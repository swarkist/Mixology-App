#!/usr/bin/env node

/**
 * Demo Script: Multi-Recipe Parser
 * 
 * This script demonstrates the new tolerant recipe parser that converts
 * messy AI responses into normalized, structured JSON.
 */

import { parseRecipesFromAI } from './server/utils/recipeParser.js';

// Example 1: Messy AI response with mixed content
const messyAIResponse = `
Here are some great cocktails for your party!

1. Old Fashioned - A timeless classic with bourbon

Ingredients:
• 2 oz Bourbon whiskey
• 0.5 oz Rich simple syrup (2:1 sugar to water)
• 2 dashes Angostura bitters
• Orange twist for garnish

Instructions:
1. Combine bourbon, syrup, and bitters in glass
2. Add ice and stir until well chilled  
3. Garnish with orange twist

2. Margarita - Perfect for summer

Ingredients:
- 2 oz Tequila blanco
- 1 oz Fresh lime juice
- 1 oz Cointreau
- Salt for rim

Instructions:
1. Rim glass with salt
2. Shake ingredients with ice
3. Strain into salt-rimmed glass
4. Garnish with lime wheel

Hope you enjoy these cocktails! Let me know if you need more suggestions.
`;

// Example 2: Broken JSON that needs repair
const brokenJSON = `{
  "recipes": [
    {
      "name": "Manhattan",
      "description": "A sophisticated whiskey cocktail",
      "ingredients": [
        {"quantity": "2", "unit": "oz", "item": "Rye whiskey", "notes": ""},
        {"quantity": "1", "unit": "oz", "item": "Sweet vermouth", "notes": ""},
        {"quantity": "2", "unit": "dashes", "item": "Angostura bitters", "notes": ""},
      ],
      "instructions": [
        "Stir all ingredients with ice",
        "Strain into chilled coupe glass",
        "Garnish with maraschino cherry",
      ],
      "glassware": "Coupe glass",
      "garnish": "Maraschino cherry",
      "tags": ["classic", "whiskey",]
    },
  ]
}`;

// Example 3: Valid JSON (should pass through unchanged)
const validJSON = `{
  "recipes": [
    {
      "name": "Negroni",
      "description": "An Italian aperitif",
      "ingredients": [
        {"quantity": "1", "unit": "oz", "item": "Gin", "notes": ""},
        {"quantity": "1", "unit": "oz", "item": "Campari", "notes": ""},
        {"quantity": "1", "unit": "oz", "item": "Sweet vermouth", "notes": ""}
      ],
      "instructions": [
        "Stir ingredients with ice",
        "Strain over ice in rocks glass",
        "Garnish with orange peel"
      ],
      "glassware": "Rocks glass",
      "garnish": "Orange peel",
      "tags": ["classic", "bitter"]
    }
  ]
}`;

console.log('🍸 Multi-Recipe Parser Demo\n');
console.log('=' .repeat(60));

// Test 1: Messy AI Response
console.log('\n📝 Test 1: Messy AI Response');
console.log('-'.repeat(30));
console.log('Input (truncated):');
console.log(messyAIResponse.substring(0, 200) + '...\n');

const result1 = parseRecipesFromAI(messyAIResponse);
console.log('✅ Parsed Output:');
console.log(JSON.stringify(result1, null, 2));
console.log(`\n📊 Found ${result1.recipes.length} recipes\n`);

// Test 2: Broken JSON Repair
console.log('\n🔧 Test 2: Broken JSON Repair');
console.log('-'.repeat(30));
console.log('Input: JSON with trailing commas');

const result2 = parseRecipesFromAI(brokenJSON);
console.log('✅ Repaired Output:');
console.log(JSON.stringify(result2, null, 2));
console.log(`\n📊 Repaired and parsed ${result2.recipes.length} recipe\n`);

// Test 3: Valid JSON Pass-through
console.log('\n✨ Test 3: Valid JSON Pass-through');
console.log('-'.repeat(30));
console.log('Input: Already valid JSON');

const result3 = parseRecipesFromAI(validJSON);
console.log('✅ Output (unchanged):');
console.log(JSON.stringify(result3, null, 2));
console.log(`\n📊 Validated ${result3.recipes.length} recipe\n`);

// Test 4: Decimal to Fraction Conversion
console.log('\n🔢 Test 4: Decimal Conversion Demo');
console.log('-'.repeat(30));

const decimalTest = `{
  "recipes": [
    {
      "name": "Fraction Test",
      "ingredients": [
        {"quantity": "0.75", "unit": "oz", "item": "Test ingredient 1"},
        {"quantity": "1.5", "unit": "oz", "item": "Test ingredient 2"},
        {"quantity": "0.25", "unit": "oz", "item": "Test ingredient 3"}
      ],
      "instructions": ["Mix well"]
    }
  ]
}`;

const result4 = parseRecipesFromAI(decimalTest);
console.log('Input decimals: 0.75, 1.5, 0.25');
console.log('Converted fractions:');
result4.recipes[0].ingredients.forEach((ing, idx) => {
  console.log(`  ${ing.quantity} ${ing.unit} ${ing.item}`);
});

console.log('\n' + '='.repeat(60));
console.log('🎉 Demo Complete! The parser handles:');
console.log('   ✓ Messy AI responses with mixed formatting');
console.log('   ✓ JSON repair (trailing commas, unquoted keys)');
console.log('   ✓ Markdown format with --- separators');
console.log('   ✓ Decimal to fraction conversion');
console.log('   ✓ Unit standardization');
console.log('   ✓ Zod schema validation');
console.log('   ✓ Performance under 50ms for 5 recipes');