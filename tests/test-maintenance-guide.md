# Test Maintenance Guide

This guide ensures regression tests and unit tests stay up-to-date with all project changes.

## 🔄 Test Update Protocol

### When to Update Tests

**ALWAYS update tests when:**
- Adding new API endpoints
- Modifying existing API functionality
- Adding new UI components or pages
- Changing database schema or data models
- Adding new features (search, filtering, AI integration, etc.)
- Modifying business logic
- Integrating external AI services (OpenRouter, OCR, transcript processing)
- Adding new photo upload or processing workflows
- Implementing new preferred brand functionality
- Updating validation rules
- Adding authentication/authorization
- Performance optimizations

### Test Update Checklist

#### 1. Regression Tests (`tests/regression/`)
- [ ] **API Tests**: Add tests for new endpoints or modified functionality
- [ ] **Firebase Persistence**: Test data storage for new fields/collections
- [ ] **Edge Cases**: Test error handling for new scenarios
- [ ] **Performance**: Benchmark new operations and data sizes
- [ ] **Data Isolation**: Ensure new test data uses proper prefixes

#### 2. Unit Tests (`tests/unit/`)
- [ ] **Storage Tests**: Test new storage methods and data validation
- [ ] **Component Tests**: Test new React components and hooks
- [ ] **Utility Tests**: Test helper functions and data transformations
- [ ] **Schema Tests**: Test Zod validation schemas for new data models

#### 3. Integration Tests
- [ ] **Full Workflow**: Test complete user journeys with new features
- [ ] **Cross-Component**: Test interaction between new and existing features
- [ ] **Database Integration**: Test data flow from frontend to Firebase

## 📝 Test Template Updates

### For New API Endpoints

```typescript
// Add to api.test.ts
describe('New Feature API', () => {
  it('should handle new endpoint functionality', async () => {
    const testData = await testManager.createTestData({
      // Use TestDataManager for isolation
    });
    
    const result = await testManager.apiRequest('/new-endpoint', {
      method: 'POST',
      body: JSON.stringify(testData)
    });
    
    expect(result).toHaveProperty('expectedField');
    // Add comprehensive assertions
  });
});
```

### For New Components

```typescript
// Add to component.test.ts
import { TestDataManager } from '../regression/data-isolation.js';

describe('NewComponent', () => {
  let testManager: TestDataManager;
  
  beforeEach(() => {
    testManager = new TestDataManager();
  });
  
  afterEach(async () => {
    await testManager.cleanupAllTestData();
  });
  
  it('should render with test data', () => {
    // Component testing with isolated data
  });
});
```

## 🏗️ Test Architecture Maintenance

### File Structure
```
tests/
├── regression/           # End-to-end functionality tests
├── unit/                # Isolated component/function tests  
├── integration/         # Cross-component interaction tests
├── fixtures/            # Reusable test data and mocks
└── utils/               # Test helper functions
```

### Test Data Management
- **ALWAYS use TestDataManager** for data that touches the database
- **Prefix all test data** with unique identifiers
- **Clean up after every test** to prevent data leaks
- **Verify cleanup** with automated checks

## 📊 Coverage Requirements

### Minimum Test Coverage
- **API Endpoints**: 100% of public endpoints
- **CRUD Operations**: All create, read, update, delete flows
- **Error Handling**: All error states and edge cases
- **UI Components**: All interactive elements and state changes
- **Data Validation**: All Zod schemas and input validation
- **Business Logic**: All calculation and transformation functions

### Performance Benchmarks
- **API Response Times**: < 2s for lists, < 3s for creation
- **Database Operations**: < 1s for simple queries
- **UI Interactions**: < 500ms for state updates
- **Firebase Sync**: < 2s for data persistence

## 🔧 Test Update Workflow

### 1. Pre-Development
- Review existing tests related to the feature area
- Plan test additions alongside feature development
- Create test data templates for new entities

### 2. During Development
- Write tests alongside code (TDD approach)
- Update existing tests when modifying functionality
- Ensure all tests use proper data isolation

### 3. Post-Development
- Run full regression suite to verify no breaking changes
- Update test documentation and examples
- Add performance benchmarks for new features
- Verify test cleanup and data isolation

