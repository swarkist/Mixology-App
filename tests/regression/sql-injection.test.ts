import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { PersistentMemStorage } from '../../server/storage/persistent-storage';
import type { IngredientForm, InsertTag } from '../../shared/schema';

const TEST_DATA_DIR = join(process.cwd(), 'test-data-injection');
const TEST_DATA_FILE = join(TEST_DATA_DIR, 'storage.json');

describe('SQL injection protection', () => {
  let storage: PersistentMemStorage;

  beforeEach(async () => {
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch {}
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    storage = new PersistentMemStorage();
    (storage as any).dataFile = TEST_DATA_FILE;
  });

  afterEach(async () => {
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch {}
  });

  it('searchIngredients safely handles injection payloads', async () => {
    const ingredient: IngredientForm = {
      name: 'Safe Vodka',
      category: 'spirits',
      subCategory: 'vodka',
      description: 'Test ingredient',
      preferredBrand: null,
      abv: 40,
      imageUrl: null,
      tagIds: []
    };
    await storage.createIngredient(ingredient);

    const payload = "' OR '1'='1";
    const results = await storage.searchIngredients(payload);
    expect(results).toHaveLength(0);
  });

  it('findTagByName treats payload as plain text', async () => {
    const tag: InsertTag = { name: 'citrus' };
    await storage.createTag(tag);

    const payload = "citrus'; DROP TABLE tags; --";
    const result = await storage.findTagByName(payload);
    expect(result).toBeNull();
  });
});
