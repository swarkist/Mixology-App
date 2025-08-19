// Data Isolation Manager for Regression Tests
// Ensures all test data is properly tracked and cleaned up

const API_BASE = 'http://localhost:5000/api';

interface DatabaseSnapshot {
  cocktails: any[];
  ingredients: any[];
  tags: any[];
  preferredBrands: any[];
  cocktailIngredients: any[];
  ingredientTags: any[];
  preferredBrandAssociations: any[];
}

export class TestDataManager {
  private createdCocktails: number[] = [];
  private createdIngredients: number[] = [];
  private createdTags: string[] = [];
  private createdPreferredBrands: number[] = [];
  private createdUsers: number[] = [];
  private createdSessions: number[] = [];
  private testPrefix = `REGRESSION_TEST_${Date.now()}_`;
  private databaseSnapshot: DatabaseSnapshot | null = null;

  // Initialize by taking complete database snapshot
  async init() {
    console.log('🛡️  Initializing TestDataManager with full database snapshot...');
    
    try {
      // Take complete snapshot of all data before any tests
      const [
        cocktails, 
        ingredients, 
        tags, 
        preferredBrands,
        cocktailIngredients
      ] = await Promise.all([
        this.apiRequest('/cocktails').catch(() => []),
        this.apiRequest('/ingredients').catch(() => []),
        this.apiRequest('/tags').catch(() => []),
        this.apiRequest('/preferred-brands').catch(() => []),
        this.apiRequest('/cocktail-ingredients').catch(() => [])
      ]);
      
      this.databaseSnapshot = {
        cocktails,
        ingredients,
        tags,
        preferredBrands,
        cocktailIngredients,
        ingredientTags: [], // These would need additional endpoints
        preferredBrandAssociations: []
      };
      
      console.log(`📊 Database snapshot captured:`);
      console.log(`  - ${cocktails.length} cocktails`);
      console.log(`  - ${ingredients.length} ingredients`);
      console.log(`  - ${tags.length} tags`);
      console.log(`  - ${preferredBrands.length} preferred brands`);
      console.log(`🔒 Test prefix: ${this.testPrefix}`);
      
    } catch (error) {
      console.error('⚠️  Error taking database snapshot:', error);
      // Initialize with empty snapshot to prevent failures
      this.databaseSnapshot = {
        cocktails: [],
        ingredients: [],
        tags: [],
        preferredBrands: [],
        cocktailIngredients: [],
        ingredientTags: [],
        preferredBrandAssociations: []
      };
    }
  }

  // Authentication tokens for test users
  private adminToken?: string;
  private basicToken?: string;
  
  // Test user credentials
  private readonly ADMIN_EMAIL = `test_admin_${Date.now()}@mixology.test`;
  private readonly BASIC_EMAIL = `test_basic_${Date.now()}@mixology.test`;
  private readonly TEST_PASSWORD = 'TestPassword123!';

  // Helper function for API requests with authentication
  async apiRequest(endpoint: string, options: RequestInit = {}, useAdminAuth = true) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Add authentication for write operations
    if (options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
      if (useAdminAuth && this.adminToken) {
        headers['Authorization'] = `Bearer ${this.adminToken}`;
      } else if (!useAdminAuth && this.basicToken) {
        headers['Authorization'] = `Bearer ${this.basicToken}`;
      } else {
        // Try to create admin user if we don't have token
        await this.ensureTestUsersExist();
        if (useAdminAuth && this.adminToken) {
          headers['Authorization'] = `Bearer ${this.adminToken}`;
        }
      }
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  // Ensure test users exist and are authenticated
  async ensureTestUsersExist() {
    if (!this.adminToken) {
      try {
        // Try to create admin user
        await this.createTestUser(this.ADMIN_EMAIL, this.TEST_PASSWORD, 'admin');
        this.adminToken = await this.loginTestUser(this.ADMIN_EMAIL, this.TEST_PASSWORD);
      } catch (error) {
        console.log(`⚠️ Admin user may already exist, trying login...`);
        try {
          this.adminToken = await this.loginTestUser(this.ADMIN_EMAIL, this.TEST_PASSWORD);
        } catch (loginError) {
          console.error('Failed to authenticate admin user:', loginError);
        }
      }
    }
    
    if (!this.basicToken) {
      try {
        // Try to create basic user
        await this.createTestUser(this.BASIC_EMAIL, this.TEST_PASSWORD, 'basic');
        this.basicToken = await this.loginTestUser(this.BASIC_EMAIL, this.TEST_PASSWORD);
      } catch (error) {
        console.log(`⚠️ Basic user may already exist, trying login...`);
        try {
          this.basicToken = await this.loginTestUser(this.BASIC_EMAIL, this.TEST_PASSWORD);
        } catch (loginError) {
          console.error('Failed to authenticate basic user:', loginError);
        }
      }
    }
  }

  // Create a test user
  async createTestUser(email: string, password: string, role: 'admin' | 'basic' = 'basic') {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok && response.status !== 409) { // 409 = user already exists
      throw new Error(`Failed to create user ${email}: ${response.status}`);
    }

    if (role === 'admin') {
      console.log(`Note: User ${email} created as basic, would need promotion to admin`);
    }

    return response.ok ? await response.json() : null;
  }