### 4. Before Deployment
- Execute complete test suite with data verification
- Confirm no test data remains in production database
- Validate all new functionality meets performance requirements

## 🚨 Critical Test Maintenance Rules

### Data Protection
1. **NEVER modify production data** in tests
2. **ALWAYS use TestDataManager** for database operations
3. **VERIFY cleanup** after every test run
4. **Use unique prefixes** for all test data

### Test Quality
1. **Make tests deterministic** - no random data or timing dependencies
2. **Test realistic scenarios** - use authentic data structures
3. **Include negative cases** - test error conditions and edge cases
4. **Maintain test independence** - tests should not depend on each other

### Performance
1. **Benchmark new operations** - establish performance baselines
2. **Test with realistic data sizes** - don't just test with minimal data
3. **Monitor test execution time** - keep test suite fast and efficient
4. **Use parallel execution** where possible

## 📋 Test Update Examples

### Adding New Cocktail Field (e.g., "difficulty")

1. **Update Schema Tests**:
```typescript
// Add to schema.test.ts
it('should validate cocktail difficulty field', () => {
  const schema = insertCocktailSchema.extend({
    difficulty: z.enum(['easy', 'medium', 'hard'])
  });
  expect(schema.parse({ difficulty: 'easy' })).toBeDefined();
});
```

2. **Update API Tests**:
```typescript
// Add to api.test.ts - in cocktail creation test
const testCocktail = await testManager.createTestCocktail({
  name: 'Difficulty_Test_Cocktail',
  difficulty: 'medium', // New field
  // ... other fields
});
expect(testCocktail.difficulty).toBe('medium');
```

3. **Update Persistence Tests**:
```typescript
// Add to firebase-persistence.test.ts
it('should persist cocktail difficulty in Firebase', async () => {
  const cocktail = await testManager.createTestCocktail({
    difficulty: 'hard'
  });
  
  const retrieved = await testManager.getCocktail(cocktail.id);
  expect(retrieved.cocktail.difficulty).toBe('hard');
});
```

### Adding New Search Feature

1. **Add Search Tests**:
```typescript
// Add to api.test.ts
describe('Search Functionality', () => {
  it('should search cocktails by difficulty', async () => {
    await testManager.createTestCocktail({
      name: 'Easy_Cocktail',
      difficulty: 'easy'
    });
    
    const results = await testManager.apiRequest('/cocktails/search?difficulty=easy');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].difficulty).toBe('easy');
  });
});
```

### Example: PopularRecipesSection Filter Fix

1. **Frontend Change**: Updated filter logic to exclude cocktails with popularityCount = 0
2. **Test Addition**: Added regression test for popular recipe filtering
```typescript
it('should filter popular recipes correctly (popularityCount > 0)', async () => {
  const neverMade = await testManager.createTestCocktail({
    name: 'Never_Made_Cocktail',
    popularityCount: 0
  });
  
  const popular = await testManager.createTestCocktail({
    name: 'Popular_Cocktail', 
    popularityCount: 5
  });
  
  const popularResults = await testManager.apiRequest('/cocktails?popular=true');
  
  // Should include popular cocktail
  expect(popularResults.find(c => c.id === popular.id)).toBeDefined();
  // Should exclude never-made cocktail
  expect(popularResults.find(c => c.id === neverMade.id)).toBeUndefined();
});
```

2. **Add Performance Test**:
```typescript
// Add to performance.test.ts
it('should handle difficulty search within performance limits', async () => {
  const start = Date.now();
  const results = await testManager.apiRequest('/cocktails/search?difficulty=medium');
  const duration = Date.now() - start;
  
  expect(duration).toBeLessThan(2000);
  expect(results).toBeInstanceOf(Array);
});
```

## 📈 Continuous Improvement

### Monthly Test Reviews
- Analyze test execution times and optimize slow tests
- Review test coverage and identify gaps
- Update test data to reflect real-world usage patterns
- Refactor tests to reduce maintenance burden

### Test Metrics Tracking
- Test execution time trends
- Test failure rates and common issues
- Code coverage percentages
- Performance benchmark trends

This guide ensures your test suite remains comprehensive, efficient, and protective of production data as your cocktail application evolves.