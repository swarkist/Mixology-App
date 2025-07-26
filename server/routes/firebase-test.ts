import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// Test endpoint to check Firebase connection and populate with sample data
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