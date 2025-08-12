#!/usr/bin/env tsx

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

console.log('🔐 Starting Authentication & Authorization Test Suite');
console.log('=' .repeat(60));

async function runAuthTests() {
  console.log('🧪 Running comprehensive authentication and authorization tests...');
  console.log('📋 Test Coverage:');
  console.log('  • User registration and login');
  console.log('  • Session management and security');
  console.log('  • Role-based access control (RBAC)');
  console.log('  • Admin vs Basic user permissions');
  console.log('  • Anonymous user restrictions');
  console.log('  • Data isolation by user');
  console.log('  • API security and validation');
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

  return new Promise<void>((resolve, reject) => {
    console.log('🔍 Executing authentication test suite...');
    
    const testProcess = spawn('npx', ['vitest', 'run', 'tests/regression/auth-scenarios.test.ts', '--reporter=verbose'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log();
        console.log('✅ Authentication tests completed successfully');
        console.log('🔒 All authentication and authorization scenarios validated');
        console.log('👥 User management and RBAC systems verified');
        resolve();
      } else {
        console.error();
        console.error(`❌ Authentication tests failed with code ${code}`);
        console.error('🔍 Review test output above for detailed error information');
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });

    testProcess.on('error', (error) => {
      console.error('❌ Error running authentication tests:', error.message);
      reject(error);
    });
  });
}

// Run the tests
runAuthTests()
  .then(() => {
    console.log();
    console.log('🎉 Authentication Test Suite Complete');
    console.log('=' .repeat(60));
    process.exit(0);
  })
  .catch((error) => {
    console.error();
    console.error('💥 Authentication Test Suite Failed');
    console.error('Error:', error.message);
    console.log('=' .repeat(60));
    process.exit(1);
  });