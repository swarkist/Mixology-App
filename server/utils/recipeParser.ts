import { z } from "zod";
import { extractJsonObjects, renameWeirdKeys, mergeRecipeObjects } from "./aiJsonRepair.js";

const IngredientSchema = z.object({
  quantity: z.string().min(1),
  unit: z.string().optional().default(""),
  item: z.string().min(1),
  notes: z.string().optional()
});

const RecipeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  ingredients: z.array(IngredientSchema).min(1),
  instructions: z.array(z.string().min(1)).min(1),
  glassware: z.string().optional(),
  garnish: z.string().optional(),
  tags: z.array(z.string()).optional().default([])
});

const ParsedRecipesSchema = z.object({
  recipes: z.array(RecipeSchema)
});

export type ParsedRecipes = z.infer<typeof ParsedRecipesSchema>;

export function parseRecipesFromAI(raw: string): ParsedRecipes {
  try {
    // 1) Extract one or more JSON objects from raw text
    const found = extractJsonObjects(raw);
    if (found.length === 0) {
      throw new Error("No JSON object detected in AI response.");
    }

    // 2) Parse each JSON string safely
    const parsed = found.map((s) => {
      try { 
        return JSON.parse(s); 
      } catch {
        // Quick "soft repair" pass: remove trailing commas & invalid quotes
        const fixed = s
          .replace(/,\s*([}\]])/g, "$1")
          .replace(/(?<!\\)"|"(?!\\)/g, '"')
          .replace(/(?<!\\)'|'(?!\\)/g, "'");
        return JSON.parse(fixed);
      }
    });

    // 3) Normalize weird/label keys on each object
    const normalized = parsed.map(renameWeirdKeys);

    // 4) Merge multiple {recipes:[...]} objects
    const merged = mergeRecipeObjects(normalized);

    // 5) Final validation
    return ParsedRecipesSchema.parse(merged);
  } catch (error) {
    // Safety fallback: return empty recipes with debug logging
    console.error('Recipe parsing failed:', error);
    console.error('Original raw input:', raw);
    return { recipes: [] };
  }
}

// Performance check helper for testing
export function parseRecipesFromAITimed(raw: string): { result: ParsedRecipes; timeMs: number } {
  const start = performance.now();
  const result = parseRecipesFromAI(raw);
  const timeMs = performance.now() - start;
  
  return { result, timeMs };
}