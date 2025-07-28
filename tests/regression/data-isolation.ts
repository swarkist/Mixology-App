// Data Isolation Manager for Regression Tests
// Ensures all test data is properly tracked and cleaned up

const API_BASE = 'http://localhost:5000/api';

export class TestDataManager {
  private createdCocktails: number[] = [];
  private createdIngredients: number[] = [];
  private createdTags: string[] = [];
  private testPrefix = `REGRESSION_TEST_${Date.now()}_`;

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

  // Create test cocktail and track for cleanup
  async createTestCocktail(cocktailData: any) {
    const testData = {
      ...cocktailData,
      name: this.getTestName(cocktailData.name),
      description: `[REGRESSION TEST] ${cocktailData.description}`,
      // Ensure test ingredients have unique names
      ingredients: cocktailData.ingredients?.map((ing: any) => ({
        ...ing,
        name: this.getTestName(ing.name)
      })) || [],
      // Ensure test tags have unique names
      tags: cocktailData.tags?.map((tag: string) => this.getTestName(tag)) || []
    };

    const result = await this.apiRequest('/cocktails', {
      method: 'POST',
      body: JSON.stringify(testData),
    });

    this.createdCocktails.push(result.id);
    
    // Track any new tags that were created
    if (testData.tags) {
      this.createdTags.push(...testData.tags);
    }

    return result;
  }

  // Create test ingredient and track for cleanup
  async createTestIngredient(ingredientData: any) {
    const testData = {
      ...ingredientData,
      name: this.getTestName(ingredientData.name),
      description: `[REGRESSION TEST] ${ingredientData.description}`
    };

    const result = await this.apiRequest('/ingredients', {
      method: 'POST',
      body: JSON.stringify(testData),
    });

    this.createdIngredients.push(result.id);
    return result;
  }

  // Update cocktail (already tracked)
  async updateCocktail(id: number, updates: any) {
    return this.apiRequest(`/cocktails/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Update ingredient (already tracked)
  async updateIngredient(id: number, updates: any) {
    return this.apiRequest(`/ingredients/${id}`, {
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

  // Comprehensive cleanup - removes ALL test data
  async cleanupAllTestData() {
    const cleanupErrors: string[] = [];

    console.log(`🧹 Cleaning up test data (${this.createdCocktails.length} cocktails, ${this.createdIngredients.length} ingredients)...`);

    // Delete cocktails (also removes their instructions and relationships)
    for (const cocktailId of this.createdCocktails) {
      try {
        await this.apiRequest(`/cocktails/${cocktailId}`, { method: 'DELETE' });
      } catch (error) {
        cleanupErrors.push(`Failed to delete cocktail ${cocktailId}: ${error}`);
      }
    }

    // Delete ingredients
    for (const ingredientId of this.createdIngredients) {
      try {
        await this.apiRequest(`/ingredients/${ingredientId}`, { method: 'DELETE' });
      } catch (error) {
        cleanupErrors.push(`Failed to delete ingredient ${ingredientId}: ${error}`);
      }
    }

    // Verify cleanup by checking for any remaining test data
    const remainingCocktails = await this.getTestCocktails();
    const remainingIngredients = await this.getTestIngredients();

    if (remainingCocktails.length > 0) {
      cleanupErrors.push(`${remainingCocktails.length} test cocktails still remain after cleanup`);
    }

    if (remainingIngredients.length > 0) {
      cleanupErrors.push(`${remainingIngredients.length} test ingredients still remain after cleanup`);
    }

    // Clear tracking arrays
    this.createdCocktails = [];
    this.createdIngredients = [];
    this.createdTags = [];

    if (cleanupErrors.length > 0) {
      console.warn('⚠️ Cleanup issues detected:', cleanupErrors);
      throw new Error(`Cleanup failed: ${cleanupErrors.join(', ')}`);
    }

    console.log('✅ Test data cleanup completed successfully');
  }

  // Emergency cleanup - finds and removes ANY test data by prefix
  async emergencyCleanup() {
    console.log('🚨 Running emergency cleanup...');
    
    // Find all test cocktails by name prefix
    const testCocktails = await this.getTestCocktails();
    for (const cocktail of testCocktails) {
      try {
        await this.apiRequest(`/cocktails/${cocktail.id}`, { method: 'DELETE' });
      } catch (error) {
        console.warn(`Emergency cleanup failed for cocktail ${cocktail.id}:`, error);
      }
    }

    // Find all test ingredients by name prefix
    const testIngredients = await this.getTestIngredients();
    for (const ingredient of testIngredients) {
      try {
        await this.apiRequest(`/ingredients/${ingredient.id}`, { method: 'DELETE' });
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