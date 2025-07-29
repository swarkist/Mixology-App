import { db } from '../firebase';
import type { IStorage } from '../storage';
import type { 
  Cocktail, Ingredient, CocktailIngredient, CocktailInstruction, Tag, 
  PreferredBrand, InsertCocktail, InsertIngredient, InsertPreferredBrand,
  CocktailForm, IngredientForm, PreferredBrandForm 
} from '@shared/schema';

export class FirebaseStorage implements IStorage {
  private cocktailsCollection = db.collection('cocktails');
  private ingredientsCollection = db.collection('ingredients');
  private preferredBrandsCollection = db.collection('preferred_brands');
  private cocktailIngredientsCollection = db.collection('cocktail_ingredients');
  private cocktailInstructionsCollection = db.collection('cocktail_instructions');
  private tagsCollection = db.collection('tags');
  private cocktailTagsCollection = db.collection('cocktail_tags');
  private ingredientTagsCollection = db.collection('ingredient_tags');
  private preferredBrandIngredientsCollection = db.collection('preferred_brand_ingredients');
  private preferredBrandTagsCollection = db.collection('preferred_brand_tags');

  // Cocktail operations
  async getAllCocktails(): Promise<Cocktail[]> {
    try {
      const snapshot = await this.cocktailsCollection.get();
      
      return snapshot.docs.map((doc: any) => {
        const data = doc.data();
        
        // Try to parse doc.id as number, if it fails or is NaN, use a generated ID
        let id = parseInt(doc.id);
        if (isNaN(id)) {
          // For existing documents without numeric IDs, generate a unique ID
          id = Date.now() + Math.floor(Math.random() * 1000);
        }
        
        // Ensure all required fields exist with default values
        const cocktail: Cocktail = {
          id,
          name: data.name || 'Untitled Cocktail',
          description: data.description || null,
          imageUrl: data.imageUrl || data.image || data.photoUrl || null, // Handle multiple field names
          isFeatured: data.isFeatured || data.featured || false,
          featuredAt: data.featuredAt ? new Date(data.featuredAt) : null,
          popularityCount: data.popularityCount || 0,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        };
        
        return cocktail;
      });
    } catch (error) {
      console.error('Error fetching cocktails from Firebase:', error);
      return [];
    }
  }

  async getCocktailById(id: number): Promise<Cocktail | null> {
    const doc = await this.cocktailsCollection.doc(id.toString()).get();
    if (!doc.exists) return null;
    const data = doc.data() || {};
    let parsedId = parseInt(doc.id);
    if (isNaN(parsedId)) {
      parsedId = id; // Use the requested ID if document ID is not numeric
    }
    
    // Ensure all required fields exist with default values
    const cocktail: Cocktail = {
      id: parsedId,
      name: data.name || 'Untitled Cocktail',
      description: data.description || null,
      imageUrl: data.imageUrl || data.photoUrl || null,
      isFeatured: data.isFeatured || false,
      featuredAt: data.featuredAt ? new Date(data.featuredAt) : null,
      popularityCount: data.popularityCount || 0,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
    };
    
    return cocktail;
  }

