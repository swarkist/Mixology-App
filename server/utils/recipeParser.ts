import { ParsedRecipes, ParsedRecipesSchema, Recipe, Ingredient, ParseError } from '../types/recipes.js';

/**
 * Tolerant Recipe Parser
 * 
 * Handles multi-recipe AI responses with JSON repair and Markdown fallback.
 * Always returns validated, normalized recipe data.
 */

/**
 * Common fractions for measurement display
 */
const DECIMAL_TO_FRACTION: Record<string, string> = {
  '0.125': '1/8',
  '0.25': '1/4',
  '0.33': '1/3',
  '0.5': '1/2',
  '0.66': '2/3',
  '0.67': '2/3',
  '0.75': '3/4',
  '1.25': '1 1/4',
  '1.5': '1 1/2',
  '1.75': '1 3/4',
  '2.5': '2 1/2',
  '2.25': '2 1/4'
};

/**
 * Unit standardization mapping
 */
const UNIT_STANDARDIZATION: Record<string, string> = {
  'ounce': 'oz',
  'ounces': 'oz',
  'milliliter': 'ml',
  'milliliters': 'ml',
  'teaspoon': 'tsp',
  'teaspoons': 'tsp',
  'tablespoon': 'tbsp',
  'tablespoons': 'tbsp',
  'dash': 'dash',
  'dashes': 'dashes',
  'barspoon': 'barspoon',
  'barspoons': 'barspoons',
  'part': 'part',
  'parts': 'parts'
};

/**
 * Attempts to repair common JSON formatting issues
 */
