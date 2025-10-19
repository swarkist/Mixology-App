import fs from "fs/promises";
import path from "path";
import { db } from "../firebase";

export interface Operation {
  type:
    | "description_set"
    | "description_find_replace"
    | "tags_add"
    | "tags_remove"
    | "tags_replace";
  payload: any;
}

export interface RowData {
  id: string;
  name?: string;
  current: { description?: string; tags?: string[] };
  proposed: { description?: string; tags?: string[] };
}

export interface JobCounters {
  matched: number;
  written: number;
  skipped: number;
  errors: number;
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

export function normalizeTags(input: string[]): string[] {
  const set = new Set<string>();
  for (const t of input) {
    const v = t.toLowerCase().trim();
    if (v) set.add(v);
    if (set.size >= 8) break;
  }
  return Array.from(set);
}

export function parseTagsCell(str: string | string[]): string[] {
  if (Array.isArray(str)) return normalizeTags(str);
  const trimmed = str.trim();
  if (!trimmed) return [];
  try {
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) return normalizeTags(arr.map(String));
    }
  } catch (err) {
    // ignore JSON parse error
  }
  const sep = trimmed.includes("|") ? "|" : ",";
  return normalizeTags(trimmed.split(sep));
}

export function applyOperation(
  current: { description?: string; tags?: string[] },
  op: Operation
): { description?: string; tags?: string[] } {
  switch (op.type) {
    case "description_set":
      return { description: op.payload.newText };
    case "description_find_replace": {
      const { find, replace, regex, caseInsensitive } = op.payload || {};
      const currentText = current.description || "";
      if (!find) return {};
      let result = currentText;
      if (regex) {
        const flags = caseInsensitive ? "gi" : "g";
        try {
          const re = new RegExp(find, flags);
          result = currentText.replace(re, replace);
        } catch {
          result = currentText;
        }
      } else {
        const replaceWith = replace ?? "";
        if (caseInsensitive) {
          const re = new RegExp(find, "gi");
          result = currentText.replace(re, replaceWith);
        } else {
          result = currentText.split(find).join(replaceWith);
        }
      }
      return { description: result };
    }
    case "tags_add": {
      const add = normalizeTags(op.payload.add || []);
      const currentTags = normalizeTags(current.tags || []);
      return { tags: normalizeTags([...currentTags, ...add]) };
    }
    case "tags_remove": {
      const remove = new Set(normalizeTags(op.payload.remove || []));
      const currentTags = normalizeTags(current.tags || []);
      return { tags: currentTags.filter(t => !remove.has(t)) };
    }
    case "tags_replace": {
      const newTags = normalizeTags(op.payload.newTags || []);
      return { tags: newTags };
    }
    default:
      return {};
  }
}

export async function buildQuery(
  collection: string,
  filters: {
    field: "description" | "tags";
    mode: string;
    value?: any;
    limit?: number;
  }
): Promise<FirebaseFirestore.QuerySnapshot> {
  let query: FirebaseFirestore.Query = db.collection(collection);
  const { field, mode, value, limit } = filters;
  if (field === "description") {
    switch (mode) {
      case "exact":
        query = query.where(field, "==", value);
        break;
      case "empty":
        query = query.where(field, "==", "");
        break;
      case "missing":
        query = query.where(field, "==", null);
        break;
      default:
        // contains / regex handled client side
        break;
    }
  }
  if (field === "tags") {
    switch (mode) {
      case "tags_any":
        query = query.where(field, "array-contains-any", value);
        break;
      case "tags_all":
        // Firestore lacks array-contains-all; filter later
        break;
      default:
        break;
    }
  }
  if (limit) query = query.limit(limit);
  const snap = await query.get();
  return snap;
}

export async function writeBackup(filePath: string, rows: RowData[]): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(rows, null, 2), "utf8");
}

export async function updateDocsInChunks(
  collection: string,
  rows: RowData[],
  counters: JobCounters
): Promise<void> {
  for (const group of chunk(rows, 450)) {
    const batch = db.batch();
    for (const row of group) {
      const ref = db.collection(collection).doc(row.id);
      
      // Handle tags separately using junction tables
      const updateData: any = { ...row.proposed };
      const tagsToProcess = updateData.tags;
      delete updateData.tags; // Remove tags from direct update
      
      // Update main document fields (description, etc.)
      if (Object.keys(updateData).length > 0) {
        batch.update(ref, updateData);
      }
      
      counters.written++;
    }
    await batch.commit();
    
    // Now handle tags via junction tables (outside the batch to avoid limits)
    for (const row of group) {
      if (row.proposed.tags) {
        await updateTagRelationships(collection, row.id, row.proposed.tags);
      }
    }
  }
}

async function updateTagRelationships(
  collection: string,
  documentId: string,
  tagNames: string[]
): Promise<void> {
  // Get the numeric ID from the document
  const docSnapshot = await db.collection(collection).doc(documentId).get();
  if (!docSnapshot.exists) {
    console.error(`Document ${documentId} not found in collection ${collection}`);
    return;
  }
  const docData = docSnapshot.data();
  const numericId = docData?.id;
  if (!numericId || typeof numericId !== 'number') {
    console.error(`Document ${documentId} does not have a valid numeric id field`);
    return;
  }
  
  // Deduplicate and normalize tag names
  const normalizedNames = Array.from(new Set(
    tagNames
      .map(name => name.trim().toLowerCase())
      .filter(name => name.length > 0)
  ));
  
  // Resolve tag names to IDs, creating tags if they don't exist
  const tagIds: number[] = [];
  for (const normalizedName of normalizedNames) {
    // Check if tag exists
    const existingTagSnapshot = await db.collection('tags')
      .where('name', '==', normalizedName)
      .limit(1)
      .get();
    
    let tagId: number;
    if (!existingTagSnapshot.empty) {
      const tagData = existingTagSnapshot.docs[0].data();
      tagId = tagData.id;
    } else {
      // Create new tag
      tagId = Date.now() + Math.floor(Math.random() * 1000);
      await db.collection('tags').doc(tagId.toString()).set({
        id: tagId,
        name: normalizedName,
        usageCount: 0
      });
    }
    tagIds.push(tagId);
  }
  
  // Determine junction table collection name
  const junctionCollection = collection === 'cocktails' ? 'cocktail_tags' : 'ingredient_tags';
  const idField = collection === 'cocktails' ? 'cocktailId' : 'ingredientId';
  
  // Delete existing tag relationships
  const existingRelationships = await db.collection(junctionCollection)
    .where(idField, '==', numericId)
    .get();
  
  const deleteBatch = db.batch();
  existingRelationships.docs.forEach(doc => {
    deleteBatch.delete(doc.ref);
  });
  await deleteBatch.commit();
  
  // Create new tag relationships
  for (let i = 0; i < tagIds.length; i++) {
    const tagId = tagIds[i];
    const junctionId = Date.now() + Math.floor(Math.random() * 1000) + i;
    const junctionData: any = {
      id: junctionId,
      [idField]: numericId,
      tagId: tagId
    };
    await db.collection(junctionCollection).doc(junctionId.toString()).set(junctionData);
  }
}