  async createCocktail(cocktail: InsertCocktail): Promise<Cocktail> {
    console.log('\n=== FIREBASE createCocktail START ===');
    console.log('Cocktail data received:', JSON.stringify(cocktail, null, 2));
    
    // Generate a numeric ID by using timestamp + random
    const numericId = Date.now() + Math.floor(Math.random() * 1000);
    
    // Separate junction table data from main cocktail data
    const { ingredients, instructions, tagIds, ...mainCocktailData } = cocktail as any;
    
    console.log('Extracted data:');
    console.log('- ingredients:', ingredients);
    console.log('- instructions:', instructions);
    console.log('- tagIds:', tagIds);
    console.log('- mainCocktailData:', mainCocktailData);
    
    const cocktailData = {
      ...mainCocktailData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isFeatured: false,
      featuredAt: null,
      popularityCount: 0,
    };
    
    // Store main cocktail data
    console.log('Storing main cocktail with ID:', numericId);
    await this.cocktailsCollection.doc(numericId.toString()).set(cocktailData);
    console.log('✓ Main cocktail stored');
    
    // Store ingredients in junction table
    if (ingredients && Array.isArray(ingredients)) {
      console.log(`Storing ${ingredients.length} ingredients...`);
      for (let i = 0; i < ingredients.length; i++) {
        const ingredient = ingredients[i];
        const ingredientDocId = Date.now() + Math.floor(Math.random() * 1000) + i;
        const ingredientData = {
          id: ingredientDocId,
          cocktailId: numericId,
          ingredientId: ingredient.ingredientId,
          amount: ingredient.amount,
          unit: ingredient.unit,
          order: i
        };
        console.log(`Storing ingredient ${i + 1}:`, ingredientData);
        await this.cocktailIngredientsCollection.doc(ingredientDocId.toString()).set(ingredientData);
        console.log(`✓ Ingredient ${i + 1} stored`);
      }
      // Recalculate all ingredient usage counts to ensure accuracy
      await this.recalculateIngredientUsageCounts();
    } else {
      console.log('No ingredients to store');
    }
    
    // Store instructions in junction table
    if (instructions && Array.isArray(instructions)) {
      console.log(`Storing ${instructions.length} instructions...`);
      for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];
        const instructionDocId = Date.now() + Math.floor(Math.random() * 1000) + i + 100;
        const instructionData = {
          id: instructionDocId,
          cocktailId: numericId,
          stepNumber: i + 1,
          instruction: instruction
        };
        console.log(`Storing instruction ${i + 1}:`, instructionData);
        await this.cocktailInstructionsCollection.doc(instructionDocId.toString()).set(instructionData);
        console.log(`✓ Instruction ${i + 1} stored`);
      }
    } else {
      console.log('No instructions to store');
    }
    
    // Store tags in junction table
    if (tagIds && Array.isArray(tagIds)) {
      console.log(`Storing ${tagIds.length} tag relationships...`);
      for (let i = 0; i < tagIds.length; i++) {
        const tagId = tagIds[i];
        const cocktailTagDocId = Date.now() + Math.floor(Math.random() * 1000) + i + 200;
        const tagData = {
          id: cocktailTagDocId,
          cocktailId: numericId,
          tagId: tagId
        };
        console.log(`Storing tag relationship ${i + 1}:`, tagData);
        await this.cocktailTagsCollection.doc(cocktailTagDocId.toString()).set(tagData);
        console.log(`✓ Tag relationship ${i + 1} stored`);
      }
    } else {
      console.log('No tags to store');
    }
    
    console.log('=== FIREBASE createCocktail COMPLETE ===\n');
    return { id: numericId, ...cocktailData } as Cocktail;
  }

  async updateCocktail(id: number, updates: Partial<InsertCocktail>): Promise<Cocktail> {
    console.log(`=== FIREBASE updateCocktail START (ID: ${id}) ===`);
    console.log('Updates received:', updates);
    
    // Extract junction table data from updates
    const { ingredients, instructions, tagIds, imageUrl, ...basicUpdates } = updates as any;
    
    // Handle image deletion (when imageUrl is null or empty)
    if (imageUrl === null || imageUrl === '') {
      console.log('Image deletion requested - setting imageUrl to null');
      basicUpdates.imageUrl = null;
    } else if (imageUrl) {
      console.log('Image update requested');
      basicUpdates.imageUrl = imageUrl;
    }
    
    // Update basic cocktail fields
    const docRef = this.cocktailsCollection.doc(id.toString());
    await docRef.update({ ...basicUpdates, updatedAt: new Date() });
    console.log('✓ Basic cocktail fields updated');
    
    // Update instructions if provided
    if (instructions && Array.isArray(instructions)) {
      console.log(`Updating ${instructions.length} instructions...`);
      
      // Delete existing instructions
      const existingInstructions = await this.cocktailInstructionsCollection
        .where('cocktailId', '==', id).get();
      for (const doc of existingInstructions.docs) {
        await doc.ref.delete();
      }
      console.log('✓ Existing instructions deleted');
      
      // Add new instructions
      for (let i = 0; i < instructions.length; i++) {
        const instructionDocId = Date.now() + Math.floor(Math.random() * 1000) + i + 100;
        const instructionData = {
          id: instructionDocId,
          cocktailId: id,
          stepNumber: i + 1,
          instruction: instructions[i]
        };
        await this.cocktailInstructionsCollection.doc(instructionDocId.toString()).set(instructionData);
      }
      console.log('✓ New instructions added');
    }
    
    // Update ingredients if provided
    if (ingredients && Array.isArray(ingredients)) {
      console.log(`Updating ${ingredients.length} ingredients...`);
      
      // Delete existing ingredient relationships
      const existingIngredients = await this.cocktailIngredientsCollection
        .where('cocktailId', '==', id).get();
      for (const doc of existingIngredients.docs) {
        await doc.ref.delete();
      }
      console.log('✓ Existing ingredient relationships deleted');
      
      // Add new ingredient relationships
      for (let i = 0; i < ingredients.length; i++) {
        const ingredient = ingredients[i];
        const ingredientDocId = Date.now() + Math.floor(Math.random() * 1000) + i;
        const ingredientData = {
          id: ingredientDocId,
          cocktailId: id,
          ingredientId: ingredient.ingredientId,
          amount: ingredient.amount,
          unit: ingredient.unit
        };
        await this.cocktailIngredientsCollection.doc(ingredientDocId.toString()).set(ingredientData);
      }
      console.log('✓ New ingredient relationships added');
      
      // Recalculate all ingredient usage counts to ensure accuracy
      await this.recalculateIngredientUsageCounts();
    }
    
    // Update tags if provided
    if (tagIds && Array.isArray(tagIds)) {
      console.log(`Updating ${tagIds.length} tag relationships...`);
      
      // Delete existing tag relationships
      const existingTags = await this.cocktailTagsCollection
        .where('cocktailId', '==', id).get();
      for (const doc of existingTags.docs) {
        await doc.ref.delete();
      }
      console.log('✓ Existing tag relationships deleted');
      
      // Add new tag relationships
      for (let i = 0; i < tagIds.length; i++) {
        const tagId = tagIds[i];
        const cocktailTagDocId = Date.now() + Math.floor(Math.random() * 1000) + i + 200;
        const tagData = {
          id: cocktailTagDocId,
          cocktailId: id,
          tagId: tagId
        };
        await this.cocktailTagsCollection.doc(cocktailTagDocId.toString()).set(tagData);
      }
      console.log('✓ New tag relationships added');
    }
    
    console.log('=== FIREBASE updateCocktail COMPLETE ===\n');
    
    // Return updated cocktail
    const doc = await docRef.get();
    if (!doc.exists) throw new Error('Cocktail not found');
    const data = doc.data();
    return { 
      id: parseInt(doc.id), 
      name: data?.name || 'Untitled Cocktail',
      description: data?.description || null,
      imageUrl: data?.imageUrl || null,
      isFeatured: data?.isFeatured || false,
      featuredAt: data?.featuredAt ? new Date(data.featuredAt) : null,
      popularityCount: data?.popularityCount || 0,
      createdAt: data?.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data?.updatedAt ? new Date(data.updatedAt) : new Date(),
    } as Cocktail;
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
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      let id = parseInt(doc.id);
      if (isNaN(id)) {
        id = Date.now() + Math.floor(Math.random() * 1000);
      }
      
      const cocktail: Cocktail = {
        id,
        name: data.name || 'Untitled Cocktail',
        description: data.description || null,
        imageUrl: data.imageUrl || data.photoUrl || null,
        isFeatured: data.isFeatured || false,
        featuredAt: data.featuredAt ? new Date(data.featuredAt) : null,
        popularityCount: data.popularityCount || 0,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      };
      
      return cocktail;
    });
  }

  async getPopularCocktails(): Promise<Cocktail[]> {
    const snapshot = await this.cocktailsCollection
      .where('popularityCount', '>', 0)
      .orderBy('popularityCount', 'desc')
      .limit(10)
      .get();
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      let id = parseInt(doc.id);
      if (isNaN(id)) {
        id = Date.now() + Math.floor(Math.random() * 1000);
      }
      
      const cocktail: Cocktail = {
        id,
        name: data.name || 'Untitled Cocktail',
        description: data.description || null,
        imageUrl: data.imageUrl || data.photoUrl || null,
        isFeatured: data.isFeatured || false,
        featuredAt: data.featuredAt ? new Date(data.featuredAt) : null,
        popularityCount: data.popularityCount || 0,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      };
      
      return cocktail;
    });
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
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      // Try to parse doc.id as number, if it fails or is NaN, use a generated ID
      let id = parseInt(doc.id);
      if (isNaN(id)) {
        // For existing documents without numeric IDs, generate a unique ID
        id = Date.now() + Math.floor(Math.random() * 1000);
      }
      
      // Ensure all required fields exist with default values
      const ingredient: Ingredient = {
        id,
        name: data.name || 'Untitled Ingredient',
        category: data.category || 'other',
        subCategory: data.subCategory || null,
        description: data.description || null,
        preferredBrand: data.preferredBrand || null,
        abv: data.abv || null,
        imageUrl: data.imageUrl || null,
        inMyBar: data.inMyBar || false,
        usedInRecipesCount: data.usedInRecipesCount || 0,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      };
      
      return ingredient;
    });
  }

  async getIngredient(id: number): Promise<Ingredient | undefined> {
    try {
      const doc = await this.ingredientsCollection.doc(id.toString()).get();
      if (!doc.exists) return undefined;
      
      const data = doc.data() || {};
      return {
        id: parseInt(doc.id),
        name: data.name || 'Untitled Ingredient',
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        category: data.category || 'other',
        subCategory: data.subCategory || null,
        preferredBrand: data.preferredBrand || null,
        abv: data.abv || null,
        inMyBar: data.inMyBar || false,
        usedInRecipesCount: data.usedInRecipesCount || 0,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      } as Ingredient;
    } catch (error) {
      console.error('Error fetching ingredient:', error);
      return undefined;
    }
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

  async updateIngredient(id: number, updates: Partial<InsertIngredient>): Promise<Ingredient> {
    const docRef = this.ingredientsCollection.doc(id.toString());
    await docRef.update({ ...updates, updatedAt: new Date() });
    
    const doc = await docRef.get();
    if (!doc.exists) throw new Error('Ingredient not found');
    const data = doc.data();
    return { 
      id: parseInt(doc.id), 
      name: data?.name || 'Untitled Ingredient',
      description: data?.description || null,
      imageUrl: data?.imageUrl || null,
      category: data?.category || 'other',
      subCategory: data?.subCategory || null,
      preferredBrand: data?.preferredBrand || null,
      abv: data?.abv || null,
      inMyBar: data?.inMyBar || false,
      usedInRecipesCount: data?.usedInRecipesCount || 0,
      createdAt: data?.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data?.updatedAt ? new Date(data.updatedAt) : new Date(),
    } as Ingredient;
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
    
    // Get all ingredient-tag relationships for tag-based searching
    const allTags = await this.getAllTags();
    const tagMap = new Map(allTags.map(tag => [tag.id, tag.name.toLowerCase()]));
    
    return ingredients.filter((ingredient: Ingredient) => {
      // Search by basic ingredient properties
      const matchesBasic = ingredient.name.toLowerCase().includes(lowerQuery) ||
        ingredient.category.toLowerCase().includes(lowerQuery) ||
        (ingredient.subCategory && ingredient.subCategory.toLowerCase().includes(lowerQuery)) ||
        (ingredient.preferredBrand && ingredient.preferredBrand.toLowerCase().includes(lowerQuery)) ||
        (ingredient.description && ingredient.description.toLowerCase().includes(lowerQuery));
      
      if (matchesBasic) return true;
      
      // Search by ingredient tags - check if any associated tag matches the query
      // Note: This is a simplified version. In a full implementation, we'd need to 
      // maintain ingredient-tag relationships in Firebase
      return false;
    });
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

  async incrementIngredientUsage(ingredientId: number): Promise<void> {
    const ingredient = await this.getIngredientById(ingredientId);
    if (!ingredient) return;
    
    await this.ingredientsCollection.doc(ingredientId.toString()).update({
      usedInRecipesCount: ingredient.usedInRecipesCount + 1,
      updatedAt: new Date()
    });
  }

  async recalculateIngredientUsageCounts(): Promise<void> {
    console.log('Recalculating ingredient usage counts...');
    
    // Get all ingredients
    const ingredients = await this.getAllIngredients();
    
    // Get all cocktail-ingredient relationships
    const cocktailIngredientsSnapshot = await this.cocktailIngredientsCollection.get();
    
    console.log(`Found ${cocktailIngredientsSnapshot.docs.length} cocktail-ingredient relationships:`);
    
    // Count usage for each ingredient
    const usageCounts = new Map<number, number>();
    
    cocktailIngredientsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const ingredientId = data.ingredientId;
      const cocktailId = data.cocktailId;
      console.log(`  Cocktail ${cocktailId} uses ingredient ${ingredientId}`);
      if (ingredientId) {
        usageCounts.set(ingredientId, (usageCounts.get(ingredientId) || 0) + 1);
      }
    });
    
    console.log('Usage count summary:');
    for (const [ingredientId, count] of usageCounts.entries()) {
      const ingredient = ingredients.find(i => i.id === ingredientId);
      console.log(`  Ingredient ${ingredient?.name} (${ingredientId}): ${count} uses`);
    }
    
    // Update each ingredient with correct usage count
    for (const ingredient of ingredients) {
      const correctCount = usageCounts.get(ingredient.id) || 0;
      if (ingredient.usedInRecipesCount !== correctCount) {
        console.log(`Updating ingredient ${ingredient.name} (${ingredient.id}): ${ingredient.usedInRecipesCount} → ${correctCount}`);
        await this.ingredientsCollection.doc(ingredient.id.toString()).update({
          usedInRecipesCount: correctCount,
          updatedAt: new Date()
        });
      }
    }
    
    console.log('✓ Ingredient usage counts recalculated');
  }

  async resetIngredientUsage(id: number): Promise<Ingredient | null> {
    await this.ingredientsCollection.doc(id.toString()).update({
      usedInRecipesCount: 0,
      updatedAt: new Date()
    });
    return this.getIngredientById(id);
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

  // Junction table operations 
  async getCocktailIngredients(cocktailId: number): Promise<CocktailIngredient[]> {
    try {
      console.log(`Fetching ingredients for cocktail ${cocktailId}`);
      
      // First try to get from junction table (new format)  
      const junctionSnapshot = await this.cocktailIngredientsCollection.where('cocktailId', '==', cocktailId).get();
      console.log(`Found ${junctionSnapshot.docs.length} ingredient junction records`);
      
      if (junctionSnapshot.docs.length > 0) {
        // Return junction table data (new format)
        const ingredients = junctionSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Junction ingredient data:', data);
          return { 
            id: data.id || parseInt(doc.id), 
            cocktailId: data.cocktailId,
            ingredientId: data.ingredientId,
            amount: data.amount,
            unit: data.unit,
            order: data.order
          } as CocktailIngredient;
        });
        return ingredients;
      }
      
      // If no junction table data, try to get from cocktail document (old format)
      console.log('No junction table data found, checking cocktail document for embedded ingredients');
      const cocktailDoc = await this.cocktailsCollection.doc(cocktailId.toString()).get();
      if (cocktailDoc.exists) {
        const cocktailData = cocktailDoc.data();
        if (cocktailData?.ingredients && Array.isArray(cocktailData.ingredients)) {
          console.log('Found embedded ingredients in cocktail document:', cocktailData.ingredients);
          // Convert embedded format to CocktailIngredient format
          return cocktailData.ingredients.map((ing: any, index: number) => ({
            id: Date.now() + index, // Generate temporary IDs
            cocktailId: cocktailId,
            ingredientId: ing.ingredientId,
            amount: ing.amount,
            unit: ing.unit,
            order: index
          } as CocktailIngredient));
        }
      }
      
      console.log('No ingredients found in either format');
      return [];
    } catch (error) {
      console.error('Error fetching cocktail ingredients:', error);
      return [];
    }
  }

  async getCocktailInstructions(cocktailId: number): Promise<CocktailInstruction[]> {
    try {
      console.log(`Fetching instructions for cocktail ${cocktailId}`);
      
      // First try to get from junction table (new format)
      const junctionSnapshot = await this.cocktailInstructionsCollection.where('cocktailId', '==', cocktailId).get();
      console.log(`Found ${junctionSnapshot.docs.length} instruction junction records`);
      
      if (junctionSnapshot.docs.length > 0) {
        // Return junction table data (new format)
        const instructions = junctionSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Junction instruction data:', data);
          return {
            id: data.id || parseInt(doc.id),
            cocktailId: data.cocktailId,
            stepNumber: data.stepNumber,
            instruction: data.instruction
          } as CocktailInstruction;
        });
        // Sort by stepNumber in memory
        return instructions.sort((a, b) => a.stepNumber - b.stepNumber);
      }
      
      // If no junction table data, try to get from cocktail document (old format)
      console.log('No junction table data found, checking cocktail document for embedded instructions');
      const cocktailDoc = await this.cocktailsCollection.doc(cocktailId.toString()).get();
      if (cocktailDoc.exists) {
        const cocktailData = cocktailDoc.data();
        if (cocktailData?.instructions && Array.isArray(cocktailData.instructions)) {
          console.log('Found embedded instructions in cocktail document:', cocktailData.instructions);
          // Convert embedded format to CocktailInstruction format
          return cocktailData.instructions.map((instruction: string, index: number) => ({
            id: Date.now() + index, // Generate temporary IDs
            cocktailId: cocktailId,
            stepNumber: index + 1,
            instruction: instruction
          } as CocktailInstruction));
        }
      }
      
      console.log('No instructions found in either format');
      return [];
    } catch (error) {
      console.error('Error fetching cocktail instructions:', error);
      return [];
    }
  }

  async getAllTags(): Promise<Tag[]> {
    const snapshot = await this.tagsCollection.get();
    return snapshot.docs.map(doc => ({ id: parseInt(doc.id), ...doc.data() } as Tag));
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    // Generate a numeric ID by using timestamp + random
    const numericId = Date.now() + Math.floor(Math.random() * 1000);
    
    const tagData = {
      ...tag,
      createdAt: new Date(),
      usageCount: 1,
    };
    
    await this.tagsCollection.doc(numericId.toString()).set(tagData);
    
    return { id: numericId, ...tagData } as Tag;
  }

  async deleteCocktail(id: number): Promise<boolean> {
    try {
      const docRef = this.cocktailsCollection.doc(id.toString());
      const docSnapshot = await docRef.get();
      
      if (!docSnapshot.exists) {
        return false;
      }
      
      // Delete the cocktail document
      await docRef.delete();
      
      // Delete associated ingredients
      const ingredientsSnapshot = await this.cocktailIngredientsCollection.where('cocktailId', '==', id).get();
      const ingredientDeletePromises = ingredientsSnapshot.docs.map(doc => doc.ref.delete());
      
      // Delete associated instructions
      const instructionsSnapshot = await this.cocktailInstructionsCollection.where('cocktailId', '==', id).get();
      const instructionDeletePromises = instructionsSnapshot.docs.map(doc => doc.ref.delete());
      
      // Delete associated tags (cocktail-tag relationships) - if collection exists
      // Note: cocktailTagsCollection is not defined in this class, skipping for now
      
      // Execute all deletions
      await Promise.all([
        ...ingredientDeletePromises,
        ...instructionDeletePromises
      ]);
      
      return true;
    } catch (error) {
      console.error('Error deleting cocktail:', error);
      return false;
    }
  }

  // Get cocktail tags
  async getCocktailTags(cocktailId: number): Promise<Tag[]> {
    try {
      console.log(`Fetching tags for cocktail ${cocktailId}`);
      
      // First try to get from junction table (new format)
      const junctionSnapshot = await this.cocktailTagsCollection.where('cocktailId', '==', cocktailId).get();
      console.log(`Found ${junctionSnapshot.docs.length} tag junction records`);
      
      if (junctionSnapshot.docs.length > 0) {
        // Return junction table data (new format)
        const tagIds = junctionSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Junction tag relationship data:', data);
          return data.tagId;
        });
        
        // Get all tags that match the tag IDs
        const tagPromises = tagIds.map(tagId => this.tagsCollection.doc(tagId.toString()).get());
        const tagDocs = await Promise.all(tagPromises);
        
        const tags = tagDocs
          .filter(doc => doc.exists)
          .map(doc => {
            const data = doc.data();
            console.log('Tag data:', data);
            return { id: parseInt(doc.id), ...data } as Tag;
          });
        
        return tags;
      }
      
      // If no junction table data, try to get from cocktail document (old format)
      console.log('No junction table data found, checking cocktail document for embedded tagIds');
      const cocktailDoc = await this.cocktailsCollection.doc(cocktailId.toString()).get();
      if (cocktailDoc.exists) {
        const cocktailData = cocktailDoc.data();
        if (cocktailData?.tagIds && Array.isArray(cocktailData.tagIds)) {
          console.log('Found embedded tagIds in cocktail document:', cocktailData.tagIds);
          // Get all tags that match the embedded tag IDs
          const tagPromises = cocktailData.tagIds.map((tagId: number) => this.tagsCollection.doc(tagId.toString()).get());
          const tagDocs = await Promise.all(tagPromises);
          
          const tags = tagDocs
            .filter(doc => doc.exists)
            .map(doc => {
              const data = doc.data();
              console.log('Embedded tag data:', data);
              return { id: parseInt(doc.id), ...data } as Tag;
            });
          
          return tags;
        }
      }
      
      console.log('No tags found in either format');
      return [];
    } catch (error) {
      console.error('Error fetching cocktail tags:', error);
      return [];
    }
  }

  // Preferred Brands methods
  async getAllPreferredBrands(): Promise<PreferredBrand[]> {
    try {
      console.log('🔥 Fetching all preferred brands from Firebase...');
      const snapshot = await this.preferredBrandsCollection.get();
      console.log(`🔥 Found ${snapshot.docs.length} preferred brands`);
      
      return snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: parseInt(doc.id),
          name: data.name || 'Untitled Brand',
          proof: data.proof || null,
          imageUrl: data.imageUrl || null,
          inMyBar: data.inMyBar || false,
          usedInRecipesCount: data.usedInRecipesCount || 0,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        } as PreferredBrand;
      });
    } catch (error) {
      console.error('🔥 Error fetching preferred brands from Firebase:', error);
      throw error; // Re-throw the error instead of swallowing it
    }
  }

  async getPreferredBrand(id: number): Promise<PreferredBrand | undefined> {
    try {
      const doc = await this.preferredBrandsCollection.doc(id.toString()).get();
      if (!doc.exists) return undefined;
      
      const data = doc.data() || {};
      return {
        id: parseInt(doc.id),
        name: data.name || 'Untitled Brand',
        proof: data.proof || null,
        imageUrl: data.imageUrl || null,
        inMyBar: data.inMyBar || false,
        usedInRecipesCount: data.usedInRecipesCount || 0,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      } as PreferredBrand;
    } catch (error) {
      console.error('Error fetching preferred brand:', error);
      return undefined;
    }
  }

  async searchPreferredBrands(query: string): Promise<PreferredBrand[]> {
    const allBrands = await this.getAllPreferredBrands();
    return allBrands.filter(brand => 
      brand.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getPreferredBrandsInMyBar(): Promise<PreferredBrand[]> {
    try {
      const snapshot = await this.preferredBrandsCollection.where('inMyBar', '==', true).get();
      return snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: parseInt(doc.id),
          name: data.name || 'Untitled Brand',
          proof: data.proof || null,
          imageUrl: data.imageUrl || null,
          inMyBar: data.inMyBar || false,
          usedInRecipesCount: data.usedInRecipesCount || 0,
          createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
        } as PreferredBrand;
      });
    } catch (error) {
      console.error('Error fetching My Bar preferred brands:', error);
      return [];
    }
  }

  async createPreferredBrand(brand: PreferredBrandForm): Promise<PreferredBrand> {
    try {
      const id = Date.now();
      const docRef = this.preferredBrandsCollection.doc(id.toString());
      
      const brandData = {
        name: brand.name,
        proof: brand.proof || null,
        imageUrl: brand.imageUrl || null,
        inMyBar: brand.inMyBar || false,
        usedInRecipesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await docRef.set(brandData);

      return {
        id,
        ...brandData,
      } as PreferredBrand;
    } catch (error) {
      console.error('Error creating preferred brand:', error);
      throw error;
    }
  }

  async updatePreferredBrand(id: number, updates: Partial<InsertPreferredBrand>): Promise<PreferredBrand> {
    try {
      const docRef = this.preferredBrandsCollection.doc(id.toString());
      // Remove the problematic field from update data
      const updateData = { ...updates };
      delete (updateData as any).usedInRecipesCount;
      
      await docRef.update({ ...updateData, updatedAt: new Date() });
      
      const updated = await this.getPreferredBrand(id);
      if (!updated) throw new Error('Preferred brand not found after update');
      return updated;
    } catch (error) {
      console.error('Error updating preferred brand:', error);
      throw error;
    }
  }

  async deletePreferredBrand(id: number): Promise<boolean> {
    try {
      await this.preferredBrandsCollection.doc(id.toString()).delete();
      return true;
    } catch (error) {
      console.error('Error deleting preferred brand:', error);
      return false;
    }
  }

  async toggleMyBarBrand(brandId: number): Promise<PreferredBrand> {
    try {
      const brand = await this.getPreferredBrand(brandId);
      if (!brand) throw new Error('Preferred brand not found');
      
      const newInMyBar = !brand.inMyBar;
      await this.updatePreferredBrand(brandId, { inMyBar: newInMyBar });
      
      const updated = await this.getPreferredBrand(brandId);
      if (!updated) throw new Error('Preferred brand not found after toggle');
      return updated;
    } catch (error) {
      console.error('Error toggling My Bar for preferred brand:', error);
      throw error;
    }
  }

  async incrementPreferredBrandUsage(brandId: number): Promise<void> {
    try {
      const brand = await this.getPreferredBrand(brandId);
      if (brand) {
        // Update usage count directly on Firestore to avoid schema validation issues
        await this.preferredBrandsCollection.doc(brandId.toString()).update({
          usedInRecipesCount: brand.usedInRecipesCount + 1,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error incrementing preferred brand usage:', error);
    }
  }

  async recalculatePreferredBrandUsageCounts(): Promise<void> {
    console.log('Preferred brand usage count recalculation not implemented yet');
  }

  async findPreferredBrandByName(name: string): Promise<PreferredBrand | null> {
    try {
      const snapshot = await this.preferredBrandsCollection.where('name', '==', name).get();
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        id: parseInt(doc.id),
        name: data.name,
        proof: data.proof || null,
        imageUrl: data.imageUrl || null,
        inMyBar: data.inMyBar || false,
        usedInRecipesCount: data.usedInRecipesCount || 0,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      } as PreferredBrand;
    } catch (error) {
      console.error('Error finding preferred brand by name:', error);
      return null;
    }
  }

  async getPreferredBrandWithDetails(id: number): Promise<{
    brand: PreferredBrand;
    ingredients: Ingredient[];
    tags: Tag[];
  } | undefined> {
    try {
      const brand = await this.getPreferredBrand(id);
      if (!brand) return undefined;

      // Get associated ingredients
      const ingredientRefs = await this.preferredBrandIngredientsCollection
        .where('preferredBrandId', '==', id).get();
      
      const ingredients: Ingredient[] = [];
      for (const ref of ingredientRefs.docs) {
        const refData = ref.data();
        const ingredient = await this.getIngredient(refData.ingredientId);
        if (ingredient) ingredients.push(ingredient);
      }

      // Get tags
      const tagRefs = await this.preferredBrandTagsCollection
        .where('preferredBrandId', '==', id).get();
      
      const tags: Tag[] = [];
      for (const ref of tagRefs.docs) {
        const refData = ref.data();
        const tag = await this.getTag(refData.tagId);
        if (tag) tags.push(tag);
      }

      return { brand, ingredients, tags };
    } catch (error) {
      console.error('Error getting preferred brand details:', error);
      return undefined;
    }
  }

  async getIngredientWithDetails(id: number): Promise<{
    ingredient: Ingredient;
    preferredBrands: PreferredBrand[];
    tags: Tag[];
  } | undefined> {
    try {
      const ingredient = await this.getIngredient(id);
      if (!ingredient) return undefined;

      // Get associated preferred brands
      const brandRefs = await this.preferredBrandIngredientsCollection
        .where('ingredientId', '==', id).get();
      
      const preferredBrands: PreferredBrand[] = [];
      for (const ref of brandRefs.docs) {
        const refData = ref.data();
        const brand = await this.getPreferredBrand(refData.preferredBrandId);
        if (brand) preferredBrands.push(brand);
      }

      // Get tags  
      const tagSnapshot = await this.ingredientTagsCollection
        .where('ingredientId', '==', id).get();
      
      const tags: Tag[] = [];
      for (const ref of tagSnapshot.docs) {
        const refData = ref.data();
        const tag = await this.getTag(refData.tagId);
        if (tag) tags.push(tag);
      }

      return { ingredient, preferredBrands, tags };
    } catch (error) {
      console.error('Error getting ingredient details:', error);
      return undefined;
    }
  }

  private async getTag(id: number): Promise<Tag | undefined> {
    try {
      const doc = await this.tagsCollection.doc(id.toString()).get();
      if (!doc.exists) return undefined;
      
      const data = doc.data() || {};
      return {
        id: parseInt(doc.id),
        name: data.name,
        usageCount: data.usageCount || 0,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      } as Tag;
    } catch (error) {
      console.error('Error fetching tag:', error);
      return undefined;
    }
  }

  // Association management methods
  async associateIngredientWithPreferredBrand(ingredientId: number, preferredBrandId: number): Promise<void> {
    try {
      // Check if association already exists
      const existingSnapshot = await this.preferredBrandIngredientsCollection
        .where('ingredientId', '==', ingredientId)
        .where('preferredBrandId', '==', preferredBrandId)
        .get();
      
      if (!existingSnapshot.empty) {
        console.log('Association already exists');
        return;
      }

      // Create new association
      const id = Date.now();
      await this.preferredBrandIngredientsCollection.doc(id.toString()).set({
        ingredientId,
        preferredBrandId
      });
      
      console.log(`Associated ingredient ${ingredientId} with preferred brand ${preferredBrandId}`);
    } catch (error) {
      console.error('Error associating ingredient with preferred brand:', error);
      throw error;
    }
  }

  async removeIngredientFromPreferredBrand(ingredientId: number, preferredBrandId: number): Promise<void> {
    try {
      // Find existing association
      const snapshot = await this.preferredBrandIngredientsCollection
        .where('ingredientId', '==', ingredientId)
        .where('preferredBrandId', '==', preferredBrandId)
        .get();
      
      if (snapshot.empty) {
        console.log('Association does not exist');
        return;
      }

      // Delete association
      const deletePromises = snapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);
      
      console.log(`Removed association between ingredient ${ingredientId} and preferred brand ${preferredBrandId}`);
    } catch (error) {
      console.error('Error removing ingredient from preferred brand:', error);
      throw error;
    }
  }

}