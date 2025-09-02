// Test the enhanced parser with the exact malformed response
import { parseRecipesFromAI } from './server/utils/recipeParser.js';

const malformedResponse = `{ "recipes": [ { "name": "Old Fashioned", "description": "A cocktail with a robust, sweet, and spicy flavor.", "

": [ {"quantity": "2", "unit": "oz", "item": "Bourbon whiskey", "notes": ""}, {"quantity": "0.5", "unit": "oz", "item": "Rich simple syrup", "notes": "2 parts sugar : 1 part water"}, {"quantity": "2", "unit": "dashes", "item": "Angostura bitters", "notes": ""}, {"quantity": "1", "unit": "", "item": "Orange twist", "notes": "for garnish"} ], "

": [ "In an old
fashioned glass, combine the bourbon, simple syrup, and bitters.", "Add ice and stir until well chilled.", "Garnish with an orange twist." ], "glassware": "Old-fashioned glass", "garnish": "Orange twist", "tags": ["classic", "bourbon", "stirred"] }, { "name": "Margarita", "description": "A refreshing and tangy cocktail that's perfect for hot days.", "

Ingredients:
": [ {"quantity": "2", "unit": "oz", "item": "Tequila", "notes": ""}, {"quantity": "1", "unit": "oz", "item": "Cointreau", "notes": ""}, {"quantity": "1", "unit": "oz", "item": "Fresh lime juice", "notes": ""}, {"quantity": "", "unit": "", "item": "Salt", "notes": "for rimming the glass"} ], "
": [ {"quantity": "2", "unit": "oz", "item": "Bourbon whiskey", "notes": ""}, {"quantity": "0.5", "unit": "oz", "item": "Rich simple syrup", "notes": "2 parts sugar : 1 part water"}, {"quantity": "2", "unit": "dashes", "item": "Angostura bitters", "notes": ""}, {"quantity": "1", "unit": "", "item": "Orange twist", "notes": "for garnish"} ], "
": [ {"quantity": "2", "unit": "oz", "item": "Tequila", "notes": ""}, {"quantity": "1", "unit": "oz", "item": "Cointreau", "notes": ""}, {"quantity": "1", "unit": "oz", "item": "Fresh lime juice", "notes": ""}, {"quantity": "", "unit": "", "item": "Salt", "notes": "for rimming the glass"} ], "
Instructions:
": [ "Rim a margarita glass with salt.", "Shake the tequila, cointreau, and lime juice with ice.", "Strain into the salt-rimmed glass filled with ice." ], "glassware": "Margarita glass", "garnish": "Lime wheel", "tags": ["classic", "tequila", "shaken", "citrus"] } ] }{ "recipes": [ { "name": "Old Fashioned", "description": "A cocktail with a robust, sweet, and spicy flavor.", "
": [ "In an old-fashioned glass, combine the bourbon, simple syrup, and bitters.", "Add ice and stir until well chilled.", "Garnish with an orange twist." ], "glassware": "Old-fashioned glass", "garnish": "Orange twist", "tags": ["classic", "bourbon", "stirred"] }, { "name": "Margarita", "description": "A refreshing and tangy cocktail that's perfect for hot days.", "
": [ "Rim a margarita glass with salt.", "Shake the tequila, cointreau, and lime juice with ice.", "Strain into the salt-rimmed glass filled with ice." ], "glassware": "Margarita glass", "garnish": "Lime wheel", "tags": ["classic", "tequila", "shaken", "citrus"] } ] }`;

console.log('Testing malformed response...');
console.log('Input length:', malformedResponse.length);
console.log('Sample input:', malformedResponse.substring(0, 200) + '...');

try {
  const result = parseRecipesFromAI(malformedResponse);
  console.log('✅ PARSER SUCCESS!');
  console.log(`Found ${result.recipes.length} recipes`);
  
  if (result.recipes.length === 0) {
    console.log('❌ No recipes found - checking extraction steps...');
    
    // Test JSON extraction step
    const { extractJsonObjects } = await import('./server/utils/aiJsonRepair.js');
    const chunks = extractJsonObjects(malformedResponse);
    console.log(`JSON chunks found: ${chunks.length}`);
    if (chunks.length > 0) {
      console.log('First chunk preview:', chunks[0].substring(0, 100) + '...');
    }
  }
  
  result.recipes.forEach((recipe, i) => {
    console.log(`\n📖 Recipe ${i + 1}: ${recipe.name}`);
    console.log(`Description: ${recipe.description}`);
    console.log(`Ingredients: ${recipe.ingredients.length}`);
    console.log(`Instructions: ${recipe.instructions.length}`);
    console.log('First ingredient:', recipe.ingredients[0]);
    console.log('First instruction:', recipe.instructions[0]);
  });
} catch (error) {
  console.error('❌ PARSER FAILED:', error);
}