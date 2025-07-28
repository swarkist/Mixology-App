import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Tags table - reusable tags for cocktails and ingredients
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  usageCount: integer("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ingredients table
export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // spirits, mixers, juices, syrups, bitters, garnishes, other
  subCategory: text("sub_category"), // for spirits: tequila, whiskey, rum, vodka, gin, scotch, moonshine, brandy
  description: text("description"),
  imageUrl: text("image_url"),
  usedInRecipesCount: integer("used_in_recipes_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Preferred Brands table
export const preferredBrands = pgTable("preferred_brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  proof: integer("proof"), // proof value (can exceed 100)
  imageUrl: text("image_url"),
  inMyBar: boolean("in_my_bar").default(false).notNull(), // for "My Bar" feature
  usedInRecipesCount: integer("used_in_recipes_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Preferred Brand Ingredients - junction table
export const preferredBrandIngredients = pgTable("preferred_brand_ingredients", {
  id: serial("id").primaryKey(),
  preferredBrandId: integer("preferred_brand_id").notNull().references(() => preferredBrands.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
});

// Cocktails table
export const cocktails = pgTable("cocktails", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  featuredAt: timestamp("featured_at"),
  popularityCount: integer("popularity_count").default(0).notNull(), // "Start Making This Cocktail" clicks
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Cocktail ingredients - junction table with amounts
export const cocktailIngredients = pgTable("cocktail_ingredients", {
  id: serial("id").primaryKey(),
  cocktailId: integer("cocktail_id").notNull().references(() => cocktails.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  amount: text("amount").notNull(), // e.g., "2", "1.5", "splash"
  unit: text("unit").notNull(), // oz, ml, parts, dashes, drops, tsp, tbsp, cups, slices, wedges, splash, twist, whole
  order: integer("order").default(0).notNull(), // for display order
});

// Cocktail instructions
export const cocktailInstructions = pgTable("cocktail_instructions", {
  id: serial("id").primaryKey(),
  cocktailId: integer("cocktail_id").notNull().references(() => cocktails.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  instruction: text("instruction").notNull(),
});

// Cocktail tags - junction table
export const cocktailTags = pgTable("cocktail_tags", {
  id: serial("id").primaryKey(),
  cocktailId: integer("cocktail_id").notNull().references(() => cocktails.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
});

// Ingredient tags - junction table
export const ingredientTags = pgTable("ingredient_tags", {
  id: serial("id").primaryKey(),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
});

// Preferred Brand tags - junction table
export const preferredBrandTags = pgTable("preferred_brand_tags", {
  id: serial("id").primaryKey(),
  preferredBrandId: integer("preferred_brand_id").notNull().references(() => preferredBrands.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTagSchema = createInsertSchema(tags).pick({
  name: true,
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
  usedInRecipesCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCocktailSchema = createInsertSchema(cocktails).omit({
  id: true,
  featuredAt: true,
  popularityCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCocktailIngredientSchema = createInsertSchema(cocktailIngredients).omit({
  id: true,
});

export const insertCocktailInstructionSchema = createInsertSchema(cocktailInstructions).omit({
  id: true,
});

export const insertCocktailTagSchema = createInsertSchema(cocktailTags).omit({
  id: true,
});

export const insertIngredientTagSchema = createInsertSchema(ingredientTags).omit({
  id: true,
});

export const insertPreferredBrandSchema = createInsertSchema(preferredBrands).omit({
  id: true,
  usedInRecipesCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPreferredBrandIngredientSchema = createInsertSchema(preferredBrandIngredients).omit({
  id: true,
});

export const insertPreferredBrandTagSchema = createInsertSchema(preferredBrandTags).omit({
  id: true,
});

// Extended schemas for forms
export const cocktailFormSchema = insertCocktailSchema.extend({
  ingredients: z.array(z.object({
    ingredientId: z.number(),
    amount: z.string().min(1),
    unit: z.string().min(1),
  })),
  instructions: z.array(z.string().min(1)),
  tagIds: z.array(z.number()).optional(),
});

export const ingredientFormSchema = insertIngredientSchema.extend({
  tagIds: z.array(z.number()).optional(),
});

export const preferredBrandFormSchema = insertPreferredBrandSchema.extend({
  tagIds: z.array(z.number()).optional(),
  ingredientIds: z.array(z.number()).optional(),
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Ingredient = typeof ingredients.$inferSelect;

export type InsertPreferredBrand = z.infer<typeof insertPreferredBrandSchema>;
export type PreferredBrand = typeof preferredBrands.$inferSelect;

export type InsertCocktail = z.infer<typeof insertCocktailSchema>;
export type Cocktail = typeof cocktails.$inferSelect;

export type CocktailIngredient = typeof cocktailIngredients.$inferSelect;
export type CocktailInstruction = typeof cocktailInstructions.$inferSelect;
export type CocktailTag = typeof cocktailTags.$inferSelect;
export type IngredientTag = typeof ingredientTags.$inferSelect;
export type PreferredBrandIngredient = typeof preferredBrandIngredients.$inferSelect;
export type PreferredBrandTag = typeof preferredBrandTags.$inferSelect;

export type CocktailForm = z.infer<typeof cocktailFormSchema>;
export type IngredientForm = z.infer<typeof ingredientFormSchema>;
export type PreferredBrandForm = z.infer<typeof preferredBrandFormSchema>;

// Constants from PRD
export const INGREDIENT_CATEGORIES = [
  "spirits",
  "mixers", 
  "juices",
  "syrups",
  "bitters",
  "garnishes",
  "other"
] as const;

export const SPIRIT_SUBCATEGORIES = [
  "tequila",
  "whiskey",
  "rum",
  "vodka",
  "gin",
  "scotch",
  "moonshine",
  "brandy"
] as const;

export const MEASUREMENT_UNITS = [
  "oz",
  "ml",
  "parts",
  "dashes",
  "drops",
  "tsp",
  "tbsp",
  "cups",
  "slices",
  "wedges",
  "splash",
  "twist",
  "whole"
] as const;

export type IngredientCategory = typeof INGREDIENT_CATEGORIES[number];
export type SpiritSubcategory = typeof SPIRIT_SUBCATEGORIES[number];
export type MeasurementUnit = typeof MEASUREMENT_UNITS[number];
