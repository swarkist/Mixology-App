// server/utils/aiJsonRepair.ts

// Enhanced preprocessing to fix common AI corruption patterns
function preprocessCorruptedJson(raw: string): string {
  return raw
    // Fix common label patterns that appear in JSON
    .replace(/"Ingredients:\s*\n"\s*:/g, '"ingredients":')
    .replace(/"Instructions:\s*\n"\s*:/g, '"instructions":')
    .replace(/"Ingredients:"\s*:/g, '"ingredients":')
    .replace(/"Instructions:"\s*:/g, '"instructions":')
    // Fix empty field names by looking at surrounding context
    .replace(/""\s*:\s*\[\s*{[^}]*"quantity"/g, '"ingredients": [{')
    .replace(/""\s*:\s*\[\s*"[^"]*\b(add|mix|stir|shake|strain|pour|garnish|serve)/gi, '"instructions": ["')
    // Remove mixed format labels that shouldn't be in JSON
    .replace(/\n\s*Ingredients:\s*\n/g, '\n')
    .replace(/\n\s*Instructions:\s*\n/g, '\n')
    // Fix concatenated JSON objects
    .replace(/}\s*{\s*"recipes"/g, '}, {"recipes"')
    // Clean up whitespace and line breaks in JSON
    .replace(/\n\s*"/g, '"')
    .replace(/"\s*\n/g, '"');
}

// Detect and remove duplicate ingredient/instruction blocks
function deduplicateContent(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    // Remove duplicate objects in arrays
    const seen = new Set();
    return obj.filter(item => {
      const key = JSON.stringify(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  const result: any = {};
  const seenIngredients = new Set<string>();
  const seenInstructions = new Set<string>();
  
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'ingredients' && Array.isArray(value)) {
      // Deduplicate ingredients by item name
      result[key] = value.filter((ing: any) => {
        const item = ing?.item?.toLowerCase?.() || '';
        if (!item || seenIngredients.has(item)) return false;
        seenIngredients.add(item);
        return true;
      });
    } else if (key === 'instructions' && Array.isArray(value)) {
      // Deduplicate instructions by content
      result[key] = value.filter((inst: string) => {
        const content = inst?.toLowerCase?.() || '';
        if (!content || seenInstructions.has(content)) return false;
        seenInstructions.add(content);
        return true;
      });
    } else {
      result[key] = deduplicateContent(value);
    }
  }
  
  return result;
}

export function extractJsonObjects(raw: string): string[] {
  // Preprocess to fix common corruption patterns
  const cleaned = preprocessCorruptedJson(raw);
  
  // Finds one or more top-level JSON objects in a noisy string.
  const results: string[] = [];
  let depth = 0, start = -1;
  let inString = false, escaped = false;
  
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    
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
        results.push(cleaned.slice(start, i + 1));
        start = -1;
      }
    }
  }
  
  // If no complete objects found, try to extract partial JSON and repair
  if (results.length === 0) {
    const jsonStart = cleaned.indexOf('{');
    if (jsonStart !== -1) {
      let jsonEnd = cleaned.lastIndexOf('}');
      if (jsonEnd > jsonStart) {
        results.push(cleaned.slice(jsonStart, jsonEnd + 1));
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

// Enhanced field name recovery with positional analysis
function recoverMissingFieldNames(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const recovered: any = {};
  const entries = Object.entries(obj);
  
  for (const [k, v] of entries) {
    let key = canonKey(k);
    
    // Enhanced empty key detection with content analysis
    if (!key || key.length === 0 || k.trim() === '' || k === '\n') {
      if (Array.isArray(v)) {
        if (v.length > 0) {
          const firstItem = v[0];
          if (typeof firstItem === 'string') {
            // Analyze instruction patterns
            if (firstItem.match(/^(add|mix|stir|shake|strain|pour|garnish|serve|combine|muddle|rim)/i)) {
              key = 'instructions';
            }
          } else if (firstItem && typeof firstItem === 'object') {
            // Analyze ingredient patterns - more comprehensive check
            if ('quantity' in firstItem || 'unit' in firstItem || 'item' in firstItem || 
                (firstItem.quantity !== undefined) || (firstItem.unit !== undefined) || (firstItem.item !== undefined)) {
              key = 'ingredients';
            }
          }
        }
        
        // Enhanced position-based heuristics - look at surrounding context
        if (!key) {
          // Check if we have recipe structure clues
          const hasName = entries.some(([ek, ev]) => canonKey(ek) === 'name');
          const hasDescription = entries.some(([ek, ev]) => canonKey(ek) === 'description');
          
          if (hasName || hasDescription) {
            // In a recipe context, arrays are likely ingredients or instructions
            const position = entries.indexOf([k, v]);
            const prevEntry = position > 0 ? entries[position - 1] : null;
            const nextEntry = position < entries.length - 1 ? entries[position + 1] : null;
            
            // If previous entry was ingredients-like, this might be instructions
            if (prevEntry && Array.isArray(prevEntry[1]) && 
                prevEntry[1].some((item: any) => item && typeof item === 'object' && (item.quantity || item.item))) {
              key = 'instructions';
            }
            // If next entry looks like instructions, this might be ingredients  
            else if (nextEntry && Array.isArray(nextEntry[1]) && 
                     nextEntry[1].some((item: any) => typeof item === 'string' && 
                     item.match(/^(add|mix|stir|shake|strain|pour|garnish|serve|combine|muddle|rim)/i))) {
              key = 'ingredients';
            }
            // Default fallback based on position
            else if (position <= 2) {
              key = 'ingredients';
            } else {
              key = 'instructions';
            }
          }
        }
      }
    }
    
    if (key && key.length > 0) {
      recovered[key] = Array.isArray(v) ? v.map(recoverMissingFieldNames) : recoverMissingFieldNames(v);
    }
  }
  
  return recovered;
}

export function renameWeirdKeys(input: any): any {
  if (Array.isArray(input)) return input.map(renameWeirdKeys);
  if (input && typeof input === "object") {
    // First pass: basic key normalization
    const normalized: any = {};
    for (const [k, v] of Object.entries(input)) {
      const key = canonKey(k);
      if (key && key.length > 0) {
        normalized[key] = renameWeirdKeys(v);
      } else {
        // Keep original key for recovery step
        normalized[k] = renameWeirdKeys(v);
      }
    }
    
    // Second pass: recover missing field names
    const recovered = recoverMissingFieldNames(normalized);
    
    // Third pass: deduplicate content
    return deduplicateContent(recovered);
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
    } else if (j?.name || (j?.ingredients && j?.instructions)) {
      // Single recipe object not wrapped in recipes array
      // More tolerant - accept if has name OR has both ingredients and instructions
      all.push(j);
    }
  }
  
  // Enhanced deduplication with data cleaning
  const seen = new Set<string>();
  const deduped = all.filter(r => {
    // Ensure minimum required fields exist
    if (!r.name && (!r.ingredients || !r.instructions)) return false;
    
    const name = (typeof r?.name === 'string' ? r.name : "").trim().toLowerCase();
    if (!name) {
      // Generate name from ingredients if missing
      if (r.ingredients && r.ingredients.length > 0) {
        const firstSpirit = r.ingredients.find((ing: any) => 
          ing.item && /\b(whiskey|bourbon|gin|vodka|rum|tequila|brandy)\b/i.test(ing.item)
        );
        if (firstSpirit) {
          r.name = `${firstSpirit.item} Cocktail`;
        } else {
          r.name = "Mystery Cocktail";
        }
      } else {
        return false; // Skip if no name and no way to generate one
      }
    }
    
    const finalName = r.name.toLowerCase();
    if (seen.has(finalName)) return false;
    seen.add(finalName);
    return true;
  });
  
  return { recipes: deduped };
}