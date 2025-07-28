# Regression Testing Suite

This directory contains comprehensive automated tests for the cocktail management application to ensure all functionality works correctly after changes.

## Test Files

### 🔧 `api.test.ts` - Core API Functionality
Tests all CRUD operations and basic functionality:
- **Cocktail Management**: Create, read, update, delete cocktails
- **Ingredient Management**: Full ingredient lifecycle management
- **Search & Filtering**: Cocktail and ingredient search capabilities
- **Tags System**: Tag creation, retrieval, and search
- **Featured System**: Featured cocktail toggle functionality
- **Popularity Tracking**: Cocktail popularity increment system

### 🔥 `firebase-persistence.test.ts` - Data Persistence
Tests Firebase storage and data synchronization:
- **Data Persistence**: Verify data survives server restarts
- **Junction Tables**: Test ingredient-cocktail and tag relationships
- **Real-time Updates**: Confirm immediate data synchronization
- **Batch Operations**: Test multiple rapid updates
- **State Consistency**: Verify data integrity across operations

### ⚠️ `edge-cases.test.ts` - Error Handling & Edge Cases
Tests application robustness and error handling:
- **Invalid Input**: Empty fields, missing data, wrong types
- **Non-existent Resources**: 404 handling for missing items
- **Large Data**: Many ingredients, instructions, long descriptions
- **Special Characters**: Unicode support, special symbols
- **Concurrent Operations**: Simultaneous updates and race conditions
- **Malformed Requests**: Invalid JSON, empty bodies

### ⚡ `performance.test.ts` - Performance & Load Testing
Tests application performance under various conditions:
- **Response Times**: API endpoint speed benchmarks
- **Bulk Operations**: Multiple simultaneous operations
- **Search Performance**: Query response time testing
- **Concurrent Load**: Multiple simultaneous requests
- **Memory Usage**: Large data handling performance

## Usage

### Quick Start
To run all regression tests:
```bash
npx tsx tests/regression/run-regression.ts
```

### Individual Test Files
Run specific test suites:
```bash
# Core API functionality
npx vitest tests/regression/api.test.ts

# Firebase persistence
npx vitest tests/regression/firebase-persistence.test.ts

# Edge cases and error handling
npx vitest tests/regression/edge-cases.test.ts

# Performance benchmarks
npx vitest tests/regression/performance.test.ts
```

### Prompt-Based Testing
Simply prompt the AI with:
```
Perform Regression Testing
```

## Test Coverage

### Core Functionality ✅
- ✅ Cocktail CRUD operations
- ✅ Ingredient management
- ✅ Instruction editing (multiple steps)
- ✅ Image upload/deletion
- ✅ Tag system
- ✅ Featured cocktails
- ✅ Popularity tracking
- ✅ "My Bar" ingredient selection

### Data Persistence ✅
- ✅ Firebase storage integration
- ✅ Junction table relationships
- ✅ Real-time synchronization
- ✅ Data consistency across restarts

### Error Handling ✅
- ✅ Invalid input validation
- ✅ 404 error responses
- ✅ Malformed JSON handling
- ✅ Concurrent operation safety

### Performance ✅
- ✅ Response time benchmarks
- ✅ Bulk operation efficiency
- ✅ Search query performance
- ✅ Memory usage optimization

## Requirements

- Server must be running on `http://localhost:5000`
- Firebase credentials must be configured
- Node.js and npm dependencies installed

## Test Data

Tests create and clean up their own data automatically:
- Test cocktails are prefixed with "Test", "Regression", etc.
- All test data is automatically deleted after test completion
- Tests are designed to not interfere with existing user data

## Performance Benchmarks

### Expected Response Times
- **GET /cocktails**: < 2 seconds
- **GET /ingredients**: < 2 seconds  
- **POST /cocktails**: < 3 seconds
- **GET /cocktails/:id**: < 1.5 seconds
- **Search queries**: < 1 second

### Load Testing
- **Concurrent reads**: 10 simultaneous requests < 5 seconds
- **Bulk creation**: 5 items average < 4 seconds per item
- **Bulk updates**: Average < 2 seconds per item

## Troubleshooting

### Common Issues

**Server not responding**: Ensure the application is running with `npm run dev`

**Firebase permission errors**: Check that Firebase credentials are properly configured

**Test timeouts**: Firebase operations may be slower; increase timeouts if needed

**Rate limiting**: Firebase has rate limits; tests run sequentially to avoid this

### Test Failure Analysis

Failed tests provide detailed output including:
- Specific test that failed
- Expected vs actual results
- Full error messages and stack traces
- Performance timing data

## Adding New Tests

When adding new functionality to the application:

1. **Add API tests** in `api.test.ts` for new endpoints
2. **Add persistence tests** in `firebase-persistence.test.ts` for data storage
3. **Add edge case tests** in `edge-cases.test.ts` for error conditions
4. **Add performance tests** in `performance.test.ts` for new operations

### Test Template
```typescript
describe('New Feature Tests', () => {
  it('should handle new functionality', async () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

## Continuous Integration

These tests are designed to be run:
- ✅ Before deploying changes
- ✅ After major feature additions
- ✅ When investigating reported bugs
- ✅ As part of regular quality assurance

The comprehensive test suite ensures your cocktail management application maintains high quality and reliability across all updates and changes.