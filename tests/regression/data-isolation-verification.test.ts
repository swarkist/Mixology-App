import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDataManager } from './data-isolation.js';

describe('Data Isolation Verification Tests', () => {
  let testManager: TestDataManager;

  beforeAll(async () => {
    testManager = new TestDataManager();
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('🛡️  Starting data isolation verification tests');
  });

  it('should create test data with unique prefixes', async () => {
    const cocktail = await testManager.createTestCocktail({
      name: 'Isolation_Test_Cocktail',
      description: 'Testing data isolation',
      ingredients: [{ name: 'Isolation_Test_Ingredient', amount: 1, unit: 'oz' }],
      instructions: ['Test isolation'],
      tags: ['isolation_test']
    });

    // Verify test data has unique prefix
    expect(cocktail.name).toMatch(/^REGRESSION_TEST_\d+_Isolation_Test_Cocktail$/);
    expect(cocktail.description).toBe('[REGRESSION TEST] Testing data isolation');
  });

  it('should track all created test data', async () => {
    const summary = testManager.getTestDataSummary();
    expect(summary.cocktails).toBeGreaterThan(0);
    expect(summary.testPrefix).toMatch(/^REGRESSION_TEST_\d+_$/);
  });

  it('should isolate test cocktails from production data', async () => {
    // Get all test cocktails (should only find our test data)
    const testCocktails = await testManager.getTestCocktails();
    
    // All test cocktails should have the regression test prefix
    testCocktails.forEach((cocktail: any) => {
      expect(cocktail.name).toContain('REGRESSION_TEST_');
      expect(cocktail.description).toContain('[REGRESSION TEST]');
    });
  });

  it('should not interfere with existing production data', async () => {
    // Get all cocktails
    const allCocktails = await testManager.apiRequest('/cocktails');
    
    // Count production vs test cocktails
    const productionCocktails = allCocktails.filter((c: any) => 
      !c.name.includes('REGRESSION_TEST_')
    );
    
    const testCocktails = allCocktails.filter((c: any) => 
      c.name.includes('REGRESSION_TEST_')
    );

    console.log(`📊 Data isolation check: ${productionCocktails.length} production cocktails, ${testCocktails.length} test cocktails`);
    
    // There should be production data (user's real cocktails)
    expect(productionCocktails.length).toBeGreaterThan(0);
    
    // Test data should be clearly identifiable
    expect(testCocktails.length).toBeGreaterThan(0);
  });

  it('should handle emergency cleanup properly', async () => {
    // Create additional test data
    await testManager.createTestCocktail({
      name: 'Emergency_Cleanup_Test',
      description: 'Testing emergency cleanup',
      ingredients: [],
      instructions: ['Emergency test'],
      tags: []
    });

    // Verify test data exists
    const beforeCleanup = await testManager.getTestCocktails();
    expect(beforeCleanup.length).toBeGreaterThan(0);

    // Run emergency cleanup
    await testManager.emergencyCleanup();

    // Verify all test data is removed
    const afterCleanup = await testManager.getTestCocktails();
    expect(afterCleanup.length).toBe(0);
  });

  it('should verify production data remains untouched after cleanup', async () => {
    // Get production data count before any test operations
    const allCocktails = await testManager.apiRequest('/cocktails');
    const productionCocktails = allCocktails.filter((c: any) => 
      !c.name.includes('REGRESSION_TEST_')
    );

    // Create and cleanup test data
    const testCocktail = await testManager.createTestCocktail({
      name: 'Cleanup_Verification_Test',
      description: 'Testing cleanup verification',
      ingredients: [],
      instructions: ['Cleanup test'],
      tags: []
    });

    await testManager.cleanupAllTestData();

    // Verify production data count is unchanged
    const allCocktailsAfter = await testManager.apiRequest('/cocktails');
    const productionCocktailsAfter = allCocktailsAfter.filter((c: any) => 
      !c.name.includes('REGRESSION_TEST_')
    );

    expect(productionCocktailsAfter.length).toBe(productionCocktails.length);
    
    // Verify no test data remains
    const testCocktailsAfter = allCocktailsAfter.filter((c: any) => 
      c.name.includes('REGRESSION_TEST_')
    );
    expect(testCocktailsAfter.length).toBe(0);
  });

  // This test runs last and ensures complete cleanup
  afterAll(async () => {
    try {
      await testManager.cleanupAllTestData();
      console.log('✅ Data isolation verification cleanup completed successfully');
      
      // Final verification - no test data should remain
      const finalCheck = await testManager.getTestCocktails();
      if (finalCheck.length > 0) {
        console.warn(`⚠️  ${finalCheck.length} test cocktails still remain after final cleanup`);
        await testManager.emergencyCleanup();
      }
    } catch (error) {
      console.error('❌ Data isolation verification cleanup failed:', error);
      throw new Error('CRITICAL: Test data isolation may be compromised');
    }
  });
});