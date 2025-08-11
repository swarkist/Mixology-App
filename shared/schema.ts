import { pgTable, text, serial, integer, boolean, timestamp, real, json, varchar, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - enhanced for auth and RBAC
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  role: text("role", { enum: ['basic', 'admin'] }).default('basic').notNull(),
  is_active: boolean("is_active").default(true).notNull(),
  email_verified_at: timestamp("email_verified_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Sessions table for refresh token management
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  refresh_token_hash: text("refresh_token_hash").notNull(),
  expires_at: timestamp("expires_at").notNull(),
  ip: text("ip"),
  user_agent: text("user_agent"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Audit logs table
export const audit_logs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resource_id: text("resource_id"),
  metadata: json("metadata"),
  ip: text("ip"),
  user_agent: text("user_agent"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// My Bar table - user-specific ingredient/brand tracking
export const my_bar = pgTable("my_bar", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ['ingredient', 'brand'] }).notNull(),
  ref_id: integer("ref_id").notNull(), // references ingredients.id or preferred_brands.id
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Password resets table
export const password_resets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token_hash: text("token_hash").notNull(),
  expires_at: timestamp("expires_at").notNull(),
  used_at: timestamp("used_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
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
  preferredBrand: text("preferred_brand"), // preferred brand for this ingredient
  abv: real("abv"), // alcohol by volume percentage
  // Removed inMyBar - now handled by my_bar table per user
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
  // Removed inMyBar - now handled by my_bar table per user
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

// Zod schemas for validation - Auth schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password_hash: true,
  role: true,
  is_active: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  created_at: true,
});

export const insertAuditLogSchema = createInsertSchema(audit_logs).omit({
  id: true,
  created_at: true,
});

export const insertMyBarSchema = createInsertSchema(my_bar).omit({
  id: true,
  created_at: true,
});

export const insertPasswordResetSchema = createInsertSchema(password_resets).omit({
  id: true,
  used_at: true,
  created_at: true,
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

// Auth type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof audit_logs.$inferSelect;
export type InsertMyBar = z.infer<typeof insertMyBarSchema>;
export type MyBar = typeof my_bar.$inferSelect;
export type InsertPasswordReset = z.infer<typeof insertPasswordResetSchema>;
export type PasswordReset = typeof password_resets.$inferSelect;

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
