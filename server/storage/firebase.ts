import { db } from '../firebase';
import type { IStorage } from '../storage';
import type { Cocktail, Ingredient, CocktailIngredient, CocktailInstruction, Tag, InsertCocktail, InsertIngredient } from '@shared/schema';

export class FirebaseStorage implements IStorage {
  private cocktailsCollection = db.collection('cocktails');
  private ingredientsCollection = db.collection('ingredients');
  private cocktailIngredientsCollection = db.collection('cocktail_ingredients');
  private cocktailInstructionsCollection = db.collection('cocktail_instructions');
  private tagsCollection = db.collection('tags');

  // Cocktail operations
  async getAllCocktails(): Promise<Cocktail[]> {
    const snapshot = await this.cocktailsCollection.get();
    return snapshot.docs.map((doc: any) => ({ id: parseInt(doc.id), ...doc.data() } as Cocktail));
  }

  async getCocktailById(id: number): Promise<Cocktail | null> {
    const doc = await this.cocktailsCollection.doc(id.toString()).get();
    if (!doc.exists) return null;
    return { id: parseInt(doc.id), ...doc.data() } as Cocktail;
  }

  async createCocktail(cocktail: InsertCocktail): Promise<Cocktail> {
    // Generate a numeric ID by using timestamp + random
    const numericId = Date.now() + Math.floor(Math.random() * 1000);
    
    const cocktailData = {
      ...cocktail,
      createdAt: new Date(),
      updatedAt: new Date(),
      isFeatured: false,
      featuredAt: null,
      popularityCount: 0,
    };
    
    await this.cocktailsCollection.doc(numericId.toString()).set(cocktailData);
    
    return { id: numericId, ...cocktailData } as Cocktail;
  }

  async updateCocktail(id: number, updates: Partial<Cocktail>): Promise<Cocktail | null> {
    const docRef = this.cocktailsCollection.doc(id.toString());
    await docRef.update({ ...updates, updatedAt: new Date() });
    
    const doc = await docRef.get();
    if (!doc.exists) return null;
    return { id: parseInt(doc.id), ...doc.data() } as Cocktail;
  }

  async deleteCocktail(id: number): Promise<boolean> {
    try {
      await this.cocktailsCollection.doc(id.toString()).delete();
      return true;
    } catch {
      return false;
    }
  }

  async searchCocktails(query: string): Promise<Cocktail[]> {
    // Firestore doesn't support full-text search natively
    // For basic search, we'll get all cocktails and filter client-side
    // In production, consider using Algolia or Elasticsearch for better search
    const cocktails = await this.getAllCocktails();
    const lowerQuery = query.toLowerCase();
    return cocktails.filter(cocktail => 
      cocktail.name.toLowerCase().includes(lowerQuery) ||
      (cocktail.description && cocktail.description.toLowerCase().includes(lowerQuery))
    );
  }

  async getFeaturedCocktails(): Promise<Cocktail[]> {
    const snapshot = await this.cocktailsCollection.where('isFeatured', '==', true).get();
    return snapshot.docs.map((doc: any) => ({ id: parseInt(doc.id), ...doc.data() } as Cocktail));
  }

  async getPopularCocktails(): Promise<Cocktail[]> {
    const snapshot = await this.cocktailsCollection.orderBy('popularityCount', 'desc').limit(10).get();
    return snapshot.docs.map((doc: any) => ({ id: parseInt(doc.id), ...doc.data() } as Cocktail));
  }

  async toggleCocktailFeatured(id: number, featured: boolean): Promise<Cocktail | null> {
    const updates: Partial<Cocktail> = {
      isFeatured: featured,
      featuredAt: featured ? new Date() : null,
    };
    return this.updateCocktail(id, updates);
  }

  async incrementCocktailPopularity(id: number): Promise<Cocktail | null> {
    const cocktail = await this.getCocktailById(id);
    if (!cocktail) return null;
    
    return this.updateCocktail(id, { 
      popularityCount: cocktail.popularityCount + 1 
    });
  }

  async resetCocktailPopularity(id: number): Promise<Cocktail | null> {
    return this.updateCocktail(id, { popularityCount: 0 });
  }

  // Ingredient operations
  async getAllIngredients(): Promise<Ingredient[]> {
    const snapshot = await this.ingredientsCollection.get();
    return snapshot.docs.map((doc: any) => ({ id: parseInt(doc.id), ...doc.data() } as Ingredient));
  }

  async getIngredientById(id: number): Promise<Ingredient | null> {
    const doc = await this.ingredientsCollection.doc(id.toString()).get();
    if (!doc.exists) return null;
    return { id: parseInt(doc.id), ...doc.data() } as Ingredient;
  }

  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    // Generate a numeric ID by using timestamp + random
    const numericId = Date.now() + Math.floor(Math.random() * 1000);
    
    const ingredientData = {
      ...ingredient,
      createdAt: new Date(),
      updatedAt: new Date(),
      inMyBar: false,
      usedInRecipesCount: 0,
    };
    
