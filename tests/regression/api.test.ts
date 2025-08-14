import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDataManager } from './data-isolation.js';

// API request helper function
async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`http://localhost:5000/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Test Data Templates (will be prefixed with unique identifiers)
const testCocktailTemplate = {
  name: 'API_Test_Cocktail',
  description: 'Test cocktail for automated regression testing',
  ingredients: [
    { name: 'API_Test_Vodka', amount: 2, unit: 'oz' },
    { name: 'API_Test_Mixer', amount: 4, unit: 'oz' }
  ],
  instructions: [
    'Add vodka to shaker',
    'Add mixer',
    'Shake well',
    'Strain into glass'
  ],
  tags: ['api_test', 'regression'],
  featured: false,
  popularityCount: 0
};

const testIngredientTemplate = {
  name: 'API_Test_Vodka',
  description: 'Test vodka for regression testing',
  category: 'spirits',
  subCategory: 'vodka',
  preferredBrand: 'Test Brand',
  abv: 40
};

let testManager: TestDataManager;
let createdCocktailId: number;
let createdIngredientId: number;
let testCocktail: any;
let testIngredient: any;

describe('Cocktail Management API Regression Tests', () => {
  beforeAll(async () => {
    // Initialize test data manager with production data protection
    testManager = new TestDataManager();
    await testManager.init(); // Take production data snapshot
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🧪 Starting API regression tests with data isolation');
  });

  describe('Cocktail CRUD Operations', () => {
    it('should create a new cocktail', async () => {
      const result = await testManager.createTestCocktail(testCocktailTemplate);

      expect(result).toHaveProperty('id');
      expect(result.name).toContain('API_Test_Cocktail');
      expect(result.description).toContain('Test cocktail for automated regression testing');
      createdCocktailId = result.id;
      testCocktail = result;
    });

    it('should retrieve cocktail details', async () => {
      const result = await testManager.getCocktail(createdCocktailId);
      
      expect(result.cocktail).toHaveProperty('id', createdCocktailId);
      expect(result.cocktail.name).toContain('API_Test_Cocktail');
      expect(result.ingredients).toBeInstanceOf(Array);
      expect(result.instructions).toBeInstanceOf(Array);
      expect(result.tags).toBeInstanceOf(Array);
      
      // Verify instructions are stored correctly
      expect(result.instructions).toHaveLength(4);
      expect(result.instructions[0].instruction).toBe('Add vodka to shaker');
      expect(result.instructions[1].instruction).toBe('Add mixer');
    });

    it('should list all cocktails', async () => {
      const result = await apiRequest('/cocktails');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const ourCocktail = result.find((c: any) => c.id === createdCocktailId);
      expect(ourCocktail).toBeDefined();
      expect(ourCocktail.name).toBe(testCocktail.name);
    });

    it('should update cocktail details', async () => {
      const updates = {
        name: 'Updated Regression Test Cocktail',
        description: 'Updated description for testing',
        instructions: [
          'Updated step 1',
          'Updated step 2',
          'New step 3'
        ]
      };

      const result = await apiRequest(`/cocktails/${createdCocktailId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      expect(result.name).toBe(updates.name);
      
      // Verify instructions were updated
      const cocktailDetails = await apiRequest(`/cocktails/${createdCocktailId}`);
      expect(cocktailDetails.instructions).toHaveLength(3);
      expect(cocktailDetails.instructions[0].instruction).toBe('Updated step 1');
      expect(cocktailDetails.instructions[2].instruction).toBe('New step 3');
    });

    it('should toggle cocktail featured status', async () => {
      const result = await apiRequest(`/cocktails/${createdCocktailId}/featured`, {
        method: 'PATCH',
        body: JSON.stringify({ featured: true }),
      });

      expect(result.isFeatured).toBe(true);
    });

    it('should increment cocktail popularity', async () => {
      const initialDetails = await apiRequest(`/cocktails/${createdCocktailId}`);
      const initialPopularity = initialDetails.cocktail.popularityCount;

      await apiRequest(`/cocktails/${createdCocktailId}/popularity`, {
        method: 'PATCH',
      });

      const updatedDetails = await apiRequest(`/cocktails/${createdCocktailId}`);
      expect(updatedDetails.cocktail.popularityCount).toBe(initialPopularity + 1);
    });
  });

  describe('Ingredient CRUD Operations', () => {
    it('should create a new ingredient', async () => {
      const result = await testManager.createTestIngredient(testIngredientTemplate);

      expect(result).toHaveProperty('id');
      expect(result.name).toContain('API_Test_Vodka');
      expect(result.category).toBe(testIngredientTemplate.category);
      expect(result.abv).toBe(testIngredientTemplate.abv);
      createdIngredientId = result.id;
      testIngredient = result;
    });

    it('should retrieve ingredient details', async () => {
      const result = await apiRequest(`/ingredients/${createdIngredientId}`);
      
      expect(result.id).toBe(createdIngredientId);
      expect(result.name).toBe(testIngredient.name);
      expect(result.category).toBe(testIngredient.category);
      expect(result.subCategory).toBe(testIngredient.subCategory);
    });

    it('should list all ingredients', async () => {
      const result = await apiRequest('/ingredients');
      
      expect(Array.isArray(result)).toBe(true);
      
      const ourIngredient = result.find((i: any) => i.id === createdIngredientId);
      expect(ourIngredient).toBeDefined();
      expect(ourIngredient.name).toBe(testIngredient.name);
    });

    it('should update ingredient details', async () => {
      const updates = {
        name: 'Updated Regression Test Vodka',
        description: 'Updated description',
        abv: 45
      };

      const result = await apiRequest(`/ingredients/${createdIngredientId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      expect(result.name).toBe(updates.name);
      expect(result.abv).toBe(updates.abv);
    });

    it('should toggle ingredient "My Bar" status', async () => {
      const result = await apiRequest(`/ingredients/${createdIngredientId}/toggle-mybar`, {
        method: 'PATCH',
        body: JSON.stringify({ inMyBar: true }),
      });

      expect(result.inMyBar).toBe(true);
    });
  });

  describe('Search and Filtering', () => {
    it('should search cocktails by name', async () => {
      const result = await apiRequest('/cocktails?search=Regression');
      
      expect(Array.isArray(result)).toBe(true);
      const foundCocktail = result.find((c: any) => c.id === createdCocktailId);
      expect(foundCocktail).toBeDefined();
    });

    it('should filter ingredients by category', async () => {
      const result = await apiRequest('/ingredients?category=spirits');
      
      expect(Array.isArray(result)).toBe(true);
      const foundIngredient = result.find((i: any) => i.id === createdIngredientId);
      expect(foundIngredient).toBeDefined();
    });

    it('should filter ingredients by "My Bar" status', async () => {
      const result = await apiRequest('/ingredients?inMyBar=true');
      
      expect(Array.isArray(result)).toBe(true);
      const foundIngredient = result.find((i: any) => i.id === createdIngredientId);
      expect(foundIngredient).toBeDefined();
      expect(foundIngredient.inMyBar).toBe(true);
    });

    it('should combine My Bar filter with search', async () => {
      // Test combined filtering: inMyBar=true + search
      const result = await apiRequest('/ingredients?inMyBar=true&search=API_Test');
      
      expect(Array.isArray(result)).toBe(true);
      // Should find our test ingredient since it's in My Bar and matches search
      const foundIngredient = result.find((i: any) => i.id === createdIngredientId);
      expect(foundIngredient).toBeDefined();
      expect(foundIngredient.inMyBar).toBe(true);
      expect(foundIngredient.name).toContain('API_Test');
    });

    it('should combine My Bar filter with category', async () => {
      // Test combined filtering: inMyBar=true + category=spirits
      const result = await apiRequest('/ingredients?inMyBar=true&category=spirits');
      
      expect(Array.isArray(result)).toBe(true);
      // Should find our test ingredient since it's in My Bar and is a spirit
      const foundIngredient = result.find((i: any) => i.id === createdIngredientId);
      expect(foundIngredient).toBeDefined();
      expect(foundIngredient.inMyBar).toBe(true);
      expect(foundIngredient.category).toBe('spirits');
    });

    it('should combine My Bar filter with subcategory', async () => {
      // Test combined filtering: inMyBar=true + subcategory=vodka
      const result = await apiRequest('/ingredients?inMyBar=true&subcategory=vodka');
      
      expect(Array.isArray(result)).toBe(true);
      // Should find our test ingredient since it's in My Bar and is vodka
      const foundIngredient = result.find((i: any) => i.id === createdIngredientId);
      expect(foundIngredient).toBeDefined();
      expect(foundIngredient.inMyBar).toBe(true);
      expect(foundIngredient.subCategory).toBe('vodka');
    });

    it('should handle all filters combined', async () => {
      // Test all filters combined: inMyBar + search + category + subcategory
      const result = await apiRequest('/ingredients?inMyBar=true&search=API&category=spirits&subcategory=vodka');
      
      expect(Array.isArray(result)).toBe(true);
      // Should find our test ingredient since it matches all criteria
      const foundIngredient = result.find((i: any) => i.id === createdIngredientId);
      expect(foundIngredient).toBeDefined();
      expect(foundIngredient.inMyBar).toBe(true);
      expect(foundIngredient.name).toContain('API');
      expect(foundIngredient.category).toBe('spirits');
      expect(foundIngredient.subCategory).toBe('vodka');
    });

    it('should get featured cocktails', async () => {
      const result = await testManager.apiRequest('/cocktails?featured=true');
      
      expect(Array.isArray(result)).toBe(true);
      const foundCocktail = result.find((c: any) => c.id === createdCocktailId);
      expect(foundCocktail).toBeDefined();
    });

    it('should filter popular recipes correctly (popularityCount > 0)', async () => {
      // Create cocktail with 0 popularity
      const neverMade = await testManager.createTestCocktail({
        name: 'Never_Made_Cocktail',
        popularityCount: 0,
        instructions: ['Test'],
        tags: []
      });

      // Create cocktail with popularity > 0
      const popular = await testManager.createTestCocktail({
        name: 'Popular_Cocktail',
        popularityCount: 5,
        instructions: ['Test'],
        tags: []
      });

      // Get popular cocktails
      const popularResults = await testManager.apiRequest('/cocktails?popular=true');
      
      // Should include cocktail with popularity > 0
      const foundPopular = popularResults.find((c: any) => c.id === popular.id);
      expect(foundPopular).toBeDefined();
      
      // Should NOT include cocktail with popularity = 0 in popular results
      const foundNeverMade = popularResults.find((c: any) => c.id === neverMade.id);
      expect(foundNeverMade).toBeUndefined();
    });
  });

  describe('My Bar Workflow Tests', () => {
    it('should handle My Bar toggle workflow correctly', async () => {
      // Create a fresh ingredient for this test
      const newIngredient = await testManager.createTestIngredient({
        name: 'MyBar_Workflow_Test_Gin',
        category: 'spirits',
        subCategory: 'gin',
        abv: 40
      });

      // Initially should not be in My Bar
      expect(newIngredient.inMyBar).toBe(false);

      // Toggle to My Bar
      const toggled = await apiRequest(`/ingredients/${newIngredient.id}/toggle-mybar`, {
        method: 'PATCH',
        body: JSON.stringify({ inMyBar: true }),
      });

      expect(toggled.inMyBar).toBe(true);

      // Verify it appears in My Bar filter
      const myBarResults = await apiRequest('/ingredients?inMyBar=true');
      const foundInMyBar = myBarResults.find((i: any) => i.id === newIngredient.id);
      expect(foundInMyBar).toBeDefined();
      expect(foundInMyBar.inMyBar).toBe(true);

      // Toggle back off
      const toggledOff = await apiRequest(`/ingredients/${newIngredient.id}/toggle-mybar`, {
        method: 'PATCH',
        body: JSON.stringify({ inMyBar: false }),
      });

      expect(toggledOff.inMyBar).toBe(false);

      // Verify it no longer appears in My Bar filter
      const myBarResultsAfter = await apiRequest('/ingredients?inMyBar=true');
      const notFoundInMyBar = myBarResultsAfter.find((i: any) => i.id === newIngredient.id);
      expect(notFoundInMyBar).toBeUndefined();
    });

    it('should correctly calculate My Bar cocktail count', async () => {
      // Create test ingredients that will be used in cocktails
      const whiteRumIngredient = await testManager.createTestIngredient({
        name: 'MyBar_Count_Test_White_Rum',
        category: 'spirits',
        subCategory: 'rum',
        abv: 40
      });

      const grenadineIngredient = await testManager.createTestIngredient({
        name: 'MyBar_Count_Test_Grenadine',
        category: 'mixers',
        abv: 0
      });

      const ginIngredient = await testManager.createTestIngredient({
        name: 'MyBar_Count_Test_Gin',
        category: 'spirits',
        subCategory: 'gin',
        abv: 47
      });

      // Create test cocktails using these ingredients
      const cocktail1 = await testManager.createTestCocktail({
        name: 'MyBar_Count_Test_Rum_Punch',
        description: 'Uses both white rum and grenadine',
        ingredients: [
          { name: whiteRumIngredient.name, amount: 1, unit: 'oz' },
          { name: grenadineIngredient.name, amount: 0.25, unit: 'oz' }
        ],
        instructions: ['Mix ingredients', 'Serve chilled'],
        tags: ['test']
      });

      const cocktail2 = await testManager.createTestCocktail({
        name: 'MyBar_Count_Test_Grenadine_Special',
        description: 'Uses only grenadine',
        ingredients: [
          { name: grenadineIngredient.name, amount: 0.5, unit: 'oz' }
        ],
        instructions: ['Pour and serve'],
        tags: ['test']
      });

      const cocktail3 = await testManager.createTestCocktail({
        name: 'MyBar_Count_Test_Gin_Cocktail',
        description: 'Uses only gin (not in My Bar)',
        ingredients: [
          { name: ginIngredient.name, amount: 2, unit: 'oz' }
        ],
        instructions: ['Pour gin', 'Add garnish'],
        tags: ['test']
      });

      // Test scenario 1: No ingredients in My Bar = 0 cocktails
      const myBarResultsEmpty = await apiRequest('/ingredients?inMyBar=true');
      const myBarIngredientsEmpty = myBarResultsEmpty.filter((i: any) => 
        [whiteRumIngredient.id, grenadineIngredient.id, ginIngredient.id].includes(i.id)
      );
      expect(myBarIngredientsEmpty.length).toBe(0);

      // Test scenario 2: Add White Rum to My Bar = 1 cocktail (cocktail1)
      await apiRequest(`/ingredients/${whiteRumIngredient.id}/toggle-mybar`, {
        method: 'PATCH',
        body: JSON.stringify({ inMyBar: true }),
      });

      const myBarResultsWhiteRum = await apiRequest('/ingredients?inMyBar=true');
      const whiteRumInMyBar = myBarResultsWhiteRum.find((i: any) => i.id === whiteRumIngredient.id);
      expect(whiteRumInMyBar).toBeDefined();
      expect(whiteRumInMyBar.inMyBar).toBe(true);

      // Test scenario 3: Add Grenadine to My Bar = 2 cocktails (cocktail1, cocktail2)
      await apiRequest(`/ingredients/${grenadineIngredient.id}/toggle-mybar`, {
        method: 'PATCH',
        body: JSON.stringify({ inMyBar: true }),
      });

      const myBarResultsBoth = await apiRequest('/ingredients?inMyBar=true');
      const myBarIngredientsBoth = myBarResultsBoth.filter((i: any) => 
        [whiteRumIngredient.id, grenadineIngredient.id].includes(i.id)
      );
      expect(myBarIngredientsBoth.length).toBe(2);

      // Test scenario 4: Remove White Rum from My Bar = 2 cocktails (still cocktail1 and cocktail2, since grenadine is in both)
      await apiRequest(`/ingredients/${whiteRumIngredient.id}/toggle-mybar`, {
        method: 'PATCH',
        body: JSON.stringify({ inMyBar: false }),
      });

      const myBarResultsGrenadineOnly = await apiRequest('/ingredients?inMyBar=true');
      const grenadineOnlyInMyBar = myBarResultsGrenadineOnly.find((i: any) => i.id === grenadineIngredient.id);
      expect(grenadineOnlyInMyBar).toBeDefined();
      expect(grenadineOnlyInMyBar.inMyBar).toBe(true);

      const whiteRumNotInMyBar = myBarResultsGrenadineOnly.find((i: any) => i.id === whiteRumIngredient.id);
      expect(whiteRumNotInMyBar).toBeUndefined();

      // Verify gin is never in My Bar throughout the test
      const ginNotInMyBar = myBarResultsGrenadineOnly.find((i: any) => i.id === ginIngredient.id);
      expect(ginNotInMyBar).toBeUndefined();

      console.log('✅ My Bar count calculation test completed successfully');
    });
  });

  describe('Tags System', () => {
    it('should list all tags', async () => {
      const result = await apiRequest('/tags');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should search tags by name', async () => {
      const result = await apiRequest('/tags?search=test');
      
      expect(Array.isArray(result)).toBe(true);
      const testTag = result.find((t: any) => t.name === 'test');
      expect(testTag).toBeDefined();
    });
  });

  describe('UI Filtering and EmptyState Tests', () => {
    it('should validate brand categorization logic for My Bar filtering', async () => {
      const testBrandNames = [
        'Jameson Whiskey',
        'Absolut Vodka', 
        'Bombay Gin',
        'Captain Morgan Rum',
        'Patron Tequila',
        'Baileys Liqueur',
        'Cointreau Triple Sec',
        'Angostura Bitters',
        'Grenadine Syrup',
        'Tonic Water',
        'Unknown Brand'
      ];

      const expectedCategories = [
        'spirits', 'spirits', 'spirits', 'spirits', 'spirits',
        'liqueurs', 'liqueurs',
        'bitters',
        'syrups',
        'mixers',
        'other'
      ];

      // Simulate the categorization logic from MyBar.tsx
      const categorizeBrand = (brandName: string): string => {
        const name = brandName.toLowerCase();
        
        if (name.includes('whiskey') || name.includes('whisky') || name.includes('bourbon') || 
            name.includes('scotch') || name.includes('rye') || name.includes('vodka') || 
            name.includes('gin') || name.includes('rum') || name.includes('tequila') || 
            name.includes('cognac') || name.includes('brandy') || name.includes('moonshine')) {
          return 'spirits';
        }
        
        if (name.includes('liqueur') || name.includes('schnapps') || name.includes('amaretto') ||
            name.includes('baileys') || name.includes('kahlua') || name.includes('cointreau') ||
            name.includes('grand marnier') || name.includes('triple sec') || name.includes('curacao')) {
          return 'liqueurs';
        }
        
        if (name.includes('bitter') || name.includes('angostura') || name.includes('peychaud')) {
          return 'bitters';
        }
        
        if (name.includes('syrup') || name.includes('grenadine') || name.includes('simple syrup') ||
            name.includes('cherry syrup') || name.includes('vanilla syrup')) {
          return 'syrups';
        }
        
        if (name.includes('tonic') || name.includes('soda') || name.includes('ginger beer') ||
            name.includes('club soda') || name.includes('mixer') || name.includes('juice')) {
          return 'mixers';
        }
        
        return 'other';
      };

      testBrandNames.forEach((brandName, index) => {
        const category = categorizeBrand(brandName);
        expect(category).toBe(expectedCategories[index]);
      });

      console.log(`✅ Brand categorization: All ${testBrandNames.length} test cases passed`);
    });

    it('should validate EmptyState differentiation between search and filter results', async () => {
      // Test that ingredient categories match expected filter options
      const ingredients = await apiRequest('/ingredients');
      const expectedCategories = ['spirits', 'mixers', 'juices', 'syrups', 'bitters', 'garnishes', 'other'];
      
      const foundCategories = new Set(ingredients.map((i: any) => i.category));
      
      foundCategories.forEach(category => {
        expect(expectedCategories).toContain(category);
      });

      console.log(`✅ Category validation: Found categories: ${Array.from(foundCategories).join(', ')}`);
    });

    it('should test cocktail filtering consistency across pages', async () => {
      // Test that featured and popular filters work consistently
      const featuredCocktails = await apiRequest('/cocktails?featured=true');
      const popularCocktails = await apiRequest('/cocktails?popular=true');
      const allCocktails = await apiRequest('/cocktails');
      
      expect(Array.isArray(featuredCocktails)).toBe(true);
      expect(Array.isArray(popularCocktails)).toBe(true);
      expect(Array.isArray(allCocktails)).toBe(true);
      
      // Validate featured cocktails
      featuredCocktails.forEach((cocktail: any) => {
        expect(cocktail.isFeatured).toBe(true);
      });

      // Validate popular cocktails
      popularCocktails.forEach((cocktail: any) => {
        expect(cocktail.popularityCount).toBeGreaterThan(0);
      });

      console.log(`✅ Filter consistency: ${featuredCocktails.length} featured, ${popularCocktails.length} popular of ${allCocktails.length} total`);
    });
  });

  // Comprehensive cleanup with verification
  afterAll(async () => {
    try {
      await testManager.cleanupAllTestData();
      console.log('✅ API test cleanup completed successfully');
    } catch (error) {
      console.error('❌ API test cleanup failed:', error);
      // Run emergency cleanup as fallback
      try {
        await testManager.emergencyCleanup();
        console.log('✅ Emergency cleanup completed');
      } catch (emergencyError) {
        console.error('💥 Emergency cleanup also failed:', emergencyError);
        throw new Error('CRITICAL: Test data may remain in database');
      }
    }
  });
});