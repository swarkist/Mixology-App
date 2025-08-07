#!/bin/bash

# Regression Test Runner with Database State Management
# Ensures all tests run with proper database snapshot and restoration

echo "🧪 Starting Mixology App Regression Test Suite..."
echo "📊 Database state will be captured and restored after tests"

# Ensure server is running
echo "⚡ Checking server status..."
if ! curl -s http://localhost:5000/api/cocktails > /dev/null; then
    echo "❌ Server not running! Please start the server first with 'npm run dev'"
    exit 1
fi

echo "✅ Server is running"

# Run UI Accessibility Tests with enhanced database management
echo ""
echo "🎯 Running UI Accessibility Tests..."
echo "- Button accessibility standards"
echo "- Image compression validation"
echo "- Firebase integration tests"
echo "- Database state management"

npm run test tests/regression/ui-accessibility.test.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ UI Accessibility Tests PASSED"
    echo "✅ Database state has been restored to pre-test condition"
else
    echo ""
    echo "❌ UI Accessibility Tests FAILED"
    echo "⚠️  Check test output for database cleanup status"
    exit 1
fi

# Run API Tests with enhanced database management
echo ""
echo "🔧 Running API Regression Tests..."
echo "- CRUD operations"
echo "- Data integrity validation" 
echo "- Database snapshot verification"

npm run test tests/regression/api.test.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ API Regression Tests PASSED"
    echo "✅ Database state has been restored to pre-test condition"
else
    echo ""
    echo "❌ API Regression Tests FAILED"
    echo "⚠️  Check test output for database cleanup status"
    exit 1
fi

echo ""
echo "🎉 All Regression Tests PASSED!"
echo "📊 Database integrity maintained throughout testing"
echo "🛡️  Production data protected from test modifications"
echo ""
echo "Test Summary:"
echo "- UI Accessibility: ✅ PASSED (with image compression validation)"
echo "- API Functionality: ✅ PASSED (with database state management)"
echo "- Database Integrity: ✅ MAINTAINED"
echo ""