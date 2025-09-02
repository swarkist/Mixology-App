import { z } from "zod";

export const IngredientSchema = z.object({
  quantity: z.string().min(1),
  unit: z.string().optional().default(""),
  item: z.string().min(1),
  notes: z.string().optional()
});

export const RecipeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  ingredients: z.array(IngredientSchema).min(1),
  instructions: z.array(z.string().min(1)).min(1),
  glassware: z.string().optional(),
  garnish: z.string().optional(),
  tags: z.array(z.string()).optional().default([])
});

export const ParsedRecipesSchema = z.object({
  recipes: z.array(RecipeSchema)
});

export type Ingredient = z.infer<typeof IngredientSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type ParsedRecipes = z.infer<typeof ParsedRecipesSchema>;

export interface ParseError {
  message: string;
  field?: string;
  value?: unknown;
}