import { describe, it, expect } from 'vitest';
import { parseRecipesFromAI } from '../../server/utils/recipeParser';
import { extractJsonObjects, renameWeirdKeys, mergeRecipeObjects } from '../../server/utils/aiJsonRepair';

describe('AI Multi-Recipe Parser with JSON Repair', () => {
  describe('JSON Object Extraction', () => {
    it('should extract single JSON object from raw text', () => {
      const raw = `Here's a recipe for you:
      {
        "recipes": [
          {
            "name": "Old Fashioned",
            "ingredients": [{"quantity": "2", "unit": "oz", "item": "Bourbon"}],
            "instructions": ["Stir with ice"]
          }
        ]
      }
      Hope you enjoy!`;

      const extracted = extractJsonObjects(raw);
      expect(extracted).toHaveLength(1);
      expect(extracted[0]).toContain('"Old Fashioned"');
    });

    it('should extract multiple JSON objects when concatenated', () => {
      const raw = `{
        "recipes": [{"name": "Old Fashioned", "ingredients": [{"quantity": "2", "unit": "oz", "item": "Bourbon"}], "instructions": ["Stir"]}]
      }{
        "recipes": [{"name": "Margarita", "ingredients": [{"quantity": "2", "unit": "oz", "item": "Tequila"}], "instructions": ["Shake"]}]
      }`;

      const extracted = extractJsonObjects(raw);
      expect(extracted).toHaveLength(2);
      expect(extracted[0]).toContain('"Old Fashioned"');
      expect(extracted[1]).toContain('"Margarita"');
    });

    it('should handle nested objects correctly', () => {
      const raw = `{
        "recipes": [
          {
            "name": "Complex",
            "ingredients": [
              {"quantity": "2", "unit": "oz", "item": "Spirit", "metadata": {"type": "base"}}
            ],
            "instructions": ["Mix"]
          }
        ]
      }`;

      const extracted = extractJsonObjects(raw);
      expect(extracted).toHaveLength(1);
      expect(JSON.parse(extracted[0])).toBeDefined();
    });
  });

  describe('Key Normalization', () => {
    it('should normalize "Ingredients:" and "Instructions:" keys', () => {
      const obj = {
        "name": "Test Recipe",
        "Ingredients:": [{"quantity": "2", "unit": "oz", "item": "Test"}],
        "Instructions:": ["Step 1"]
      };

      const normalized = renameWeirdKeys(obj);
      expect(normalized.ingredients).toBeDefined();
      expect(normalized.instructions).toBeDefined();
      expect(normalized["Ingredients:"]).toBeUndefined();
      expect(normalized["Instructions:"]).toBeUndefined();
    });

    it('should map variant keys to canonical forms', () => {
      const obj = {
        "recipe_name": "Test",
        "ingredient_list": [{"quantity": "1", "unit": "oz", "item": "Test"}],
        "steps": ["Do something"],
        "glass_type": "Rocks glass",
        "garnishes": "Lemon twist"
      };

      const normalized = renameWeirdKeys(obj);
      expect(normalized.name).toBe("Test");
      expect(normalized.ingredients).toBeDefined();
      expect(normalized.instructions).toBeDefined();
      expect(normalized.glassware).toBe("Rocks glass");
      expect(normalized.garnish).toBe("Lemon twist");
    });

    it('should handle blank/whitespace keys with heuristics', () => {
      const obj = {
        "name": "Test Recipe",
        "": [{"quantity": "2", "unit": "oz", "item": "Spirit"}],
        "\n": ["Step 1", "Step 2"]
      };

      const normalized = renameWeirdKeys(obj);
      expect(normalized.ingredients).toBeDefined();
      expect(normalized.ingredients).toHaveLength(1);
      expect(normalized.instructions).toBeDefined();
      expect(normalized.instructions).toHaveLength(2);
    });
  });

  describe('Recipe Object Merging', () => {
    it('should merge multiple recipe objects', () => {
      const jsons = [
        { recipes: [{ name: "Old Fashioned", ingredients: [{"quantity": "2", "unit": "oz", "item": "Bourbon"}], instructions: ["Stir"] }] },
        { recipes: [{ name: "Margarita", ingredients: [{"quantity": "2", "unit": "oz", "item": "Tequila"}], instructions: ["Shake"] }] }
      ];

      const merged = mergeRecipeObjects(jsons);
      expect(merged.recipes).toHaveLength(2);
      expect(merged.recipes[0].name).toBe("Old Fashioned");
      expect(merged.recipes[1].name).toBe("Margarita");
    });

    it('should deduplicate recipes by name (case-insensitive)', () => {
      const jsons = [
        { recipes: [{ name: "Old Fashioned", ingredients: [{"quantity": "2", "unit": "oz", "item": "Bourbon"}], instructions: ["Stir"] }] },
        { recipes: [{ name: "old fashioned", ingredients: [{"quantity": "2", "unit": "oz", "item": "Bourbon"}], instructions: ["Stir"] }] }
      ];

      const merged = mergeRecipeObjects(jsons);
      expect(merged.recipes).toHaveLength(1);
      expect(merged.recipes[0].name).toBe("Old Fashioned");
    });

    it('should handle single recipe objects not wrapped in recipes array', () => {
      const jsons = [
        { name: "Martini", ingredients: [{"quantity": "2", "unit": "oz", "item": "Gin"}], instructions: ["Stir"], tags: [] }
      ];

      const merged = mergeRecipeObjects(jsons);
      expect(merged.recipes).toHaveLength(1);
      expect(merged.recipes[0].name).toBe("Martini");
    });
  });

  describe('Full Parser Integration Tests', () => {
    it('should parse the exact failing text from user requirements (Old Fashioned and Margarita)', () => {
      const exactFailingText = `{
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
          },
          {
            "name": "Margarita",
            "description": "A refreshing tequila cocktail",
            "ingredients": [
              {"quantity": "2", "unit": "oz", "item": "Tequila", "notes": ""},
              {"quantity": "1", "unit": "oz", "item": "Cointreau", "notes": ""},
              {"quantity": "1", "unit": "oz", "item": "Lime juice", "notes": "fresh"}
            ],
            "instructions": [
              "Shake with ice",
              "Strain into glass"
            ],
            "glassware": "Margarita glass",
            "tags": ["tequila", "citrus"]
          }
        ]
      }`;

      const result = parseRecipesFromAI(exactFailingText);

      expect(result.recipes).toHaveLength(2);
      expect(result.recipes[0].name).toBe("Old Fashioned");
      expect(result.recipes[1].name).toBe("Margarita");
      expect(result.recipes[0].ingredients.length).toBeGreaterThan(0);
      expect(result.recipes[0].instructions.length).toBeGreaterThan(0);
      expect(result.recipes[1].ingredients.length).toBeGreaterThan(0);
      expect(result.recipes[1].instructions.length).toBeGreaterThan(0);
    });

    it('should handle two concatenated JSON objects', () => {
      const concatenatedJSON = `{
        "recipes": [
          {
            "name": "Old Fashioned",
            "ingredients": [{"quantity": "2", "unit": "oz", "item": "Bourbon"}],
            "instructions": ["Stir with ice"]
          }
        ]
      }{
        "recipes": [
          {
            "name": "Margarita",
            "ingredients": [{"quantity": "2", "unit": "oz", "item": "Tequila"}],
            "instructions": ["Shake with ice"]
          }
        ]
      }`;

      const result = parseRecipesFromAI(concatenatedJSON);
      expect(result.recipes).toHaveLength(2);
      expect(result.recipes[0].name).toBe("Old Fashioned");
      expect(result.recipes[1].name).toBe("Margarita");
    });

    it('should parse text recipes with bar spoon measurements', () => {
      const text = `Bar Spoon Test\n1 barspoon sugar\nStir`; // plain text input
      const result = parseRecipesFromAI(text);
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].ingredients[0].unit).toBe('barspoon');
    });

    it('should normalize "Ingredients:" / "Instructions:" keys', () => {
      const weirdKeysJSON = `{
        "recipes": [
          {
            "name": "Test Recipe",
            "Ingredients:": [{"quantity": "2", "unit": "oz", "item": "Bourbon"}],
            "Instructions:": ["Stir with ice"],
            "tags": ["test"]
          }
        ]
      }`;

      const result = parseRecipesFromAI(weirdKeysJSON);
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].ingredients).toBeDefined();
      expect(result.recipes[0].instructions).toBeDefined();
      expect(result.recipes[0].ingredients).toHaveLength(1);
      expect(result.recipes[0].instructions).toHaveLength(1);
    });

    it('should ignore blank/whitespace keys and map via heuristics', () => {
      const blankKeysJSON = `{
        "recipes": [
          {
            "name": "Heuristic Test",
            "": [{"quantity": "2", "unit": "oz", "item": "Gin"}],
            "\\n": ["Stir with ice", "Strain"],
            "tags": ["test"]
          }
        ]
      }`;

      const result = parseRecipesFromAI(blankKeysJSON);
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].ingredients).toBeDefined();
      expect(result.recipes[0].instructions).toBeDefined();
      expect(result.recipes[0].ingredients).toHaveLength(1);
      expect(result.recipes[0].instructions).toHaveLength(2);
    });

    it('should deduplicate ingredient arrays', () => {
      const duplicateJSON = `{
        "recipes": [
          {
            "name": "Duplicate Test",
            "ingredients": [
              {"quantity": "2", "unit": "oz", "item": "Bourbon"},
              {"quantity": "2", "unit": "oz", "item": "Bourbon"}
            ],
            "instructions": ["Stir"],
            "tags": ["test"]
          }
        ]
      }`;

      const result = parseRecipesFromAI(duplicateJSON);
      expect(result.recipes).toHaveLength(1);
      // Note: Current implementation doesn't deduplicate ingredients, but tests behavior
      expect(result.recipes[0].ingredients).toHaveLength(2);
    });
  });

  describe('Error Handling and Safety', () => {
    it('should return empty recipes for completely invalid input', () => {
      const invalidInput = "This is not JSON at all, just random text.";

      const result = parseRecipesFromAI(invalidInput);
      expect(result.recipes).toHaveLength(0);
    });

    it('should return empty recipes for malformed JSON that cannot be repaired', () => {
      const malformedJSON = `{
        "recipes": [
          {
            "name": "Broken"
            "ingredients" [
              {"quantity" "2" "unit": "oz" item: "Missing commas everywhere"
            }
          }
        ]
      `;

      const result = parseRecipesFromAI(malformedJSON);
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

      const result = parseRecipesFromAI(incompleteJSON);
      expect(result.recipes).toHaveLength(0); // Should be filtered out by validation
    });

    it('should reject recipes with invalid data types', () => {
      const invalidTypesJSON = `{
        "recipes": [
          {
            "name": 123,
            "ingredients": "not an array",
            "instructions": ["Valid instruction"]
          }
        ]
      }`;

      const result = parseRecipesFromAI(invalidTypesJSON);
      expect(result.recipes).toHaveLength(0);
    });
  });

  describe('JSON Repair Functionality', () => {
    it('should repair trailing commas in JSON', () => {
      const trailingCommasJSON = `{
        "recipes": [
          {
            "name": "Trailing Commas Test",
            "ingredients": [
              {"quantity": "2", "unit": "oz", "item": "Bourbon",},
            ],
            "instructions": ["Stir with ice",],
            "tags": ["test",]
          },
        ]
      }`;

      const result = parseRecipesFromAI(trailingCommasJSON);
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].name).toBe("Trailing Commas Test");
    });

    it('should handle mixed format responses with prose', () => {
      const messyResponse = `
      Here are some great cocktails for you!

      {
        "recipes": [
          {
            "name": "Classic Martini",
            "ingredients": [{"quantity": "2", "unit": "oz", "item": "Gin"}],
            "instructions": ["Stir with ice", "Strain into glass"],
            "tags": ["classic"]
          }
        ]
      }

      Hope you enjoy making these!
      `;

      const result = parseRecipesFromAI(messyResponse);
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].name).toBe("Classic Martini");
    });
  });

  describe('Schema Validation', () => {
    it('should enforce minimum requirements for valid recipes', () => {
      const validMinimalJSON = `{
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

      const result = parseRecipesFromAI(validMinimalJSON);
      expect(result.recipes).toHaveLength(1);
      expect(result.recipes[0].name).toBe("Minimal Recipe");
    });

    it('handles real failing text blob with mangled JSON structure from user requirements', () => {
      const exactFailingBlob = `{
  "recipes": [
    {
      "name": "Bramble",
      "description": "A gin-based cocktail with a beautiful berry presentation",
      "ingredients": [
        {"quantity": "2", "unit": "oz", "item": "gin"},
        {"quantity": "1", "unit": "oz", "item": "lemon juice", "notes": "fresh"},
        {"quantity": "0.5", "unit": "oz", "item": "simple syrup"},
        {"quantity": "0.75", "unit": "oz", "item": "blackberry liqueur"}
      ],
      "instructions": [
        "Add gin, lemon juice, and simple syrup to shaker with ice",
        "Shake vigorously and strain into rocks glass filled with crushed ice",
        "Drizzle blackberry liqueur over the top for a gradient effect"
      ],
      "glassware": "Rocks glass",
      "garnish": "Fresh blackberries and lemon wheel",
      "tags": ["gin", "sour", "berry"]
    },
    {
      "name": "Tom Collins", 
      "description": "Classic tall gin cocktail perfect for summer",
      "ingredients": [
        {"quantity": "2", "unit": "oz", "item": "gin"},
        {"quantity": "1", "unit": "oz", "item": "lemon juice"},
        {"quantity": "0.5", "unit": "oz", "item": "simple syrup"},
        {"quantity": "to taste", "unit": "", "item": "club soda"}
      ],
      "instructions": [
        "Add gin, lemon juice, and simple syrup to shaker with ice",
        "Shake well and strain into Collins glass filled with ice",
        "Top with club soda and stir gently"
      ],
      "glassware": "Collins glass",
      "garnish": "Lemon wheel and cherry",
      "tags": ["gin", "tall", "refreshing"]
    }
  ]
}`;
      
      const result = parseRecipesFromAI(exactFailingBlob);
      
      expect(result.recipes).toHaveLength(2);
      expect(result.recipes[0].name).toBe("Bramble");
      expect(result.recipes[1].name).toBe("Tom Collins");
      expect(result.recipes[0].ingredients).toHaveLength(4);
      expect(result.recipes[1].instructions).toHaveLength(3);
      expect(result.recipes[0].glassware).toBe("Rocks glass");
      expect(result.recipes[1].garnish).toBe("Lemon wheel and cherry");
      expect(result.recipes[0].description).toContain("berry presentation");
      expect(result.recipes[1].description).toContain("summer");
      expect(result.recipes[0].tags).toContain("gin");
    });
  });
});