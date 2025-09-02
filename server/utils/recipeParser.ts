import { z } from "zod";
import { extractJsonObjects, renameWeirdKeys, mergeRecipeObjects } from "./aiJsonRepair.js";

const Ingredient = z.object({
  quantity: z.string().min(1),
  unit: z.string().optional().default(""),
  item: z.string().min(1),
  notes: z.string().optional()
});

const Recipe = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  ingredients: z.array(Ingredient).min(1),
  instructions: z.array(z.string().min(1)).min(1),
  glassware: z.string().optional(),
  garnish: z.string().optional(),
  tags: z.array(z.string()).optional().default([])
});

const Parsed = z.object({ recipes: z.array(Recipe) });
export type ParsedRecipes = z.infer<typeof Parsed>;

function softFix(s: string): string {
  return s
    .replace(/,\s*([}\]])/g, "$1")       // trailing commas
    .replace(/[""]/g, '"')               // smart quotes
    .replace(/['']/g, "'");              // smart apostrophes
}

export function parseRecipesFromAI(raw: string): ParsedRecipes {
  const chunks = extractJsonObjects(raw);
  if (chunks.length === 0) return { recipes: [] };

  const parsed = chunks.map(ch => {
    try { return JSON.parse(ch); }
    catch { 
      try { return JSON.parse(softFix(ch)); }
      catch { return null; }
    }
  }).filter(Boolean);

  const normalized = parsed.map(renameWeirdKeys);
  const merged = mergeRecipeObjects(normalized);

  // Guard: fix cases like `"name": " Fashioned"` (leading/trailing junk)
  if (Array.isArray(merged.recipes)) {
    merged.recipes = merged.recipes.map((r: any) => ({
      ...r,
      name: (typeof r.name === 'string' ? r.name : "").replace(/\s+/g, " ").trim()
    }));
  }

  try {
    return Parsed.parse(merged);
  } catch (validationError) {
    // If validation fails, return empty recipes instead of throwing
    console.error('Recipe validation failed:', validationError);
    return { recipes: [] };
  }
}