    await this.ingredientsCollection.doc(numericId.toString()).set(ingredientData);
    
    return { id: numericId, ...ingredientData } as Ingredient;
  }

  async updateIngredient(id: number, updates: Partial<Ingredient>): Promise<Ingredient | null> {
    const docRef = this.ingredientsCollection.doc(id.toString());
    await docRef.update({ ...updates, updatedAt: new Date() });
    
    const doc = await docRef.get();
    if (!doc.exists) return null;
    return { id: parseInt(doc.id), ...doc.data() } as Ingredient;
  }

  async deleteIngredient(id: number): Promise<boolean> {
    try {
      await this.ingredientsCollection.doc(id.toString()).delete();
      return true;
    } catch {
      return false;
    }
  }

  async searchIngredients(query: string): Promise<Ingredient[]> {
    const ingredients = await this.getAllIngredients();
    const lowerQuery = query.toLowerCase();
    return ingredients.filter((ingredient: Ingredient) => 
      ingredient.name.toLowerCase().includes(lowerQuery) ||
      ingredient.category.toLowerCase().includes(lowerQuery) ||
      (ingredient.subCategory && ingredient.subCategory.toLowerCase().includes(lowerQuery))
    );
  }

  async getIngredientsByCategory(category: string): Promise<Ingredient[]> {
    const snapshot = await this.ingredientsCollection.where('category', '==', category).get();
    return snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() } as Ingredient));
  }

  async getMyBarIngredients(): Promise<Ingredient[]> {
    const snapshot = await this.ingredientsCollection.where('inMyBar', '==', true).get();
    return snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() } as Ingredient));
  }

  async toggleIngredientInMyBar(id: number, inMyBar: boolean): Promise<Ingredient | null> {
    return this.updateIngredient(id, { inMyBar });
  }

  async incrementIngredientUsage(id: number): Promise<Ingredient | null> {
    const ingredient = await this.getIngredientById(id);
    if (!ingredient) return null;
    
    return this.updateIngredient(id, { 
      usedInRecipesCount: ingredient.usedInRecipesCount + 1 
    });
  }

  async resetIngredientUsage(id: number): Promise<Ingredient | null> {
    return this.updateIngredient(id, { usedInRecipesCount: 0 });
  }

  // Filter ingredients by multiple criteria
  async filterIngredients(filters: {
    category?: string;
    subcategory?: string;
    myBar?: boolean;
    search?: string;
  }): Promise<Ingredient[]> {
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = this.ingredientsCollection;

    if (filters.category) {
      query = query.where('category', '==', filters.category);
    }
    if (filters.subcategory) {
      query = query.where('subCategory', '==', filters.subcategory);
    }
    if (filters.myBar !== undefined) {
      query = query.where('inMyBar', '==', filters.myBar);
    }

    const snapshot = await query.get();
    let ingredients = snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() } as Ingredient));

    // Apply search filter client-side since Firestore has limited text search
    if (filters.search) {
      const lowerQuery = filters.search.toLowerCase();
      ingredients = ingredients.filter(ingredient => 
        ingredient.name.toLowerCase().includes(lowerQuery) ||
        ingredient.category.toLowerCase().includes(lowerQuery) ||
        (ingredient.subCategory && ingredient.subCategory.toLowerCase().includes(lowerQuery))
      );
    }

    return ingredients;
  }

  // Filter cocktails by multiple criteria
  async filterCocktails(filters: {
    featured?: boolean;
    popular?: boolean;
    search?: string;
  }): Promise<Cocktail[]> {
    let cocktails: Cocktail[];

    if (filters.featured) {
      cocktails = await this.getFeaturedCocktails();
    } else if (filters.popular) {
      cocktails = await this.getPopularCocktails();
    } else {
      cocktails = await this.getAllCocktails();
    }

    // Apply search filter
    if (filters.search) {
      const lowerQuery = filters.search.toLowerCase();
      cocktails = cocktails.filter(cocktail => 
        cocktail.name.toLowerCase().includes(lowerQuery) ||
        (cocktail.description && cocktail.description.toLowerCase().includes(lowerQuery))
      );
    }

    return cocktails;
  }

  // Junction table operations (for future use)
  async getCocktailIngredients(cocktailId: number): Promise<CocktailIngredient[]> {
    const snapshot = await this.cocktailIngredientsCollection.where('cocktailId', '==', cocktailId).get();
    return snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() } as CocktailIngredient));
  }

  async getCocktailInstructions(cocktailId: number): Promise<CocktailInstruction[]> {
    const snapshot = await this.cocktailInstructionsCollection.where('cocktailId', '==', cocktailId).orderBy('stepNumber').get();
    return snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() } as CocktailInstruction));
  }

  async getAllTags(): Promise<Tag[]> {
    const snapshot = await this.tagsCollection.get();
    return snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() } as Tag));
  }
}