import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_BASE = 'http://localhost:5000/api';

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

describe('Firebase Data Persistence Tests', () => {
  let testCocktailId: number;
  let testIngredientId: number;

  const persistenceTestCocktail = {
    name: 'Persistence Test Cocktail',
    description: 'Testing Firebase data persistence',
    ingredients: [
      { name: 'Persistence Vodka', amount: 2, unit: 'oz' }
    ],
    instructions: [
      'Step 1: Test persistence',
      'Step 2: Verify data survives',
      'Step 3: Confirm Firebase storage'
    ],
    tags: ['persistence', 'firebase'],
    featured: true
  };

  const persistenceTestIngredient = {
    name: 'Persistence Test Ingredient',
    description: 'Testing ingredient persistence in Firebase',
    category: 'spirits',
    subCategory: 'rum',
    preferredBrand: 'Persistence Brand',
    abv: 42,
    inMyBar: true
  };

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  it('should create and persist cocktail data in Firebase', async () => {
    // Create cocktail
    const cocktail = await apiRequest('/cocktails', {
      method: 'POST',
      body: JSON.stringify(persistenceTestCocktail),
    });

    testCocktailId = cocktail.id;
    expect(cocktail.name).toBe(persistenceTestCocktail.name);

    // Wait for Firebase write
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify data is immediately retrievable
    const retrieved = await apiRequest(`/cocktails/${testCocktailId}`);
    expect(retrieved.cocktail.name).toBe(persistenceTestCocktail.name);
    expect(retrieved.instructions).toHaveLength(3);
    expect(retrieved.instructions[0].instruction).toBe('Step 1: Test persistence');
    expect(retrieved.tags).toHaveLength(2);
  });

  it('should create and persist ingredient data in Firebase', async () => {
    // Create ingredient
    const ingredient = await apiRequest('/ingredients', {
      method: 'POST',
      body: JSON.stringify(persistenceTestIngredient),
    });

    testIngredientId = ingredient.id;
    expect(ingredient.name).toBe(persistenceTestIngredient.name);

    // Wait for Firebase write
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify data is immediately retrievable
    const retrieved = await apiRequest(`/ingredients/${testIngredientId}`);
    expect(retrieved.name).toBe(persistenceTestIngredient.name);
    expect(retrieved.category).toBe(persistenceTestIngredient.category);
    expect(retrieved.abv).toBe(persistenceTestIngredient.abv);
  });

  it('should persist cocktail updates in Firebase', async () => {
    const updates = {
      name: 'Updated Persistence Test Cocktail',
      description: 'Updated description to test Firebase persistence',
      instructions: [
        'Updated step 1',
        'Updated step 2',
        'New step 3',
        'Additional step 4'
      ],
      featured: false
    };

    // Update cocktail
    await apiRequest(`/cocktails/${testCocktailId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    // Wait for Firebase write
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify updates persisted
    const retrieved = await apiRequest(`/cocktails/${testCocktailId}`);
    expect(retrieved.cocktail.name).toBe(updates.name);
    expect(retrieved.cocktail.description).toBe(updates.description);
    expect(retrieved.cocktail.isFeatured).toBe(false);
    expect(retrieved.instructions).toHaveLength(4);
    expect(retrieved.instructions[3].instruction).toBe('Additional step 4');
  });

  it('should persist ingredient updates in Firebase', async () => {
    const updates = {
      name: 'Updated Persistence Test Ingredient',
      abv: 50,
      inMyBar: false,
      preferredBrand: 'Updated Brand'
    };

    // Update ingredient
    await apiRequest(`/ingredients/${testIngredientId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    // Wait for Firebase write
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify updates persisted
    const retrieved = await apiRequest(`/ingredients/${testIngredientId}`);
    expect(retrieved.name).toBe(updates.name);
    expect(retrieved.abv).toBe(updates.abv);
    expect(retrieved.inMyBar).toBe(false);
    expect(retrieved.preferredBrand).toBe(updates.preferredBrand);
  });

  it('should persist junction table relationships', async () => {
    // Verify cocktail-ingredient relationships persist
    const cocktailDetails = await apiRequest(`/cocktails/${testCocktailId}`);
    expect(cocktailDetails.ingredients).toHaveLength(1);
    expect(cocktailDetails.ingredients[0].ingredient.name).toContain('Persistence Vodka');

    // Verify cocktail-tag relationships persist
    expect(cocktailDetails.tags).toHaveLength(2);
    const tagNames = cocktailDetails.tags.map((t: any) => t.name);
    expect(tagNames).toContain('persistence');
    expect(tagNames).toContain('firebase');
  });

  it('should handle popularity tracking persistence', async () => {
    // Get initial popularity
    const initial = await apiRequest(`/cocktails/${testCocktailId}`);
    const initialPopularity = initial.cocktail.popularityCount;

    // Increment popularity multiple times
    await apiRequest(`/cocktails/${testCocktailId}/popularity`, { method: 'PATCH' });
    await apiRequest(`/cocktails/${testCocktailId}/popularity`, { method: 'PATCH' });
    await apiRequest(`/cocktails/${testCocktailId}/popularity`, { method: 'PATCH' });

    // Wait for Firebase writes
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify popularity increments persisted
    const updated = await apiRequest(`/cocktails/${testCocktailId}`);
    expect(updated.cocktail.popularityCount).toBe(initialPopularity + 3);
  });

  it('should handle featured status persistence', async () => {
    // Toggle featured status
    await apiRequest(`/cocktails/${testCocktailId}/featured`, {
      method: 'PATCH',
      body: JSON.stringify({ featured: true }),
    });

    // Wait for Firebase write
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify featured status persisted
    const retrieved = await apiRequest(`/cocktails/${testCocktailId}`);
    expect(retrieved.cocktail.isFeatured).toBe(true);
  });

  it('should handle "My Bar" status persistence', async () => {
    // Toggle My Bar status
    await apiRequest(`/ingredients/${testIngredientId}/my-bar`, {
      method: 'PATCH',
      body: JSON.stringify({ inMyBar: true }),
    });

    // Wait for Firebase write
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify My Bar status persisted
    const retrieved = await apiRequest(`/ingredients/${testIngredientId}`);
    expect(retrieved.inMyBar).toBe(true);
  });

  // Test data consistency across multiple operations
  it('should maintain data consistency during rapid updates', async () => {
    const rapidUpdates = [
      { name: 'Rapid Update 1' },
      { name: 'Rapid Update 2' },
      { name: 'Rapid Update 3' },
      { name: 'Final Rapid Update' }
    ];

    // Perform rapid updates
    for (const update of rapidUpdates) {
      await apiRequest(`/cocktails/${testCocktailId}`, {
        method: 'PATCH',
        body: JSON.stringify(update),
      });
    }

    // Wait for all Firebase writes to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify final state is consistent
    const final = await apiRequest(`/cocktails/${testCocktailId}`);
    expect(final.cocktail.name).toBe('Final Rapid Update');
  });

  // Cleanup
  afterAll(async () => {
    try {
      if (testCocktailId) {
        await apiRequest(`/cocktails/${testCocktailId}`, { method: 'DELETE' });
      }
      if (testIngredientId) {
        await apiRequest(`/ingredients/${testIngredientId}`, { method: 'DELETE' });
      }
    } catch (error) {
      console.warn('Persistence test cleanup failed:', error);
    }
  });
});