# Unit Tests

This directory contains unit tests for individual components and features of the Mixology application.

## Test Files

### `components.test.tsx`
Tests for React components including:
- `CocktailCard` - Display and interaction with cocktail data
- `IngredientCard` - Ingredient display and My Bar functionality  
- `AddCocktail` - Form validation and dynamic ingredient/instruction handling
- `SearchBar` and `FilterSection` - Search and filtering functionality

### `storage.test.ts`
Tests for data storage operations including:
- Cocktail CRUD operations
- Ingredient management and My Bar status
- Data validation and error handling
- Tag system functionality

### `ai-features.test.ts` ⭐ **New**
Tests for AI-powered features including:
- **Photo OCR Brand Extraction** - Upload bottle photos and extract brand information
- **Recipe Import from URLs** - Parse recipes from web pages and YouTube videos
- **YouTube Transcript Processing** - Extract and parse recipes from video transcripts
- **AI Text Recipe Parsing** - Convert raw text into structured recipe data
- **Fraction Conversion** - Test decimal to fraction conversion utilities
- **Preferred Brands Integration** - OCR data to brand creation workflow
- **Error Handling** - AI service failures and validation

## AI Features Testing

The AI features tests include comprehensive coverage for:

### Photo OCR Workflow
- Image upload validation
- Brand extraction accuracy
- Confidence scoring
- Error handling for invalid images

### Recipe Import System
- URL validation and processing
- YouTube video transcript extraction
- AI model selection and routing
- Structured data output validation

### Text Parsing
- Raw recipe text to structured format
- Ingredient amount parsing
- Instruction step extraction
- Fraction conversion accuracy

### Integration Testing
- OCR to preferred brand creation
- Brand association with ingredients
- My Bar integration
- Mobile-responsive UI components

## Running Tests

```bash
# Run all unit tests
npm test

# Run specific test file
npm test ai-features.test.ts

# Run with coverage
npm run test:coverage
```

## Test Data Isolation

All AI feature tests use isolated test data with unique prefixes to prevent data contamination:
- Test cocktails: `ai_test_[timestamp]_CocktailName`
- Test ingredients: `ai_test_[timestamp]_IngredientName`
- Test brands: `AI_Test_Brand`

## Mocking External Services

AI service calls are designed to gracefully handle failures during testing:
- OpenRouter API calls may fail in test environment
- YouTube transcript extraction requires valid video IDs
- OCR processing requires valid image data
- Tests verify error handling rather than requiring actual AI responses