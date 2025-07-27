// Debug script to examine storage state without logging truncation
import { MemStorage } from './storage.js';

const storage = new MemStorage();

// Direct inspection of storage state
console.log('\n=== DIRECT STORAGE INSPECTION ===');

const cocktailId = 1753576368169;
console.log(`\nChecking cocktail ID: ${cocktailId}`);

// Check if cocktail exists
const cocktail = (storage as any).cocktails.get(cocktailId);
console.log('Cocktail exists:', !!cocktail);
if (cocktail) {
  console.log('Cocktail name:', cocktail.name);
}

// Check all relationship tables
console.log('\n--- INGREDIENTS ---');
const allIngredients = Array.from((storage as any).ingredients.values());
console.log('Total ingredients in storage:', allIngredients.length);
allIngredients.forEach(ing => console.log(`- ${ing.name} (ID: ${ing.id})`));

console.log('\n--- COCKTAIL INGREDIENTS ---');
const allCocktailIngredients = Array.from((storage as any).cocktailIngredients.values());
console.log('Total cocktail ingredients:', allCocktailIngredients.length);
allCocktailIngredients.forEach(ci => {
  console.log(`- Cocktail ${ci.cocktailId} -> Ingredient ${ci.ingredientId}: ${ci.amount} ${ci.unit}`);
});

const cocktailIngredientsForThisCocktail = allCocktailIngredients.filter(ci => ci.cocktailId === cocktailId);
console.log(`Ingredients for cocktail ${cocktailId}:`, cocktailIngredientsForThisCocktail.length);

console.log('\n--- INSTRUCTIONS ---');
const allInstructions = Array.from((storage as any).cocktailInstructions.values());
console.log('Total instructions:', allInstructions.length);
const instructionsForThisCocktail = allInstructions.filter(inst => inst.cocktailId === cocktailId);
console.log(`Instructions for cocktail ${cocktailId}:`, instructionsForThisCocktail.length);
instructionsForThisCocktail.forEach(inst => console.log(`- Step ${inst.stepNumber}: ${inst.instruction}`));

console.log('\n--- TAGS ---');
const allTags = Array.from((storage as any).tags.values());
console.log('Total tags in storage:', allTags.length);
allTags.forEach(tag => console.log(`- ${tag.name} (ID: ${tag.id})`));

console.log('\n--- COCKTAIL TAGS ---');
const allCocktailTags = Array.from((storage as any).cocktailTags.values());
console.log('Total cocktail tags:', allCocktailTags.length);
allCocktailTags.forEach(ct => {
  console.log(`- Cocktail ${ct.cocktailId} -> Tag ${ct.tagId}`);
});

const cocktailTagsForThisCocktail = allCocktailTags.filter(ct => ct.cocktailId === cocktailId);
console.log(`Tags for cocktail ${cocktailId}:`, cocktailTagsForThisCocktail.length);

console.log('\n=== END DIRECT INSPECTION ===');