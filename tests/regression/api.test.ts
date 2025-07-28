import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

// API Base URL
const API_BASE = 'http://localhost:5000/api';

// Test Data
const testCocktail = {
  name: 'Regression Test Cocktail',
  description: 'Test cocktail for automated regression testing',
  ingredients: [
    { name: 'Test Vodka', amount: 2, unit: 'oz' },
    { name: 'Test Mixer', amount: 4, unit: 'oz' }
  ],
  instructions: [
    'Add vodka to shaker',
    'Add mixer',
    'Shake well',
    'Strain into glass'
  ],
  tags: ['test', 'regression'],
  featured: false,
  popularityCount: 0
};

const testIngredient = {
  name: 'Regression Test Vodka',
  description: 'Test vodka for regression testing',
  category: 'spirits',
  subCategory: 'vodka',
  preferredBrand: 'Test Brand',
  abv: 40
};

let createdCocktailId: number;
let createdIngredientId: number;

// Helper function for API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
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

describe('Cocktail Management API Regression Tests', () => {
  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('Cocktail CRUD Operations', () => {
    it('should create a new cocktail', async () => {
      const result = await apiRequest('/cocktails', {
        method: 'POST',
        body: JSON.stringify(testCocktail),
      });

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(testCocktail.name);
      expect(result.description).toBe(testCocktail.description);
      createdCocktailId = result.id;
    });

    it('should retrieve cocktail details', async () => {
      const result = await apiRequest(`/cocktails/${createdCocktailId}`);
      
      expect(result.cocktail).toHaveProperty('id', createdCocktailId);
      expect(result.cocktail.name).toBe(testCocktail.name);
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
      const result = await apiRequest('/ingredients', {
        method: 'POST',
        body: JSON.stringify(testIngredient),
      });

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(testIngredient.name);
      expect(result.category).toBe(testIngredient.category);
      expect(result.abv).toBe(testIngredient.abv);
      createdIngredientId = result.id;
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
      const result = await apiRequest(`/ingredients/${createdIngredientId}/my-bar`, {
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
    });

    it('should get featured cocktails', async () => {
      const result = await apiRequest('/cocktails?featured=true');
      
      expect(Array.isArray(result)).toBe(true);
      const foundCocktail = result.find((c: any) => c.id === createdCocktailId);
      expect(foundCocktail).toBeDefined();
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

  // Cleanup
  afterAll(async () => {
    try {
      // Delete created cocktail
      if (createdCocktailId) {
        await apiRequest(`/cocktails/${createdCocktailId}`, {
          method: 'DELETE',
        });
      }
      
      // Delete created ingredient
      if (createdIngredientId) {
        await apiRequest(`/ingredients/${createdIngredientId}`, {
          method: 'DELETE',
        });
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });
});