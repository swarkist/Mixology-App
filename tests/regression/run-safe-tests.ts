#!/usr/bin/env tsx

import { TestDataManager } from './data-isolation.js';

/**
 * Safe Test Runner - Enhanced with Production Data Protection
 * 
 * This script runs regression tests with guaranteed data isolation and
 * automatic production data integrity verification.
 */

async function runSafeTests() {
  console.log('🛡️  ENHANCED SAFE TEST RUNNER - Production Data Protected');
  console.log('━'.repeat(70));

  let testManager: TestDataManager | null = null;
  
  try {
    // Initialize TestDataManager with production data snapshot
    console.log('🔒 Initializing data protection...');
    testManager = new TestDataManager();
    await testManager.init();
    
    console.log('🧪 Starting regression tests...');
    
    // Test 1: Basic data isolation verification
    console.log('\n📋 Test 1: Data Isolation Verification');
    console.log('─'.repeat(50));
    
    const testCocktail = await testManager.createTestCocktail({
      name: 'Safe_Test_Cocktail',
      description: 'Testing enhanced data isolation',
      ingredients: [{ name: 'Safe_Test_Ingredient', amount: 1, unit: 'oz' }],
      instructions: ['Safe test instruction'],
      tags: ['safe_test']
    });
    
    console.log(`✅ Created test cocktail: ${testCocktail.name}`);
    
    // Verify test data has proper prefixes
    if (!testCocktail.name.includes('REGRESSION_TEST_')) {
      throw new Error('❌ CRITICAL: Test data missing required prefix!');
    }
    
    // Test 2: Verify production data remains untouched
    console.log('\n📋 Test 2: Production Data Integrity Check');
    console.log('─'.repeat(50));
    
    await testManager.verifyProductionDataIntegrity();
    
    // Test 3: Test the protection mechanisms
    console.log('\n📋 Test 3: Protection Mechanism Test');
    console.log('─'.repeat(50));
    
    try {
      // This should fail - attempting to create data without test prefix
      await testManager.protectedApiRequest('/cocktails', {
        method: 'POST',
        body: JSON.stringify({
          name: 'BadTestCocktail', // Missing test prefix
          description: 'This should fail'
        })
      });
      
      throw new Error('❌ CRITICAL: Protection mechanism failed - should have blocked non-test data creation!');
    } catch (error) {
      if (error.message.includes('CRITICAL: Attempting to create/modify non-test data')) {
        console.log('✅ Protection mechanism working - correctly blocked non-test data creation');
      } else {
        throw error;
      }
    }
    
    // Test 4: Cleanup verification
    console.log('\n📋 Test 4: Enhanced Cleanup Verification');
    console.log('─'.repeat(50));
    
    const beforeCleanup = await testManager.getTestCocktails();
    console.log(`Test cocktails before cleanup: ${beforeCleanup.length}`);
    
    await testManager.cleanupAllTestData();
    
    const afterCleanup = await testManager.getTestCocktails();
    console.log(`Test cocktails after cleanup: ${afterCleanup.length}`);
    
    if (afterCleanup.length !== 0) {
      throw new Error(`❌ CRITICAL: Cleanup failed - ${afterCleanup.length} test cocktails remain!`);
    }
    
    // Final production data integrity check
    console.log('\n📋 Final: Production Data Integrity Verification');
    console.log('─'.repeat(50));
    await testManager.verifyProductionDataIntegrity();
    
    console.log('\n🎉 ALL TESTS PASSED');
    console.log('━'.repeat(70));
    console.log('✅ Enhanced data isolation working correctly');
    console.log('✅ Production data protection verified');
    console.log('✅ Cleanup mechanisms functional');
    console.log('✅ All protection mechanisms active');
    console.log('━'.repeat(70));
    
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED');
    console.error('━'.repeat(70));
    console.error('Error:', error.message);
    
    if (testManager) {
      console.log('\n🚨 Running emergency cleanup...');
      await testManager.emergencyCleanup();
      await testManager.verifyProductionDataIntegrity();
    }
    
    process.exit(1);
  }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSafeTests().catch(console.error);
}

export { runSafeTests };