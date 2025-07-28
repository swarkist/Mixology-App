#!/usr/bin/env tsx

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

console.log('🧪 Starting Comprehensive Regression Test Suite');
console.log('=' .repeat(60));

// Test configuration
const testFiles = [
  'tests/regression/api.test.ts',
  'tests/regression/firebase-persistence.test.ts', 
  'tests/regression/edge-cases.test.ts',
  'tests/regression/performance.test.ts'
];

const testDescriptions = {
  'api.test.ts': 'Core API functionality (CRUD operations, search, filtering)',
  'firebase-persistence.test.ts': 'Firebase data persistence and synchronization',
  'edge-cases.test.ts': 'Error handling and edge case scenarios',
  'performance.test.ts': 'Performance benchmarks and load testing'
};

async function runRegressionTests() {
  console.log('🔍 Test Suite Overview:');
  testFiles.forEach(file => {
    const fileName = file.split('/').pop()!;
    console.log(`  • ${fileName}: ${testDescriptions[fileName]}`);
  });
  console.log();

  // Check if server is running
  console.log('🚀 Checking server status...');
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

  console.log();
  console.log('🧪 Running regression tests...');
  console.log('-'.repeat(60));

  // Run tests sequentially to avoid Firebase rate limits
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const results: Array<{file: string, success: boolean, output: string}> = [];

  for (const testFile of testFiles) {
    const fileName = testFile.split('/').pop()!;
    console.log(`\n📝 Running ${fileName}...`);
    
    try {
      const result = await runVitest(testFile);
      results.push({ file: fileName, success: result.success, output: result.output });
      
      if (result.success) {
        console.log(`✅ ${fileName} - All tests passed`);
        passedTests += result.testCount;
      } else {
        console.log(`❌ ${fileName} - Some tests failed`);
        failedTests += result.failedCount;
        passedTests += result.passedCount;
      }
      
      totalTests += result.testCount;
    } catch (error) {
      console.error(`💥 ${fileName} - Test execution failed:`, error);
      results.push({ file: fileName, success: false, output: error.toString() });
      failedTests++;
      totalTests++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 REGRESSION TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : ''}`);
  console.log(`Success Rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`);

  console.log('\n📋 Detailed Results:');
  results.forEach(result => {
    console.log(`  ${result.success ? '✅' : '❌'} ${result.file}`);
  });

  // Show failed test details
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('\n🔍 Failure Details:');
    failures.forEach(failure => {
      console.log(`\n--- ${failure.file} ---`);
      console.log(failure.output);
    });
  }

  console.log('\n' + '='.repeat(60));
  
  if (failedTests === 0) {
    console.log('🎉 ALL REGRESSION TESTS PASSED! Your application is working perfectly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the failures above.');
    process.exit(1);
  }
}

function runVitest(testFile: string): Promise<{success: boolean, output: string, testCount: number, passedCount: number, failedCount: number}> {
  return new Promise((resolve) => {
    const child = spawn('npx', ['vitest', 'run', testFile, '--reporter=verbose'], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    let output = '';
    let testCount = 0;
    let passedCount = 0;
    let failedCount = 0;

    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      // Parse test results
      const passMatches = text.match(/✓.*\(\d+\)/g);
      if (passMatches) passedCount += passMatches.length;
      
      const failMatches = text.match(/✗.*\(\d+\)/g);
      if (failMatches) failedCount += failMatches.length;
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      testCount = passedCount + failedCount;
      resolve({
        success: code === 0,
        output,
        testCount,
        passedCount,
        failedCount
      });
    });
  });
}

// Run the tests
runRegressionTests().catch(console.error);