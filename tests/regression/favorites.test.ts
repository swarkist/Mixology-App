import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDataManager } from './data-isolation';

describe('Favorites API', () => {
  let testManager: TestDataManager;
  let testUserId: string;
  let sessionCookie: string;
  let testCocktailId: string;

  beforeAll(async () => {
    testManager = new TestDataManager();
    await testManager.captureCurrentState();

    // Create a test user and get session
    const { userId, cookie } = await testManager.createTestUser();
    testUserId = userId;
    sessionCookie = cookie;

    // Get a test cocktail ID
    const cocktailsResponse = await fetch('http://localhost:5000/api/cocktails');
    const cocktails = await cocktailsResponse.json();
    testCocktailId = String(cocktails[0]?.id || '1754355116391');
  });

  afterAll(async () => {
    await testManager.cleanup();
  });

  describe('Authentication Required', () => {
    it('GET /api/user/favorites requires authentication', async () => {
      const response = await fetch('http://localhost:5000/api/user/favorites');
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('POST /api/user/favorites/:id requires authentication', async () => {
      const response = await fetch(`http://localhost:5000/api/user/favorites/${testCocktailId}`, {
        method: 'POST'
      });
      expect(response.status).toBe(401);
    });
  });

  describe('Authenticated User Operations', () => {
    it('can get empty favorites initially', async () => {
      const response = await fetch('http://localhost:5000/api/user/favorites', {
        headers: { Cookie: sessionCookie }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('ids');
      expect(Array.isArray(data.ids)).toBe(true);
    });

    it('can toggle favorite (add)', async () => {
      const response = await fetch(`http://localhost:5000/api/user/favorites/${testCocktailId}`, {
        method: 'POST',
        headers: { Cookie: sessionCookie }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('favorited', true);
    });

    it('favorite appears in user favorites list', async () => {
      const response = await fetch('http://localhost:5000/api/user/favorites', {
        headers: { Cookie: sessionCookie }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ids).toContain(testCocktailId);
    });

    it('can toggle favorite (remove)', async () => {
      const response = await fetch(`http://localhost:5000/api/user/favorites/${testCocktailId}`, {
        method: 'POST',
        headers: { Cookie: sessionCookie }
      });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('favorited', false);
    });
  });

  describe('Cocktails by IDs Public Read', () => {
    it('can fetch cocktails by IDs without authentication', async () => {
      const response = await fetch(`http://localhost:5000/api/cocktails?ids=${testCocktailId}`);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('name');
      }
    });

    it('returns empty array for non-existent IDs', async () => {
      const response = await fetch('http://localhost:5000/api/cocktails?ids=999999999');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([]);
    });

    it('returns empty array for empty IDs parameter', async () => {
      const response = await fetch('http://localhost:5000/api/cocktails?ids=');
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([]);
    });
  });
});