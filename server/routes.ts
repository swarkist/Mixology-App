import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTagSchema, insertIngredientSchema, insertCocktailSchema,
  cocktailFormSchema, ingredientFormSchema,
  type Cocktail, type Ingredient
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
    const { search, category, mybar } = req.query;
    
    try {
      let ingredients;
      
      if (search) {
        ingredients = await storage.searchIngredients(search as string);
      } else if (category) {
        ingredients = await storage.getIngredientsByCategory(category as string);
      } else if (mybar === 'true') {
        ingredients = await storage.getIngredientsInMyBar();
      } else {
        ingredients = await storage.getAllIngredients();
      }
      
      res.json(ingredients);
    } catch (error) {
      res.status(500).json({ message: "Error fetching ingredients", error });
    }
  });

  app.get("/api/ingredients/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const ingredient = await storage.getIngredient(id);

    if (!ingredient) {
      return res.status(404).json({ message: "Ingredient not found" });
    }

    res.json(ingredient);
  });

  app.post("/api/ingredients", async (req, res) => {
    try {
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
      
      const ingredientData = ingredientFormSchema.parse(transformedData);
      const ingredient = await storage.createIngredient(ingredientData);
      res.status(201).json(ingredient);
    } catch (error) {
      res.status(400).json({ message: "Invalid ingredient data", error });
    }
  });

  app.patch("/api/ingredients/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
      const updateData = { ...req.body };
      
      // Handle image upload
      if (req.body.image && typeof req.body.image === 'string') {
        // Store the base64 data directly as imageUrl
        updateData.imageUrl = req.body.image;
        delete updateData.image;
      }
      
      const updated = await storage.updateIngredient(id, updateData);
      res.json(updated);
    } catch (error) {
      res.status(404).json({ message: "Ingredient not found", error });
    }
  });

  app.patch("/api/ingredients/:id/toggle-mybar", async (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
      const updated = await storage.toggleMyBar(id);
      res.json(updated);
    } catch (error) {
      res.status(404).json({ message: "Ingredient not found", error });
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
                  preferredBrand: null,
                  abv: null,
                  imageUrl: null,
                  inMyBar: false
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
      // Transform ingredients from {name, amount, unit} to {ingredientId, amount, unit}
      const transformedData = { ...req.body };
      
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
                  preferredBrand: null,
                  abv: null,
                  imageUrl: null,
                  inMyBar: false
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
      
      // Handle image upload for PATCH
      if (req.body.image && typeof req.body.image === 'string') {
        console.log('Processing image upload for PATCH...');
        // For now, store the base64 data directly as imageUrl
        // In production, you would typically upload to a file storage service
        transformedData.imageUrl = req.body.image;
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

  // Add Firebase test routes
  app.use("/api", firebaseTestRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
