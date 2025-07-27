import { FirebaseStorage } from './firebase';
import type { IStorage } from '../storage';
import type { 
  User, InsertUser, Cocktail, InsertCocktail, Ingredient, InsertIngredient, 
  Tag, InsertTag, CocktailIngredient, CocktailInstruction, CocktailForm, IngredientForm 
} from '@shared/schema';

// Adapter class that implements the existing IStorage interface using Firebase
export class FirebaseStorageAdapter implements IStorage {
  private firebase: FirebaseStorage;

  constructor() {
    this.firebase = new FirebaseStorage();
  }

  // Users (stubbed for now - can be implemented later)
  async getUser(id: number): Promise<User | undefined> {
    // TODO: Implement user management in Firebase
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // TODO: Implement user management in Firebase
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    // TODO: Implement user management in Firebase
    throw new Error('User management not implemented with Firebase yet');
  }

  // Tags (basic implementation)
  async getAllTags(): Promise<Tag[]> {
    return this.firebase.getAllTags();
  }

  async getTagsByNames(names: string[]): Promise<Tag[]> {
    const allTags = await this.firebase.getAllTags();
    return allTags.filter(tag => names.includes(tag.name));
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    // TODO: Implement tag creation in Firebase
    throw new Error('Tag creation not implemented yet');
  }

