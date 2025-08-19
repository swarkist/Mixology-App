import { Router } from 'express';
import { storage } from '../storage';
import type { Ingredient, Cocktail } from '@shared/schema';

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
    const storageData: any = JSON.parse(await fs.readFile(storageFile, 'utf-8'));
    
    // Migrate ingredients
    const migratedIngredients: Ingredient[] = [];
    if (storageData.ingredients) {
      for (const [, ingredient] of storageData.ingredients as [number, any][]) {
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
    const migratedCocktails: Cocktail[] = [];
    if (storageData.cocktails) {
      for (const [, cocktail] of storageData.cocktails as [number, any][]) {
        try {
          const newCocktail = await storage.createCocktail({
            name: cocktail.name,
            description: cocktail.description,
            imageUrl: cocktail.imageUrl
          } as any);
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
      } as any);

      await storage.createCocktail({
        name: "Mojito",
        description: "A refreshing Cuban cocktail with mint and lime",
        imageUrl: null,
      } as any);
      
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

// Test utility to promote user to admin (only in test mode)
router.post('/promote-user-to-admin', async (req, res) => {
  // Only allow in test environment
  if (process.env.NODE_ENV !== 'test') {
    return res.status(403).json({ error: 'Only available in test environment' });
  }

  const { userId, email } = req.body;
  if (!userId || !email) {
    return res.status(400).json({ error: 'userId and email are required' });
  }

  try {
    // Get the Firebase storage instance
    const firebaseStorage = storage as any;
    
    // Direct database update to set user role to admin
    if (firebaseStorage.firebase) {
      const userRef = firebaseStorage.firebase.getFirestore().collection('users').doc(userId.toString());
      await userRef.update({ 
        role: 'admin',
        updatedAt: new Date().toISOString()
      });
      
      console.log(`🧪 Test utility: Promoted user ${email} (ID: ${userId}) to admin`);
      res.json({ success: true, message: `User ${email} promoted to admin` });
    } else {
      res.status(500).json({ error: 'Firebase storage not available' });
    }
  } catch (error) {
    console.error('Failed to promote user to admin:', error);
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

export default router;
