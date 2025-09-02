import { z } from "zod";
import { extractJsonObjects, renameWeirdKeys, mergeRecipeObjects } from "./aiJsonRepair.js";

// Tolerant ingredient schema that accepts empty quantities for garnishes
const TolerateIngredient = z.object({
  quantity: z.string().optional().default(""), // Allow empty for garnishes like "salt for rim"
  unit: z.string().optional().default(""),
  item: z.string().min(1),
  notes: z.string().optional()
});

const Ingredient = z.object({
  quantity: z.string().min(1),
  unit: z.string().optional().default(""),
  item: z.string().min(1),
  notes: z.string().optional()
});

// Strict recipe schema
const Recipe = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  ingredients: z.array(Ingredient).min(1),
  instructions: z.array(z.string().min(1)).min(1),
  glassware: z.string().optional(),
  garnish: z.string().optional(),
  tags: z.array(z.string()).optional().default([])
});

// Tolerant recipe schema for malformed data
const TolerateRecipe = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  ingredients: z.array(TolerateIngredient).min(1),
  instructions: z.array(z.string().min(1)).min(1),
  glassware: z.string().optional(),
  garnish: z.string().optional(),
  tags: z.array(z.string()).optional().default([])
});

const Parsed = z.object({ recipes: z.array(Recipe) });
const ToleratedParsed = z.object({ recipes: z.array(TolerateRecipe) });
export type ParsedRecipes = z.infer<typeof Parsed>;

// Enhanced text-based recipe extraction as ultimate fallback
function extractRecipesFromText(text: string): any[] {
  const recipes: any[] = [];
  
  // Look for recipe names in quotes or on lines by themselves
  const nameMatches = text.match(/"([^"]+)"/g) || 
                     text.match(/^\s*([A-Z][a-zA-Z\s]+)\s*$/gm) || [];
  
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Simple pattern-based extraction
  let currentRecipe: any = null;
  
  for (const line of lines) {
    // Recipe name detection
    if (line.match(/^[A-Z][a-zA-Z\s]+$/) && line.length < 50) {
      if (currentRecipe) recipes.push(currentRecipe);
      currentRecipe = {
        name: line,
        description: "",
        ingredients: [],
        instructions: [],
        tags: []
      };
    }
    // Ingredient detection (starts with number or fraction)
    else if (line.match(/^\d+(\.\d+)?\s*(oz|ml|dash|part|cup|tsp|tbsp)/i)) {
      if (currentRecipe) {
        const parts = line.split(/\s+/);
        currentRecipe.ingredients.push({
          quantity: parts[0] || "",
          unit: parts[1] || "",
          item: parts.slice(2).join(" ") || "Unknown ingredient",
          notes: ""
        });
      }
    }
    // Instruction detection (starts with action words)
    else if (line.match(/^(add|mix|stir|shake|strain|pour|garnish|serve|combine|muddle)/i)) {
      if (currentRecipe) {
        currentRecipe.instructions.push(line);
      }
    }
  }
  
  if (currentRecipe) recipes.push(currentRecipe);
  return recipes.filter(r => r.ingredients.length > 0 && r.instructions.length > 0);
}

function softFix(s: string): string {
  return s
    .replace(/,\s*([}\]])/g, "$1")       // trailing commas
    .replace(/[""]/g, '"')               // smart quotes
    .replace(/['']/g, "'")               // smart apostrophes
    .replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // unquoted keys
}

export function parseRecipesFromAI(raw: string): ParsedRecipes {
  const chunks = extractJsonObjects(raw);
  
  // If no JSON found, try text-based extraction as ultimate fallback
  if (chunks.length === 0) {
    const textRecipes = extractRecipesFromText(raw);
    if (textRecipes.length > 0) {
      try {
        return ToleratedParsed.parse({ recipes: textRecipes });
      } catch {
        return { recipes: [] };
      }
    }
    return { recipes: [] };
  }

  const parsed = chunks.map(ch => {
    try { return JSON.parse(ch); }
    catch { 
      try { return JSON.parse(softFix(ch)); }
      catch { return null; }
    }
  }).filter(Boolean);

  if (parsed.length === 0) {
    // Fallback to text extraction if JSON parsing completely fails
    const textRecipes = extractRecipesFromText(raw);
    if (textRecipes.length > 0) {
      try {
        return ToleratedParsed.parse({ recipes: textRecipes });
      } catch {
        return { recipes: [] };
      }
    }
    return { recipes: [] };
  }

  const normalized = parsed.map(renameWeirdKeys);
  const merged = mergeRecipeObjects(normalized);

  // Clean up recipe data
  if (Array.isArray(merged.recipes)) {
    merged.recipes = merged.recipes.map((r: any) => {
      const cleaned = {
        ...r,
        name: (typeof r.name === 'string' ? r.name : "").replace(/\s+/g, " ").trim(),
        description: (typeof r.description === 'string' ? r.description : "").trim(),
        ingredients: Array.isArray(r.ingredients) ? r.ingredients.filter((ing: any) => 
          ing && typeof ing === 'object' && ing.item && ing.item.trim()
        ) : [],
        instructions: Array.isArray(r.instructions) ? r.instructions.filter((inst: any) => 
          typeof inst === 'string' && inst.trim()
        ) : [],
        tags: Array.isArray(r.tags) ? r.tags.filter((tag: any) => 
          typeof tag === 'string' && tag.trim()
        ) : []
      };
      
      // Clean up ingredient quantities
      cleaned.ingredients = cleaned.ingredients.map((ing: any) => ({
        ...ing,
        quantity: ing.quantity || "",
        unit: ing.unit || "",
        item: ing.item.trim(),
        notes: ing.notes || ""
      }));
      
      return cleaned;
    }).filter((r: any) => 
      r.name && r.ingredients.length > 0 && r.instructions.length > 0
    );
  }

  // Try strict validation first, then fall back to tolerant validation
  try {
    return Parsed.parse(merged);
  } catch (strictError) {
    try {
      return ToleratedParsed.parse(merged);
    } catch (tolerantError) {
      console.error('Recipe validation failed even with tolerant schema:', tolerantError);
      return { recipes: [] };
    }
  }
}