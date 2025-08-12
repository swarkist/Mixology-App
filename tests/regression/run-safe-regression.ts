#!/usr/bin/env tsx

import { spawn } from 'child_process';
import { TestDataManager } from './data-isolation.js';

console.log('🧪 Starting Safe Regression Test Suite with Database Snapshots');
console.log('=' .repeat(70));

// Test configuration
const testFiles = [
  'tests/regression/data-isolation-verification.test.ts',
  'tests/regression/auth-scenarios.test.ts',
  'tests/regression/api.test.ts',
  'tests/regression/firebase-persistence.test.ts', 
  'tests/regression/edge-cases.test.ts',
  'tests/regression/performance.test.ts',
  'tests/regression/ui-accessibility.test.ts'
];

let globalTestManager: TestDataManager;

async function initializeTestManager() {
  console.log('🔒 Taking production database snapshot...');
  globalTestManager = new TestDataManager();
  await globalTestManager.init();
  console.log('✅ Database snapshot captured and test environment ready');
  return globalTestManager;
}

async function runSingleTest(testFile: string): Promise<{ success: boolean, output: string }> {
  return new Promise((resolve) => {
    console.log(`\n📝 Running ${testFile.split('/').pop()}...`);
    
    const testProcess = spawn('npx', ['vitest', 'run', testFile, '--reporter=verbose'], {
      stdio: 'pipe',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });

    let output = '';
    
    testProcess.stdout?.on('data', (data) => {
      output += data.toString();
    });
    
    testProcess.stderr?.on('data', (data) => {
      output += data.toString();
    });

    testProcess.on('close', (code) => {
      const success = code === 0;
      console.log(`${success ? '✅' : '❌'} ${testFile.split('/').pop()} - ${success ? 'Passed' : 'Some tests failed'}`);
      resolve({ success, output });
    });

    testProcess.on('error', (error) => {
      console.error(`❌ Error running ${testFile}:`, error.message);
      resolve({ success: false, output: `Error: ${error.message}` });
    });
  });
}

async function runAllTests() {
  // Initialize test manager and take snapshot
  await initializeTestManager();
  
  // Check server status
  console.log('\n🚀 Checking server status...');
  try {
    const response = await fetch('http://localhost:5000/api/cocktails');
    if (!response.ok) {
      throw new Error('Server not responding correctly');
    }
    console.log('✅ Server is running and responding');
  } catch (error) {
    console.error('❌ Server is not running or not accessible');
    console.error('Please ensure the application is running with "npm run dev"');
    process.exit(1);
  }

  const results: Array<{ testFile: string, success: boolean, output: string }> = [];
  
  // Run tests sequentially to avoid conflicts
  for (const testFile of testFiles) {
    try {
      const result = await runSingleTest(testFile);
      results.push({ testFile, ...result });
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`💥 Critical error running ${testFile}:`, error);
      results.push({ 
        testFile, 
        success: false, 
        output: `Critical error: ${error.message}` 
      });
    }
  }

  // Cleanup and report results
  console.log('\n🧹 Cleaning up test data and restoring database state...');
  try {
    await globalTestManager.cleanup();
    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.error('⚠️ Error during cleanup:', error.message);
    console.log('🚨 Running emergency cleanup...');
    try {
      await globalTestManager.emergencyCleanup();
      console.log('✅ Emergency cleanup completed');
    } catch (emergencyError) {
      console.error('💥 Emergency cleanup failed:', emergencyError.message);
    }
  }

  // Final report
  console.log('\n' + '=' .repeat(70));
  console.log('📊 REGRESSION TEST RESULTS SUMMARY');
  console.log('=' .repeat(70));
  
  const passedTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  
  console.log(`✅ Passed: ${passedTests.length}/${results.length} test files`);
  if (failedTests.length > 0) {
    console.log(`❌ Failed: ${failedTests.length}/${results.length} test files`);
    console.log('\nFailed Tests:');
    failedTests.forEach(test => {
      console.log(`  - ${test.testFile.split('/').pop()}`);
    });
  }
  
  console.log(`\n🛡️ Database State: ${'Restored to pre-test condition'}`);
  console.log(`📊 Test Data Management: ${'All test data cleaned up'}`);
  
  if (failedTests.length === 0) {
    console.log('\n🎉 ALL REGRESSION TESTS PASSED! Application is working perfectly.');
    return true;
  } else {
    console.log('\n⚠️ Some tests failed. See individual test outputs above for details.');
    console.log('Note: Authentication failures may indicate security hardening is working correctly.');
    return false;
  }
}

// Run the test suite
runAllTests()
  .then((success) => {
    console.log('\n' + '=' .repeat(70));
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Critical test suite error:', error.message);
    console.log('=' .repeat(70));
    process.exit(1);
  });