import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { PersistentMemStorage } from '../server/storage/persistent-storage';
import type { IngredientForm, CocktailForm, InsertTag } from '../shared/schema';

// Test data directory
const TEST_DATA_DIR = join(process.cwd(), 'test-data');
const TEST_DATA_FILE = join(TEST_DATA_DIR, 'storage.json');

describe('PersistentMemStorage', () => {
  let storage: PersistentMemStorage;

  beforeEach(async () => {
    // Ensure clean test environment
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch {}
    
    // Create test directory
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    
    // Create storage with test data file
    storage = new PersistentMemStorage();
    // Override the data file path after construction
    (storage as any).dataFile = TEST_DATA_FILE;
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch {}
  });

  describe('Tags Management', () => {
    test('should create and retrieve tags', async () => {
      const tagData: InsertTag = { name: 'citrus' };
      const tag = await storage.createTag(tagData);
      
      expect(tag.id).toBeDefined();
      expect(tag.name).toBe('citrus');
      expect(tag.usageCount).toBe(0);
      expect(tag.createdAt).toBeInstanceOf(Date);
      
      const allTags = await storage.getAllTags();
      expect(allTags).toHaveLength(1);
      expect(allTags[0].name).toBe('citrus');
    });

    test('should not create duplicate tags', async () => {
      const tagData: InsertTag = { name: 'citrus' };
      const tag1 = await storage.createTag(tagData);
      const tag2 = await storage.createTag(tagData);
      
      expect(tag1.id).toBe(tag2.id);
      expect(tag1.name).toBe(tag2.name);
      
      const allTags = await storage.getAllTags();
      expect(allTags).toHaveLength(1);
    });

    test('should increment tag usage', async () => {
      const tag = await storage.createTag({ name: 'citrus' });
      await storage.incrementTagUsage(tag.id);
      
      const tags = await storage.getAllTags();
      expect(tags[0].usageCount).toBe(1);
    });

    test('should get most used tags', async () => {
      const tag1 = await storage.createTag({ name: 'citrus' });
      const tag2 = await storage.createTag({ name: 'sweet' });
      
      await storage.incrementTagUsage(tag2.id);
      await storage.incrementTagUsage(tag2.id);
      await storage.incrementTagUsage(tag1.id);
      
      const mostUsed = await storage.getMostUsedTags(2);
      expect(mostUsed).toHaveLength(2);
      expect(mostUsed[0].name).toBe('sweet');
      expect(mostUsed[0].usageCount).toBe(2);
      expect(mostUsed[1].name).toBe('citrus');
      expect(mostUsed[1].usageCount).toBe(1);
    });
  });

  describe('Ingredients Management', () => {
    test('should create and retrieve ingredients', async () => {
      const ingredientData: IngredientForm = {
        name: 'Premium Vodka',
        category: 'spirits',
        subCategory: 'vodka',
        description: 'High-quality vodka',
        preferredBrand: 'Grey Goose',
        abv: 40,
        imageUrl: null,
        inMyBar: false,
        tagIds: []
      };
      
      const ingredient = await storage.createIngredient(ingredientData);
      
      expect(ingredient.id).toBeDefined();
      expect(ingredient.name).toBe('Premium Vodka');
      expect(ingredient.category).toBe('spirits');
      expect(ingredient.subCategory).toBe('vodka');
      expect(ingredient.abv).toBe(40);
      expect(ingredient.usedInRecipesCount).toBe(0);
      expect(ingredient.createdAt).toBeInstanceOf(Date);
      expect(ingredient.updatedAt).toBeInstanceOf(Date);
      
      const allIngredients = await storage.getAllIngredients();
      expect(allIngredients).toHaveLength(1);
      expect(allIngredients[0].name).toBe('Premium Vodka');
    });

    test('should update ingredient', async () => {
      const ingredient = await storage.createIngredient({
        name: 'Vodka',
        category: 'spirits',
        subCategory: 'vodka',
        description: 'Basic vodka',
        preferredBrand: null,
        abv: 40,
        imageUrl: null,
        inMyBar: false,
        tagIds: []
      });
      
      const updated = await storage.updateIngredient(ingredient.id, {
        description: 'Premium vodka',
        preferredBrand: 'Grey Goose'
      });
      
      expect(updated.description).toBe('Premium vodka');
      expect(updated.preferredBrand).toBe('Grey Goose');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(ingredient.updatedAt.getTime());
    });

    test('should toggle myBar status', async () => {
      const ingredient = await storage.createIngredient({
        name: 'Vodka',
        category: 'spirits',
        subCategory: 'vodka',
        description: 'Basic vodka',
        preferredBrand: null,
        abv: 40,
        imageUrl: null,
        inMyBar: false,
        tagIds: []
      });
      
      expect(ingredient.inMyBar).toBe(false);
      
      const toggled = await storage.toggleMyBar(ingredient.id);
      expect(toggled.inMyBar).toBe(true);
      
      const toggledBack = await storage.toggleMyBar(ingredient.id);
      expect(toggledBack.inMyBar).toBe(false);
    });

    test('should search ingredients', async () => {
      await storage.createIngredient({
        name: 'Premium Vodka',
        category: 'spirits',
        subCategory: 'vodka',
        description: 'High-quality vodka',
        preferredBrand: 'Grey Goose',
        abv: 40,
        imageUrl: null,
        inMyBar: false,
        tagIds: []
      });

      await storage.createIngredient({
        name: 'Lime Juice',
        category: 'juices',
        subCategory: null,
        description: 'Fresh lime juice',
        preferredBrand: null,
        abv: 0,
        imageUrl: null,
        inMyBar: false,
        tagIds: []
      });
      
      const vodkaResults = await storage.searchIngredients('vodka');
      expect(vodkaResults).toHaveLength(1);
      expect(vodkaResults[0].name).toBe('Premium Vodka');
      
      const juiceResults = await storage.searchIngredients('juice');
      expect(juiceResults).toHaveLength(1);
      expect(juiceResults[0].name).toBe('Lime Juice');
    });

    test('should find ingredient by name', async () => {
      await storage.createIngredient({
        name: 'Premium Vodka',
        category: 'spirits',
        subCategory: 'vodka',
        description: 'High-quality vodka',
        preferredBrand: 'Grey Goose',
        abv: 40,
        imageUrl: null,
        inMyBar: false,
        tagIds: []
      });
      
      const found = await storage.findIngredientByName('Premium Vodka');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Premium Vodka');
      
      const notFound = await storage.findIngredientByName('Nonexistent');
      expect(notFound).toBeNull();
    });

    test('should get ingredients by category', async () => {
      await storage.createIngredient({
        name: 'Premium Vodka',
        category: 'spirits',
        subCategory: 'vodka',
        description: 'High-quality vodka',
        preferredBrand: 'Grey Goose',
        abv: 40,
        imageUrl: null,
        inMyBar: false,
        tagIds: []
      });

      await storage.createIngredient({
        name: 'Lime Juice',
        category: 'juices',
        subCategory: null,
        description: 'Fresh lime juice',
        preferredBrand: null,
        abv: 0,
        imageUrl: null,
        inMyBar: false,
        tagIds: []
      });
      
      const spirits = await storage.getIngredientsByCategory('spirits');
      expect(spirits).toHaveLength(1);
      expect(spirits[0].name).toBe('Premium Vodka');
      
      const juices = await storage.getIngredientsByCategory('juices');
      expect(juices).toHaveLength(1);
      expect(juices[0].name).toBe('Lime Juice');
    });
  });

  describe('Data Persistence', () => {
    test('should persist data across instances', async () => {
      // Create data in first instance
      const tag = await storage.createTag({ name: 'persistent-tag' });
      const ingredient = await storage.createIngredient({
        name: 'Persistent Vodka',
        category: 'spirits',
        subCategory: 'vodka',
        description: 'Test persistence',
        preferredBrand: null,
        abv: 40,
        imageUrl: null,
        inMyBar: false,
        tagIds: []
      });
      
      // Create new instance (simulating restart)
      const newStorage = new PersistentMemStorage();
      
      // Wait a bit for data to load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if data persists
      const persistedTags = await newStorage.getAllTags();
      expect(persistedTags).toHaveLength(1);
      expect(persistedTags[0].name).toBe('persistent-tag');
      
      const persistedIngredients = await newStorage.getAllIngredients();
      expect(persistedIngredients).toHaveLength(1);
      expect(persistedIngredients[0].name).toBe('Persistent Vodka');
    });

    test('should handle missing data file gracefully', async () => {
      // Ensure no data file exists
      try {
        await fs.rm(TEST_DATA_FILE, { force: true });
      } catch {}
      
      const newStorage = new PersistentMemStorage();
      
      const tags = await newStorage.getAllTags();
      expect(tags).toHaveLength(0);
      
      const ingredients = await newStorage.getAllIngredients();
      expect(ingredients).toHaveLength(0);
    });
  });

  describe('Tag Segregation', () => {
    test('should segregate ingredient and cocktail tags', async () => {
      // Create tags and associate with ingredients
      const ingredientTag = await storage.createTag({ name: 'ingredient-tag' });
      const cocktailTag = await storage.createTag({ name: 'cocktail-tag' });
      
      // Create ingredient with tag
      await storage.createIngredient({
        name: 'Test Ingredient',
        category: 'spirits',
        subCategory: 'vodka',
        description: 'Test',
        preferredBrand: null,
        abv: 40,
        imageUrl: null,
        inMyBar: false,
        tagIds: [ingredientTag.id]
      });
      
      // Test ingredient-specific tag methods
      const ingredientTags = await storage.getMostUsedIngredientTags();
      expect(ingredientTags).toHaveLength(1);
      expect(ingredientTags[0].name).toBe('ingredient-tag');
      
      const cocktailTags = await storage.getMostUsedCocktailTags();
      expect(cocktailTags).toHaveLength(0); // No cocktail tags associated yet
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent ingredient updates', async () => {
      await expect(storage.updateIngredient(999, { name: 'Updated' }))
        .rejects.toThrow('Ingredient 999 not found');
    });

    test('should handle non-existent ingredient myBar toggle', async () => {
      await expect(storage.toggleMyBar(999))
        .rejects.toThrow('Ingredient 999 not found');
    });

    test('should handle non-existent tag usage increment', async () => {
      // Should not throw, just do nothing
      await expect(storage.incrementTagUsage(999)).resolves.not.toThrow();
    });
  });
});