  async getMostUsedTags(limit?: number): Promise<Tag[]> {
    const tags = await this.firebase.getAllTags();
    return tags.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, limit || 10);
  }

  async getMostRecentTags(limit?: number): Promise<Tag[]> {
    const tags = await this.firebase.getAllTags();
    return tags.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit || 10);
  }

  async incrementTagUsage(tagId: number): Promise<void> {
    // TODO: Implement tag usage increment
  }

  // Ingredients
  async getAllIngredients(): Promise<Ingredient[]> {
    return this.firebase.getAllIngredients();
  }

  async getIngredient(id: number): Promise<Ingredient | undefined> {
    const ingredient = await this.firebase.getIngredientById(id);
    return ingredient || undefined;
  }

  async searchIngredients(query: string): Promise<Ingredient[]> {
    return this.firebase.searchIngredients(query);
  }

  async getIngredientsByCategory(category: string): Promise<Ingredient[]> {
    return this.firebase.getIngredientsByCategory(category);
  }

  async getIngredientsInMyBar(): Promise<Ingredient[]> {
    return this.firebase.getMyBarIngredients();
  }

  async createIngredient(ingredient: IngredientForm): Promise<Ingredient> {
    // Convert IngredientForm to InsertIngredient
    const insertIngredient: InsertIngredient = {
      name: ingredient.name,
      description: ingredient.description || null,
      imageUrl: ingredient.imageUrl || null,
      category: ingredient.category,
      subCategory: ingredient.subCategory || null,
      preferredBrand: ingredient.preferredBrand || null,
      abv: ingredient.abv || null,
    };
    return this.firebase.createIngredient(insertIngredient);
  }

  async updateIngredient(id: number, ingredient: Partial<InsertIngredient>): Promise<Ingredient> {
    const updated = await this.firebase.updateIngredient(id, ingredient);
    if (!updated) throw new Error('Ingredient not found');
    return updated;
  }

  async toggleMyBar(ingredientId: number): Promise<Ingredient> {
    const ingredient = await this.firebase.getIngredientById(ingredientId);
    if (!ingredient) throw new Error('Ingredient not found');
    
    const updated = await this.firebase.toggleIngredientInMyBar(ingredientId, !ingredient.inMyBar);
    if (!updated) throw new Error('Failed to update ingredient');
    return updated;
  }

  async incrementIngredientUsage(ingredientId: number): Promise<void> {
    await this.firebase.incrementIngredientUsage(ingredientId);
  }

  // Cocktails
  async getAllCocktails(): Promise<Cocktail[]> {
    return this.firebase.getAllCocktails();
  }

  async getCocktail(id: number): Promise<Cocktail | undefined> {
    const cocktail = await this.firebase.getCocktailById(id);
    return cocktail || undefined;
  }

  async searchCocktails(query: string): Promise<Cocktail[]> {
    return this.firebase.searchCocktails(query);
  }

  async getFeaturedCocktails(): Promise<Cocktail[]> {
    return this.firebase.getFeaturedCocktails();
  }

  async getPopularCocktails(): Promise<Cocktail[]> {
    return this.firebase.getPopularCocktails();
  }

  async getCocktailsByIngredients(ingredientIds: number[], matchAll?: boolean): Promise<Cocktail[]> {
    // TODO: Implement ingredient-based cocktail filtering
    // For now, return all cocktails
    return this.firebase.getAllCocktails();
  }

  async createCocktail(cocktail: any): Promise<Cocktail> {
    // Create the basic cocktail first
    const insertCocktail: InsertCocktail = {
      name: cocktail.name,
      description: cocktail.description || null,
      imageUrl: cocktail.image || null,
    };
    
    const createdCocktail = await this.firebase.createCocktail(insertCocktail);
    
    // Handle ingredients - for now we'll store them as a simple array in the cocktail document
    // In a full implementation, you'd create proper cocktail-ingredient relationships
    if (cocktail.ingredients && cocktail.ingredients.length > 0) {
      await this.firebase.updateCocktail(createdCocktail.id, {
        ingredients: cocktail.ingredients,
        instructions: cocktail.instructions || [],
        tags: cocktail.tags || []
      });
    }
    
    return createdCocktail;
  }

  async updateCocktail(id: number, cocktail: Partial<InsertCocktail>): Promise<Cocktail> {
    const updated = await this.firebase.updateCocktail(id, cocktail);
    if (!updated) throw new Error('Cocktail not found');
    return updated;
  }

  async deleteCocktail(id: number): Promise<boolean> {
    return this.firebase.deleteCocktail(id);
  }

  async toggleFeatured(cocktailId: number): Promise<Cocktail> {
    const cocktail = await this.firebase.getCocktailById(cocktailId);
    if (!cocktail) throw new Error('Cocktail not found');
    
    const updated = await this.firebase.toggleCocktailFeatured(cocktailId, !cocktail.isFeatured);
    if (!updated) throw new Error('Failed to update cocktail');
    return updated;
  }

  async incrementPopularity(cocktailId: number): Promise<Cocktail> {
    const updated = await this.firebase.incrementCocktailPopularity(cocktailId);
    if (!updated) throw new Error('Cocktail not found');
    return updated;
  }

  async resetPopularity(cocktailId: number): Promise<Cocktail> {
    const updated = await this.firebase.resetCocktailPopularity(cocktailId);
    if (!updated) throw new Error('Cocktail not found');
    return updated;
  }

  // Cocktail details (basic implementation)
  async getCocktailWithDetails(id: number): Promise<{
    cocktail: Cocktail;
    ingredients: Array<CocktailIngredient & { ingredient: Ingredient }>;
    instructions: CocktailInstruction[];
    tags: Tag[];
  } | undefined> {
    const cocktail = await this.firebase.getCocktailById(id);
    if (!cocktail) return undefined;

    // Get related data
    const ingredients = await this.firebase.getCocktailIngredients(id);
    const instructions = await this.firebase.getCocktailInstructions(id);
    const tags: Tag[] = []; // TODO: Implement cocktail tags

    // Enrich ingredients with ingredient details
    const enrichedIngredients = await Promise.all(
      ingredients.map(async (ci) => {
        const ingredient = await this.firebase.getIngredientById(ci.ingredientId);
        return { ...ci, ingredient: ingredient! };
      })
    );

    return {
      cocktail,
      ingredients: enrichedIngredients,
      instructions,
      tags,
    };
  }
}