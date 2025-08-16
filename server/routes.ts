import type { Express } from "express";
import { createServer, type Server } from "http";
// Note: storage now passed as parameter
import { 
  insertTagSchema, insertIngredientSchema, insertCocktailSchema,
  cocktailFormSchema, ingredientFormSchema, insertPreferredBrandSchema, preferredBrandFormSchema,
  type Cocktail, type Ingredient, type PreferredBrand
} from "@shared/schema";
import firebaseTestRoutes from "./routes/firebase-test";
import { extractBrandFromImage } from "./ai/openrouter";

import { createAuthRoutes } from './routes/auth';
import { createMyBarRoutes } from './routes/mybar';
import { createAdminRoutes } from './routes/admin';
import type { IStorage } from './storage';
import { createAuthMiddleware } from './middleware/auth';
import { allowRoles, rejectWritesForReviewer } from './middleware/roles';

export async function registerRoutes(app: Express, storage: IStorage): Promise<Server> {
  // Create auth middleware
  const { requireAuth, requireAdmin } = createAuthMiddleware(storage);
  
  // Apply write rejection middleware to protected routes
  app.use('/api/cocktails', rejectWritesForReviewer);
  app.use('/api/ingredients', rejectWritesForReviewer);  
  app.use('/api/preferred-brands', rejectWritesForReviewer);
  app.use('/api/mybar', rejectWritesForReviewer);
  
  // Register authentication routes
  app.use('/api/auth', createAuthRoutes(storage));
  
  // Register my bar routes
  app.use('/api/mybar', createMyBarRoutes(storage));
  
  // Register admin routes  
  app.use('/api/admin', createAdminRoutes(storage));
  // =================== USERS ===================
  app.get("/api/users/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const user = await storage.getUserById(id);

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

  app.post("/api/tags", requireAdmin, async (req, res) => {
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
      
      // My Bar filtering now handled by separate API endpoint
      
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

  app.post("/api/ingredients", allowRoles('admin'), async (req, res) => {
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

  app.patch("/api/ingredients/:id", allowRoles('admin'), async (req, res) => {
    const id = parseInt(req.params.id);
    
    console.log(`🔥 PATCH /api/ingredients/${id} called with body:`, JSON.stringify(req.body, null, 2));
    
    try {
      const updateData = { ...req.body };
      
      // Transform tags from string array to tag IDs (same as POST route)
      if (req.body.tags && Array.isArray(req.body.tags)) {
        console.log('🔥 Transforming ingredient tags for update...');
        updateData.tagIds = await Promise.all(
          req.body.tags.map(async (tagName: string) => {
            let existingTag = await storage.findTagByName(tagName);
            if (!existingTag) {
              console.log(`🔥 Creating new ingredient tag: ${tagName}`);
              existingTag = await storage.createTag({ name: tagName });
            }
            return existingTag.id;
          })
        );
        delete updateData.tags;
        console.log(`🔥 Transformed tags to IDs:`, updateData.tagIds);
      }
      
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

  app.patch("/api/ingredients/:id/toggle-mybar", requireAdmin, async (req, res) => {
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

  app.delete("/api/ingredients/:id", allowRoles('admin'), async (req, res) => {
    const id = parseInt(req.params.id);
    
    console.log(`\n=== DELETE /api/ingredients/${id} ===`);
    console.log(`Deleting ingredient ID: ${id}`);
    console.log(`User making request:`, req.user);
    
    try {
      console.log(`Calling storage.deleteIngredient(${id})...`);
      const deleted = await storage.deleteIngredient(id);
      console.log(`Delete ingredient result:`, deleted);
      if (deleted) {
        res.json({ message: "Ingredient deleted successfully" });
      } else {
        res.status(404).json({ message: "Ingredient not found" });
      }
    } catch (error) {
      console.error(`Error deleting ingredient ${id}:`, error);
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

  app.post("/api/cocktails", allowRoles('admin'), async (req, res) => {
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

  app.patch("/api/cocktails/:id", allowRoles('admin'), async (req, res) => {
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

  app.patch("/api/cocktails/:id/featured", allowRoles('admin'), async (req, res) => {
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

  app.patch("/api/cocktails/:id/toggle-featured", allowRoles('admin'), async (req, res) => {
    const id = parseInt(req.params.id);
    
    console.log(`\n=== PATCH /api/cocktails/${id}/toggle-featured ===`);
    console.log(`Toggling featured status for cocktail ID: ${id}`);
    console.log(`User making request:`, req.user);
    
    try {
      console.log(`Calling storage.toggleFeatured(${id})...`);
      const updated = await storage.toggleFeatured(id);
      console.log(`Toggle featured result:`, JSON.stringify(updated, null, 2));
      res.json(updated);
    } catch (error) {
      console.error(`Toggle featured error for cocktail ${id}:`, error);
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

  app.delete("/api/cocktails/:id", allowRoles('admin'), async (req, res) => {
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
        brands = await storage.getAllPreferredBrands();
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

  app.post("/api/preferred-brands", allowRoles('admin'), async (req, res) => {
    try {
      console.log("🔥 Preferred brands POST - Raw body:", JSON.stringify(req.body, null, 2));
      
      const brandData = preferredBrandFormSchema.parse(req.body);
      console.log("🔥 Parsed brand data:", brandData);
      
      // Handle image upload
      if (req.body.image && typeof req.body.image === 'string') {
        brandData.imageUrl = req.body.image;
        console.log("🔥 Image URL set from image field");
      }
      
      console.log("🔥 Final brand data for creation:", brandData);
      const brand = await storage.createPreferredBrand(brandData);
      console.log("🔥 Brand created successfully:", brand.id);
      
      res.status(201).json(brand);
    } catch (error) {
      console.error("🔥 Preferred brand creation failed:", error);
      console.error("🔥 Error details:", error instanceof Error ? error.stack : error);
      res.status(400).json({ 
        message: "Invalid preferred brand data", 
        error: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : undefined
      });
    }
  });

  app.patch("/api/preferred-brands/:id", allowRoles('admin'), async (req, res) => {
    const id = parseInt(req.params.id);
    
    console.log(`\n=== PATCH /api/preferred-brands/${id} ===`);
    console.log(`Request body:`, JSON.stringify(req.body, null, 2));
    console.log(`User making request:`, req.user);
    
    try {
      const updateData = { ...req.body };
      
      // Handle image upload
      if (req.body.image && typeof req.body.image === 'string') {
        console.log('Processing image upload for brand update...');
        updateData.imageUrl = req.body.image;
        delete updateData.image;
      }
      
      console.log(`Final update data for brand ${id}:`, JSON.stringify(updateData, null, 2));
      console.log(`Calling storage.updatePreferredBrand(${id}, updateData)...`);
      const updated = await storage.updatePreferredBrand(id, updateData);
      console.log(`Update brand result:`, JSON.stringify(updated, null, 2));
      res.json(updated);
    } catch (error) {
      console.error(`Error updating preferred brand ${id}:`, error);
      res.status(404).json({ message: "Preferred brand not found", error });
    }
  });

  app.patch("/api/preferred-brands/:id/toggle-mybar", allowRoles('admin'), async (req, res) => {
    const id = parseInt(req.params.id);
    
    console.log(`\n=== PATCH /api/preferred-brands/${id}/toggle-mybar ===`);
    console.log(`Toggling My Bar status for brand ID: ${id}`);
    console.log(`User making request:`, req.user);
    
    try {
      console.log(`Getting existing brand ${id}...`);
      const brand = await storage.getPreferredBrand(id);
      if (!brand) {
        console.log(`Brand ${id} not found`);
        return res.status(404).json({ message: "Brand not found" });
      }
      
      const currentInMyBar = (brand as any).inMyBar;
      console.log(`Current brand inMyBar status: ${currentInMyBar}, toggling to: ${!currentInMyBar}`);
      console.log(`Calling storage.updatePreferredBrand(${id}, { inMyBar: ${!currentInMyBar} })...`);
      const updated = await storage.updatePreferredBrand(id, {
        inMyBar: !currentInMyBar
      } as any);
      
      console.log(`Toggle My Bar result:`, JSON.stringify(updated, null, 2));
      res.json(updated);
    } catch (error) {
      console.error(`Error toggling brand ${id} in My Bar:`, error);
      res.status(500).json({ message: "Error updating brand", error });
    }
  });

  app.delete("/api/preferred-brands/:id", allowRoles('admin'), async (req, res) => {
    const id = parseInt(req.params.id);
    
    console.log(`\n=== DELETE /api/preferred-brands/${id} ===`);
    console.log(`Deleting preferred brand ID: ${id}`);
    console.log(`User making request:`, req.user);
    
    try {
      console.log(`Calling storage.deletePreferredBrand(${id})...`);
      const deleted = await storage.deletePreferredBrand(id);
      console.log(`Delete preferred brand result:`, deleted);
      if (deleted) {
        res.json({ message: "Preferred brand deleted successfully" });
      } else {
        res.status(404).json({ message: "Preferred brand not found" });
      }
    } catch (error) {
      console.error(`Error deleting preferred brand ${id}:`, error);
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

  // Photo → Preferred Brand OCR endpoint - allow admin and reviewer for parsing
  app.post("/api/ai/brands/from-image", requireAuth, allowRoles('admin', 'reviewer'), async (req, res) => {
    try {
      console.log("🔥 OCR request received");
      
      // Expect JSON: { base64: "data:image/...;base64,xxx", autoCreate?: boolean }
      const { base64, autoCreate } = req.body ?? {};
      console.log("🔥 Base64 received:", base64 ? `${base64.substring(0, 50)}...` : "null");
      console.log("🔥 AutoCreate:", autoCreate);
      
      if (!base64 || !String(base64).startsWith("data:image")) {
        console.log("🔥 Invalid base64 format");
        return res.status(400).json({ error: "Send { base64: 'data:image/...;base64,XXX' }" });
      }

      // Check if OpenRouter API key is available
      if (!process.env.OPENROUTER_API_KEY) {
        console.log("🔥 Missing OpenRouter API key");
        return res.status(500).json({ error: "OpenRouter API key not configured" });
      }

      console.log("🔥 Calling extractBrandFromImage...");
      const { result, model } = await extractBrandFromImage(base64);
      console.log("🔥 OCR result:", { model, result });

      // No roles yet — any user can auto-create for now.
      // TODO (roles): Once roles are implemented, require admin for autoCreate.
      let created: any = null;

      if (autoCreate && result?.name && result?.confidence && result.confidence >= 0.7) {
        console.log("🔥 Auto-creating brand with confidence:", result.confidence);
        const payload = {
          name: result.name.trim(),
          proof: result.proof ?? null,
          imageUrl: base64, // prototype (replace with uploaded URL later)
          notes: result.notes ?? undefined,
        };
        
        // Create the preferred brand using internal API
        try {
          const createdBrand = await storage.createPreferredBrand(payload);
          created = createdBrand;
          console.log("🔥 Brand auto-created:", created.id);
        } catch (createError) {
          console.error("🔥 Failed to auto-create brand:", createError);
          // Don't fail the OCR response if creation fails
        }
      }

      console.log("🔥 OCR request completed successfully");
      return res.json({ model, ...result, created });
    } catch (e: any) {
      console.error("🔥 OCR extraction failed:", e);
      console.error("🔥 Error stack:", e?.stack);
      return res.status(500).json({ 
        error: e?.message ?? "OCR failed",
        details: e?.stack ? e.stack.split('\n').slice(0, 3).join('\n') : undefined
      });
    }
  });

  // =================== AI IMPORT PARSE/COMMIT ROUTES ===================
  
  // Parse content (reviewers and admins can parse)
  app.post("/api/import/parse", requireAuth, allowRoles('admin', 'reviewer'), async (req, res) => {
    try {
      const { content, source } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }
      
      // Parse the content using AI without creating database records
      // This allows reviewers to see what would be created
      
      const systemPrompt = `You are a cocktail recipe parser. Extract cocktail recipes from the provided content and return them in structured JSON format. 

For each recipe, return:
{
  "name": "Recipe Name",
  "description": "Brief description", 
  "ingredients": [
    {
      "name": "Ingredient Name",
      "amount": "2",
      "unit": "oz"
    }
  ],
  "instructions": ["Step 1", "Step 2"],
  "tags": ["tag1", "tag2"]
}

Return an array of recipes. Only include complete recipes with clear ingredient lists and instructions.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: content }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("OpenRouter API error:", errorData);
        return res.status(response.status).json({ 
          error: `AI parsing failed: ${response.statusText}` 
        });
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || "";
      
      try {
        // Try to parse the AI response as JSON
        const recipes = JSON.parse(aiResponse);
        
        res.json({
          source: source || "manual",
          parsed: Array.isArray(recipes) ? recipes : [recipes],
          timestamp: new Date().toISOString()
        });
        
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", parseError);
        res.status(500).json({ 
          error: "Failed to parse AI response",
          rawResponse: aiResponse 
        });
      }
      
    } catch (error) {
      console.error("Parse error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to parse content" 
      });
    }
  });
  
  // Commit parsed recipes (only admins can commit to database)
  app.post("/api/import/commit", requireAuth, allowRoles('admin'), async (req, res) => {
    try {
      const { recipes } = req.body;
      
      if (!recipes || !Array.isArray(recipes)) {
        return res.status(400).json({ error: "Recipes array is required" });
      }
      
      const createdRecipes = [];
      
      for (const recipe of recipes) {
        try {
          // Transform the recipe data to match our schema
          const transformedData = { ...recipe };
          
          // Transform ingredients from {name, amount, unit} to {ingredientId, amount, unit}
          if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
            transformedData.ingredients = await Promise.all(
              recipe.ingredients.map(async (ingredient: any) => {
                // Find or create ingredient by name
                let existingIngredient = await storage.findIngredientByName(ingredient.name);
                if (!existingIngredient) {
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
              })
            );
          }
          
          // Transform tags from string array to tag IDs
          if (recipe.tags && Array.isArray(recipe.tags)) {
            transformedData.tagIds = await Promise.all(
              recipe.tags.map(async (tagName: string) => {
                let existingTag = await storage.findTagByName(tagName);
                if (!existingTag) {
                  existingTag = await storage.createTag({ name: tagName });
                }
                return existingTag.id;
              })
            );
            delete transformedData.tags;
          }
          
          const cocktail = await storage.createCocktail(transformedData);
          createdRecipes.push(cocktail);
          
        } catch (recipeError) {
          console.error(`Failed to create recipe ${recipe.name}:`, recipeError);
          // Continue with other recipes
        }
      }
      
      res.json({
        success: true,
        created: createdRecipes.length,
        recipes: createdRecipes
      });
      
    } catch (error) {
      console.error("Commit error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to commit recipes" 
      });
    }
  });

  // =================== AI ENDPOINTS ===================
  
  // OpenRouter proxy endpoint - allow admin and reviewer for parsing  
  app.post("/api/openrouter", requireAuth, allowRoles('admin', 'reviewer'), async (req, res) => {
    try {
      const { model, systemPrompt, userContent } = req.body;
      
      if (!model || !userContent) {
        return res.status(400).json({ error: "Model and userContent are required" });
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
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            { role: "user", content: userContent }
          ]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("OpenRouter API error:", errorData);
        return res.status(response.status).json({ 
          error: `OpenRouter API error: ${response.statusText}` 
        });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("OpenRouter request failed:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to process OpenRouter request" 
      });
    }
  });

  // YouTube transcript endpoint - allow admin and reviewer for parsing
  app.post("/api/youtube-transcript", requireAuth, allowRoles('admin', 'reviewer'), async (req, res) => {
    try {
      const { videoId } = req.body;
      
      if (!videoId) {
        return res.status(400).json({ error: "Video ID is required" });
      }
      
      // Import the youtube-transcript library
      const { YoutubeTranscript } = await import('youtube-transcript');
      
      // Try multiple language hints + allow auto-generated
      const tryLangs = ["en", "en-US", "en-GB"];
      let transcriptItems: any = null;
      let lastError: any;

      for (const lang of tryLangs) {
        try {
          transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang });
          if (transcriptItems?.length) break;
        } catch (e) {
          lastError = e;
        }
      }

      // Fallback: no language hint (lets library try auto-generated)
      if (!transcriptItems || transcriptItems.length === 0) {
        try {
          transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
        } catch (e) {
          lastError = e;
        }
      }
      
      if (!transcriptItems || transcriptItems.length === 0) {
        return res.status(404).json({ 
          error: `No transcript available or fetch blocked for video ${videoId}. The video may not have auto-generated captions or manual subtitles available. Try a different video with captions.`
        });
      }
      
      // Join all transcript text and limit length for token limits
      const transcript = transcriptItems
        .map((item: any) => item.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 12000);
      
      res.json({ transcript });
    } catch (error) {
      console.error("YouTube transcript extraction failed:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to extract YouTube transcript" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Register read-only POST endpoints that should bypass admin key requirement
export function registerReadOnlyRoutes(app: Express, storage?: IStorage) {
  // Note: AI endpoints moved to main registerRoutes function with proper auth
  
  // Web scraping endpoint
  app.post("/api/scrape-url", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }
      
      // Use AllOrigins proxy to bypass CORS
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        return res.status(response.status).json({ 
          error: `Failed to fetch webpage: ${response.statusText}` 
        });
      }
      
      const data = await response.json();
      
      if (!data?.contents) {
        return res.status(404).json({ error: 'No content retrieved from URL' });
      }
      
      const htmlContent = data.contents;
      
      // Basic HTML tag removal and text extraction
      const textContent = htmlContent
        // Remove script and style elements completely
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        // Remove HTML tags
        .replace(/<[^>]*>/g, ' ')
        // Decode HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // Clean up whitespace
        .replace(/\s+/g, ' ')
        .trim();
      
      if (textContent.length < 50) {
        return res.status(400).json({ error: 'Extracted content is too short to be meaningful' });
      }
      
      res.json({ textContent });
    } catch (error) {
      console.error("URL scraping failed:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to scrape URL" 
      });
    }
  });

  // =================== MIXI CHAT ENDPOINT ===================
  
  // Streaming chat endpoint for Mixi AI
  app.post("/api/mixi/chat", async (req, res) => {
    try {
      const { messages, context } = req.body;
      
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      // Check if OpenRouter API key is available
      if (!process.env.OPENROUTER_API_KEY) {
        return res.status(500).json({ error: "OpenRouter API key not configured" });
      }

      // Load our site's cocktail database for recommendations
      let siteRecipes = "";
      try {
        const cocktails = storage ? await storage.getAllCocktails() : [];
        if (cocktails && cocktails.length > 0) {
          siteRecipes = `\n\nOUR SITE RECIPES (Always recommend these FIRST):\n`;
          siteRecipes += cocktails.map(c => 
            `- ${c.name} (ID: ${c.id}) - ${c.description || 'Classic cocktail'} [Link: /recipe/${c.id}]`
          ).join('\n');
        }
      } catch (error) {
        console.error('Error loading site recipes:', error);
      }

      // Build system prompt
      let systemPrompt = `You are Mixi, a friendly AI bartender for the Miximixology app.

Core Capabilities:
- Pitcher scaling: Scale recipes to target volume (e.g., 64 oz) without exceeding; round each ingredient to 0.25 oz; preserve ratios; support oz/ml/tbsp/tsp/barspoon/dash/parts.
- Citrus yields: lime ≈ 1 oz; lemon ≈ 2–3 Tbsp (~1–1.5 oz); provide min/max fruit counts when scaling.
- Simple syrup: "rich" syrup = 2 parts sugar : 1 part water; provide quick preparation method when asked.
- Tags: Understand holiday, dessert, tiki, classic, modern categories; prefer app database results.
- Substitutions: Suggest ingredient alternatives with proper ratios.

CRITICAL PRIORITY RULES:
- **ALWAYS recommend OUR SITE RECIPES FIRST** before suggesting external recipes
- When recommending our recipes, include clickable links like: "Try our [Old Fashioned](/recipe/1754355116391)"
- Only suggest external recipes if we don't have what the user wants
- You are READ-ONLY. Never suggest modifying, creating, or deleting data.
- When unsure, ask brief, targeted follow-up questions.
- Keep responses helpful, friendly, and concise.
- For pitcher scaling, always round to 0.25 oz increments and ensure total doesn't exceed target.${siteRecipes}`;

      // Add context-specific information if provided
      if (context) {
        if (context.cocktailId && storage) {
          try {
            const cocktail = await storage.getCocktailWithDetails(context.cocktailId);
            if (cocktail) {
              systemPrompt += `\n\nContext: User is viewing "${cocktail.cocktail.name}" cocktail. Ingredients: ${cocktail.ingredients.map(i => `${i.amount} ${i.unit} ${i.ingredient.name}`).join(', ')}.`;
            }
          } catch (error) {
            console.error('Error fetching cocktail context:', error);
          }
        }
        
        if (context.ingredientId && storage) {
          try {
            const ingredient = await storage.getIngredient(context.ingredientId);
            if (ingredient) {
              systemPrompt += `\n\nContext: User is viewing "${ingredient.name}" ingredient (${ingredient.category}). Used in ${ingredient.usedInRecipesCount || 0} recipes.`;
            }
          } catch (error) {
            console.error('Error fetching ingredient context:', error);
          }
        }
        
        if (context.myBar && Array.isArray(context.myBar)) {
          const barItems = context.myBar.map((item: any) => item.name || `ID:${item.id}`).join(', ');
          systemPrompt += `\n\nContext: User's bar contains: ${barItems}. Tailor suggestions to what they have available.`;
        }
      }

      // Model fallback order
      const models = [
        "deepseek/deepseek-v3:free",
        "deepseek/deepseek-r1:free", 
        "meta-llama/llama-3.2-11b-vision-instruct:free",
        "qwen/qwen2.5-coder:free"
      ];

      let lastError: any = null;
      
      // Try each model in order
      for (const model of models) {
        try {
          console.log(`Trying model: ${model}`);
          
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.SITE_URL || "",
              "X-Title": process.env.SITE_NAME || "Miximixology"
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                ...messages
              ],
              stream: true,
              temperature: 0.7,
              max_tokens: 2000
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.log(`Model ${model} failed with status ${response.status}: ${errorText}`);
            lastError = new Error(`HTTP ${response.status}: ${errorText}`);
            continue; // Try next model
          }

          // Success! Set up streaming response
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.setHeader('Access-Control-Allow-Origin', '*');

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body reader available');
          }

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    res.write('data: [DONE]\n\n');
                    res.end();
                    return;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.choices?.[0]?.delta?.content) {
                      res.write(`data: ${JSON.stringify({ content: parsed.choices[0].delta.content })}\n\n`);
                    }
                  } catch (parseError) {
                    // Skip invalid JSON chunks
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }

          res.end();
          return; // Successfully streamed response

        } catch (error) {
          console.error(`Model ${model} error:`, error);
          lastError = error;
          continue; // Try next model
        }
      }

      // All models failed
      console.error('All models failed, last error:', lastError);
      res.status(500).json({ 
        error: "I'm sorry. Looks like my mind is not working at the moment. Please try again later." 
      });

    } catch (error) {
      console.error('Chat endpoint error:', error);
      res.status(500).json({ 
        error: "I'm sorry. Looks like my mind is not working at the moment. Please try again later." 
      });
    }
  });

}
