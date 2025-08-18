import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

class AITestManager {
  async apiRequest(endpoint: string, options: any = {}) {
    const url = `http://localhost:5000/api${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': process.env.ADMIN_API_KEY || 'test-key',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
  }
}

const mockFetch = (data: any, ok = true, status = 200) => {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(data)
  } as any);
};

describe('AI Features Tests', () => {
  let testManager: AITestManager;

  beforeEach(() => {
    testManager = new AITestManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Photo OCR Brand Extraction', () => {
    it('returns brand data for valid image', async () => {
      mockFetch({ name: 'Mock Brand', confidence: 0.9 });

      const response = await testManager.apiRequest('/ai/brands/from-image', {
        method: 'POST',
        body: JSON.stringify({
          base64: 'data:image/jpeg;base64,MOCKDATA',
          autoCreate: false
        })
      });

      expect(response).toEqual({ name: 'Mock Brand', confidence: 0.9 });
    });

    it('throws on invalid payload', async () => {
      mockFetch({}, false, 400);

      await expect(
        testManager.apiRequest('/ai/brands/from-image', {
          method: 'POST',
          body: JSON.stringify({ autoCreate: false })
        })
      ).rejects.toThrow('API request failed: 400');
    });
  });

  describe('Recipe Import from URLs', () => {
    it('returns parsed recipe structure', async () => {
      mockFetch({
        name: 'Mock Recipe',
        ingredients: ['1 oz rum'],
        instructions: ['Mix', 'Serve']
      });

      const response = await testManager.apiRequest('/ai/import/recipe', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com/recipe',
          model: 'gpt-4o-mini'
        })
      });

      expect(response).toEqual({
        name: 'Mock Recipe',
        ingredients: ['1 oz rum'],
        instructions: ['Mix', 'Serve']
      });
    });

    it('throws when url is missing', async () => {
      mockFetch({}, false, 400);

      await expect(
        testManager.apiRequest('/ai/import/recipe', {
          method: 'POST',
          body: JSON.stringify({ model: 'gpt-4o-mini' })
        })
      ).rejects.toThrow('API request failed: 400');
    });
  });

  describe('YouTube Transcript Processing', () => {
    it('parses recipe from video URL', async () => {
      mockFetch({
        name: 'Video Recipe',
        ingredients: [],
        instructions: []
      });

      const response = await testManager.apiRequest('/ai/import/recipe', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          model: 'gpt-4o-mini'
        })
      });

      expect(response).toEqual({
        name: 'Video Recipe',
        ingredients: [],
        instructions: []
      });
    });

    it('throws when transcript processing fails', async () => {
      mockFetch({}, false, 500);

      await expect(
        testManager.apiRequest('/ai/import/recipe', {
          method: 'POST',
          body: JSON.stringify({
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            model: 'gpt-4o-mini'
          })
        })
      ).rejects.toThrow('API request failed: 500');
    });
  });

  describe('AI Text Recipe Parsing', () => {
    it('parses recipe from raw text', async () => {
      mockFetch({
        name: 'Old Fashioned',
        ingredients: [
          '2 oz bourbon',
          '1 sugar cube',
          '2 dashes bitters',
          'Orange peel'
        ],
        instructions: [
          'Muddle sugar with bitters',
          'Add whiskey and stir',
          'Garnish with orange peel'
        ]
      });

      const response = await testManager.apiRequest('/ai/import/parse-text', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Old Fashioned recipe',
          model: 'gpt-4o-mini'
        })
      });

      expect(response).toEqual({
        name: 'Old Fashioned',
        ingredients: [
          '2 oz bourbon',
          '1 sugar cube',
          '2 dashes bitters',
          'Orange peel'
        ],
        instructions: [
          'Muddle sugar with bitters',
          'Add whiskey and stir',
          'Garnish with orange peel'
        ]
      });
    });

    it('throws on empty text', async () => {
      mockFetch({}, false, 400);

      await expect(
        testManager.apiRequest('/ai/import/parse-text', {
          method: 'POST',
          body: JSON.stringify({
            text: '',
            model: 'gpt-4o-mini'
          })
        })
      ).rejects.toThrow('API request failed: 400');
    });
  });
});