function repairJSON(jsonStr: string): string {
  let repaired = jsonStr;
  
  // Remove trailing commas before closing braces/brackets
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix unquoted keys (basic pattern)
  repaired = repaired.replace(/(\w+):/g, '"$1":');
  
  // Fix single quotes to double quotes
  repaired = repaired.replace(/'/g, '"');
  
  // Remove duplicate quotes
  repaired = repaired.replace(/""([^"]+)""/g, '"$1"');
  
  return repaired;
}

/**
 * Extracts JSON from text that may have prose before/after
 */
function extractJSON(text: string): string | null {
  // Look for JSON object boundaries
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  
  let jsonStr = jsonMatch[0];
  
  // Ensure we have a complete object
  let braceCount = 0;
  let endIndex = -1;
  
  for (let i = 0; i < jsonStr.length; i++) {
    if (jsonStr[i] === '{') braceCount++;
    if (jsonStr[i] === '}') braceCount--;
    if (braceCount === 0) {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex > -1) {
    return jsonStr.substring(0, endIndex + 1);
  }
  
  return jsonStr;
}

/**
 * Normalizes quantity string and converts decimals to fractions where appropriate
 */
function normalizeQuantity(quantity: string): string {
  const trimmed = quantity.trim();
  
  // Check for existing fractions
  if (trimmed.includes('/')) return trimmed;
  
  // Convert decimal to fraction if it matches common values
  const decimal = parseFloat(trimmed);
  if (!isNaN(decimal)) {
    const fractionKey = decimal.toFixed(3).replace(/\.?0+$/, '');
    if (DECIMAL_TO_FRACTION[fractionKey]) {
      return DECIMAL_TO_FRACTION[fractionKey];
    }
  }
  
  return trimmed;
}

/**
 * Standardizes units to canonical short forms
 */
function normalizeUnit(unit: string): string {
  const trimmed = unit.trim().toLowerCase();
  return UNIT_STANDARDIZATION[trimmed] || trimmed;
}

/**
 * Parses ingredients from markdown format with tolerant regex
 */
function parseMarkdownIngredients(ingredientLines: string[]): Ingredient[] {
  const ingredients: Ingredient[] = [];
  
  for (const line of ingredientLines) {
    const trimmed = line.replace(/^-\s*/, '').trim();
    if (!trimmed) continue;
    
    // Tolerant regex for: "1 1/2 oz", "0.75 oz", "dash", "rinse", "top with", and (notes)
    const match = trimmed.match(/^([\d\s\/\.]+)?\s*(oz|ounces?|ml|tsp|tbsp|dash|dashes?|barspoons?|parts?|cup|cups?)?\s+(.+?)(\s*\([^)]+\))?$/i);
    
    if (match) {
      const [, quantity = '', unit = '', item = '', notes = ''] = match;
      ingredients.push({
        quantity: normalizeQuantity(quantity),
        unit: normalizeUnit(unit),
        item: item.trim(),
        notes: notes.replace(/[()]/g, '').trim() || undefined
      });
    } else {
      // Fallback for items without measurements (like "Salt for rimming")
      ingredients.push({
        quantity: '',
        unit: '',
        item: trimmed,
        notes: undefined
      });
    }
  }
  
  return ingredients;
}

/**
 * Parses a single recipe from markdown format
 */
function parseMarkdownRecipe(recipeText: string): Recipe | null {
  const lines = recipeText.split('\n').map(l => l.trim()).filter(l => l);
  
  let name = '';
  let description = '';
  const ingredients: string[] = [];
  const instructions: string[] = [];
  let glassware = '';
  let garnish = '';
  const tags: string[] = [];
  
  let currentSection = '';
  
  for (const line of lines) {
    // Recipe title (### Title)
    if (line.startsWith('###')) {
      name = line.replace('###', '').trim();
      continue;
    }
    
    // Description (italic text)
    if (line.startsWith('_') && line.endsWith('_')) {
      description = line.replace(/^_|_$/g, '');
      continue;
    }
    
    // Section headers
    if (line.startsWith('**Ingredients**')) {
      currentSection = 'ingredients';
      continue;
    }
    if (line.startsWith('**Instructions**')) {
      currentSection = 'instructions';
      continue;
    }
    if (line.startsWith('**Glassware**:')) {
      glassware = line.replace('**Glassware**:', '').trim();
      continue;
    }
    if (line.startsWith('**Garnish**:')) {
      garnish = line.replace('**Garnish**:', '').trim();
      continue;
    }
    if (line.startsWith('**Tags**:')) {
      const tagStr = line.replace('**Tags**:', '').trim();
      tags.push(...tagStr.split(',').map(t => t.trim()));
      continue;
    }
    
    // Section content
    if (currentSection === 'ingredients' && line.startsWith('-')) {
      ingredients.push(line);
    } else if (currentSection === 'instructions' && /^\d+\)/.test(line)) {
      instructions.push(line.replace(/^\d+\)\s*/, ''));
    }
  }
  
  if (!name || ingredients.length === 0 || instructions.length === 0) {
    return null;
  }
  
  return {
    name,
    description,
    ingredients: parseMarkdownIngredients(ingredients),
    instructions,
    glassware: glassware || undefined,
    garnish: garnish || undefined,
    tags
  };
}

/**
 * Main parser function - handles both JSON and Markdown formats
 */
export function parseRecipesFromAI(raw: string): ParsedRecipes {
  const trimmed = raw.trim();
  
  // Fast path: JSON
  const extractedJSON = extractJSON(trimmed);
  if (extractedJSON) {
    try {
      const parsed = JSON.parse(extractedJSON);
      const validated = ParsedRecipesSchema.parse(parsed);
      
      // Normalize quantities and units
      for (const recipe of validated.recipes) {
        for (const ingredient of recipe.ingredients) {
          ingredient.quantity = normalizeQuantity(ingredient.quantity);
          ingredient.unit = normalizeUnit(ingredient.unit || '');
        }
      }
      
      return validated;
    } catch (parseError) {
      // Try JSON repair
      try {
        const repaired = repairJSON(extractedJSON);
        const parsed = JSON.parse(repaired);
        const validated = ParsedRecipesSchema.parse(parsed);
        
        // Normalize quantities and units
        for (const recipe of validated.recipes) {
          for (const ingredient of recipe.ingredients) {
            ingredient.quantity = normalizeQuantity(ingredient.quantity);
            ingredient.unit = normalizeUnit(ingredient.unit || '');
          }
        }
        
        return validated;
      } catch (repairError) {
        // Fall through to markdown parsing
      }
    }
  }
  
  // Fallback: Markdown
  try {
    const recipes: Recipe[] = [];
    
    // Split on --- or ### headings
    const sections = trimmed.split(/\n---\n|\n(?=###)/);
    
    for (const section of sections) {
      if (!section.trim()) continue;
      
      const recipe = parseMarkdownRecipe(section.trim());
      if (recipe) {
        recipes.push(recipe);
      }
    }
    
    if (recipes.length === 0) {
      return { recipes: [] };
    }
    
    const result = ParsedRecipesSchema.parse({ recipes });
    return result;
  } catch (markdownError) {
    // Return empty result if all parsing fails
    return { recipes: [] };
  }
}

/**
 * Performance check helper for testing
 */
export function parseRecipesFromAITimed(raw: string): { result: ParsedRecipes; timeMs: number } {
  const start = performance.now();
  const result = parseRecipesFromAI(raw);
  const timeMs = performance.now() - start;
  
  return { result, timeMs };
}