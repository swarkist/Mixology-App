/**
 * PWA (Progressive Web App) Functionality Regression Tests
 * 
 * These tests validate PWA features including:
 * - Web App Manifest validation
 * - Icon availability and format compliance
 * - PWA metadata and configuration
 * - Mobile experience enhancements
 */

import { describe, it, expect, beforeAll } from 'vitest';

// Helper function to make HTTP requests
async function httpRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = 'http://localhost:5000';
  return await fetch(`${baseUrl}${path}`, {
    headers: {
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  });
}

// Helper to validate JSON response
async function getJsonResponse(path: string): Promise<any> {
  const response = await httpRequest(path);
  expect(response.ok, `Failed to fetch ${path}: ${response.status} ${response.statusText}`).toBe(true);
  return await response.json();
}

// Helper to check if resource exists
async function resourceExists(path: string, expectedType?: string): Promise<boolean> {
  try {
    const response = await httpRequest(path);
    if (expectedType) {
      const contentType = response.headers.get('content-type');
      return response.ok && contentType?.includes(expectedType) === true;
    }
    return response.ok;
  } catch {
    return false;
  }
}

describe('PWA Functionality Regression Tests', () => {
  describe('Web App Manifest', () => {
    let manifest: any;

    beforeAll(async () => {
      manifest = await getJsonResponse('/manifest.webmanifest');
    });

    it('should serve valid web app manifest', async () => {
      expect(manifest).toBeDefined();
      expect(typeof manifest).toBe('object');
    });

    it('should have required PWA manifest fields', () => {
      // Core required fields for PWA
      expect(manifest.name).toBe('Miximixology');
      expect(manifest.short_name).toBe('Mixi');
      expect(manifest.start_url).toBe('/');
      expect(manifest.display).toBe('standalone');
      
      // Theme and branding
      expect(manifest.background_color).toBe('#000000');
      expect(manifest.theme_color).toBe('#FFD43B');
    });

    it('should have comprehensive icon set', () => {
      expect(manifest.icons).toBeDefined();
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThan(0);

      // Required icon sizes for PWA
      const requiredSizes = ['192x192', '512x512'];
      const availableSizes = manifest.icons.map((icon: any) => icon.sizes);
      
      requiredSizes.forEach(size => {
        expect(availableSizes).toContain(size);
      });
    });

    it('should have valid icon configuration', () => {
      manifest.icons.forEach((icon: any) => {
        expect(icon.src).toBeDefined();
        expect(icon.src).toMatch(/^\/mixi-bot-\d+\.png$/);
        expect(icon.sizes).toBeDefined();
        expect(icon.sizes).toMatch(/^\d+x\d+$/);
        expect(icon.type).toBe('image/png');
      });
    });
  });

  describe('PWA Icon Resources', () => {
    it('should serve all manifest icons', async () => {
      const manifest = await getJsonResponse('/manifest.webmanifest');
      
      for (const icon of manifest.icons) {
        const exists = await resourceExists(icon.src, 'image/png');
        expect(exists, `Icon ${icon.src} should be accessible`).toBe(true);
      }
    });

    it('should serve Apple Touch Icon', async () => {
      const exists = await resourceExists('/mixi-bot-192.png', 'image/png');
      expect(exists, 'Apple Touch Icon should be accessible').toBe(true);
    });

    it('should serve favicon', async () => {
      const exists = await resourceExists('/favicon.ico');
      expect(exists, 'Favicon should be accessible').toBe(true);
    });
  });

  describe('HTML PWA Integration', () => {
    let htmlContent: string;

    beforeAll(async () => {
      const response = await httpRequest('/');
      htmlContent = await response.text();
    });

    it('should include manifest link in HTML head', () => {
      expect(htmlContent).toContain('<link rel="manifest" href="/manifest.webmanifest"');
    });

    it('should include Apple Touch Icon link', () => {
      expect(htmlContent).toContain('<link rel="apple-touch-icon" href="/mixi-bot-192.png"');
    });

    it('should include favicon link', () => {
      expect(htmlContent).toContain('<link rel="icon" href="/favicon.ico"');
    });

    it('should have proper viewport meta tag for mobile', () => {
      expect(htmlContent).toContain('meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1"');
    });

    it('should have UTF-8 charset declaration', () => {
      expect(htmlContent).toContain('<meta charset="UTF-8"');
    });
  });

  describe('PWA Branding Consistency', () => {
    it('should use consistent color scheme', async () => {
      const manifest = await getJsonResponse('/manifest.webmanifest');
      
      // Validate brand colors match design system
      expect(manifest.background_color).toBe('#000000'); // Dark theme
      expect(manifest.theme_color).toBe('#FFD43B'); // Gold accent
    });

    it('should use consistent branding names', async () => {
      const manifest = await getJsonResponse('/manifest.webmanifest');
      
      expect(manifest.name).toBe('Miximixology');
      expect(manifest.short_name).toBe('Mixi');
      
      // Ensure names are appropriate length for mobile
      expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    });
  });

  describe('PWA Performance Requirements', () => {
    it('should serve manifest quickly', async () => {
      const startTime = Date.now();
      const response = await httpRequest('/manifest.webmanifest');
      const endTime = Date.now();
      
      expect(response.ok).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should load within 1 second
    });

    it('should serve icons quickly', async () => {
      const startTime = Date.now();
      const response = await httpRequest('/mixi-bot-192.png');
      const endTime = Date.now();
      
      expect(response.ok).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Icons should load within 2 seconds
    });

    it('should have proper caching headers for static assets', async () => {
      const response = await httpRequest('/manifest.webmanifest');
      expect(response.ok).toBe(true);
      
      // Should have some form of caching header
      const cacheControl = response.headers.get('cache-control');
      const etag = response.headers.get('etag');
      const lastModified = response.headers.get('last-modified');
      
      expect(
        cacheControl || etag || lastModified,
        'Manifest should have caching headers for better performance'
      ).toBeTruthy();
    });
  });

  describe('Mobile Experience Validation', () => {
    it('should support standalone display mode', async () => {
      const manifest = await getJsonResponse('/manifest.webmanifest');
      expect(manifest.display).toBe('standalone');
    });

    it('should have appropriate start URL', async () => {
      const manifest = await getJsonResponse('/manifest.webmanifest');
      expect(manifest.start_url).toBe('/');
      
      // Verify start URL is accessible
      const response = await httpRequest('/');
      expect(response.ok).toBe(true);
    });

    it('should provide multiple icon sizes for different devices', async () => {
      const manifest = await getJsonResponse('/manifest.webmanifest');
      
      // Check for common mobile icon sizes
      const iconSizes = manifest.icons.map((icon: any) => icon.sizes);
      const commonMobileSizes = ['192x192', '512x512', '96x96', '64x64', '32x32', '16x16'];
      
      commonMobileSizes.forEach(size => {
        expect(iconSizes).toContain(size);
      });
    });
  });

  describe('PWA Standards Compliance', () => {
    it('should follow W3C Web App Manifest specification', async () => {
      const manifest = await getJsonResponse('/manifest.webmanifest');
      
      // Validate against core W3C spec requirements
      expect(typeof manifest.name).toBe('string');
      expect(typeof manifest.short_name).toBe('string');
      expect(typeof manifest.start_url).toBe('string');
      expect(['fullscreen', 'standalone', 'minimal-ui', 'browser']).toContain(manifest.display);
    });

    it('should have valid MIME type for manifest', async () => {
      const response = await httpRequest('/manifest.webmanifest');
      const contentType = response.headers.get('content-type');
      
      // Should be served with proper MIME type
      expect(contentType).toContain('application/manifest+json');
    });
  });
});