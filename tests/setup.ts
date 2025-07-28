import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Global test setup

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'test://test';

// Mock window and document for component tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock fetch for API tests
global.fetch = vi.fn();

// Mock console methods to reduce test noise
const originalConsole = console;
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
};

// Restore console after tests if needed
afterAll(() => {
  global.console = originalConsole;
});

// Global test timeout
vi.setConfig({ testTimeout: 10000 });

// Mock image loading
Object.defineProperty(Image.prototype, 'src', {
  set() {
    setTimeout(() => this.onload?.(), 0);
  },
});

// Mock file reading
Object.defineProperty(FileReader.prototype, 'readAsDataURL', {
  value: vi.fn().mockImplementation(function(this: FileReader) {
    setTimeout(() => {
      this.result = 'data:image/jpeg;base64,mock-base64-data';
      this.onload?.({ target: this } as any);
    }, 0);
  }),
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = vi.fn();

// Setup for React testing
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/',
    search: '',
    hash: '',
    href: 'http://localhost:3000/',
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Setup test environment logging
console.log('🧪 Test environment initialized');
console.log('📋 Global mocks configured');
console.log('🔧 Test utilities loaded');