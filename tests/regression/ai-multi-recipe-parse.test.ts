import { describe, it, expect, beforeAll } from 'vitest';
import { parseRecipesFromAI, parseRecipesFromAITimed } from '../../server/utils/recipeParser';
import { ParsedRecipesSchema } from '../../server/types/recipes';

describe('AI Multi-Recipe Parser', () => {
  describe('Valid JSON Parsing', () => {
    it('should parse single recipe JSON correctly', () => {
      const validSingleRecipeJSON = `{
        "recipes": [
          {
            "name": "Old Fashioned",
            "description": "A classic bourbon cocktail",
            "ingredients": [
              {"quantity": "2", "unit": "oz", "item": "Bourbon whiskey", "notes": ""},
              {"quantity": "0.5", "unit": "oz", "item": "Simple syrup", "notes": ""},
              {"quantity": "2", "unit": "dashes", "item": "Angostura bitters", "notes": ""}
            ],
            "instructions": [
              "Combine all ingredients in an old-fashioned glass",
              "Add ice and stir until well chilled",
              "Garnish with orange twist"
            ],
            "glassware": "Old-fashioned glass",
            "garnish": "Orange twist",
            "tags": ["classic", "bourbon"]
          }
        ]
      }`;

      const result = parseRecipesFromAI(validSingleRecipeJSON);
      
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].name).toBe('Old Fashioned');
      expect(result.recipes[0].ingredients).toHaveLength(3);
      expect(result.recipes[0].instructions).toHaveLength(3);
      expect(result.recipes[0].glassware).toBe('Old-fashioned glass');
      
      // Validate against Zod schema
      expect(() => ParsedRecipesSchema.parse(result)).not.toThrow();
    });

    it('should parse multiple recipes JSON correctly', () => {
      const validMultiRecipeJSON = `{
        "recipes": [
          {
            "name": "Margarita",
            "description": "A refreshing tequila cocktail",
            "ingredients": [
              {"quantity": "2", "unit": "oz", "item": "Tequila", "notes": ""},
              {"quantity": "1", "unit": "oz", "item": "Cointreau", "notes": ""},
              {"quantity": "1", "unit": "oz", "item": "Lime juice", "notes": "fresh"}
            ],
            "instructions": ["Shake with ice", "Strain into glass"],
            "glassware": "Margarita glass",
            "tags": ["tequila", "citrus"]
          },
          {
            "name": "Manhattan",
            "description": "A whiskey cocktail with vermouth",
            "ingredients": [
              {"quantity": "2", "unit": "oz", "item": "Rye whiskey", "notes": ""},
              {"quantity": "1", "unit": "oz", "item": "Sweet vermouth", "notes": ""}
            ],
            "instructions": ["Stir with ice", "Strain into coupe"],
            "glassware": "Coupe glass",
            "tags": ["whiskey", "classic"]
          }
        ]
      }`;

      const result = parseRecipesFromAI(validMultiRecipeJSON);
      
      expect(result.recipes).toHaveLength(2);
      expect(result.recipes[0].name).toBe('Margarita');
      expect(result.recipes[1].name).toBe('Manhattan');
      expect(() => ParsedRecipesSchema.parse(result)).not.toThrow();
    });
  });

  describe('JSON Repair Functionality', () => {
    it('should repair trailing commas in JSON', () => {
      const brokenJSON = `{
        "recipes": [
          {
            "name": "Old Fashioned",
            "description": "A classic cocktail",
            "ingredients": [
              {"quantity": "2", "unit": "oz", "item": "Bourbon", "notes": ""},
            ],
            "instructions": ["Stir with ice", "Strain",],
            "tags": ["classic",]
          },
        ]
      }`;

      const result = parseRecipesFromAI(brokenJSON);
      
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].name).toBe('Old Fashioned');
      expect(() => ParsedRecipesSchema.parse(result)).not.toThrow();
    });

    it('should repair unquoted keys in JSON', () => {
      const brokenJSON = `{
        recipes: [
          {
            name: "Margarita",
            description: "A tequila cocktail",
            ingredients: [
              {quantity: "2", unit: "oz", item: "Tequila", notes: ""}
            ],
            instructions: ["Shake with ice"],
            tags: ["tequila"]
          }
        ]
      }`;

      const result = parseRecipesFromAI(brokenJSON);
      
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].name).toBe('Margarita');
    });
  });

  describe('Markdown Parsing', () => {
    it('should parse markdown with --- separators', () => {
      const markdownContent = `
### Old Fashioned
_A timeless bourbon cocktail_

**Ingredients**
- 2 oz Bourbon whiskey
- 0.5 oz Simple syrup
- 2 dashes Angostura bitters

**Instructions**
1) Combine all ingredients in glass
2) Add ice and stir
3) Garnish with orange twist

**Glassware**: Old-fashioned glass
**Garnish**: Orange twist
**Tags**: classic, bourbon
---

### Margarita
_A refreshing tequila drink_

**Ingredients**
- 2 oz Tequila
- 1 oz Cointreau
- 1 oz Fresh lime juice

**Instructions**
1) Shake all ingredients with ice
2) Strain into salt-rimmed glass

**Glassware**: Margarita glass
**Tags**: tequila, citrus
---
      `;

      const result = parseRecipesFromAI(markdownContent);
      
      expect(result.recipes).toHaveLength(2);
      expect(result.recipes[0].name).toBe('Old Fashioned');
      expect(result.recipes[1].name).toBe('Margarita');
      expect(result.recipes[0].ingredients).toHaveLength(3);
      expect(() => ParsedRecipesSchema.parse(result)).not.toThrow();
    });

    it('should parse markdown with ### headings', () => {
      const markdownContent = `
### Manhattan
A classic whiskey cocktail

**Ingredients**
- 2 oz Rye whiskey
- 1 oz Sweet vermouth  
- 2 dashes Angostura bitters

**Instructions**
1) Stir ingredients with ice
2) Strain into chilled coupe
3) Garnish with cherry

### Negroni
An Italian aperitif

**Ingredients**
- 1 oz Gin
- 1 oz Campari
- 1 oz Sweet vermouth

**Instructions**
1) Stir with ice
2) Strain over ice in rocks glass
3) Garnish with orange peel
      `;

      const result = parseRecipesFromAI(markdownContent);
      
      expect(result.recipes).toHaveLength(2);
      expect(result.recipes[0].name).toBe('Manhattan');
      expect(result.recipes[1].name).toBe('Negroni');
    });
  });

  describe('Mixed and Edge Case Ingredients', () => {
    it('should handle complex measurement formats', () => {
      const complexIngredients = `{
        "recipes": [
          {
            "name": "Complex Cocktail",
            "description": "Testing various measurements",
            "ingredients": [
              {"quantity": "1 1/2", "unit": "oz", "item": "Bourbon", "notes": ""},
              {"quantity": "0.75", "unit": "oz", "item": "Lemon juice", "notes": "fresh squeezed"},
              {"quantity": "1", "unit": "dash", "item": "Orange bitters", "notes": ""},
              {"quantity": "1", "unit": "sprig", "item": "Mint", "notes": "for garnish"},
              {"quantity": "2", "unit": "tsp", "item": "Simple syrup", "notes": ""},
              {"quantity": "4", "unit": "ml", "item": "Absinthe", "notes": "rinse"}
            ],
            "instructions": ["Shake and strain"],
            "tags": ["complex"]
          }
        ]
      }`;

      const result = parseRecipesFromAI(complexIngredients);
      
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].ingredients).toHaveLength(6);
      
      // Check fraction handling
      const bourbonIngredient = result.recipes[0].ingredients.find(i => i.item === 'Bourbon');
      expect(bourbonIngredient?.quantity).toBe('1 1/2'); // Should preserve fractions
      
      // Check decimal conversion
      const lemonIngredient = result.recipes[0].ingredients.find(i => i.item === 'Lemon juice');
      expect(lemonIngredient?.quantity).toBe('3/4'); // Should convert 0.75 to 3/4
      
      // Check garnish ingredient
      const mintIngredient = result.recipes[0].ingredients.find(i => i.item === 'Mint');
      expect(mintIngredient?.unit).toBe('sprig');
      
      expect(() => ParsedRecipesSchema.parse(result)).not.toThrow();
    });

    it('should handle various unit standardizations', () => {
      const unitsTest = `{
        "recipes": [
          {
            "name": "Unit Test Cocktail",
            "ingredients": [
              {"quantity": "2", "unit": "ounces", "item": "Whiskey"},
              {"quantity": "1", "unit": "teaspoon", "item": "Sugar"},
              {"quantity": "3", "unit": "dashes", "item": "Bitters"},
              {"quantity": "30", "unit": "milliliters", "item": "Vermouth"}
            ],
            "instructions": ["Mix well"],
            "tags": ["test"]
          }
        ]
      }`;

      const result = parseRecipesFromAI(unitsTest);
      
      expect(result.recipes[0].ingredients[0].unit).toBe('oz'); // ounces → oz
      expect(result.recipes[0].ingredients[1].unit).toBe('tsp'); // teaspoon → tsp
      expect(result.recipes[0].ingredients[2].unit).toBe('dashes'); // dashes preserved
      expect(result.recipes[0].ingredients[3].unit).toBe('ml'); // milliliters → ml
    });
  });

  describe('Performance Testing', () => {
    it('should parse 5 recipes in under 50ms', () => {
      const fiveRecipesJSON = `{
        "recipes": [
          {
            "name": "Recipe 1",
            "ingredients": [{"quantity": "2", "unit": "oz", "item": "Spirit"}],
            "instructions": ["Mix well"],
            "tags": ["test"]
          },
          {
            "name": "Recipe 2", 
            "ingredients": [{"quantity": "1", "unit": "oz", "item": "Liqueur"}],
            "instructions": ["Shake"],
            "tags": ["test"]
          },
          {
            "name": "Recipe 3",
            "ingredients": [{"quantity": "0.5", "unit": "oz", "item": "Syrup"}],
            "instructions": ["Stir"],
            "tags": ["test"]
          },
          {
            "name": "Recipe 4",
            "ingredients": [{"quantity": "3", "unit": "dashes", "item": "Bitters"}],
            "instructions": ["Combine"],
            "tags": ["test"]
          },
          {
            "name": "Recipe 5",
            "ingredients": [{"quantity": "1", "unit": "twist", "item": "Lemon"}],
            "instructions": ["Garnish"],
            "tags": ["test"]
          }
        ]
      }`;

      const { result, timeMs } = parseRecipesFromAITimed(fiveRecipesJSON);
      
      expect(timeMs).toBeLessThan(50);
      expect(result.recipes).toHaveLength(5);
      expect(() => ParsedRecipesSchema.parse(result)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should return empty recipes for completely invalid input', () => {
      const invalidInput = "This is not a recipe at all, just random text without any structure.";
      
      const result = parseRecipesFromAI(invalidInput);
      
      expect(result.recipes).toHaveLength(0);
      expect(() => ParsedRecipesSchema.parse(result)).not.toThrow();
    });

    it('should return empty recipes for malformed JSON that cannot be repaired', () => {
      const badJSON = `{
        "recipes": [
          {
            "name": "Broken Recipe"
            "ingredients": [
              {"quantity": "2" "unit": "oz" item: "Missing commas everywhere"
            }
          }
        ]
      `;

      const result = parseRecipesFromAI(badJSON);
      
      expect(result.recipes).toHaveLength(0);
    });

    it('should handle empty or missing required fields gracefully', () => {
      const incompleteJSON = `{
        "recipes": [
          {
            "name": "",
            "ingredients": [],
            "instructions": []
          }
        ]
      }`;

      // This should be caught by Zod validation and return empty
      const result = parseRecipesFromAI(incompleteJSON);
      expect(result.recipes).toHaveLength(0);
    });
  });

  describe('Schema Validation', () => {
    it('should enforce minimum requirements for valid recipes', () => {
      const validMinimal = `{
        "recipes": [
          {
            "name": "Minimal Recipe",
            "ingredients": [
              {"quantity": "1", "unit": "oz", "item": "Something"}
            ],
            "instructions": ["Do something"]
          }
        ]
      }`;

      const result = parseRecipesFromAI(validMinimal);
      
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].name).toBe('Minimal Recipe');
      expect(() => ParsedRecipesSchema.parse(result)).not.toThrow();
    });

    it('should reject recipes with invalid data types', () => {
      const invalidTypes = `{
        "recipes": [
          {
            "name": 123,
            "ingredients": "not an array",
            "instructions": ["Valid instruction"]
          }
        ]
      }`;

      const result = parseRecipesFromAI(invalidTypes);
      expect(result.recipes).toHaveLength(0);
    });
  });

  describe('Real-world AI Response Scenarios', () => {
    it('should handle messy AI response with prose before and after JSON', () => {
      const messyResponse = `
Here are some great cocktail recipes for you:

{
  "recipes": [
    {
      "name": "Classic Martini",
      "description": "The quintessential gin cocktail",
      "ingredients": [
        {"quantity": "2.5", "unit": "oz", "item": "Gin", "notes": ""},
        {"quantity": "0.5", "unit": "oz", "item": "Dry vermouth", "notes": ""}
      ],
      "instructions": [
        "Stir with ice until well chilled",
        "Strain into chilled coupe",
        "Garnish with lemon twist or olive"
      ],
      "glassware": "Coupe or martini glass",
      "garnish": "Lemon twist or olive",
      "tags": ["classic", "gin"]
    }
  ]
}

I hope you enjoy making these cocktails! Let me know if you need any variations.
      `;

      const result = parseRecipesFromAI(messyResponse);
      
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].name).toBe('Classic Martini');
      expect(result.recipes[0].ingredients[0].quantity).toBe('2 1/2'); // 2.5 → 2 1/2
    });

    it('should handle mixed format responses (some JSON, some markdown)', () => {
      const mixedResponse = `
### Old Fashioned
A classic bourbon cocktail

**Ingredients**
- 2 oz Bourbon
- 0.25 oz Simple syrup
- 2 dashes Angostura bitters

**Instructions**
1) Combine in glass with ice
2) Stir until chilled
3) Garnish with orange peel
      `;

      const result = parseRecipesFromAI(mixedResponse);
      
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].name).toBe('Old Fashioned');
      expect(result.recipes[0].ingredients).toHaveLength(3);
    });
  });
});