  // Login a test user (using cookie-based auth)
  async loginTestUser(email: string, password: string): Promise<string> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error(`Failed to login user ${email}: ${response.status}`);
    }

    const data = await response.json();
    // For cookie-based auth, we just return success status
    return data.success ? 'logged_in' : '';
  }

  // Delete test user (for cleanup)
  async deleteTestUser(email: string, password: string) {
    try {
      const token = await this.loginTestUser(email, password);
      const response = await fetch(`${API_BASE}/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
      return response.ok;
    } catch (error) {
      console.log(`⚠️ Could not delete test user ${email}:`, error.message);
      return false;
    }
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
    await this.ensureTestUsersExist();
    
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
              item = await this.apiRequest(`/cocktails/${id}`, {}, false); // Use GET without auth
              item = item.cocktail || item;
            } else if (endpoint.includes('/ingredients/')) {
              item = await this.apiRequest(`/ingredients/${id}`, {}, false); // Use GET without auth
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
    
    return this.apiRequest(endpoint, options, true); // Use admin auth
  }

  // Create test cocktail and track for cleanup
  async createTestCocktail(cocktailData: any) {
    await this.ensureTestUsersExist();
    
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

    const result = await this.apiRequest('/cocktails', {
      method: 'POST',
      body: JSON.stringify(testData),
    }, true); // Use admin auth

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
    await this.ensureTestUsersExist();
    
    const testName = this.getTestName(ingredientData.name);
    this.validateNotProductionData(testName, 'ingredient');
    
    const testData = {
      ...ingredientData,
      name: testName,
      description: ingredientData.description ? `[REGRESSION TEST] ${ingredientData.description}` : '[REGRESSION TEST] Test ingredient'
    };

    const result = await this.apiRequest('/ingredients', {
      method: 'POST',
      body: JSON.stringify(testData),
    }, true); // Use admin auth

    this.createdIngredients.push(result.id);
    console.log(`✅ Created test ingredient: ${result.name} (ID: ${result.id}) - inMyBar: ${result.inMyBar}`);
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

  // Enhanced cleanup with database restoration
  async cleanup() {
    console.log(`🧹 Starting comprehensive database cleanup and restoration...`);
    console.log(`📊 Test data to clean: ${this.createdCocktails.length} cocktails, ${this.createdIngredients.length} ingredients`);
    
    const errors: string[] = [];

    // Step 1: Delete all tracked test data
    await this.deleteTrackedTestData(errors);
    
    // Step 2: Scan for any remaining test data and clean it up
    await this.scanAndCleanRemainingTestData(errors);
    
    // Step 3: Verify database state matches snapshot
    await this.verifyDatabaseIntegrity(errors);
    
    if (errors.length > 0) {
      console.error('⚠️ Cleanup issues detected:', errors);
      throw new Error(`Database cleanup failed: ${errors.join(', ')}`);
    }

    console.log('✅ Database cleanup and verification completed successfully');
  }

  private async deleteTrackedTestData(errors: string[]) {
    // Clean up tracked cocktails
    for (const cocktailId of this.createdCocktails) {
      try {
        await this.protectedApiRequest(`/cocktails/${cocktailId}`, { method: 'DELETE' });
        console.log(`✅ Deleted tracked cocktail ID: ${cocktailId}`);
      } catch (error: any) {
        errors.push(`Failed to delete cocktail ${cocktailId}: ${error.message}`);
      }
    }

    // Clean up tracked ingredients  
    for (const ingredientId of this.createdIngredients) {
      try {
        await this.protectedApiRequest(`/ingredients/${ingredientId}`, { method: 'DELETE' });
        console.log(`✅ Deleted tracked ingredient ID: ${ingredientId}`);
      } catch (error: any) {
        errors.push(`Failed to delete ingredient ${ingredientId}: ${error.message}`);
      }
    }

    // Clean up tracked preferred brands
    for (const brandId of this.createdPreferredBrands) {
      try {
        await this.protectedApiRequest(`/preferred-brands/${brandId}`, { method: 'DELETE' });
        console.log(`✅ Deleted tracked preferred brand ID: ${brandId}`);
      } catch (error: any) {
        errors.push(`Failed to delete preferred brand ${brandId}: ${error.message}`);
      }
    }

    // Clean up tracked tags
    if (this.createdTags.length > 0) {
      try {
        const allTags = await this.apiRequest('/tags').catch(() => []);
        const tagMap = new Map(allTags.map((t: any) => [t.name, t.id]));
        for (const tagName of Array.from(new Set(this.createdTags))) {
          const tagId = tagMap.get(tagName);
          if (tagId) {
            await this.protectedApiRequest(`/tags/${tagId}`, { method: 'DELETE' });
            console.log(`✅ Deleted tracked tag ${tagName} (ID: ${tagId})`);
          }
        }
      } catch (error: any) {
        errors.push(`Failed to delete tracked tags: ${error.message}`);
      }
    }

    // Clean up tracked test users
    for (const userId of this.createdUsers) {
      try {
        await this.deleteTestUser(userId, 'test_password');
        console.log(`✅ Deleted tracked test user ID: ${userId}`);
      } catch (error: any) {
        errors.push(`Failed to delete test user ${userId}: ${error.message}`);
      }
    }
  }

  private async scanAndCleanRemainingTestData(errors: string[]) {
    try {
      // Scan for any remaining test data that wasn't tracked
      const [currentCocktails, currentIngredients, currentBrands, currentTags] = await Promise.all([
        this.apiRequest('/cocktails').catch(() => []),
        this.apiRequest('/ingredients').catch(() => []),
        this.apiRequest('/preferred-brands').catch(() => []),
        this.apiRequest('/tags').catch(() => [])
      ]);

      // Find and delete any remaining test items
      const remainingTestCocktails = currentCocktails.filter((c: any) => 
        c.name.includes('REGRESSION_TEST_') && !this.createdCocktails.includes(c.id)
      );
      
      const remainingTestIngredients = currentIngredients.filter((i: any) => 
        i.name.includes('REGRESSION_TEST_') && !this.createdIngredients.includes(i.id)
      );

      const remainingTestBrands = currentBrands.filter((b: any) =>
        b.name.includes('REGRESSION_TEST_') && !this.createdPreferredBrands.includes(b.id)
      );

      const remainingTestTags = currentTags.filter((t: any) =>
        t.name.includes('REGRESSION_TEST_') && !this.createdTags.includes(t.name)
      );

      // Clean up remaining test data
      for (const item of remainingTestCocktails) {
        try {
          await this.apiRequest(`/cocktails/${item.id}`, { method: 'DELETE' });
          console.log(`✅ Cleaned untracked test cocktail: ${item.name} (ID: ${item.id})`);
        } catch (error: any) {
          errors.push(`Failed to clean untracked cocktail ${item.id}: ${error.message}`);
        }
      }

      for (const item of remainingTestIngredients) {
        try {
          await this.apiRequest(`/ingredients/${item.id}`, { method: 'DELETE' });
          console.log(`✅ Cleaned untracked test ingredient: ${item.name} (ID: ${item.id})`);
        } catch (error: any) {
          errors.push(`Failed to clean untracked ingredient ${item.id}: ${error.message}`);
        }
      }

      for (const item of remainingTestBrands) {
        try {
          await this.apiRequest(`/preferred-brands/${item.id}`, { method: 'DELETE' });
          console.log(`✅ Cleaned untracked test brand: ${item.name} (ID: ${item.id})`);
        } catch (error: any) {
          errors.push(`Failed to clean untracked brand ${item.id}: ${error.message}`);
        }
      }

      for (const tag of remainingTestTags) {
        try {
          await this.apiRequest(`/tags/${tag.id}`, { method: 'DELETE' });
          console.log(`✅ Cleaned untracked test tag: ${tag.name} (ID: ${tag.id})`);
        } catch (error: any) {
          errors.push(`Failed to clean untracked tag ${tag.id}: ${error.message}`);
        }
      }

    } catch (error: any) {
      errors.push(`Failed to scan for remaining test data: ${error.message}`);
    }
  }

  private async verifyDatabaseIntegrity(errors: string[]) {
    if (!this.databaseSnapshot) {
      console.log('⚠️ No database snapshot available for verification');
      return;
    }

    try {
      const [currentCocktails, currentIngredients, currentBrands, currentTags] = await Promise.all([
        this.apiRequest('/cocktails').catch(() => []),
        this.apiRequest('/ingredients').catch(() => []),
        this.apiRequest('/preferred-brands').catch(() => []),
        this.apiRequest('/tags').catch(() => [])
      ]);

      // Filter out any remaining test data to get pure production data
      const productionCocktails = currentCocktails.filter((c: any) => 
        !c.name.includes('REGRESSION_TEST_')
      );
      const productionIngredients = currentIngredients.filter((i: any) => 
        !i.name.includes('REGRESSION_TEST_')
      );
      const productionBrands = currentBrands.filter((b: any) =>
        !b.name.includes('REGRESSION_TEST_')
      );
      const productionTags = currentTags.filter((t: any) =>
        !t.name.includes('REGRESSION_TEST_')
      );

      // Verify data integrity
      const cocktailIntegrityOk = this.databaseSnapshot.cocktails.length === productionCocktails.length;
      const ingredientIntegrityOk = this.databaseSnapshot.ingredients.length === productionIngredients.length;
      const brandIntegrityOk = this.databaseSnapshot.preferredBrands.length === productionBrands.length;
      const tagIntegrityOk = this.databaseSnapshot.tags.length === productionTags.length;

      console.log(`📊 Database integrity check:`);
      console.log(`  - Cocktails: ${cocktailIntegrityOk ? '✅' : '❌'} (snapshot: ${this.databaseSnapshot.cocktails.length}, current: ${productionCocktails.length})`);
      console.log(`  - Ingredients: ${ingredientIntegrityOk ? '✅' : '❌'} (snapshot: ${this.databaseSnapshot.ingredients.length}, current: ${productionIngredients.length})`);
      console.log(`  - Brands: ${brandIntegrityOk ? '✅' : '❌'} (snapshot: ${this.databaseSnapshot.preferredBrands.length}, current: ${productionBrands.length})`);
      console.log(`  - Tags: ${tagIntegrityOk ? '✅' : '❌'} (snapshot: ${this.databaseSnapshot.tags.length}, current: ${productionTags.length})`);

      if (!cocktailIntegrityOk || !ingredientIntegrityOk || !brandIntegrityOk || !tagIntegrityOk) {
        errors.push('Database state does not match snapshot - production data may have been modified');
      }

      // Check for any remaining test data
      const remainingTestItems = [
        ...currentCocktails.filter((c: any) => c.name.includes('REGRESSION_TEST_')),
        ...currentIngredients.filter((i: any) => i.name.includes('REGRESSION_TEST_')),
        ...currentBrands.filter((b: any) => b.name.includes('REGRESSION_TEST_')),
        ...currentTags.filter((t: any) => t.name.includes('REGRESSION_TEST_'))
      ];

      if (remainingTestItems.length > 0) {
        console.warn(`⚠️ Found ${remainingTestItems.length} remaining test items after cleanup`);
        errors.push(`${remainingTestItems.length} test items remain in database after cleanup`);
      }

    } catch (error: any) {
      errors.push(`Failed to verify database integrity: ${error.message}`);
    }

    // Reset tracking arrays
    this.createdCocktails = [];
    this.createdIngredients = [];
    this.createdTags = [];
    this.createdPreferredBrands = [];
    this.createdUsers = [];
    this.createdSessions = [];
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
      users: this.createdUsers.length,
      testPrefix: this.testPrefix
    };
  }
}