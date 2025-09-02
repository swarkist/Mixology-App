export function extractJsonObjects(raw: string): string[] {
  const jsonObjects: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === '{') {
      if (depth === 0) {
        start = i;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        const jsonStr = raw.slice(start, i + 1);
        jsonObjects.push(jsonStr);
        start = -1;
      }
    }
  }
  
  return jsonObjects;
}

export function renameWeirdKeys(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(renameWeirdKeys);
  }
  
  const normalized: any = {};
  const keyMappings: Record<string, string> = {
    // Ingredients variations
    'ingredients': 'ingredients',
    'ingredient': 'ingredients', 
    'ingredients:': 'ingredients',
    'ingrédients': 'ingredients',
    'ingredient_list': 'ingredients',
    'recipe_ingredients': 'ingredients',
    
    // Instructions variations
    'instructions': 'instructions',
    'instruction': 'instructions',
    'instructions:': 'instructions',
    'steps': 'instructions',
    'method': 'instructions',
    'directions': 'instructions',
    'preparation': 'instructions',
    'recipe_steps': 'instructions',
    
    // Glass variations
    'glass': 'glassware',
    'glassware': 'glassware',
    'glass_type': 'glassware',
    'serving_glass': 'glassware',
    
    // Garnish variations
    'garnish': 'garnish',
    'garnishes': 'garnish',
    'garnish:': 'garnish',
    'decoration': 'garnish',
    
    // Name variations
    'name': 'name',
    'title': 'name',
    'recipe_name': 'name',
    'cocktail_name': 'name',
    
    // Description variations
    'description': 'description',
    'desc': 'description',
    'about': 'description',
    'summary': 'description',
    
    // Tags variations
    'tags': 'tags',
    'categories': 'tags',
    'category': 'tags',
    'labels': 'tags'
  };
  
  // Handle orphaned values (empty/whitespace keys)
  const orphanedValues: any[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const cleanKey = key.toLowerCase().trim().replace(/[^\w]/g, '');
    
    // Handle empty or whitespace-only keys
    if (!cleanKey || cleanKey.length === 0) {
      orphanedValues.push(value);
      continue;
    }
    
    const mappedKey = keyMappings[cleanKey] || cleanKey;
    normalized[mappedKey] = renameWeirdKeys(value);
  }
  
  // Apply heuristics for orphaned values
  for (const value of orphanedValues) {
    if (Array.isArray(value)) {
      // If array of objects with quantity/item → ingredients
      if (value.every(item => typeof item === 'object' && item !== null && 
          ('quantity' in item || 'item' in item || 'ingredient' in item))) {
        if (!normalized.ingredients) {
          normalized.ingredients = value;
        }
      }
      // If array of strings → instructions
      else if (value.every(item => typeof item === 'string')) {
        if (!normalized.instructions) {
          normalized.instructions = value;
        }
      }
    }
  }
  
  return normalized;
}

export function mergeRecipeObjects(jsons: any[]): any {
  const allRecipes: any[] = [];
  const seenNames = new Set<string>();
  
  for (const json of jsons) {
    if (json && typeof json === 'object') {
      let recipes = json.recipes || json.recipe || [];
      
      // Handle single recipe objects that aren't wrapped in recipes array
      if (!Array.isArray(recipes) && json.name && typeof json.name === 'string') {
        recipes = [json];
      }
      
      if (Array.isArray(recipes)) {
        for (const recipe of recipes) {
          if (recipe && recipe.name && typeof recipe.name === 'string') {
            const normalizedName = recipe.name.toLowerCase().trim();
            if (!seenNames.has(normalizedName)) {
              seenNames.add(normalizedName);
              allRecipes.push(recipe);
            }
          }
        }
      }
    }
  }
  
  return { recipes: allRecipes };
}