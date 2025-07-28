import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_BASE = 'http://localhost:5000/api';

// Helper function for API requests with timing
async function timedApiRequest(endpoint: string, options: RequestInit = {}) {
  const start = Date.now();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  const end = Date.now();
  const duration = end - start;
  
  return { 
    response, 
    data: response.ok ? await response.json() : null,
    duration 
  };
}

describe('Performance and Load Tests', () => {
  let testCocktailIds: number[] = [];
  let testIngredientIds: number[] = [];

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('Response Time Tests', () => {
    it('should handle GET /cocktails within acceptable time', async () => {
      const { duration, response } = await timedApiRequest('/cocktails');
      
      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(2000); // 2 seconds max
    });

    it('should handle GET /ingredients within acceptable time', async () => {
      const { duration, response } = await timedApiRequest('/ingredients');
      
      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(2000); // 2 seconds max
    });

    it('should handle cocktail creation within acceptable time', async () => {
      const { duration, response, data } = await timedApiRequest('/cocktails', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Performance Test Cocktail',
          description: 'Testing creation performance',
          ingredients: [{ name: 'Test Ingredient', amount: 1, unit: 'oz' }],
          instructions: ['Test instruction'],
          tags: ['performance']
        }),
      });

      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(3000); // 3 seconds max for creation
      testCocktailIds.push(data.id);
    });

    it('should handle cocktail detail retrieval within acceptable time', async () => {
      if (testCocktailIds.length === 0) return;

      const { duration, response } = await timedApiRequest(`/cocktails/${testCocktailIds[0]}`);
      
      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(1500); // 1.5 seconds max for details
    });
  });

  describe('Bulk Operations Performance', () => {
    it('should handle creating multiple cocktails efficiently', async () => {
      const cocktailsToCreate = 5;
      const startTime = Date.now();

      const promises = Array.from({ length: cocktailsToCreate }, (_, i) =>
        timedApiRequest('/cocktails', {
          method: 'POST',
          body: JSON.stringify({
            name: `Bulk Test Cocktail ${i + 1}`,
            description: `Bulk creation test ${i + 1}`,
            ingredients: [{ name: 'Bulk Test Ingredient', amount: 1, unit: 'oz' }],
            instructions: [`Bulk instruction ${i + 1}`],
            tags: ['bulk', 'performance']
          }),
        })
      );

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All creations should succeed
      results.forEach(({ response, data }) => {
        expect(response.ok).toBe(true);
        testCocktailIds.push(data.id);
      });

      // Average time per creation should be reasonable
      const avgTime = totalTime / cocktailsToCreate;
      expect(avgTime).toBeLessThan(4000); // 4 seconds average max
    });

    it('should handle creating multiple ingredients efficiently', async () => {
      const ingredientsToCreate = 5;
      const startTime = Date.now();

      const promises = Array.from({ length: ingredientsToCreate }, (_, i) =>
        timedApiRequest('/ingredients', {
          method: 'POST',
          body: JSON.stringify({
            name: `Bulk Test Ingredient ${i + 1}`,
            description: `Bulk ingredient test ${i + 1}`,
            category: 'spirits',
            abv: 40 + i
          }),
        })
      );

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All creations should succeed
      results.forEach(({ response, data }) => {
        expect(response.ok).toBe(true);
        testIngredientIds.push(data.id);
      });

      // Average time per creation should be reasonable
      const avgTime = totalTime / ingredientsToCreate;
      expect(avgTime).toBeLessThan(3000); // 3 seconds average max
    });

    it('should handle bulk updates efficiently', async () => {
      if (testCocktailIds.length === 0) return;

      const startTime = Date.now();

      const promises = testCocktailIds.map((id, i) =>
        timedApiRequest(`/cocktails/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: `Updated Bulk Test Cocktail ${i + 1}`,
            description: `Updated bulk description ${i + 1}`
          }),
        })
      );

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All updates should succeed
      results.forEach(({ response }) => {
        expect(response.ok).toBe(true);
      });

      // Average time per update should be reasonable
      const avgTime = totalTime / testCocktailIds.length;
      expect(avgTime).toBeLessThan(2000); // 2 seconds average max
    });
  });

  describe('Search Performance', () => {
    it('should handle search queries efficiently', async () => {
      const searchQueries = [
        'test',
        'bulk',
        'cocktail',
        'performance',
        'nonexistent'
      ];

      for (const query of searchQueries) {
        const { duration, response } = await timedApiRequest(`/cocktails?search=${query}`);
        
        expect(response.ok).toBe(true);
        expect(duration).toBeLessThan(1000); // 1 second max for search
      }
    });

    it('should handle filtered queries efficiently', async () => {
      const filters = [
        'featured=true',
        'category=spirits',
        'inMyBar=true',
        'featured=true&search=test'
      ];

      for (const filter of filters) {
        const { duration, response } = await timedApiRequest(`/cocktails?${filter}`);
        
        expect(response.ok).toBe(true);
        expect(duration).toBeLessThan(1000); // 1 second max for filtered queries
      }
    });
  });

  describe('Concurrent Load Testing', () => {
    it('should handle concurrent read operations', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentRequests }, () =>
        timedApiRequest('/cocktails')
      );

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      results.forEach(({ response }) => {
        expect(response.ok).toBe(true);
      });

      // Total time should be reasonable for concurrent requests
      expect(totalTime).toBeLessThan(5000); // 5 seconds max for 10 concurrent requests
    });

    it('should handle concurrent write operations', async () => {
      const concurrentWrites = 3; // Reduced for Firebase rate limits
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentWrites }, (_, i) =>
        timedApiRequest('/cocktails', {
          method: 'POST',
          body: JSON.stringify({
            name: `Concurrent Test Cocktail ${i + 1}`,
            description: `Concurrent creation test ${i + 1}`,
            ingredients: [{ name: 'Concurrent Test Ingredient', amount: 1, unit: 'oz' }],
            instructions: [`Concurrent instruction ${i + 1}`],
            tags: ['concurrent']
          }),
        })
      );

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All writes should succeed
      results.forEach(({ response, data }) => {
        expect(response.ok).toBe(true);
        testCocktailIds.push(data.id);
      });

      // Total time should be reasonable
      expect(totalTime).toBeLessThan(10000); // 10 seconds max for concurrent writes
    });
  });

  describe('Memory Usage Tests', () => {
    it('should handle large instruction arrays without performance degradation', async () => {
      const largeInstructions = Array.from({ length: 50 }, (_, i) =>
        `Step ${i + 1}: This is a detailed instruction with lots of text to test memory usage and performance. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`
      );

      const { duration, response, data } = await timedApiRequest('/cocktails', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Large Instructions Test',
          description: 'Testing performance with many instructions',
          ingredients: [{ name: 'Test Ingredient', amount: 1, unit: 'oz' }],
          instructions: largeInstructions,
          tags: ['memory-test']
        }),
      });

      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(5000); // 5 seconds max for large data
      testCocktailIds.push(data.id);

      // Verify retrieval performance
      const { duration: retrievalDuration } = await timedApiRequest(`/cocktails/${data.id}`);
      expect(retrievalDuration).toBeLessThan(2000); // 2 seconds max for retrieval
    });

    it('should handle large ingredient lists without performance degradation', async () => {
      const largeIngredients = Array.from({ length: 30 }, (_, i) => ({
        name: `Performance Test Ingredient ${i + 1}`,
        amount: (i + 1) * 0.5,
        unit: i % 2 === 0 ? 'oz' : 'ml'
      }));

      const { duration, response, data } = await timedApiRequest('/cocktails', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Large Ingredients Test',
          description: 'Testing performance with many ingredients',
          ingredients: largeIngredients,
          instructions: ['Mix all ingredients thoroughly'],
          tags: ['memory-test']
        }),
      });

      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(5000); // 5 seconds max for large data
      testCocktailIds.push(data.id);
    });
  });

  // Cleanup
  afterAll(async () => {
    try {
      // Clean up test cocktails
      const deletePromises = testCocktailIds.map(id =>
        timedApiRequest(`/cocktails/${id}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);

      // Clean up test ingredients
      const deleteIngredientPromises = testIngredientIds.map(id =>
        timedApiRequest(`/ingredients/${id}`, { method: 'DELETE' })
      );
      await Promise.all(deleteIngredientPromises);
    } catch (error) {
      console.warn('Performance test cleanup failed:', error);
    }
  });
});