// Test Utility Functions
// Shared helpers for all test suites

export const testHelpers = {
  // Generate unique test identifiers
  generateTestId: () => `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  
  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Validate test data prefixes
  isTestData: (name: string) => name.includes('REGRESSION_TEST_') || name.includes('TEST_'),
  
  // Generate realistic test data
  generateTestCocktail: (overrides = {}) => ({
    name: 'Test_Generated_Cocktail',
    description: 'Generated cocktail for testing purposes',
    ingredients: [
      { name: 'Test_Generated_Spirit', amount: 2, unit: 'oz' },
      { name: 'Test_Generated_Mixer', amount: 4, unit: 'oz' }
    ],
    instructions: [
      'Combine ingredients in shaker',
      'Add ice and shake vigorously',
      'Strain into glass'
    ],
    tags: ['test_generated', 'automated'],
    featured: false,
    popularityCount: 0,
    ...overrides
  }),
  
  generateTestIngredient: (overrides = {}) => ({
    name: 'Test_Generated_Ingredient',
    description: 'Generated ingredient for testing',
    category: 'spirits',
    subCategory: 'vodka',
    preferredBrand: 'Test Brand',
    abv: 40,
    inMyBar: false,
    ...overrides
  }),
  
  // Validation helpers
  validateCocktailStructure: (cocktail: any) => {
    return cocktail &&
           typeof cocktail.id === 'number' &&
           typeof cocktail.name === 'string' &&
           typeof cocktail.description === 'string' &&
           Array.isArray(cocktail.ingredients || []) &&
           Array.isArray(cocktail.instructions || []) &&
           Array.isArray(cocktail.tags || []);
  },
  
  validateIngredientStructure: (ingredient: any) => {
    return ingredient &&
           typeof ingredient.id === 'number' &&
           typeof ingredient.name === 'string' &&
           typeof ingredient.category === 'string' &&
           (ingredient.abv === null || typeof ingredient.abv === 'number');
  },
  
  // Performance measurement
  measureExecutionTime: async <T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = Date.now();
    const result = await operation();
    const duration = Date.now() - start;
    return { result, duration };
  },
  
  // Test data cleanup verification
  verifyCleanup: async (dataManager: any) => {
    const remainingCocktails = await dataManager.getTestCocktails();
    const remainingIngredients = await dataManager.getTestIngredients();
    
    if (remainingCocktails.length > 0 || remainingIngredients.length > 0) {
      throw new Error(`Cleanup verification failed: ${remainingCocktails.length} cocktails, ${remainingIngredients.length} ingredients remain`);
    }
    
    return true;
  }
};

// Mock data factories for unit tests
export const mockData = {
  cocktail: (overrides = {}) => ({
    id: 1,
    name: 'Mock Cocktail',
    description: 'A mocked cocktail for testing',
    imageUrl: '/mock-image.jpg',
    isFeatured: false,
    popularityCount: 0,
    createdAt: new Date().toISOString(),
    ...overrides
  }),
  
  ingredient: (overrides = {}) => ({
    id: 1,
    name: 'Mock Ingredient',
    description: 'A mocked ingredient for testing',
    category: 'spirits',
    subCategory: 'vodka',
    preferredBrand: 'Mock Brand',
    abv: 40,
    inMyBar: false,
    imageUrl: null,
    createdAt: new Date().toISOString(),
    ...overrides
  }),
  
  cocktailWithRelations: (overrides = {}) => ({
    cocktail: mockData.cocktail(),
    ingredients: [
      {
        id: 1,
        amount: 2,
        unit: 'oz',
        ingredient: mockData.ingredient({ name: 'Mock Vodka' })
      }
    ],
    instructions: [
      { id: 1, instruction: 'Add vodka to shaker', order: 1 }
    ],
    tags: [
      { id: 1, name: 'mock_tag' }
    ],
    ...overrides
  })
};

// Test environment setup helpers
export const testSetup = {
  // Set up test environment
  setupTestEnvironment: () => {
    // Mock console methods to reduce test noise
    const originalConsole = console;
    return {
      mockConsole: {
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      },
      restoreConsole: () => {
        global.console = originalConsole;
      }
    };
  },
  
  // Mock API responses
  mockApiResponse: (data: any, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  }),
  
  // Mock fetch for component tests
  mockFetch: (responses: Record<string, any>) => {
    return vi.fn((url: string) => {
      const endpoint = url.replace('http://localhost:5000/api', '');
      const response = responses[endpoint];
      
      if (response) {
        return Promise.resolve(testSetup.mockApiResponse(response));
      }
      
      return Promise.reject(new Error(`No mock response for ${endpoint}`));
    });
  }
};

// Performance testing utilities
export const performanceHelpers = {
  // Benchmark API operations
  benchmarkOperation: async (name: string, operation: () => Promise<any>, expectedMaxTime: number) => {
    const { result, duration } = await testHelpers.measureExecutionTime(operation);
    
    console.log(`⏱️ ${name}: ${duration}ms (max: ${expectedMaxTime}ms)`);
    
    if (duration > expectedMaxTime) {
      console.warn(`⚠️ Performance warning: ${name} took ${duration}ms, expected < ${expectedMaxTime}ms`);
    }
    
    return { result, duration, passed: duration <= expectedMaxTime };
  },
  
  // Test concurrent operations
  testConcurrency: async (operations: (() => Promise<any>)[], maxConcurrent = 5) => {
    const results = [];
    const startTime = Date.now();
    
    for (let i = 0; i < operations.length; i += maxConcurrent) {
      const batch = operations.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
    }
    
    const totalTime = Date.now() - startTime;
    
    return { results, totalTime, averageTime: totalTime / operations.length };
  }
};

// Error testing utilities
export const errorHelpers = {
  // Test API error responses
  expectApiError: async (operation: () => Promise<any>, expectedStatus?: number) => {
    try {
      await operation();
      throw new Error('Expected operation to throw an error');
    } catch (error) {
      if (expectedStatus && error.status !== expectedStatus) {
        throw new Error(`Expected status ${expectedStatus}, got ${error.status}`);
      }
      return error;
    }
  },
  
  // Generate invalid test data
  invalidCocktailData: () => ({
    // Missing required name field
    description: 'Invalid cocktail data',
    ingredients: 'not an array', // Invalid type
    instructions: null, // Invalid type
    tags: 'not an array' // Invalid type
  }),
  
  invalidIngredientData: () => ({
    // Missing required name field
    category: 'invalid_category', // Invalid category
    abv: 150 // Invalid ABV > 100
  })
};

export default {
  testHelpers,
  mockData,
  testSetup,
  performanceHelpers,
  errorHelpers
};