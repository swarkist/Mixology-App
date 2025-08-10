import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTagSchema, insertIngredientSchema, insertCocktailSchema,
  cocktailFormSchema, ingredientFormSchema, insertPreferredBrandSchema, preferredBrandFormSchema,
  type Cocktail, type Ingredient, type PreferredBrand
} from "@shared/schema";
import firebaseTestRoutes from "./routes/firebase-test";

export async function registerRoutes(app: Express): Promise<Server> {
  // =================== USERS ===================
  app.get("/api/users/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const user = await storage.getUser(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  });

  // =================== TAGS ===================
  app.get("/api/tags", async (req, res) => {
    const tags = await storage.getAllTags();
    res.json(tags);
  });

  app.get("/api/tags/most-used", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const tags = await storage.getMostUsedTags(limit);
    res.json(tags);
  });

  app.get("/api/tags/most-recent", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const tags = await storage.getMostRecentTags(limit);
    res.json(tags);
  });

  // Ingredient-specific tag endpoints
  app.get("/api/tags/ingredients/most-used", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const tags = await storage.getMostUsedIngredientTags(limit);
    res.json(tags);
  });

  app.get("/api/tags/ingredients/most-recent", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const tags = await storage.getMostRecentIngredientTags(limit);
    res.json(tags);
  });

  // Cocktail-specific tag endpoints
  app.get("/api/tags/cocktails/most-used", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const tags = await storage.getMostUsedCocktailTags(limit);
    res.json(tags);
  });

  app.get("/api/tags/cocktails/most-recent", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const tags = await storage.getMostRecentCocktailTags(limit);
    res.json(tags);
  });

  app.post("/api/tags", async (req, res) => {
    try {
      const tagData = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(tagData);
      res.status(201).json(tag);
    } catch (error) {
      res.status(400).json({ message: "Invalid tag data", error });
    }
  });

  // =================== INGREDIENTS ===================
  app.get("/api/ingredients", async (req, res) => {
    const { search, category, subcategory, mybar, inMyBar } = req.query;
    
    try {
      let ingredients;
      
      // Get all ingredients first, then filter by My Bar if needed
      ingredients = await storage.getAllIngredients();
      
      // Filter by My Bar if requested
      if (mybar === 'true' || inMyBar === 'true') {
        ingredients = ingredients.filter(ingredient => ingredient.inMyBar === true);
      }
      
      // Apply search filter if provided
      if (search && search.toString().trim()) {
        const searchTerm = search.toString().toLowerCase();
        ingredients = ingredients.filter(ingredient => 
          ingredient.name.toLowerCase().includes(searchTerm) ||
          ingredient.description?.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply category filter if provided
      if (category && category !== 'all') {
        ingredients = ingredients.filter(ingredient => ingredient.category === category);
      }
      
      // Apply subcategory filter if provided
      if (subcategory && subcategory !== 'all') {
        ingredients = ingredients.filter(ingredient => ingredient.subCategory === subcategory);
      }
      
      res.json(ingredients);
    } catch (error) {
      res.status(500).json({ message: "Error fetching ingredients", error });
    }
  });

  app.get("/api/ingredients/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
      const ingredientDetails = await storage.getIngredientWithDetails(id);
      
      if (!ingredientDetails) {
        return res.status(404).json({ message: "Ingredient not found" });
      }

      res.json(ingredientDetails);
    } catch (error) {
      console.error('Error fetching ingredient details:', error);
      res.status(500).json({ message: "Error fetching ingredient details", error });
    }
  });

  app.post("/api/ingredients", async (req, res) => {
    try {
      console.log('🔥 POST /api/ingredients called with body:', JSON.stringify(req.body, null, 2));
      
      // Transform tags from string array to tag IDs and handle image upload
      const transformedData = { ...req.body };
      
      // Transform tags from string array to tag IDs
      if (req.body.tags && Array.isArray(req.body.tags)) {
        console.log('Transforming ingredient tags...');
        transformedData.tagIds = await Promise.all(
          req.body.tags.map(async (tagName: string) => {
            let existingTag = await storage.findTagByName(tagName);
            if (!existingTag) {
              console.log(`Creating new ingredient tag: ${tagName}`);
              existingTag = await storage.createTag({ name: tagName });
            }
            return existingTag.id;
          })
        );
        delete transformedData.tags;
      }
      
      // Handle image upload
      if (req.body.image && typeof req.body.image === 'string') {
        console.log('Processing ingredient image upload...');
        transformedData.imageUrl = req.body.image;
        delete transformedData.image;
      }
      
      console.log('🔥 transformedData before validation:', JSON.stringify(transformedData, null, 2));
      const ingredientData = ingredientFormSchema.parse(transformedData);
      console.log('🔥 ingredientData after validation:', JSON.stringify(ingredientData, null, 2));
      const ingredient = await storage.createIngredient(ingredientData);
      console.log('🔥 ingredient created:', JSON.stringify(ingredient, null, 2));
      res.status(201).json(ingredient);
    } catch (error) {
      console.log('🔥 Error creating ingredient:', error);
      res.status(400).json({ message: "Invalid ingredient data", error });
    }
  });

  app.patch("/api/ingredients/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    
    console.log(`🔥 PATCH /api/ingredients/${id} called with body:`, JSON.stringify(req.body, null, 2));
    
    try {
      const updateData = { ...req.body };
      
      // Handle image upload
      if (req.body.image && typeof req.body.image === 'string') {
        console.log('🔥 Processing image upload for ingredient update...');
        // Store the base64 data directly as imageUrl
        updateData.imageUrl = req.body.image;
        delete updateData.image;
      }
      
      console.log(`🔥 Final update data for ingredient ${id}:`, JSON.stringify(updateData, null, 2));
      const updated = await storage.updateIngredient(id, updateData);
      console.log(`🔥 Successfully updated ingredient ${id}:`, updated);
      res.json(updated);
    } catch (error: any) {
      console.error(`🔥 Error updating ingredient ${id}:`, error);
      const errorMessage = error.message || 'Unknown error';
      if (errorMessage.includes('not found')) {
        res.status(404).json({ message: "Ingredient not found", error: errorMessage });
      } else {
        res.status(500).json({ message: "Error updating ingredient", error: errorMessage });
      }
    }
  });

  app.patch("/api/ingredients/:id/toggle-mybar", async (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
      const ingredient = await storage.getIngredient(id);
      if (!ingredient) {
        return res.status(404).json({ message: "Ingredient not found" });
      }
      
      // For now, just return the ingredient as-is since inMyBar functionality will be moved to preferred brands
      res.json(ingredient);
    } catch (error) {
      res.status(404).json({ message: "Ingredient not found", error });
    }
  });

  app.delete("/api/ingredients/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
      const deleted = await storage.deleteIngredient(id);
      if (deleted) {
        res.json({ message: "Ingredient deleted successfully" });
      } else {
        res.status(404).json({ message: "Ingredient not found" });
      }
    } catch (error) {
      console.error('Error deleting ingredient:', error);
      res.status(500).json({ message: "Error deleting ingredient", error });
    }
  });

  // =================== COCKTAILS ===================
  app.get("/api/cocktails", async (req, res) => {
    const { search, featured, popular, ingredients, matchAll } = req.query;
    
    try {
      let cocktails;
      
      if (search) {
        cocktails = await storage.searchCocktails(search as string);
      } else if (featured === 'true') {
        cocktails = await storage.getFeaturedCocktails();
      } else if (popular === 'true') {
        cocktails = await storage.getPopularCocktails();
      } else if (ingredients) {
        const ingredientIds = (ingredients as string).split(',').map(id => parseInt(id));
        const shouldMatchAll = matchAll === 'true';
        cocktails = await storage.getCocktailsByIngredients(ingredientIds, shouldMatchAll);
      } else {
        cocktails = await storage.getAllCocktails();
      }
      
      res.json(cocktails);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cocktails", error });
    }
  });

  app.get("/api/cocktails/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    console.log(`Fetching cocktail details for ID: ${id}`);
    
    const cocktailWithDetails = await storage.getCocktailWithDetails(id);
    console.log('Cocktail details retrieved:', JSON.stringify(cocktailWithDetails, null, 2));

    if (!cocktailWithDetails) {
      return res.status(404).json({ message: "Cocktail not found" });
    }

    res.json(cocktailWithDetails);
  });

  app.post("/api/cocktails", async (req, res) => {
    try {
      console.log('\n=== POST /api/cocktails ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      // Transform ingredients from {name, amount, unit} to {ingredientId, amount, unit}
      const transformedData = { ...req.body };
      
      if (req.body.ingredients && Array.isArray(req.body.ingredients)) {
        console.log('Transforming ingredients...');
        transformedData.ingredients = await Promise.all(
          req.body.ingredients.map(async (ingredient: any) => {
            if (ingredient.name) {
              // Find or create ingredient by name
              let existingIngredient = await storage.findIngredientByName(ingredient.name);
              if (!existingIngredient) {
                console.log(`Creating new ingredient: ${ingredient.name}`);
                existingIngredient = await storage.createIngredient({
                  name: ingredient.name,
                  category: 'spirits', // Default category
                  subCategory: null,
                  description: null,
                  imageUrl: null
                });
              }
              return {
                ingredientId: existingIngredient.id,
                amount: ingredient.amount.toString(),
                unit: ingredient.unit
              };
            }
            return ingredient;
          })
        );
      }
      
      // Transform tags from string array to tag IDs
      if (req.body.tags && Array.isArray(req.body.tags)) {
        console.log('Transforming tags...');
        transformedData.tagIds = await Promise.all(
          req.body.tags.map(async (tagName: string) => {
            let existingTag = await storage.findTagByName(tagName);
            if (!existingTag) {
              console.log(`Creating new tag: ${tagName}`);
              existingTag = await storage.createTag({ name: tagName });
            }
            return existingTag.id;
          })
        );
        delete transformedData.tags;
      }
      
      // Handle image upload
      if (req.body.image && typeof req.body.image === 'string') {
        console.log('Processing image upload...');
        // For now, store the base64 data directly as imageUrl
        // In production, you would typically upload to a file storage service
        transformedData.imageUrl = req.body.image;
        delete transformedData.image;
      }
      
      console.log('Transformed data:', JSON.stringify(transformedData, null, 2));
      console.log('Calling storage.createCocktail with:', Object.keys(transformedData));
      
      const cocktail = await storage.createCocktail(transformedData);
      console.log('Created cocktail:', JSON.stringify(cocktail, null, 2));
      res.status(201).json(cocktail);
    } catch (error) {
      console.error("Cocktail creation error:", error);
      res.status(400).json({ message: "Invalid cocktail data", error });
    }
  });

  app.patch("/api/cocktails/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    
    console.log(`\n=== PATCH /api/cocktails/${id} ===`);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    try {
      // Get existing cocktail to preserve fields not being updated
      const existingCocktail = await storage.getCocktail(id);
      if (!existingCocktail) {
        return res.status(404).json({ message: "Cocktail not found" });
      }
      
      // Transform ingredients from {name, amount, unit} to {ingredientId, amount, unit}
      // Only include the fields being updated, preserve existing fields like popularityCount
      const transformedData: any = {};
      
      // Copy basic fields from request body, excluding special fields
      const basicFields = ['name', 'description', 'isFeatured'];
      for (const field of basicFields) {
        if (req.body.hasOwnProperty(field)) {
          transformedData[field] = req.body[field];
        }
      }
      
      if (req.body.ingredients && Array.isArray(req.body.ingredients)) {
        console.log('Transforming ingredients for PATCH...');
        transformedData.ingredients = await Promise.all(
          req.body.ingredients.map(async (ingredient: any) => {
            if (ingredient.name) {
              // Find or create ingredient by name
              let existingIngredient = await storage.findIngredientByName(ingredient.name);
              if (!existingIngredient) {
                console.log(`Creating new ingredient during PATCH: ${ingredient.name}`);
                existingIngredient = await storage.createIngredient({
                  name: ingredient.name,
                  category: 'spirits', // Default category
                  subCategory: null,
                  description: null,
                  imageUrl: null
                });
              }
              return {
                ingredientId: existingIngredient.id,
                amount: ingredient.amount.toString(),
                unit: ingredient.unit
              };
            }
            return ingredient;
          })
        );
      }
      
      // Handle instructions (keep as array of strings)
      if (req.body.instructions && Array.isArray(req.body.instructions)) {
        console.log(`PATCH: Processing ${req.body.instructions.length} instructions:`, req.body.instructions);
        transformedData.instructions = req.body.instructions;
      }
      
      // Transform tags from string array to tag IDs
      if (req.body.tags && Array.isArray(req.body.tags)) {
        console.log('Transforming tags for PATCH...');
        transformedData.tagIds = await Promise.all(
          req.body.tags.map(async (tagName: string) => {
            let existingTag = await storage.findTagByName(tagName);
            if (!existingTag) {
              console.log(`Creating new tag during PATCH: ${tagName}`);
              existingTag = await storage.createTag({ name: tagName });
            }
            return existingTag.id;
          })
        );
        delete transformedData.tags;
      }
      
      // Handle image upload/deletion for PATCH
      if (req.body.hasOwnProperty('image')) {
        if (req.body.image === null) {
          console.log('Processing image deletion for PATCH...');
          transformedData.imageUrl = null;
        } else if (typeof req.body.image === 'string') {
          console.log('Processing image upload for PATCH...');
          // For now, store the base64 data directly as imageUrl
          // In production, you would typically upload to a file storage service
          transformedData.imageUrl = req.body.image;
        }
        delete transformedData.image;
      }
      
      console.log('Transformed PATCH data:', JSON.stringify(transformedData, null, 2));
      
      const updated = await storage.updateCocktail(id, transformedData);
      console.log('Updated cocktail result:', JSON.stringify(updated, null, 2));
      res.json(updated);
    } catch (error) {
      console.error('Update error:', error);
      res.status(404).json({ message: "Cocktail not found", error });
    }
  });

  app.patch("/api/cocktails/:id/featured", async (req, res) => {
    const id = parseInt(req.params.id);
    const { featured } = req.body;
    
    try {
      const cocktail = await storage.getCocktail(id);
      if (!cocktail) {
        return res.status(404).json({ message: "Cocktail not found" });
      }
      
      const updated = await storage.updateCocktail(id, { 
        isFeatured: featured
      });
      
      res.json(updated);
    } catch (error) {
      res.status(404).json({ message: "Cocktail not found", error });
    }
  });

  app.patch("/api/cocktails/:id/toggle-featured", async (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
      const updated = await storage.toggleFeatured(id);
      res.json(updated);
    } catch (error) {
      res.status(404).json({ message: "Cocktail not found", error });
    }
  });

  app.patch("/api/cocktails/:id/increment-popularity", async (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
      const updated = await storage.incrementPopularity(id);
      res.json(updated);
    } catch (error) {
      res.status(404).json({ message: "Cocktail not found", error });
    }
  });

  // Shorter alias for the test compatibility
  app.patch("/api/cocktails/:id/popularity", async (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
      const updated = await storage.incrementPopularity(id);
      res.json(updated);
    } catch (error) {
      res.status(404).json({ message: "Cocktail not found", error });
    }
  });

  app.patch("/api/cocktails/:id/reset-popularity", async (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
      const updated = await storage.resetPopularity(id);
      res.json(updated);
    } catch (error) {
      res.status(404).json({ message: "Cocktail not found", error });
    }
  });

  app.delete("/api/cocktails/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
      const success = await storage.deleteCocktail?.(id);
      if (success) {
        res.json({ message: "Cocktail deleted successfully" });
      } else {
        res.status(404).json({ message: "Cocktail not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error deleting cocktail", error });
    }
  });

  // =================== SEARCH ===================
  app.get("/api/search", async (req, res) => {
    const { q, type } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: "Query parameter 'q' is required" });
    }
    
    try {
      const results: {
        cocktails: Cocktail[];
        ingredients: Ingredient[];
      } = {
        cocktails: [],
        ingredients: []
      };
      
      if (!type || type === 'cocktails') {
        results.cocktails = await storage.searchCocktails(q as string);
      }
      
      if (!type || type === 'ingredients') {
        results.ingredients = await storage.searchIngredients(q as string);
      }
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search error", error });
    }
  });

  // Endpoint to get cocktail stats for ingredients page
  app.get("/api/cocktail-stats", async (req, res) => {
    try {
      const allCocktails = await storage.getAllCocktails();
      const cocktailsWithIngredients = [];
      
      for (const cocktail of allCocktails) {
        const details = await storage.getCocktailWithDetails(cocktail.id);
        if (details && details.ingredients.length > 0) {
          cocktailsWithIngredients.push(cocktail.id);
        }
      }
      
      res.json({
        totalCocktails: allCocktails.length,
        cocktailsWithIngredients: cocktailsWithIngredients.length,
        cocktailIds: cocktailsWithIngredients
      });
    } catch (error) {
      console.error('Error getting cocktail stats:', error);
      res.status(500).json({ message: "Error getting stats", error });
    }
  });

  // =================== UTILITY ENDPOINTS ===================
  
  // Temporary endpoint to recalculate ingredient usage counts
  app.post("/api/recalculate-ingredient-counts", async (req, res) => {
    try {
      console.log('Manual recalculation of ingredient usage counts requested');
      await storage.recalculateIngredientUsageCounts();
      res.json({ message: "Ingredient usage counts recalculated successfully" });
    } catch (error) {
      console.error('Error recalculating ingredient counts:', error);
      res.status(500).json({ message: "Error recalculating counts", error });
    }
  });

  // Debug endpoint to check ingredient usage data
  app.get("/api/debug/ingredient-usage/:id", async (req, res) => {
    try {
      const ingredientId = parseInt(req.params.id);
      console.log(`Debug check for ingredient ${ingredientId}`);
      
      // Get all cocktails and their detailed information
      const cocktails = await storage.getAllCocktails();
      const usageInfo = [];
      
      for (const cocktail of cocktails) {
        const cocktailDetails = await storage.getCocktailWithDetails(cocktail.id);
        if (cocktailDetails) {
          const usesIngredient = cocktailDetails.ingredients.some(ci => ci.ingredientId === ingredientId);
          if (usesIngredient) {
            const ingredientInfo = cocktailDetails.ingredients.find(ci => ci.ingredientId === ingredientId);
            usageInfo.push({
              cocktailId: cocktail.id,
              cocktailName: cocktail.name,
              amount: ingredientInfo?.amount,
              unit: ingredientInfo?.unit
            });
          }
        }
      }
      
      const ingredient = await storage.getIngredient(ingredientId);
      
      res.json({
        ingredientId,
        ingredientName: ingredient?.name,
        currentCount: ingredient?.usedInRecipesCount,
        actualUsage: usageInfo,
        actualCount: usageInfo.length
      });
    } catch (error) {
      console.error('Error debugging ingredient usage:', error);
      res.status(500).json({ message: "Error debugging", error });
    }
  });

  // Get count of unique cocktails that use My Bar ingredients
  app.get('/api/my-bar-cocktail-count', async (req, res) => {
    try {
      console.log('Calculating My Bar cocktail count...');
      
      // For now, return 0 count since My Bar functionality will be moved to preferred brands
      res.json({ count: 0, cocktailIds: [] });
      return;
      
      // This code is disabled for now since My Bar functionality has been replaced
      // The code below is commented out and will be replaced with preferred brands functionality
      /*
      console.log('My Bar ingredients:', myBarIngredients.map((i: any) => `${i.name} (${i.id})`));
      
      if (myBarIngredientIds.length === 0) {
        res.json({ count: 0, cocktailIds: [] });
        return;
      }

      // Get all cocktails and check which ones use My Bar ingredients
      const cocktails = await storage.getAllCocktails();
      const uniqueCocktailIds = new Set<number>();
      
      for (const cocktail of cocktails) {
        const cocktailDetails = await storage.getCocktailWithDetails(cocktail.id);
        if (cocktailDetails?.ingredients && cocktailDetails.ingredients.length > 0) {
          // Check if this cocktail uses any My Bar ingredients
          const usesMyBarIngredient = cocktailDetails.ingredients.some((ingredient: any) => 
            myBarIngredientIds.includes(ingredient.ingredientId)
          );
          
          if (usesMyBarIngredient) {
            uniqueCocktailIds.add(cocktail.id);
            console.log(`Cocktail ${cocktail.name} (${cocktail.id}) uses My Bar ingredients`);
          }
        }
      }
      
      const count = uniqueCocktailIds.size;
      const cocktailIds = Array.from(uniqueCocktailIds);
      
      console.log(`My Bar cocktail count: ${count} unique cocktails`);
      console.log(`Cocktail IDs: ${cocktailIds.join(', ')}`);
      
      res.json({ count, cocktailIds });
      */


    } catch (error) {
      console.error('Error calculating My Bar cocktail count:', error);
      res.status(500).json({ error: 'Failed to calculate My Bar cocktail count' });
    }
  });

  // =================== PREFERRED BRANDS ===================
  app.get("/api/preferred-brands", async (req, res) => {
    const { search, inMyBar } = req.query;
    
    try {
      console.log('🔥 Preferred brands API called with params:', { search, inMyBar });
      let brands;
      
      if (inMyBar === 'true') {
        console.log('🔥 Calling getPreferredBrandsInMyBar...');
        brands = await storage.getPreferredBrandsInMyBar();
      } else if (search) {
        console.log('🔥 Calling searchPreferredBrands with query:', search);
        brands = await storage.searchPreferredBrands(search as string);
      } else {
        console.log('🔥 Calling getAllPreferredBrands...');
        brands = await storage.getAllPreferredBrands();
      }
      
      console.log('🔥 Brands result:', brands.length, 'items');
      res.json(brands);
    } catch (error) {
      console.error('🔥 Preferred brands API error:', error);
      res.status(500).json({ message: "Error fetching preferred brands", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/preferred-brands/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const brandWithDetails = await storage.getPreferredBrandWithDetails(id);

    if (!brandWithDetails) {
      return res.status(404).json({ message: "Preferred brand not found" });
    }

    res.json(brandWithDetails);
  });

  app.post("/api/preferred-brands", async (req, res) => {
    try {
      const brandData = preferredBrandFormSchema.parse(req.body);
      
      // Handle image upload
      if (req.body.image && typeof req.body.image === 'string') {
        brandData.imageUrl = req.body.image;
      }
      
      const brand = await storage.createPreferredBrand(brandData);
      res.status(201).json(brand);
    } catch (error) {
      res.status(400).json({ message: "Invalid preferred brand data", error });
    }
  });

  app.patch("/api/preferred-brands/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
      const updateData = { ...req.body };
      
      // Handle image upload
      if (req.body.image && typeof req.body.image === 'string') {
        updateData.imageUrl = req.body.image;
        delete updateData.image;
      }
      
      const updated = await storage.updatePreferredBrand(id, updateData);
      res.json(updated);
    } catch (error) {
      res.status(404).json({ message: "Preferred brand not found", error });
    }
  });

  app.patch("/api/preferred-brands/:id/toggle-mybar", async (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
      const updated = await storage.toggleMyBarBrand(id);
      res.json(updated);
    } catch (error) {
      res.status(404).json({ message: "Preferred brand not found", error });
    }
  });

  app.delete("/api/preferred-brands/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
      const deleted = await storage.deletePreferredBrand(id);
      if (deleted) {
        res.json({ message: "Preferred brand deleted successfully" });
      } else {
        res.status(404).json({ message: "Preferred brand not found" });
      }
    } catch (error) {
      console.error('Error deleting preferred brand:', error);
      res.status(500).json({ message: "Error deleting preferred brand", error });
    }
  });

  // =================== PREFERRED BRAND ASSOCIATIONS ===================
  app.post("/api/preferred-brands/:brandId/ingredients/:ingredientId", async (req, res) => {
    const brandId = parseInt(req.params.brandId);
    const ingredientId = parseInt(req.params.ingredientId);
    
    try {
      await storage.associateIngredientWithPreferredBrand(ingredientId, brandId);
      res.json({ message: "Association created successfully" });
    } catch (error) {
      console.error('Error creating association:', error);
      res.status(500).json({ message: "Error creating association", error });
    }
  });

  app.delete("/api/preferred-brands/:brandId/ingredients/:ingredientId", async (req, res) => {
    const brandId = parseInt(req.params.brandId);
    const ingredientId = parseInt(req.params.ingredientId);
    
    try {
      await storage.removeIngredientFromPreferredBrand(ingredientId, brandId);
      res.json({ message: "Association removed successfully" });
    } catch (error) {
      console.error('Error removing association:', error);
      res.status(500).json({ message: "Error removing association", error });
    }
  });

  // =================== AI IMPORT ROUTES ===================
  app.post("/api/openrouter", async (req, res) => {
    try {
      const { model, systemPrompt, userContent } = req.body;
      
      if (!process.env.OPENROUTER_API_KEY) {
        return res.status(500).json({ error: "OpenRouter API key not configured" });
      }
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenRouter API error: ${response.status} ${response.statusText}`, errorText);
        return res.status(response.status).json({ 
          error: `OpenRouter API error: ${response.statusText}` 
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("OpenRouter request failed:", error);
      res.status(500).json({ error: "Failed to process OpenRouter request" });
    }
  });

  app.post("/api/youtube-transcript", async (req, res) => {
    try {
      const { videoId } = req.body;
      
      if (!videoId) {
        return res.status(400).json({ error: "Video ID is required" });
      }
      
      // Use the youtube-transcript package
      const { YoutubeTranscript } = await import('youtube-transcript');
      
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      
      if (!transcriptItems || transcriptItems.length === 0) {
        return res.status(404).json({ error: "No transcript found for this video" });
      }
      
      // Join all transcript text
      const transcript = transcriptItems.map(item => item.text).join(' ');
      
      res.json({ transcript });
    } catch (error) {
      console.error("YouTube transcript extraction failed:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to extract YouTube transcript" 
      });
    }
  });

  // Add Firebase test routes
  app.use("/api", firebaseTestRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
