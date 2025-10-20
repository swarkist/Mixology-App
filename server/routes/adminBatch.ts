import express from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";
import { db } from "../firebase";
import {
  buildQuery,
  applyOperation,
  writeBackup,
  updateDocsInChunks,
  RowData,
  JobCounters
} from "../services/batch";
import { requireAuth, requireAdmin } from "../middleware/requireAuth";
import type { IStorage } from "../storage";

export default function adminBatchRoutes(storage: IStorage) {
  const router = express.Router();

  const limiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

  const requireAdminKey = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const provided = req.header("x-admin-key") || "";
    const expected = process.env.ADMIN_API_KEY || "";
    if (!expected || provided !== expected) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };

  router.use(requireAuth(storage));
  router.use(requireAdmin);
  router.use(requireAdminKey);

  const operationSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("description_set"), payload: z.object({ newText: z.string() }) }),
    z.object({
      type: z.literal("description_find_replace"),
      payload: z.object({
        find: z.string(),
        replace: z.string().optional(),
        regex: z.boolean().optional(),
        caseInsensitive: z.boolean().optional()
      })
    }),
    z.object({ type: z.literal("tags_add"), payload: z.object({ add: z.array(z.string()) }) }),
    z.object({ type: z.literal("tags_remove"), payload: z.object({ remove: z.array(z.string()) }) }),
    z.object({ type: z.literal("tags_replace"), payload: z.object({ newTags: z.array(z.string()) }) })
  ]);

  const optionsSchema = z
    .object({
      onlyImportedPlaceholders: z.boolean().optional(),
      skipIfSame: z.boolean().optional().default(true)
    })
    .default({ skipIfSame: true });

  const queryBody = z.object({
    mode: z.literal("query"),
    collection: z.union([z.literal("ingredients"), z.literal("cocktails")]),
    filters: z.object({
      field: z.union([z.literal("description"), z.literal("tags")]),
      mode: z.string(),
      value: z.any().optional(),
      limit: z.number().optional()
    }),
    operation: operationSchema,
    options: optionsSchema.optional()
  });

  const pasteRow = z.object({
    id: z.string(),
    name: z.string().optional(),
    proposed: z.object({ description: z.string().optional(), tags: z.array(z.string()).optional() }).partial()
  });

  const pasteBody = z.object({
    mode: z.literal("paste"),
    collection: z.union([z.literal("ingredients"), z.literal("cocktails")]),
    rows: z.array(pasteRow).max(1000),
    options: optionsSchema.optional()
  });

  const previewBody = z.union([queryBody, pasteBody]);

  const commitBody = z.union([
    queryBody.extend({
      selectIds: z.array(z.string()).optional(),
      note: z.string().optional()
    }),
    pasteBody.extend({
      selectIds: z.array(z.string()).optional(),
      note: z.string().optional()
    })
  ]);

  async function buildPreview(body: any) {
    const options = body.options || { skipIfSame: true };
    const rows: RowData[] = [];
    const missing: string[] = [];
    let skipped = 0;
    let warnings: { duplicates?: number } = {};

    if (body.mode === "query") {
      const snap = await buildQuery(body.collection, body.filters);
      snap.forEach((doc) => {
        const data: any = doc.data() || {};
        
        // Client-side filtering for "contains" mode
        if (body.filters.field === "description" && body.filters.mode === "contains" && body.filters.value) {
          const description = data.description || "";
          if (!description.toLowerCase().includes(body.filters.value.toLowerCase())) {
            return; // Skip this document
          }
        }
        
        const current = { description: data.description || "", tags: data.tags || [] };
        const proposed = applyOperation(current, body.operation);
        const row: RowData = { id: doc.id, name: data.name, current, proposed };
        const final = { description: proposed.description ?? current.description, tags: proposed.tags ?? current.tags };
        const shouldSkip =
          (options.onlyImportedPlaceholders && current.description && !current.description.startsWith("Imported ingredient")) ||
          (options.skipIfSame && JSON.stringify(current) === JSON.stringify(final));
        if (shouldSkip) {
          skipped++;
        } else {
          rows.push(row);
        }
      });
    } else {
      const idMap = new Map<string, any>();
      for (const r of body.rows) {
        if (idMap.has(r.id)) {
          warnings.duplicates = (warnings.duplicates || 0) + 1;
        }
        idMap.set(r.id, r);
      }
      for (const [id, r] of Array.from(idMap.entries())) {
        const ref = db.collection(body.collection).doc(id);
        const doc = await ref.get();
        if (!doc.exists) {
          missing.push(id);
          continue;
        }
        const data: any = doc.data() || {};
        const current = { description: data.description || "", tags: data.tags || [] };
        const proposed = {
          description: r.proposed?.description ?? current.description,
          tags: r.proposed?.tags ?? current.tags
        };
        const shouldSkip =
          (options.onlyImportedPlaceholders && current.description && !current.description.startsWith("Imported ingredient")) ||
          (options.skipIfSame && JSON.stringify(current) === JSON.stringify(proposed));
        if (shouldSkip) {
          skipped++;
          continue;
        }
        rows.push({ id, name: r.name, current, proposed });
      }
    }

    return { rows: rows.slice(0, 1000), skipped, missing, warnings };
  }

  router.post("/preview", limiter, async (req, res) => {
    try {
      const body = previewBody.parse(req.body);
      const { rows, skipped, missing, warnings } = await buildPreview(body);
      res.json({
        jobId: `temp-${uuidv4()}`,
        willUpdate: rows.length,
        skipped,
        missing,
        rows,
        warnings
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post("/commit", limiter, async (req, res) => {
    try {
      console.log('[BATCH COMMIT] Starting batch commit');
      const body = commitBody.parse(req.body);
      console.log('[BATCH COMMIT] Body parsed:', { mode: body.mode, collection: body.collection, selectIdsCount: body.selectIds?.length });
      
      const { rows } = await buildPreview(body);
      console.log('[BATCH COMMIT] Preview built, row count:', rows.length);
      
      const selectIds = body.selectIds ? new Set(body.selectIds) : null;
      const toWrite = selectIds ? rows.filter((r) => selectIds.has(r.id)) : rows;
      console.log('[BATCH COMMIT] Rows to write:', toWrite.length);
      
      if (toWrite.length === 0) {
        console.log('[BATCH COMMIT] No rows to write, returning');
        return res.status(400).json({ error: 'No rows selected for update' });
      }
      
      const counters: JobCounters = { matched: rows.length, written: 0, skipped: 0, errors: 0 };
      const timestamp = new Date().toISOString().replace(/[:]/g, "-").split(".")[0];
      const backupFile = path.join("server", "backups", `batch_${timestamp}.json`);
      const backupRows = rows.map((r) => ({ 
        id: r.id, 
        name: r.name, 
        current: r.current, 
        proposed: r.current 
      }));
      
      console.log('[BATCH COMMIT] Writing backup to:', backupFile);
      await writeBackup(backupFile, backupRows);
      console.log('[BATCH COMMIT] Backup written');
      
      const jobRef = db.collection("admin_jobs").doc();
      console.log('[BATCH COMMIT] Creating job with ID:', jobRef.id);
      
      await jobRef.set({
        status: "pending",
        mode: body.mode,
        collection: body.collection,
        note: body.note || null,
        counts: counters,
        backupFile,
        startedAt: new Date().toISOString()
      });
      console.log('[BATCH COMMIT] Job created successfully');
      
      res.json({ jobId: jobRef.id, status: "pending" });
      
      process.nextTick(async () => {
        try {
          console.log('[BATCH COMMIT] Starting background processing for job:', jobRef.id);
          await jobRef.update({ status: "in_progress" });
          await updateDocsInChunks(body.collection, toWrite, counters);
          await jobRef.update({ status: "done", counts: counters, finishedAt: new Date().toISOString() });
          console.log('[BATCH COMMIT] Job completed successfully:', jobRef.id);
        } catch (e: any) {
          console.error('[BATCH COMMIT] Job failed:', jobRef.id, e.message);
          await jobRef.update({ status: "failed", counts: counters, finishedAt: new Date().toISOString(), errors: [{ message: e.message }] });
        }
      });
    } catch (err: any) {
      console.error('[BATCH COMMIT] Error:', err.message, err.stack);
      res.status(400).json({ error: err.message });
    }
  });

  router.get("/jobs", async (_req, res) => {
    try {
      const snap = await db
        .collection("admin_jobs")
        .orderBy("startedAt", "desc")
        .limit(20)
        .get();
      const jobs = snap.docs.map((d) => ({ jobId: d.id, ...d.data() }));
      res.json(jobs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/jobs/:jobId", async (req, res) => {
    try {
      const jobId = req.params.jobId;
      const doc = await db.collection("admin_jobs").doc(jobId).get();
      if (!doc.exists) return res.status(404).json({ error: "Not found" });
      res.json({ jobId: doc.id, ...doc.data() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/jobs/:jobId/rollback", limiter, async (req, res) => {
    try {
      const jobId = req.params.jobId;
      const original = await db.collection("admin_jobs").doc(jobId).get();
      if (!original.exists) {
        return res.status(404).json({ error: "Job not found" });
      }
      const data: any = original.data();
      const backupFile: string = data.backupFile;
      const content = await fs.readFile(backupFile, "utf8");
      const rowsFromBackup = JSON.parse(content);
      const rows: RowData[] = rowsFromBackup.map((r: any) => ({
        id: r.id,
        name: r.name,
        current: { description: r.description, tags: r.tags },
        proposed: { description: r.description, tags: r.tags }
      }));
      const counters: JobCounters = { matched: rows.length, written: 0, skipped: 0, errors: 0 };
      const newJobRef = db.collection("admin_jobs").doc();
      await newJobRef.set({
        status: "pending",
        mode: "rollback",
        collection: data.collection,
        originalJobId: jobId,
        backupFile,
        counts: counters,
        startedAt: new Date().toISOString()
      });
      res.json({ status: "pending" });
      process.nextTick(async () => {
        try {
          await newJobRef.update({ status: "in_progress" });
          await updateDocsInChunks(data.collection, rows, counters);
          await newJobRef.update({ status: "done", counts: counters, finishedAt: new Date().toISOString() });
        } catch (e: any) {
          await newJobRef.update({ status: "failed", counts: counters, finishedAt: new Date().toISOString(), errors: [{ message: e.message }] });
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/list-cocktails", async (_req, res) => {
    try {
      // Fetch all cocktails
      const cocktailsSnapshot = await db.collection("cocktails").get();
      
      // Fetch all tags and cocktail_tags
      const [allTagsSnapshot, cocktailTagsSnapshot] = await Promise.all([
        db.collection("tags").get(),
        db.collection("cocktail_tags").get()
      ]);
      
      // Build tag map (tagId -> tag name)
      const tagMap = new Map<number, string>();
      allTagsSnapshot.forEach(doc => {
        const data = doc.data();
        tagMap.set(parseInt(doc.id), data.name);
      });
      
      // Build cocktail tags map (cocktailId -> tag names array)
      const cocktailTagsMap = new Map<number, string[]>();
      cocktailTagsSnapshot.forEach(doc => {
        const data = doc.data();
        const cocktailId = data.cocktailId;
        const tagName = tagMap.get(data.tagId);
        if (tagName) {
          if (!cocktailTagsMap.has(cocktailId)) {
            cocktailTagsMap.set(cocktailId, []);
          }
          cocktailTagsMap.get(cocktailId)!.push(tagName);
        }
      });
      
      // Build result
      const result = cocktailsSnapshot.docs.map(doc => {
        const data = doc.data();
        const cocktailId = parseInt(doc.id);
        const tags = cocktailTagsMap.get(cocktailId) || [];
        
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          tags: tags.join(', ')
        };
      });
      
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/list-ingredients", async (_req, res) => {
    try {
      // Fetch all ingredients
      const ingredientsSnapshot = await db.collection("ingredients").get();
      
      // Fetch all tags and ingredient_tags
      const [allTagsSnapshot, ingredientTagsSnapshot] = await Promise.all([
        db.collection("tags").get(),
        db.collection("ingredient_tags").get()
      ]);
      
      // Build tag map (tagId -> tag name)
      const tagMap = new Map<number, string>();
      allTagsSnapshot.forEach(doc => {
        const data = doc.data();
        tagMap.set(parseInt(doc.id), data.name);
      });
      
      // Build ingredient tags map (ingredientId -> tag names array)
      const ingredientTagsMap = new Map<number, string[]>();
      ingredientTagsSnapshot.forEach(doc => {
        const data = doc.data();
        const ingredientId = data.ingredientId;
        const tagName = tagMap.get(data.tagId);
        if (tagName) {
          if (!ingredientTagsMap.has(ingredientId)) {
            ingredientTagsMap.set(ingredientId, []);
          }
          ingredientTagsMap.get(ingredientId)!.push(tagName);
        }
      });
      
      // Build result
      const result = ingredientsSnapshot.docs.map(doc => {
        const data = doc.data();
        const ingredientId = parseInt(doc.id);
        const tags = ingredientTagsMap.get(ingredientId) || [];
        
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          tags: tags.join(', ')
        };
      });
      
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

