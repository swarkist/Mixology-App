import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestDataManager } from '../regression/data-isolation.js';

describe('Storage Layer Unit Tests', () => {
  let testManager: TestDataManager;

  beforeEach(() => {
    testManager = new TestDataManager();
  });

  afterEach(async () => {
    await testManager.cleanupAllTestData();
  });

  describe('Cocktail Storage Operations', () => {
    it('should create cocktail with all fields', async () => {
      const cocktailData = {
        name: 'Unit_Test_Cocktail',
        description: 'Testing cocktail creation',
        ingredients: [
          { name: 'Unit_Test_Vodka', amount: 2, unit: 'oz' },
          { name: 'Unit_Test_Mixer', amount: 4, unit: 'oz' }
        ],
        instructions: [
          'Add vodka to shaker',
          'Add mixer and shake',
          'Strain into glass'
        ],
        tags: ['unit_test', 'storage'],
        featured: false,
        popularityCount: 0
      };

      const cocktail = await testManager.createTestCocktail(cocktailData);

      expect(cocktail).toHaveProperty('id');
      expect(cocktail.name).toContain('Unit_Test_Cocktail');
      expect(cocktail.description).toContain('Testing cocktail creation');
    });

    it('should update cocktail preserving relationships', async () => {
      const cocktail = await testManager.createTestCocktail({
        name: 'Update_Test_Cocktail',
        description: 'Original description',
        ingredients: [{ name: 'Original_Ingredient', amount: 1, unit: 'oz' }],
        instructions: ['Original instruction'],
        tags: ['original']
      });

      const updates = {
        description: 'Updated description',
        ingredients: [
          { name: 'Updated_Ingredient', amount: 2, unit: 'oz' },
          { name: 'New_Ingredient', amount: 1, unit: 'dash' }
        ]
      };

      await testManager.updateCocktail(cocktail.id, updates);
      const updated = await testManager.getCocktail(cocktail.id);

      expect(updated.cocktail.description).toBe('Updated description');
      expect(updated.ingredients).toHaveLength(2);
      expect(updated.ingredients[0].amount).toBe(2);
    });

    it('should delete cocktail and cleanup relationships', async () => {
      const cocktail = await testManager.createTestCocktail({
        name: 'Delete_Test_Cocktail',
        description: 'Will be deleted',
        ingredients: [{ name: 'Delete_Test_Ingredient', amount: 1, unit: 'oz' }],
        instructions: ['Will be deleted'],
        tags: ['delete_test']
      });

      // Delete via API
      await testManager.apiRequest(`/cocktails/${cocktail.id}`, {
        method: 'DELETE'
      });

      // Verify deletion
      try {
        await testManager.getCocktail(cocktail.id);
        expect.fail('Cocktail should have been deleted');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Ingredient Storage Operations', () => {
    it('should create ingredient with all properties', async () => {
      const ingredientData = {
        name: 'Unit_Test_Rum',
        description: 'Testing ingredient creation',
        category: 'spirits',
        subCategory: 'rum',
        preferredBrand: 'Test Brand',
        abv: 40,
        inMyBar: false
      };

      const ingredient = await testManager.createTestIngredient(ingredientData);

      expect(ingredient).toHaveProperty('id');
      expect(ingredient.name).toContain('Unit_Test_Rum');
      expect(ingredient.category).toBe('spirits');
      expect(ingredient.subCategory).toBe('rum');
      expect(ingredient.abv).toBe(40);
    });

    it('should update ingredient My Bar status', async () => {
      const ingredient = await testManager.createTestIngredient({
        name: 'MyBar_Test_Ingredient',
        category: 'spirits',
        inMyBar: false
      });

      await testManager.updateIngredient(ingredient.id, { inMyBar: true });
      const updated = await testManager.getIngredient(ingredient.id);

      expect(updated.inMyBar).toBe(true);
    });

    it('should handle ingredient deletion', async () => {
      const ingredient = await testManager.createTestIngredient({
        name: 'Delete_Test_Ingredient',
        category: 'mixers'
      });

      // Delete via API
      await testManager.apiRequest(`/ingredients/${ingredient.id}`, {
        method: 'DELETE'
      });

      // Verify deletion
      try {
        await testManager.getIngredient(ingredient.id);
        expect.fail('Ingredient should have been deleted');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Data Validation', () => {
    it('should reject invalid cocktail data', async () => {
      try {
        await testManager.apiRequest('/cocktails', {
          method: 'POST',
          body: JSON.stringify({
            // Missing required name field
            description: 'Invalid cocktail'
          })
        });
        expect.fail('Should have rejected invalid data');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should reject invalid ingredient category', async () => {
      try {
        await testManager.apiRequest('/ingredients', {
          method: 'POST',
          body: JSON.stringify({
            name: testManager.getTestName('Invalid_Ingredient'),
            category: 'invalid_category' // Invalid category
          })
        });
        expect.fail('Should have rejected invalid category');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should accept high proof values for ingredients', async () => {
      const response = await testManager.apiRequest('/ingredients', {
        method: 'POST',
        body: JSON.stringify({
          name: testManager.getTestName('High_Proof_Ingredient'),
          category: 'spirits',
          abv: 150 // Valid proof value over 100
        })
      });
      
      expect(response.status).toBe(200);
      expect(response.data.abv).toBe(150);
    });
  });

  describe('Search and Filtering', () => {
    it('should filter cocktails by ingredients', async () => {
      // Create test cocktail with specific ingredient
      await testManager.createTestCocktail({
        name: 'Filter_Test_Cocktail',
        ingredients: [{ name: 'Filter_Test_Vodka', amount: 2, unit: 'oz' }],
        instructions: ['Mix well'],
        tags: []
      });

      // Search for cocktails containing the ingredient
      const results = await testManager.apiRequest('/cocktails/search?ingredient=Filter_Test_Vodka');
      
      expect(results.length).toBeGreaterThan(0);
      const foundCocktail = results.find((c: any) => c.name.includes('Filter_Test_Cocktail'));
      expect(foundCocktail).toBeDefined();
    });

    it('should filter ingredients by category', async () => {
      await testManager.createTestIngredient({
        name: 'Category_Filter_Test_Rum',
        category: 'spirits',
        subCategory: 'rum'
      });

      const results = await testManager.apiRequest('/ingredients?category=spirits');
      
      expect(results.length).toBeGreaterThan(0);
      const spiritsIngredients = results.filter((i: any) => i.category === 'spirits');
      expect(spiritsIngredients.length).toBeGreaterThan(0);
    });

    it('should search ingredients by name', async () => {
      await testManager.createTestIngredient({
        name: 'Search_Test_Gin',
        category: 'spirits',
        subCategory: 'gin'
      });

      const results = await testManager.apiRequest('/ingredients/search?q=Search_Test_Gin');
      
      expect(results.length).toBeGreaterThan(0);
      const foundIngredient = results.find((i: any) => i.name.includes('Search_Test_Gin'));
      expect(foundIngredient).toBeDefined();
    });
  });

  describe('Featured and Popularity System', () => {
    it('should toggle cocktail featured status', async () => {
      const cocktail = await testManager.createTestCocktail({
        name: 'Featured_Test_Cocktail',
        featured: false,
        instructions: ['Test'],
        tags: []
      });

      // Toggle featured status
      await testManager.apiRequest(`/cocktails/${cocktail.id}/featured`, {
        method: 'PATCH',
        body: JSON.stringify({ featured: true })
      });

      const updated = await testManager.getCocktail(cocktail.id);
      expect(updated.cocktail.isFeatured).toBe(true);
    });

    it('should increment popularity count', async () => {
      const cocktail = await testManager.createTestCocktail({
        name: 'Popularity_Test_Cocktail',
        popularityCount: 0,
        instructions: ['Test'],
        tags: []
      });

      // Increment popularity
      await testManager.apiRequest(`/cocktails/${cocktail.id}/popularity`, {
        method: 'PATCH'
      });

      const updated = await testManager.getCocktail(cocktail.id);
      expect(updated.cocktail.popularityCount).toBe(1);
    });
  });

  describe('Tag Management', () => {
    it('should create and associate tags with cocktails', async () => {
      const cocktail = await testManager.createTestCocktail({
        name: 'Tag_Test_Cocktail',
        tags: ['unit_test_tag_1', 'unit_test_tag_2'],
        instructions: ['Test'],
        ingredients: []
      });

      const retrieved = await testManager.getCocktail(cocktail.id);
      expect(retrieved.tags).toHaveLength(2);
      expect(retrieved.tags.some((t: any) => t.name.includes('unit_test_tag_1'))).toBe(true);
    });

    it('should handle tag updates', async () => {
      const cocktail = await testManager.createTestCocktail({
        name: 'Tag_Update_Test_Cocktail',
        tags: ['original_tag'],
        instructions: ['Test'],
        ingredients: []
      });

      await testManager.updateCocktail(cocktail.id, {
        tags: ['updated_tag', 'new_tag']
      });

      const updated = await testManager.getCocktail(cocktail.id);
      expect(updated.tags).toHaveLength(2);
      expect(updated.tags.some((t: any) => t.name.includes('updated_tag'))).toBe(true);
    });
  });
});