import fs from "fs/promises";
import path from "path";
import { firestore } from "firebase-admin";

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

export function matchesFilter(
  data: any,
  filters: { field: "description" | "tags"; mode: string; value?: any }
): boolean {
  const { field, mode, value } = filters;
  const val = data[field];
  if (field === "description") {
    const text = String(val || "");
    const cmp = String(value || "");
    switch (mode) {
      case "exact":
        return text === cmp;
      case "iexact":
        return text.toLowerCase() === cmp.toLowerCase();
      case "contains":
        return text.includes(cmp);
      case "icontains":
        return text.toLowerCase().includes(cmp.toLowerCase());
      case "regex":
        try {
          const re = new RegExp(cmp);
          return re.test(text);
        } catch {
          return false;
        }
      case "empty":
        return text === "";
      case "missing":
        return val === undefined || val === null;
      default:
        return true;
    }
  }
  if (field === "tags") {
    const tags = Array.isArray(val) ? val : [];
    switch (mode) {
      case "tags_any":
        return Array.isArray(value)
          ? tags.some((t: string) => (value as string[]).includes(t))
          : false;
      case "tags_all":
        return Array.isArray(value)
          ? (value as string[]).every((t) => tags.includes(t))
          : false;
      default:
        return true;
    }
  }
  return true;
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
  const db = firestore();
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
  const db = firestore();
  for (const group of chunk(rows, 450)) {
    const batch = db.batch();
    for (const row of group) {
      const ref = db.collection(collection).doc(row.id);
      batch.update(ref, row.proposed);
      counters.written++;
    }
    await batch.commit();
  }
}

