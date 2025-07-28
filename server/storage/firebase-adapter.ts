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
    return this.firebase.createTag(tag);
  }

  async getMostUsedTags(limit?: number): Promise<Tag[]> {
    const tags = await this.firebase.getAllTags();
    return tags.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, limit || 10);
  }

  async getMostRecentTags(limit?: number): Promise<Tag[]> {
    const tags = await this.firebase.getAllTags();
    return tags.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit || 10);
  }

  async getMostUsedIngredientTags(limit = 5): Promise<Tag[]> {
    // TODO: Implement ingredient-specific tag filtering
    const tags = await this.firebase.getAllTags();
    return tags.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, limit);
  }

  async getMostRecentIngredientTags(limit = 5): Promise<Tag[]> {
    // TODO: Implement ingredient-specific tag filtering
    const tags = await this.firebase.getAllTags();
    return tags.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
  }

  async getMostUsedCocktailTags(limit = 5): Promise<Tag[]> {
    // TODO: Implement cocktail-specific tag filtering
    const tags = await this.firebase.getAllTags();
    return tags.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, limit);
  }

  async getMostRecentCocktailTags(limit = 5): Promise<Tag[]> {
    // TODO: Implement cocktail-specific tag filtering
    const tags = await this.firebase.getAllTags();
    return tags.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
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
    const ingredients = await this.firebase.getAllIngredients();
    const lowerQuery = query.toLowerCase();
    
    // Get all tags for tag-based searching
    const allTags = await this.firebase.getAllTags();
    const tagMap = new Map(allTags.map(tag => [tag.id, tag.name.toLowerCase()]));
    
    return ingredients.filter((ingredient: Ingredient) => {
      // Search by basic ingredient properties
      const matchesBasic = ingredient.name.toLowerCase().includes(lowerQuery) ||
        ingredient.category.toLowerCase().includes(lowerQuery) ||
        (ingredient.subCategory && ingredient.subCategory.toLowerCase().includes(lowerQuery)) ||
        (ingredient.preferredBrand && ingredient.preferredBrand.toLowerCase().includes(lowerQuery)) ||
        (ingredient.description && ingredient.description.toLowerCase().includes(lowerQuery));
      
      if (matchesBasic) return true;
      
      // Search by ingredient tags - Since Firebase stores ingredientTagIds directly on ingredients
      // we can check the associated tag names
      if (ingredient.tagIds && ingredient.tagIds.length > 0) {
        return ingredient.tagIds.some(tagId => {
          const tagName = tagMap.get(tagId);
          return tagName && tagName.includes(lowerQuery);
        });
      }
      
      return false;
    });
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

  async recalculateIngredientUsageCounts(): Promise<void> {
    await this.firebase.recalculateIngredientUsageCounts();
  }

  async deleteIngredient(id: number): Promise<boolean> {
    return this.firebase.deleteIngredient(id);
  }

  async findIngredientByName(name: string): Promise<Ingredient | null> {
    const allIngredients = await this.firebase.getAllIngredients();
    const lowercaseName = name.toLowerCase();
    const found = allIngredients.find(ingredient => 
      ingredient.name.toLowerCase() === lowercaseName
    );
    return found || null;
  }

  async findTagByName(name: string): Promise<Tag | null> {
    const allTags = await this.firebase.getAllTags();
    const lowercaseName = name.toLowerCase();
    const found = allTags.find(tag => 
      tag.name.toLowerCase() === lowercaseName
    );
    return found || null;
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

  async createCocktail(cocktail: CocktailForm): Promise<Cocktail> {
    console.log('\n=== FIREBASE ADAPTER createCocktail START ===');
    console.log('Adapter received cocktail data:', JSON.stringify(cocktail, null, 2));
    console.log('Cocktail data keys:', Object.keys(cocktail));
    
    // Pass ALL cocktail data to Firebase, including junction table data
    const createdCocktail = await this.firebase.createCocktail(cocktail as any);
    
    console.log('=== FIREBASE ADAPTER createCocktail COMPLETE ===\n');
    return createdCocktail;
  }

  async updateCocktail(id: number, cocktail: Partial<InsertCocktail> | CocktailForm): Promise<Cocktail> {
    const updated = await this.firebase.updateCocktail(id, cocktail as any);
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
    const tags = await this.firebase.getCocktailTags(id);

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