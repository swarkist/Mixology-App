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
  
  return { response, data: response.ok ? await response.json() : null };
}

describe('Edge Cases and Error Handling Tests', () => {
  let testCocktailId: number;
  let testIngredientId: number;

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create test data for edge case testing
    const { data: cocktail } = await apiRequest('/cocktails', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Edge Case Test Cocktail',
        description: 'For testing edge cases',
        ingredients: [{ name: 'Test Ingredient', amount: 1, unit: 'oz' }],
        instructions: ['Test instruction'],
        tags: ['test']
      }),
    });
    testCocktailId = cocktail.id;

    const { data: ingredient } = await apiRequest('/ingredients', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Edge Case Test Ingredient',
        category: 'spirits',
        abv: 40
      }),
    });
    testIngredientId = ingredient.id;
  });

  describe('Invalid Input Handling', () => {
    it('should handle empty cocktail name', async () => {
      const { response } = await apiRequest('/cocktails', {
        method: 'POST',
        body: JSON.stringify({
          name: '',
          description: 'Empty name test'
        }),
      });
      
      expect(response.status).toBe(400);
    });

    it('should handle missing required cocktail fields', async () => {
      const { response } = await apiRequest('/cocktails', {
        method: 'POST',
        body: JSON.stringify({
          description: 'Missing name field'
        }),
      });
      
      expect(response.status).toBe(400);
    });

    it('should handle invalid ingredient category', async () => {
      const { response } = await apiRequest('/ingredients', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Invalid Category',
          category: 'invalid_category'
        }),
      });
      
      expect(response.status).toBe(400);
    });

    it('should handle negative ABV values', async () => {
      const { response } = await apiRequest('/ingredients', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Negative ABV Test',
          category: 'spirits',
          abv: -10
        }),
      });
      
      expect(response.status).toBe(400);
    });

    it('should handle ABV values over 100', async () => {
      const { response } = await apiRequest('/ingredients', {
        method: 'POST',
        body: JSON.stringify({
          name: 'High ABV Test',
          category: 'spirits',
          abv: 150
        }),
      });
      
      expect(response.status).toBe(400);
    });
  });

  describe('Non-existent Resource Handling', () => {
    it('should return 404 for non-existent cocktail', async () => {
      const { response } = await apiRequest('/cocktails/999999999');
      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent ingredient', async () => {
      const { response } = await apiRequest('/ingredients/999999999');
      expect(response.status).toBe(404);
    });

    it('should handle updates to non-existent cocktail', async () => {
      const { response } = await apiRequest('/cocktails/999999999', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated Name' }),
      });
      
      expect(response.status).toBe(404);
    });

    it('should handle deleting non-existent cocktail', async () => {
      const { response } = await apiRequest('/cocktails/999999999', {
        method: 'DELETE',
      });
      
      expect(response.status).toBe(404);
    });
  });

  describe('Large Data Handling', () => {
    it('should handle cocktail with many ingredients', async () => {
      const manyIngredients = Array.from({ length: 20 }, (_, i) => ({
        name: `Ingredient ${i + 1}`,
        amount: i + 1,
        unit: 'oz'
      }));

      const { response, data } = await apiRequest('/cocktails', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Many Ingredients Cocktail',
          description: 'Testing many ingredients',
          ingredients: manyIngredients,
          instructions: ['Mix all ingredients'],
          tags: ['test']
        }),
      });

      expect(response.ok).toBe(true);
      expect(data.name).toBe('Many Ingredients Cocktail');

      // Cleanup
      await apiRequest(`/cocktails/${data.id}`, { method: 'DELETE' });
    });

    it('should handle cocktail with many instructions', async () => {
      const manyInstructions = Array.from({ length: 15 }, (_, i) => 
        `Step ${i + 1}: Detailed instruction for step ${i + 1}`
      );

      const { response, data } = await apiRequest('/cocktails', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Many Instructions Cocktail',
          description: 'Testing many instructions',
          ingredients: [{ name: 'Test Ingredient', amount: 1, unit: 'oz' }],
          instructions: manyInstructions,
          tags: ['test']
        }),
      });

      expect(response.ok).toBe(true);
      
      // Verify all instructions were stored
      const { data: details } = await apiRequest(`/cocktails/${data.id}`);
      expect(details.instructions).toHaveLength(15);

      // Cleanup
      await apiRequest(`/cocktails/${data.id}`, { method: 'DELETE' });
    });

    it('should handle very long cocktail description', async () => {
      const longDescription = 'A'.repeat(2000);

      const { response, data } = await apiRequest('/cocktails', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Long Description Cocktail',
          description: longDescription,
          ingredients: [{ name: 'Test Ingredient', amount: 1, unit: 'oz' }],
          instructions: ['Test instruction'],
          tags: ['test']
        }),
      });

      expect(response.ok).toBe(true);
      expect(data.description).toBe(longDescription);

      // Cleanup
      await apiRequest(`/cocktails/${data.id}`, { method: 'DELETE' });
    });
  });

  describe('Special Characters and Unicode', () => {
    it('should handle cocktail names with special characters', async () => {
      const specialName = "Piña Colada™ & Co. (50% Rüm)";

      const { response, data } = await apiRequest('/cocktails', {
        method: 'POST',
        body: JSON.stringify({
          name: specialName,
          description: 'Testing special characters',
          ingredients: [{ name: 'Test Ingredient', amount: 1, unit: 'oz' }],
          instructions: ['Test instruction'],
          tags: ['test']
        }),
      });

      expect(response.ok).toBe(true);
      expect(data.name).toBe(specialName);

      // Cleanup
      await apiRequest(`/cocktails/${data.id}`, { method: 'DELETE' });
    });

    it('should handle unicode in ingredient names', async () => {
      const unicodeName = "Tequila 🇲🇽 Añejo";

      const { response, data } = await apiRequest('/ingredients', {
        method: 'POST',
        body: JSON.stringify({
          name: unicodeName,
          category: 'spirits',
          subCategory: 'tequila',
          abv: 40
        }),
      });

      expect(response.ok).toBe(true);
      expect(data.name).toBe(unicodeName);

      // Cleanup
      await apiRequest(`/ingredients/${data.id}`, { method: 'DELETE' });
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent cocktail updates', async () => {
      const updates = [
        { name: 'Concurrent Update 1' },
        { name: 'Concurrent Update 2' },
        { name: 'Concurrent Update 3' }
      ];

      // Execute concurrent updates
      const promises = updates.map(update =>
        apiRequest(`/cocktails/${testCocktailId}`, {
          method: 'PATCH',
          body: JSON.stringify(update),
        })
      );

      const results = await Promise.all(promises);
      
      // All updates should succeed
      results.forEach(({ response }) => {
        expect(response.ok).toBe(true);
      });

      // Final state should be consistent
      const { data: final } = await apiRequest(`/cocktails/${testCocktailId}`);
      expect(final.cocktail.name).toMatch(/Concurrent Update [1-3]/);
    });

    it('should handle concurrent popularity increments', async () => {
      const { data: initial } = await apiRequest(`/cocktails/${testCocktailId}`);
      const initialCount = initial.cocktail.popularityCount;

      // Execute concurrent popularity increments
      const promises = Array.from({ length: 5 }, () =>
        apiRequest(`/cocktails/${testCocktailId}/popularity`, {
          method: 'PATCH',
        })
      );

      const results = await Promise.all(promises);
      
      // All increments should succeed
      results.forEach(({ response }) => {
        expect(response.ok).toBe(true);
      });

      // Wait for all updates to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Final count should be incremented by 5
      const { data: final } = await apiRequest(`/cocktails/${testCocktailId}`);
      expect(final.cocktail.popularityCount).toBe(initialCount + 5);
    });
  });

  describe('Image Handling Edge Cases', () => {
    it('should handle null image updates', async () => {
      const { response } = await apiRequest(`/cocktails/${testCocktailId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          image: null
        }),
      });

      expect(response.ok).toBe(true);
    });

    it('should handle empty string image updates', async () => {
      const { response } = await apiRequest(`/cocktails/${testCocktailId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          image: ''
        }),
      });

      expect(response.ok).toBe(true);
    });
  });

  describe('Search Edge Cases', () => {
    it('should handle empty search queries', async () => {
      const { response, data } = await apiRequest('/cocktails?search=');
      expect(response.ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should handle search with special characters', async () => {
      const { response, data } = await apiRequest('/cocktails?search=&%20test');
      expect(response.ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(500);
      const { response, data } = await apiRequest(`/cocktails?search=${longQuery}`);
      expect(response.ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Malformed JSON Handling', () => {
    it('should handle malformed JSON in POST requests', async () => {
      const { response } = await apiRequest('/cocktails', {
        method: 'POST',
        body: '{"name": "test", "description":}', // Invalid JSON
      });

      expect(response.status).toBe(400);
    });

    it('should handle empty request body', async () => {
      const { response } = await apiRequest('/cocktails', {
        method: 'POST',
        body: '',
      });

      expect(response.status).toBe(400);
    });
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
      console.warn('Edge cases test cleanup failed:', error);
    }
  });
});