
import { 
  users, cocktails, ingredients, tags, cocktailIngredients, cocktailInstructions, 
  cocktailTags, ingredientTags,
  type User, type InsertUser, type Cocktail, type InsertCocktail, 
  type Ingredient, type InsertIngredient, type Tag, type InsertTag,
  type CocktailIngredient, type CocktailInstruction, type CocktailForm, type IngredientForm
} from "@shared/schema";

// Comprehensive storage interface for all MVP features
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Tags
  getAllTags(): Promise<Tag[]>;
  getTagsByNames(names: string[]): Promise<Tag[]>;
  createTag(tag: InsertTag): Promise<Tag>;
  getMostUsedTags(limit?: number): Promise<Tag[]>;
  getMostRecentTags(limit?: number): Promise<Tag[]>;
  incrementTagUsage(tagId: number): Promise<void>;

  // Ingredients
  getAllIngredients(): Promise<Ingredient[]>;
  getIngredient(id: number): Promise<Ingredient | undefined>;
  searchIngredients(query: string): Promise<Ingredient[]>;
  getIngredientsByCategory(category: string): Promise<Ingredient[]>;
  getIngredientsInMyBar(): Promise<Ingredient[]>;
  createIngredient(ingredient: IngredientForm): Promise<Ingredient>;
  updateIngredient(id: number, ingredient: Partial<InsertIngredient>): Promise<Ingredient>;
  toggleMyBar(ingredientId: number): Promise<Ingredient>;
  incrementIngredientUsage(ingredientId: number): Promise<void>;

  // Cocktails  
  getAllCocktails(): Promise<Cocktail[]>;
  getCocktail(id: number): Promise<Cocktail | undefined>;
  searchCocktails(query: string): Promise<Cocktail[]>;
  getFeaturedCocktails(): Promise<Cocktail[]>;
  getPopularCocktails(): Promise<Cocktail[]>;
  getCocktailsByIngredients(ingredientIds: number[], matchAll?: boolean): Promise<Cocktail[]>;
  createCocktail(cocktail: CocktailForm): Promise<Cocktail>;
  updateCocktail(id: number, cocktail: Partial<InsertCocktail>): Promise<Cocktail>;
  toggleFeatured(cocktailId: number): Promise<Cocktail>;
  incrementPopularity(cocktailId: number): Promise<Cocktail>;
  resetPopularity(cocktailId: number): Promise<Cocktail>;

  // Cocktail details
  getCocktailWithDetails(id: number): Promise<{
    cocktail: Cocktail;
    ingredients: Array<CocktailIngredient & { ingredient: Ingredient }>;
    instructions: CocktailInstruction[];
    tags: Tag[];
  } | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private cocktails: Map<number, Cocktail>;
  private ingredients: Map<number, Ingredient>;
  private tags: Map<number, Tag>;
  private cocktailIngredients: Map<number, CocktailIngredient>;
  private cocktailInstructions: Map<number, CocktailInstruction>;
  private cocktailTags: Map<number, { cocktailId: number; tagId: number }>;
  private ingredientTags: Map<number, { ingredientId: number; tagId: number }>;
  
  private currentUserId: number;
  private currentCocktailId: number;
  private currentIngredientId: number;
  private currentTagId: number;
  private currentCocktailIngredientId: number;
  private currentCocktailInstructionId: number;
  private currentCocktailTagId: number;
  private currentIngredientTagId: number;

  constructor() {
    this.users = new Map();
    this.cocktails = new Map();
    this.ingredients = new Map();
    this.tags = new Map();
    this.cocktailIngredients = new Map();
    this.cocktailInstructions = new Map();
    this.cocktailTags = new Map();
    this.ingredientTags = new Map();
    
    this.currentUserId = 1;
    this.currentCocktailId = 1;
    this.currentIngredientId = 1;
    this.currentTagId = 1;
    this.currentCocktailIngredientId = 1;
    this.currentCocktailInstructionId = 1;
    this.currentCocktailTagId = 1;
    this.currentIngredientTagId = 1;

    this.seedData();
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Tags
  async getAllTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async getTagsByNames(names: string[]): Promise<Tag[]> {
    return Array.from(this.tags.values()).filter(tag => names.includes(tag.name));
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const existing = Array.from(this.tags.values()).find(t => t.name === tag.name);
    if (existing) return existing;
    
    const id = this.currentTagId++;
    const newTag: Tag = { 
      ...tag, 
      id, 
      usageCount: 0, 
      createdAt: new Date() 
    };
    this.tags.set(id, newTag);
    return newTag;
  }

  async getMostUsedTags(limit = 5): Promise<Tag[]> {
    return Array.from(this.tags.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  async getMostRecentTags(limit = 5): Promise<Tag[]> {
    return Array.from(this.tags.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async incrementTagUsage(tagId: number): Promise<void> {
    const tag = this.tags.get(tagId);
    if (tag) {
      tag.usageCount++;
      this.tags.set(tagId, tag);
    }
  }

  // Ingredients
  async getAllIngredients(): Promise<Ingredient[]> {
    return Array.from(this.ingredients.values());
  }

  async getIngredient(id: number): Promise<Ingredient | undefined> {
    return this.ingredients.get(id);
  }

  async searchIngredients(query: string): Promise<Ingredient[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.ingredients.values()).filter(ingredient =>
      ingredient.name.toLowerCase().includes(lowercaseQuery) ||
      ingredient.category.toLowerCase().includes(lowercaseQuery) ||
      ingredient.subCategory?.toLowerCase().includes(lowercaseQuery) ||
      ingredient.preferredBrand?.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getIngredientsByCategory(category: string): Promise<Ingredient[]> {
    return Array.from(this.ingredients.values()).filter(ingredient => 
      ingredient.category === category
    );
  }

  async getIngredientsInMyBar(): Promise<Ingredient[]> {
    return Array.from(this.ingredients.values()).filter(ingredient => ingredient.inMyBar);
  }

  async createIngredient(ingredientData: IngredientForm): Promise<Ingredient> {
    const id = this.currentIngredientId++;
    const ingredient: Ingredient = {
      id,
      name: ingredientData.name,
      category: ingredientData.category,
      subCategory: ingredientData.subCategory || null,
      description: ingredientData.description || null,
      preferredBrand: ingredientData.preferredBrand || null,
      abv: ingredientData.abv || null,
      imageUrl: ingredientData.imageUrl || null,
      inMyBar: ingredientData.inMyBar || false,
      usedInRecipesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.ingredients.set(id, ingredient);
    
    // Handle tags
    if (ingredientData.tagIds) {
      for (const tagId of ingredientData.tagIds) {
        const tagRelationId = this.currentIngredientTagId++;
        this.ingredientTags.set(tagRelationId, { ingredientId: id, tagId });
        await this.incrementTagUsage(tagId);
      }
    }
    
    return ingredient;
  }

  async updateIngredient(id: number, update: Partial<InsertIngredient>): Promise<Ingredient> {
    const ingredient = this.ingredients.get(id);
    if (!ingredient) throw new Error(`Ingredient ${id} not found`);
    
    const updated = { ...ingredient, ...update, updatedAt: new Date() };
    this.ingredients.set(id, updated);
    return updated;
  }

  async toggleMyBar(ingredientId: number): Promise<Ingredient> {
    const ingredient = this.ingredients.get(ingredientId);
    if (!ingredient) throw new Error(`Ingredient ${ingredientId} not found`);
    
    ingredient.inMyBar = !ingredient.inMyBar;
    ingredient.updatedAt = new Date();
    this.ingredients.set(ingredientId, ingredient);
    return ingredient;
  }

  async incrementIngredientUsage(ingredientId: number): Promise<void> {
    const ingredient = this.ingredients.get(ingredientId);
    if (ingredient) {
      ingredient.usedInRecipesCount++;
      ingredient.updatedAt = new Date();
      this.ingredients.set(ingredientId, ingredient);
    }
  }

  // Cocktails
  async getAllCocktails(): Promise<Cocktail[]> {
    return Array.from(this.cocktails.values());
  }

  async getCocktail(id: number): Promise<Cocktail | undefined> {
    return this.cocktails.get(id);
  }

  async searchCocktails(query: string): Promise<Cocktail[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.cocktails.values()).filter(cocktail =>
      cocktail.name.toLowerCase().includes(lowercaseQuery) ||
      cocktail.description?.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getFeaturedCocktails(): Promise<Cocktail[]> {
    return Array.from(this.cocktails.values())
      .filter(cocktail => cocktail.isFeatured)
      .sort((a, b) => {
        if (!a.featuredAt || !b.featuredAt) return 0;
        return b.featuredAt.getTime() - a.featuredAt.getTime();
      });
  }

  async getPopularCocktails(): Promise<Cocktail[]> {
    return Array.from(this.cocktails.values())
      .sort((a, b) => b.popularityCount - a.popularityCount);
  }

  async getCocktailsByIngredients(ingredientIds: number[], matchAll = false): Promise<Cocktail[]> {
    const cocktailsWithIngredients = new Map<number, Set<number>>();
    
    // Build map of cocktails and their ingredients
    for (const ci of Array.from(this.cocktailIngredients.values())) {
      if (!cocktailsWithIngredients.has(ci.cocktailId)) {
        cocktailsWithIngredients.set(ci.cocktailId, new Set());
      }
      cocktailsWithIngredients.get(ci.cocktailId)!.add(ci.ingredientId);
    }
    
    const matchingCocktailIds = new Set<number>();
    
    for (const [cocktailId, cocktailIngredients] of Array.from(cocktailsWithIngredients.entries())) {
      if (matchAll) {
        // All specified ingredients must be in the cocktail
        if (ingredientIds.every(id => cocktailIngredients.has(id))) {
          matchingCocktailIds.add(cocktailId);
        }
      } else {
        // Any of the specified ingredients can be in the cocktail
        if (ingredientIds.some(id => cocktailIngredients.has(id))) {
          matchingCocktailIds.add(cocktailId);
        }
      }
    }
    
    return Array.from(matchingCocktailIds)
      .map(id => this.cocktails.get(id))
      .filter((cocktail): cocktail is Cocktail => cocktail !== undefined);
  }

  async createCocktail(cocktailData: CocktailForm): Promise<Cocktail> {
    const id = this.currentCocktailId++;
    const cocktail: Cocktail = {
      id,
      name: cocktailData.name,
      description: cocktailData.description || null,
      imageUrl: cocktailData.imageUrl || null,
      isFeatured: cocktailData.isFeatured || false,
      featuredAt: cocktailData.isFeatured ? new Date() : null,
      popularityCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.cocktails.set(id, cocktail);
    
    // Handle ingredients
    for (let i = 0; i < cocktailData.ingredients.length; i++) {
      const ingredient = cocktailData.ingredients[i];
      const ingredientId = this.currentCocktailIngredientId++;
      const cocktailIngredient: CocktailIngredient = {
        id: ingredientId,
        cocktailId: id,
        ingredientId: ingredient.ingredientId,
        amount: ingredient.amount,
        unit: ingredient.unit,
        order: i,
      };
      this.cocktailIngredients.set(ingredientId, cocktailIngredient);
      await this.incrementIngredientUsage(ingredient.ingredientId);
    }
    
    // Handle instructions
    for (let i = 0; i < cocktailData.instructions.length; i++) {
      const instructionId = this.currentCocktailInstructionId++;
      const instruction: CocktailInstruction = {
        id: instructionId,
        cocktailId: id,
        stepNumber: i + 1,
        instruction: cocktailData.instructions[i],
      };
      this.cocktailInstructions.set(instructionId, instruction);
    }
    
    // Handle tags
    if (cocktailData.tagIds) {
      for (const tagId of cocktailData.tagIds) {
        const tagRelationId = this.currentCocktailTagId++;
        this.cocktailTags.set(tagRelationId, { cocktailId: id, tagId });
        await this.incrementTagUsage(tagId);
      }
    }
    
    return cocktail;
  }

  async updateCocktail(id: number, update: Partial<InsertCocktail>): Promise<Cocktail> {
    const cocktail = this.cocktails.get(id);
    if (!cocktail) throw new Error(`Cocktail ${id} not found`);
    
    const updated = { ...cocktail, ...update, updatedAt: new Date() };
    this.cocktails.set(id, updated);
    return updated;
  }

  async toggleFeatured(cocktailId: number): Promise<Cocktail> {
    const cocktail = this.cocktails.get(cocktailId);
    if (!cocktail) throw new Error(`Cocktail ${cocktailId} not found`);
    
    cocktail.isFeatured = !cocktail.isFeatured;
    cocktail.featuredAt = cocktail.isFeatured ? new Date() : null;
    cocktail.updatedAt = new Date();
    this.cocktails.set(cocktailId, cocktail);
    return cocktail;
  }

  async incrementPopularity(cocktailId: number): Promise<Cocktail> {
    const cocktail = this.cocktails.get(cocktailId);
    if (!cocktail) throw new Error(`Cocktail ${cocktailId} not found`);
    
    cocktail.popularityCount++;
    cocktail.updatedAt = new Date();
    this.cocktails.set(cocktailId, cocktail);
    return cocktail;
  }

  async resetPopularity(cocktailId: number): Promise<Cocktail> {
    const cocktail = this.cocktails.get(cocktailId);
    if (!cocktail) throw new Error(`Cocktail ${cocktailId} not found`);
    
    cocktail.popularityCount = 0;
    cocktail.updatedAt = new Date();
    this.cocktails.set(cocktailId, cocktail);
    return cocktail;
  }

  async getCocktailWithDetails(id: number): Promise<{
    cocktail: Cocktail;
    ingredients: Array<CocktailIngredient & { ingredient: Ingredient }>;
    instructions: CocktailInstruction[];
    tags: Tag[];
  } | undefined> {
    const cocktail = this.cocktails.get(id);
    if (!cocktail) return undefined;
    
    const ingredients = Array.from(this.cocktailIngredients.values())
      .filter(ci => ci.cocktailId === id)
      .map(ci => ({
        ...ci,
        ingredient: this.ingredients.get(ci.ingredientId)!
      }))
      .filter(ci => ci.ingredient)
      .sort((a, b) => a.order - b.order);
    
    const instructions = Array.from(this.cocktailInstructions.values())
      .filter(inst => inst.cocktailId === id)
      .sort((a, b) => a.stepNumber - b.stepNumber);
    
    const tagIds = Array.from(this.cocktailTags.values())
      .filter(ct => ct.cocktailId === id)
      .map(ct => ct.tagId);
    
    const tags = tagIds
      .map(tagId => this.tags.get(tagId))
      .filter((tag): tag is Tag => tag !== undefined);
    
    return {
      cocktail,
      ingredients,
      instructions,
      tags,
    };
  }

  // Seed some sample data
  private seedData(): void {
    // Create some sample ingredients
    const vodka: Ingredient = {
      id: this.currentIngredientId++,
      name: "Premium Vodka",
      category: "spirits",
      subCategory: "vodka",
      description: "High-quality vodka for cocktails",
      preferredBrand: "Grey Goose",
      abv: 40,
      imageUrl: null,
      inMyBar: true,
      usedInRecipesCount: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.ingredients.set(vodka.id, vodka);

    const lime: Ingredient = {
      id: this.currentIngredientId++,
      name: "Lime Juice",
      category: "juices",
      subCategory: null,
      description: "Fresh lime juice",
      preferredBrand: null,
      abv: 0,
      imageUrl: null,
      inMyBar: true,
      usedInRecipesCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.ingredients.set(lime.id, lime);

    // Create sample tags
    const citrusTag: Tag = {
      id: this.currentTagId++,
      name: "citrus",
      usageCount: 2,
      createdAt: new Date(),
    };
    this.tags.set(citrusTag.id, citrusTag);

    // Create sample cocktail
    const cosmopolitan: Cocktail = {
      id: this.currentCocktailId++,
      name: "Cosmopolitan",
      description: "A classic pink cocktail with vodka and cranberry",
      imageUrl: null,
      isFeatured: true,
      featuredAt: new Date(),
      popularityCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.cocktails.set(cosmopolitan.id, cosmopolitan);
  }
}

export const storage = new MemStorage();
