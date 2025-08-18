import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDataManager } from '../regression/data-isolation.js';
import { waitForEndpoint } from '../utils/wait-for-endpoint.js';

describe('Full Workflow Integration Tests', () => {
  let testManager: TestDataManager;

  beforeAll(async () => {
    testManager = new TestDataManager();
    await waitForEndpoint('http://localhost:5000/health');
    console.log('🔄 Starting full workflow integration tests');
  });

  afterAll(async () => {
    await testManager.cleanupAllTestData();
    console.log('✅ Full workflow integration test cleanup completed');
  });

  describe('Complete Cocktail Management Workflow', () => {
    it('should handle complete cocktail creation to deletion workflow', async () => {
      // Step 1: Create ingredients first
      const vodkaIngredient = await testManager.createTestIngredient({
        name: 'Workflow_Test_Vodka',
        description: 'Premium vodka for testing',
        category: 'spirits',
        subCategory: 'vodka',
        preferredBrand: 'Test Brand',
        abv: 40,
        inMyBar: true
      });

      const mixerIngredient = await testManager.createTestIngredient({
        name: 'Workflow_Test_Mixer',
        description: 'Cranberry juice mixer',
        category: 'juices',
        preferredBrand: 'Fresh Brand',
        abv: 0,
        inMyBar: true
      });

      // Step 2: Create cocktail using the ingredients
      const cocktail = await testManager.createTestCocktail({
        name: 'Workflow_Test_Cosmopolitan',
        description: 'A classic cosmopolitan for workflow testing',
        ingredients: [
          { name: 'Workflow_Test_Vodka', amount: 2, unit: 'oz' },
          { name: 'Workflow_Test_Mixer', amount: 1, unit: 'oz' },
          { name: 'Workflow_Test_Lime', amount: 0.5, unit: 'oz' }
        ],
        instructions: [
          'Add vodka to shaker with ice',
          'Add cranberry juice and lime',
          'Shake vigorously for 15 seconds',
          'Strain into chilled martini glass',
          'Garnish with lime wheel'
        ],
        tags: ['classic', 'workflow_test', 'cosmopolitan'],
        featured: false
      });

      expect(cocktail.id).toBeDefined();
      expect(cocktail.name).toContain('Workflow_Test_Cosmopolitan');

      // Step 3: Retrieve and verify complete cocktail data
      const retrieved = await testManager.getCocktail(cocktail.id);
      expect(retrieved.cocktail.name).toContain('Workflow_Test_Cosmopolitan');
      expect(retrieved.ingredients).toHaveLength(3);
      expect(retrieved.instructions).toHaveLength(5);
      expect(retrieved.tags).toHaveLength(3);

      // Verify ingredient relationships
      const vodkaRel = retrieved.ingredients.find((ing: any) => 
        ing.ingredient?.name?.includes('Workflow_Test_Vodka')
      );
      expect(vodkaRel).toBeDefined();
      expect(vodkaRel.amount).toBe(2);
      expect(vodkaRel.unit).toBe('oz');

      // Step 4: Update cocktail (modify instructions and add ingredient)
      await testManager.updateCocktail(cocktail.id, {
        description: 'Updated classic cosmopolitan with enhanced recipe',
        instructions: [
          'Chill martini glass in freezer',
          'Add vodka to shaker with ice',
          'Add cranberry juice, lime, and triple sec',
          'Shake vigorously for 20 seconds',
          'Double strain into chilled glass',
          'Express orange peel oils over drink',
          'Garnish with lime wheel and orange twist'
        ],
        ingredients: [
          { name: 'Workflow_Test_Vodka', amount: 2, unit: 'oz' },
          { name: 'Workflow_Test_Mixer', amount: 1, unit: 'oz' },
          { name: 'Workflow_Test_Lime', amount: 0.5, unit: 'oz' },
          { name: 'Workflow_Test_Triple_Sec', amount: 0.25, unit: 'oz' }
        ]
      });

      // Verify updates
      const updated = await testManager.getCocktail(cocktail.id);
      expect(updated.cocktail.description).toContain('Updated classic cosmopolitan');
      expect(updated.instructions).toHaveLength(7);
      expect(updated.ingredients).toHaveLength(4);

      // Step 5: Test popularity and featured functionality
      await testManager.apiRequest(`/cocktails/${cocktail.id}/popularity`, {
        method: 'PATCH'
      });

      await testManager.apiRequest(`/cocktails/${cocktail.id}/featured`, {
        method: 'PATCH',
        body: JSON.stringify({ featured: true })
      });

      const featuredCocktail = await testManager.getCocktail(cocktail.id);
      expect(featuredCocktail.cocktail.popularityCount).toBe(1);
      expect(featuredCocktail.cocktail.isFeatured).toBe(true);

      // Step 6: Test search functionality
      const searchResults = await testManager.apiRequest('/cocktails/search?q=Workflow_Test_Cosmopolitan');
      expect(searchResults.length).toBeGreaterThan(0);
      const foundCocktail = searchResults.find((c: any) => c.id === cocktail.id);
      expect(foundCocktail).toBeDefined();

      // Step 7: Test ingredient-based filtering
      const vodkaResults = await testManager.apiRequest('/cocktails/search?ingredient=Workflow_Test_Vodka');
      expect(vodkaResults.length).toBeGreaterThan(0);
      const vodkaCocktail = vodkaResults.find((c: any) => c.id === cocktail.id);
      expect(vodkaCocktail).toBeDefined();

      // Step 8: Test "My Bar" ingredient functionality
      await testManager.updateIngredient(vodkaIngredient.id, { inMyBar: false });
      const updatedIngredient = await testManager.getIngredient(vodkaIngredient.id);
      expect(updatedIngredient.inMyBar).toBe(false);

      // Step 9: Test complete cleanup (done automatically in afterAll)
    }, 30000); // 30 second timeout for complex workflow
  });

  describe('Ingredient Management Workflow', () => {
    it('should handle complete ingredient lifecycle', async () => {
      // Create ingredient
      const ingredient = await testManager.createTestIngredient({
        name: 'Lifecycle_Test_Bourbon',
        description: 'Premium bourbon for lifecycle testing',
        category: 'spirits',
        subCategory: 'whiskey',
        preferredBrand: 'Test Distillery',
        abv: 45,
        inMyBar: false
      });

      // Verify creation
      expect(ingredient.id).toBeDefined();
      expect(ingredient.name).toContain('Lifecycle_Test_Bourbon');

      // Add to My Bar
      await testManager.updateIngredient(ingredient.id, { inMyBar: true });
      const inBarIngredient = await testManager.getIngredient(ingredient.id);
      expect(inBarIngredient.inMyBar).toBe(true);

      // Create cocktail using this ingredient
      const cocktail = await testManager.createTestCocktail({
        name: 'Bourbon_Lifecycle_Cocktail',
        ingredients: [
          { name: 'Lifecycle_Test_Bourbon', amount: 2, unit: 'oz' },
          { name: 'Lifecycle_Test_Simple_Syrup', amount: 0.5, unit: 'oz' }
        ],
        instructions: ['Mix bourbon with simple syrup', 'Serve on rocks'],
        tags: ['bourbon', 'lifecycle']
      });

      // Verify ingredient appears in cocktail
      const cocktailWithIngredients = await testManager.getCocktail(cocktail.id);
      const bourbonRelation = cocktailWithIngredients.ingredients.find((ing: any) => 
        ing.ingredient?.name?.includes('Lifecycle_Test_Bourbon')
      );
      expect(bourbonRelation).toBeDefined();

      // Search ingredients by category
      const spiritsResults = await testManager.apiRequest('/ingredients?category=spirits');
      const bourbonInResults = spiritsResults.find((ing: any) => ing.id === ingredient.id);
      expect(bourbonInResults).toBeDefined();

      // Search by "My Bar" status
      const myBarResults = await testManager.apiRequest('/ingredients?inMyBar=true');
      const bourbonInMyBar = myBarResults.find((ing: any) => ing.id === ingredient.id);
      expect(bourbonInMyBar).toBeDefined();

      // Update ingredient details
      await testManager.updateIngredient(ingredient.id, {
        description: 'Updated premium bourbon with enhanced flavor profile',
        preferredBrand: 'Updated Test Distillery',
        abv: 46
      });

      const updatedIngredient = await testManager.getIngredient(ingredient.id);
      expect(updatedIngredient.description).toContain('Updated premium bourbon');
      expect(updatedIngredient.abv).toBe(46);
    });
  });

  describe('Search and Filter Integration', () => {
    it('should handle complex search and filtering scenarios', async () => {
      // Create test data with various attributes
      const ingredients = await Promise.all([
        testManager.createTestIngredient({
          name: 'Search_Test_Gin',
          category: 'spirits',
          subCategory: 'gin',
          inMyBar: true
        }),
        testManager.createTestIngredient({
          name: 'Search_Test_Tonic',
          category: 'mixers',
          inMyBar: true
        }),
        testManager.createTestIngredient({
          name: 'Search_Test_Lime',
          category: 'garnishes',
          inMyBar: false
        })
      ]);

      const cocktails = await Promise.all([
        testManager.createTestCocktail({
          name: 'Search_Test_Gin_Tonic',
          ingredients: [
            { name: 'Search_Test_Gin', amount: 2, unit: 'oz' },
            { name: 'Search_Test_Tonic', amount: 4, unit: 'oz' }
          ],
          instructions: ['Build in glass with ice'],
          tags: ['classic', 'easy'],
          featured: true
        }),
        testManager.createTestCocktail({
          name: 'Search_Test_Gimlet',
          ingredients: [
            { name: 'Search_Test_Gin', amount: 2, unit: 'oz' },
            { name: 'Search_Test_Lime', amount: 0.5, unit: 'oz' }
          ],
          instructions: ['Shake and strain'],
          tags: ['classic', 'sour'],
          featured: false
        })
      ]);

      // Test text search
      const ginResults = await testManager.apiRequest('/cocktails/search?q=gin');
      expect(ginResults.length).toBeGreaterThan(0);

      // Test ingredient-based search
      const ginIngredientResults = await testManager.apiRequest('/cocktails/search?ingredient=Search_Test_Gin');
      expect(ginIngredientResults.length).toBe(2); // Both cocktails use gin

      // Test featured filter
      const featuredResults = await testManager.apiRequest('/cocktails?featured=true');
      const featuredTestCocktails = featuredResults.filter((c: any) => 
        c.name.includes('Search_Test_')
      );
      expect(featuredTestCocktails.length).toBe(1);

      // Test tag-based search
      const classicResults = await testManager.apiRequest('/cocktails/search?tag=classic');
      const classicTestCocktails = classicResults.filter((c: any) => 
        c.name.includes('Search_Test_')
      );
      expect(classicTestCocktails.length).toBe(2);

      // Test ingredient category filter
      const spiritsResults = await testManager.apiRequest('/ingredients?category=spirits');
      const testSpirits = spiritsResults.filter((ing: any) => 
        ing.name.includes('Search_Test_')
      );
      expect(testSpirits.length).toBe(1);

      // Test "My Bar" filter
      const myBarResults = await testManager.apiRequest('/ingredients?inMyBar=true');
      const myBarTestIngredients = myBarResults.filter((ing: any) => 
        ing.name.includes('Search_Test_')
      );
      expect(myBarTestIngredients.length).toBe(2); // Gin and Tonic
    });
  });

  describe('Data Persistence Across Operations', () => {
    it('should maintain data consistency across multiple operations', async () => {
      // Create complex cocktail with multiple relationships
      const cocktail = await testManager.createTestCocktail({
        name: 'Persistence_Test_Complex_Cocktail',
        description: 'Complex cocktail for persistence testing',
        ingredients: [
          { name: 'Persistence_Vodka', amount: 1.5, unit: 'oz' },
          { name: 'Persistence_Gin', amount: 0.5, unit: 'oz' },
          { name: 'Persistence_Vermouth', amount: 0.25, unit: 'oz' }
        ],
        instructions: [
          'Chill glass',
          'Add spirits to mixing glass',
          'Add vermouth',
          'Stir with ice',
          'Strain into glass'
        ],
        tags: ['complex', 'persistence_test', 'stirred'],
        featured: false
      });

      // Perform multiple operations
      await testManager.apiRequest(`/cocktails/${cocktail.id}/popularity`, { method: 'PATCH' });
      await testManager.apiRequest(`/cocktails/${cocktail.id}/popularity`, { method: 'PATCH' });
      await testManager.apiRequest(`/cocktails/${cocktail.id}/featured`, {
        method: 'PATCH',
        body: JSON.stringify({ featured: true })
      });

      // Update cocktail multiple times
      await testManager.updateCocktail(cocktail.id, {
        description: 'First update: Enhanced complex cocktail'
      });

      await testManager.updateCocktail(cocktail.id, {
        description: 'Second update: Final enhanced complex cocktail',
        tags: ['complex', 'persistence_test', 'stirred', 'premium']
      });

      // Verify final state maintains all changes
      const finalCocktail = await testManager.getCocktail(cocktail.id);
      expect(finalCocktail.cocktail.description).toBe('Second update: Final enhanced complex cocktail');
      expect(finalCocktail.cocktail.popularityCount).toBe(2);
      expect(finalCocktail.cocktail.isFeatured).toBe(true);
      expect(finalCocktail.tags).toHaveLength(4);
      expect(finalCocktail.instructions).toHaveLength(5);
      expect(finalCocktail.ingredients).toHaveLength(3);

      // Verify individual instruction order is maintained
      expect(finalCocktail.instructions[0].instruction).toBe('Chill glass');
      expect(finalCocktail.instructions[4].instruction).toBe('Strain into glass');
    });
  });
});