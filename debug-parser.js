// Comprehensive debug test for the enhanced parser
import { parseRecipesFromAI } from './server/utils/recipeParser.js';
import { extractJsonObjects, renameWeirdKeys, mergeRecipeObjects } from './server/utils/aiJsonRepair.js';

const malformedResponse = `{ "recipes": [ { "name": "Old Fashioned", "description": "A cocktail with a robust, sweet, and spicy flavor.", "

": [ {"quantity": "2", "unit": "oz", "item": "Bourbon whiskey", "notes": ""}, {"quantity": "0.5", "unit": "oz", "item": "Rich simple syrup", "notes": "2 parts sugar : 1 part water"}, {"quantity": "2", "unit": "dashes", "item": "Angostura bitters", "notes": ""}, {"quantity": "1", "unit": "", "item": "Orange twist", "notes": "for garnish"} ], "

": [ "In an old-fashioned glass, combine the bourbon, simple syrup, and bitters.", "Add ice and stir until well chilled.", "Garnish with an orange twist." ], "glassware": "Old-fashioned glass", "garnish": "Orange twist", "tags": ["classic", "bourbon", "stirred"] }, { "name": "Margarita", "description": "A refreshing and tangy cocktail that's perfect for hot days.", "

Ingredients:
": [ {"quantity": "2", "unit": "oz", "item": "Tequila", "notes": ""}, {"quantity": "1", "unit": "oz", "item": "Cointreau", "notes": ""}, {"quantity": "1", "unit": "oz", "item": "Fresh lime juice", "notes": ""}, {"quantity": "", "unit": "", "item": "Salt", "notes": "for rimming the glass"} ], "glassware": "Margarita glass", "garnish": "Lime wheel", "tags": ["classic", "tequila", "shaken", "citrus"] } ] }`;

console.log('🔍 STEP-BY-STEP PARSER DEBUG\n');

// Step 1: JSON Extraction
console.log('1️⃣ Testing JSON extraction...');
const chunks = extractJsonObjects(malformedResponse);
console.log(`Found ${chunks.length} JSON chunks`);
chunks.forEach((chunk, i) => {
  console.log(`Chunk ${i + 1} preview:`, chunk.substring(0, 150) + '...');
});

// Step 2: JSON Parsing
console.log('\n2️⃣ Testing JSON parsing...');
const parsed = chunks.map((ch, i) => {
  try { 
    const result = JSON.parse(ch);
    console.log(`✅ Chunk ${i + 1} parsed successfully`);
    return result;
  } catch (error) { 
    console.log(`❌ Chunk ${i + 1} parse failed:`, error.message);
    return null;
  }
}).filter(Boolean);
console.log(`Successfully parsed ${parsed.length} chunks`);

// Step 3: Key Normalization 
console.log('\n3️⃣ Testing key normalization...');
const normalized = parsed.map((obj, i) => {
  console.log(`Processing chunk ${i + 1}...`);
  const result = renameWeirdKeys(obj);
  console.log(`Chunk ${i + 1} after normalization:`, JSON.stringify(result, null, 2).substring(0, 300) + '...');
  return result;
});

// Step 4: Recipe Merging
console.log('\n4️⃣ Testing recipe merging...');
const merged = mergeRecipeObjects(normalized);
console.log(`Merged result has ${merged.recipes?.length || 0} recipes`);
if (merged.recipes && merged.recipes.length > 0) {
  merged.recipes.forEach((recipe, i) => {
    console.log(`Recipe ${i + 1}: ${recipe.name}`);
    console.log(`  Ingredients: ${recipe.ingredients?.length || 0}`);
    console.log(`  Instructions: ${recipe.instructions?.length || 0}`);
  });
}

// Step 5: Full Parser Test
console.log('\n5️⃣ Testing full parser...');
try {
  const result = parseRecipesFromAI(malformedResponse);
  console.log(`✅ Full parser success! Found ${result.recipes.length} recipes`);
  
  result.recipes.forEach((recipe, i) => {
    console.log(`\n📖 Recipe ${i + 1}: ${recipe.name}`);
    console.log(`   Description: ${recipe.description}`);
    console.log(`   Ingredients: ${recipe.ingredients.length}`);
    console.log(`   Instructions: ${recipe.instructions.length}`);
    if (recipe.ingredients.length > 0) {
      console.log(`   First ingredient: ${recipe.ingredients[0].quantity} ${recipe.ingredients[0].unit} ${recipe.ingredients[0].item}`);
    }
  });
} catch (error) {
  console.error('❌ Full parser failed:', error);
}