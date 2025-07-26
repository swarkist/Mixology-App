import '../firebase'; // Initialize Firebase
import { FirebaseStorage } from '../storage/firebase';
import type { InsertCocktail, InsertIngredient } from '@shared/schema';

// Sample data to populate Firebase
const sampleIngredients: InsertIngredient[] = [
  {
    name: "Premium Vodka",
    description: "High-quality vodka for cocktails",
    imageUrl: null,
    category: "spirits",
    subCategory: "vodka",
    preferredBrand: "Grey Goose",
    abv: 40,
  },
  {
    name: "Lime Juice",
    description: "Fresh lime juice",
    imageUrl: null,
    category: "juices",
    subCategory: null,
    preferredBrand: null,
    abv: 0,
  },
  {
    name: "Cranberry Juice",
    description: "Tart cranberry juice",
    imageUrl: null,
    category: "juices",
    subCategory: null,
    preferredBrand: "Ocean Spray",
    abv: 0,
  },
  {
    name: "Triple Sec",
    description: "Orange-flavored liqueur",
    imageUrl: null,
    category: "liqueurs",
    subCategory: "orange",
    preferredBrand: "Cointreau",
    abv: 40,
  },
  {
    name: "Simple Syrup",
    description: "Basic sugar syrup",
    imageUrl: null,
    category: "syrups",
    subCategory: null,
    preferredBrand: null,
    abv: 0,
  },
];

const sampleCocktails: InsertCocktail[] = [
  {
    name: "Cosmopolitan",
    description: "A classic pink cocktail with vodka and cranberry",
    imageUrl: null,
  },
  {
    name: "Mojito",
    description: "A refreshing Cuban cocktail with mint and lime",
    imageUrl: null,
  },
  {
    name: "Old Fashioned",
    description: "A classic whiskey cocktail with bitters and sugar",
    imageUrl: null,
  },
  {
    name: "Margarita",
    description: "A tangy tequila cocktail with lime and salt",
    imageUrl: null,
  },
];

async function migrateData() {
  console.log('Starting Firebase migration...');
  
  const firebaseStorage = new FirebaseStorage();
  
  try {
    // Create ingredients
    console.log('Creating ingredients...');
    const createdIngredients = [];
    for (const ingredient of sampleIngredients) {
      const created = await firebaseStorage.createIngredient(ingredient);
      createdIngredients.push(created);
      console.log(`Created ingredient: ${created.name} (ID: ${created.id})`);
    }
    
    // Create cocktails
    console.log('Creating cocktails...');
    const createdCocktails = [];
    for (const cocktail of sampleCocktails) {
      const created = await firebaseStorage.createCocktail(cocktail);
      createdCocktails.push(created);
      console.log(`Created cocktail: ${created.name} (ID: ${created.id})`);
    }
    
    // Mark some cocktails as featured
    console.log('Setting featured cocktails...');
    if (createdCocktails.length > 0) {
      await firebaseStorage.toggleCocktailFeatured(createdCocktails[0].id, true);
      console.log(`Set ${createdCocktails[0].name} as featured`);
    }
    
    // Add some ingredients to "My Bar"
    console.log('Adding ingredients to My Bar...');
    if (createdIngredients.length > 2) {
      await firebaseStorage.toggleIngredientInMyBar(createdIngredients[0].id, true);
      await firebaseStorage.toggleIngredientInMyBar(createdIngredients[1].id, true);
      console.log('Added first two ingredients to My Bar');
    }
    
    // Increment popularity for some cocktails
    console.log('Setting popularity counts...');
    for (let i = 0; i < Math.min(createdCocktails.length, 2); i++) {
      for (let j = 0; j < 5; j++) {
        await firebaseStorage.incrementCocktailPopularity(createdCocktails[i].id);
      }
      console.log(`Set popularity for ${createdCocktails[i].name}`);
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration automatically
migrateData().then(() => {
  console.log('Migration script finished');
  process.exit(0);
}).catch((error) => {
  console.error('Migration script failed:', error);
  process.exit(1);
});

export { migrateData };