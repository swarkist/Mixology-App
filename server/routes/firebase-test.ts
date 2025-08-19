import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// Test endpoint to check Firebase connection and populate with sample data
// Migrate data from local storage to Firebase
router.post('/migrate-to-firebase', async (req, res) => {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const storageFile = path.join(process.cwd(), 'data', 'storage.json');
    
    // Check if file exists
    try {
      await fs.access(storageFile);
    } catch {
      return res.json({
        status: "no_data",
        message: "No local storage file found to migrate"
      });
    }
    
    // Read local storage data
    const storageData = JSON.parse(await fs.readFile(storageFile, 'utf-8'));
    
    // Migrate ingredients
    const migratedIngredients = [];
    if (storageData.ingredients) {
      for (const [id, ingredient] of storageData.ingredients) {
        try {
          const newIngredient = await storage.createIngredient({
            name: ingredient.name,
            description: ingredient.description,
            imageUrl: ingredient.imageUrl,
            category: ingredient.category,
            subCategory: ingredient.subCategory,
            preferredBrand: ingredient.preferredBrand,
            abv: ingredient.abv
          });
          migratedIngredients.push(newIngredient);
        } catch (error) {
          console.log(`Skipping ingredient ${ingredient.name}: ${error}`);
        }
      }
    }
    
    // Migrate cocktails
    const migratedCocktails = [];
    if (storageData.cocktails) {
      for (const [id, cocktail] of storageData.cocktails) {
        try {
          const newCocktail = await storage.createCocktail({
            name: cocktail.name,
            description: cocktail.description,
            imageUrl: cocktail.imageUrl
          });
          migratedCocktails.push(newCocktail);
        } catch (error) {
          console.log(`Skipping cocktail ${cocktail.name}: ${error}`);
        }
      }
    }
    
    res.json({
      status: "success",
      message: "Data migration completed",
      migrated: {
        ingredients: migratedIngredients.length,
        cocktails: migratedCocktails.length
      },
      data: {
        ingredients: migratedIngredients,
        cocktails: migratedCocktails
      }
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      status: "error",
      message: "Migration failed",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/test-firebase', async (req, res) => {
  try {
    console.log('Testing Firebase connection...');
    
    // Try to get all ingredients first
    const ingredients = await storage.getAllIngredients();
    console.log(`Found ${ingredients.length} ingredients in database`);
    
    // If empty, create some sample data
    if (ingredients.length === 0) {
      console.log('Creating sample ingredients...');
      
      await storage.createIngredient({
        name: "Premium Vodka",
        description: "High-quality vodka for cocktails",
        category: "spirits",
        subCategory: "vodka",
        preferredBrand: "Grey Goose",
        abv: 40,
      });
      
      await storage.createIngredient({
        name: "Lime Juice",
        description: "Fresh lime juice",
        category: "juices",
        subCategory: null,
        preferredBrand: null,
        abv: 0,
      });
      
      console.log('Sample ingredients created');
    }
    
    // Test cocktails
    const cocktails = await storage.getAllCocktails();
    console.log(`Found ${cocktails.length} cocktails in database`);
    
    if (cocktails.length === 0) {
      console.log('Creating sample cocktails...');
      
      await storage.createCocktail({
        name: "Cosmopolitan",
        description: "A classic pink cocktail with vodka and cranberry",
        imageUrl: null,
      });
      
      await storage.createCocktail({
        name: "Mojito", 
        description: "A refreshing Cuban cocktail with mint and lime",
        imageUrl: null,
      });
      
      console.log('Sample cocktails created');
    }
    
    res.json({
      success: true,
      message: 'Firebase connection successful',
      data: {
        ingredients: await storage.getAllIngredients(),
        cocktails: await storage.getAllCocktails(),
      }
    });
    
  } catch (error) {
    console.error('Firebase test failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;