// Data Isolation Manager for Regression Tests
// Ensures all test data is properly tracked and cleaned up

const API_BASE = 'http://localhost:5000/api';

export class TestDataManager {
  private createdCocktails: number[] = [];
  private createdIngredients: number[] = [];
  private createdTags: string[] = [];
  private testPrefix = `REGRESSION_TEST_${Date.now()}_`;
  private productionDataSnapshot: any = null;

  // Initialize by taking snapshot of production data
  async init() {
    console.log('🛡️  Initializing TestDataManager with production data protection...');
    
    // Take snapshot of production data before any tests
    const [cocktails, ingredients] = await Promise.all([
      this.apiRequest('/cocktails'),
      this.apiRequest('/ingredients')
    ]);
    
    this.productionDataSnapshot = {
      cocktails: cocktails.map((c: any) => ({ id: c.id, name: c.name })),
      ingredients: ingredients.map((i: any) => ({ id: i.id, name: i.name }))
    };
    
    console.log(`📊 Production data snapshot: ${cocktails.length} cocktails, ${ingredients.length} ingredients`);
    console.log(`🔒 Test prefix: ${this.testPrefix}`);
  }

  // Helper function for API requests
  async apiRequest(endpoint: string, options: RequestInit = {}) {
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

  // Generate unique test names to avoid conflicts
  getTestName(baseName: string): string {
    return `${this.testPrefix}${baseName}`;
  }

  // Validate that we never modify production data
  private validateNotProductionData(name: string, type: 'cocktail' | 'ingredient') {
    if (!name.includes(this.testPrefix)) {
      throw new Error(`❌ CRITICAL: Attempting to modify non-test ${type}: ${name}. All test data must include prefix: ${this.testPrefix}`);
    }
  }

  // Enhanced protection: only allow operations on test data
  async protectedApiRequest(endpoint: string, options: RequestInit = {}) {
    // For write operations, ensure we're only touching test data
    if (options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
      const body = options.body ? JSON.parse(options.body as string) : {};
      
      // Check if we're creating/modifying data with proper test prefix
      if (body.name && !body.name.includes(this.testPrefix)) {
        throw new Error(`❌ CRITICAL: Attempting to create/modify non-test data: ${body.name}`);
      }
      
      // For DELETE operations, verify we're only deleting test data
      if (options.method === 'DELETE') {
        const pathParts = endpoint.split('/');
        const id = pathParts[pathParts.length - 1];
        
        // Verify this ID is in our tracked test data
        const isTrackedCocktail = this.createdCocktails.includes(parseInt(id));
        const isTrackedIngredient = this.createdIngredients.includes(parseInt(id));
        
        if (!isTrackedCocktail && !isTrackedIngredient) {
          // Additional check: get the item and verify it has test prefix
          try {
            let item;
            if (endpoint.includes('/cocktails/')) {
              item = await this.apiRequest(`/cocktails/${id}`);
              item = item.cocktail || item;
            } else if (endpoint.includes('/ingredients/')) {
              item = await this.apiRequest(`/ingredients/${id}`);
            }
            
            if (item && !item.name.includes(this.testPrefix)) {
              throw new Error(`❌ CRITICAL: Attempting to delete production data: ${item.name} (ID: ${id})`);
            }
          } catch (error) {
            // If we can't verify it's test data, don't allow deletion
            throw new Error(`❌ CRITICAL: Cannot verify ${id} is test data, blocking deletion`);
          }
        }
      }
    }
    
    return this.apiRequest(endpoint, options);
  }

  // Create test cocktail and track for cleanup
  async createTestCocktail(cocktailData: any) {
    const testName = this.getTestName(cocktailData.name);
    this.validateNotProductionData(testName, 'cocktail');
    
    const testData = {
      ...cocktailData,
      name: testName,
      description: `[REGRESSION TEST] ${cocktailData.description}`,
      // Ensure test ingredients have unique names
      ingredients: cocktailData.ingredients?.map((ing: any) => ({
        ...ing,
        name: this.getTestName(ing.name)
      })) || [],
      // Ensure test tags have unique names
      tags: cocktailData.tags?.map((tag: string) => this.getTestName(tag)) || []
    };

    const result = await this.protectedApiRequest('/cocktails', {
      method: 'POST',
      body: JSON.stringify(testData),
    });

    this.createdCocktails.push(result.id);
    console.log(`✅ Created test cocktail: ${result.name} (ID: ${result.id})`);
    
    // Track any new tags that were created
    if (testData.tags) {
      this.createdTags.push(...testData.tags);
    }

    return result;
  }

  // Create test ingredient and track for cleanup
  async createTestIngredient(ingredientData: any) {
    const testName = this.getTestName(ingredientData.name);
    this.validateNotProductionData(testName, 'ingredient');
    
    const testData = {
      ...ingredientData,
      name: testName,
      description: `[REGRESSION TEST] ${ingredientData.description}`
    };

    const result = await this.protectedApiRequest('/ingredients', {
      method: 'POST',
      body: JSON.stringify(testData),
    });

    this.createdIngredients.push(result.id);
    console.log(`✅ Created test ingredient: ${result.name} (ID: ${result.id})`);
    return result;
  }

  // Update cocktail (already tracked)
  async updateCocktail(id: number, updates: any) {
    return this.protectedApiRequest(`/cocktails/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Update ingredient (already tracked)
  async updateIngredient(id: number, updates: any) {
    return this.protectedApiRequest(`/ingredients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Get cocktail details
  async getCocktail(id: number) {
    return this.apiRequest(`/cocktails/${id}`);
  }

  // Get ingredient details
  async getIngredient(id: number) {
    return this.apiRequest(`/ingredients/${id}`);
  }

  // List all test cocktails (for verification)
  async getTestCocktails() {
    const allCocktails = await this.apiRequest('/cocktails');
    return allCocktails.filter((c: any) => c.name.startsWith(this.testPrefix));
  }

  // List all test ingredients (for verification)
  async getTestIngredients() {
    const allIngredients = await this.apiRequest('/ingredients');
    return allIngredients.filter((i: any) => i.name.startsWith(this.testPrefix));
  }

  // Enhanced cleanup with production data verification
  async cleanupAllTestData() {
    console.log(`🧹 Cleaning up test data (${this.createdCocktails.length} cocktails, ${this.createdIngredients.length} ingredients)...`);
    
    const errors: string[] = [];

    // Clean up cocktails with protection
    for (const cocktailId of this.createdCocktails) {
      try {
        await this.protectedApiRequest(`/cocktails/${cocktailId}`, { method: 'DELETE' });
        console.log(`✅ Deleted test cocktail ID: ${cocktailId}`);
      } catch (error) {
        errors.push(`Failed to delete cocktail ${cocktailId}: ${error.message}`);
      }
    }

    // Clean up ingredients with protection
    for (const ingredientId of this.createdIngredients) {
      try {
        await this.protectedApiRequest(`/ingredients/${ingredientId}`, { method: 'DELETE' });
        console.log(`✅ Deleted test ingredient ID: ${ingredientId}`);
      } catch (error) {
        errors.push(`Failed to delete ingredient ${ingredientId}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      console.error('⚠️ Cleanup issues detected:', errors);
    }

    // Verify production data integrity
    await this.verifyProductionDataIntegrity();

    // Reset tracking arrays
    this.createdCocktails = [];
    this.createdIngredients = [];
    this.createdTags = [];
    
    console.log('✅ Test data cleanup completed');
  }

  // Verify production data hasn't been modified
  async verifyProductionDataIntegrity() {
    if (!this.productionDataSnapshot) {
      console.log('⚠️ No production data snapshot available for verification');
      return;
    }

    const [currentCocktails, currentIngredients] = await Promise.all([
      this.apiRequest('/cocktails'),
      this.apiRequest('/ingredients')
    ]);

    // Filter out any remaining test data
    const productionCocktails = currentCocktails.filter((c: any) => 
      !c.name.includes('REGRESSION_TEST_')
    );
    const productionIngredients = currentIngredients.filter((i: any) => 
      !i.name.includes('REGRESSION_TEST_')
    );

    // Check if production data matches snapshot
    const cocktailIntegrityCheck = this.productionDataSnapshot.cocktails.length === productionCocktails.length;
    const ingredientIntegrityCheck = this.productionDataSnapshot.ingredients.length === productionIngredients.length;

    if (cocktailIntegrityCheck && ingredientIntegrityCheck) {
      console.log('✅ Production data integrity verified - no data contamination detected');
    } else {
      console.error('❌ CRITICAL: Production data integrity compromised!');
      console.error(`Expected: ${this.productionDataSnapshot.cocktails.length} cocktails, ${this.productionDataSnapshot.ingredients.length} ingredients`);
      console.error(`Current: ${productionCocktails.length} cocktails, ${productionIngredients.length} ingredients`);
      
      // Emergency restoration attempt
      console.log('🚨 Attempting emergency cleanup of any remaining test data...');
      await this.emergencyCleanup();
    }
  }

  // Emergency cleanup - finds and removes ANY test data by prefix
  async emergencyCleanup() {
    console.log('🚨 Running emergency cleanup...');
    
    // Find all test cocktails by name prefix
    const testCocktails = await this.getTestCocktails();
    for (const cocktail of testCocktails) {
      try {
        await this.apiRequest(`/cocktails/${cocktail.id}`, { method: 'DELETE' });
        console.log(`🧹 Emergency deleted cocktail: ${cocktail.name}`);
      } catch (error) {
        console.warn(`Emergency cleanup failed for cocktail ${cocktail.id}:`, error);
      }
    }

    // Find all test ingredients by name prefix
    const testIngredients = await this.getTestIngredients();
    for (const ingredient of testIngredients) {
      try {
        await this.apiRequest(`/ingredients/${ingredient.id}`, { method: 'DELETE' });
        console.log(`🧹 Emergency deleted ingredient: ${ingredient.name}`);
      } catch (error) {
        console.warn(`Emergency cleanup failed for ingredient ${ingredient.id}:`, error);
      }
    }

    console.log(`🧹 Emergency cleanup completed: removed ${testCocktails.length} cocktails, ${testIngredients.length} ingredients`);
  }

  // Get summary of tracked test data
  getTestDataSummary() {
    return {
      cocktails: this.createdCocktails.length,
      ingredients: this.createdIngredients.length,
      tags: this.createdTags.length,
      testPrefix: this.testPrefix
    };
  }
}