// server/utils/aiJsonRepair.ts
export function extractJsonObjects(raw: string): string[] {
  // Finds one or more top-level JSON objects in a noisy string.
  const results: string[] = [];
  let depth = 0, start = -1;
  let inString = false, escaped = false;
  
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    
    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        results.push(raw.slice(start, i + 1));
        start = -1;
      }
    }
  }
  
  // If no complete objects found, try to extract partial JSON and repair
  if (results.length === 0) {
    const jsonStart = raw.indexOf('{');
    if (jsonStart !== -1) {
      let jsonEnd = raw.lastIndexOf('}');
      if (jsonEnd > jsonStart) {
        results.push(raw.slice(jsonStart, jsonEnd + 1));
      }
    }
  }
  
  return results;
}

function canonKey(k: string): string {
  const s = k.toLowerCase().trim().replace(/[:*_\-\s]+$/g, "").replace(/[^a-z]/g, "");
  if (["ingredient","ingredients","ingrdnts","ingrédients","ingredientlist"].includes(s)) return "ingredients";
  if (["instruction","instructions","steps","method"].includes(s)) return "instructions";
  if (["glass","glassware","glasstype"].includes(s)) return "glassware";
  if (["garnish","garnishes"].includes(s)) return "garnish";
  if (["tag","tags"].includes(s)) return "tags";
  if (["name","recipename"].includes(s)) return "name";
  if (["description","desc"].includes(s)) return "description";
  return s; // could be already correct or irrelevant label
}

export function renameWeirdKeys(input: any): any {
  if (Array.isArray(input)) return input.map(renameWeirdKeys);
  if (input && typeof input === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(input)) {
      const key = canonKey(k);
      
      // Handle blank/whitespace-only keys with heuristics
      if (!key || key.length === 0) {
        if (Array.isArray(v)) {
          if (v.every(it => typeof it === "string")) {
            out.instructions = v;
          } else if (v.every(it => it && typeof it === "object" && ("item" in it || "quantity" in it))) {
            out.ingredients = v;
          }
        }
        continue;
      }

      out[key] = renameWeirdKeys(v);
    }
    return out;
  }
  if (typeof input === "string") return input.trim();
  return input;
}

export function mergeRecipeObjects(jsons: any[]): any {
  // Expect one or more { recipes: [...] } after normalization, or single recipe objects
  const all: any[] = [];
  for (const j of jsons) {
    if (j?.recipes && Array.isArray(j.recipes)) {
      all.push(...j.recipes);
    } else if (j?.name && j?.ingredients && j?.instructions) {
      // Single recipe object not wrapped in recipes array
      all.push(j);
    }
  }
  // De-dupe by name (case-insensitive)
  const seen = new Set<string>();
  const deduped = all.filter(r => {
    const name = (typeof r?.name === 'string' ? r.name : "").trim().toLowerCase();
    if (!name) return true;
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
  return { recipes: deduped };
}