import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import MixiChat from '../../client/src/components/MixiChat';
import { openMixi } from '../../client/src/lib/mixiBus';

const encoder = new TextEncoder();

function makeSSEChunk(content: string): Uint8Array {
  const data = JSON.stringify({ content });
  return encoder.encode(`data: ${data}\n\n`);
}

function makeDoneChunk(): Uint8Array {
  return encoder.encode(`data: [DONE]\n\n`);
}

function createMockStreamReader(chunks: Uint8Array[]) {
  let index = 0;
  return {
    read: vi.fn(async () => {
      if (index >= chunks.length) {
        return { done: true, value: undefined };
      }
      const value = chunks[index++];
      return { done: false, value };
    }),
    releaseLock: vi.fn(),
    cancel: vi.fn(),
  };
}

type ReaderLike =
  | ReturnType<typeof createMockStreamReader>
  | {
      read: ReturnType<typeof vi.fn>;
      releaseLock: ReturnType<typeof vi.fn>;
      cancel: ReturnType<typeof vi.fn>;
    };

function createMockResponse(reader: ReaderLike, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Internal Server Error',
    headers: new Headers(),
    body: {
      getReader: () => reader,
    },
    json: vi.fn().mockResolvedValue({}),
  } as unknown as Response;
}

describe('MixiChat Streaming Tests', () => {
  let originalFetch: typeof fetch;
  let mockFetch: Mock;

  beforeEach(() => {
    originalFetch = global.fetch;

    // One canonical fetch mock. Do not manually push "history" inside tests.
    mockFetch = vi.fn((url: string, _options?: RequestInit) => {
      // =========================
      // PDOS TRIPWIRE (HARD FAIL)
      // =========================
      // Any attempt to hit a non-local URL (http/https) or known third-parties
      // should immediately fail the test suite.
      const urlStr = String(url);
      if (
        urlStr.includes('openrouter') ||
        urlStr.includes('api.openai.com') ||
        urlStr.startsWith('http://') ||
        urlStr.startsWith('https://')
      ) {
        throw new Error(`TEST TRIPWIRE: External network call attempted: ${urlStr}`);
      }

      // Default: cocktails list used for suggestions/autocomplete
      if (urlStr === '/api/cocktails?fields=id,name' || urlStr === '/api/cocktails') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        } as Response);
      }

      // Default: streaming endpoint returns empty stream (done immediately)
      return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
    });

    global.fetch = mockFetch;

    // Needed for components that use timers (scroll-to-bottom, debounce, etc.)
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
    vi.clearAllMocks();
    cleanup();
  });

  function getFetchUrls(): string[] {
    return mockFetch.mock.calls.map((call) => String(call[0]));
  }

  async function openMixiAndWait(seed = 'Welcome!') {
    await act(async () => {
      openMixi({ seed });
      await vi.advanceTimersByTimeAsync(50);
    });
  }

  describe('Streaming chunk handling and accumulation', () => {
    it('should accumulate streaming chunks in order', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const chunks = [makeSSEChunk('Hello '), makeSSEChunk('from '), makeSSEChunk('Mixi!'), makeDoneChunk()];

      const reader = createMockStreamReader(chunks);

      mockFetch.mockImplementation((url: string, _options?: RequestInit) => {
        const urlStr = String(url);
        if (urlStr.includes('openrouter') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
          throw new Error(`TEST TRIPWIRE: External network call attempted: ${urlStr}`);
        }

        if (urlStr === '/api/cocktails?fields=id,name' || urlStr === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (urlStr === '/api/mixi/chat') {
          return Promise.resolve(createMockResponse(reader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      await openMixiAndWait('Welcome!');

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');

      await act(async () => {
        await user.type(input, 'Test message');
      });

      await act(async () => {
        await user.click(sendButton);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(
        () => {
          const messages = screen.getByTestId('mixi-chat-messages');
          expect(messages.textContent).toContain('Hello from Mixi!');
        },
        { timeout: 2000 }
      );
    });

    it('should handle multi-line SSE chunks correctly', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const combinedChunk = encoder.encode(
        `data: ${JSON.stringify({ content: 'Part 1 ' })}\n\n` +
          `data: ${JSON.stringify({ content: 'Part 2' })}\n\n` +
          `data: [DONE]\n\n`
      );

      const reader = createMockStreamReader([combinedChunk]);

      mockFetch.mockImplementation((url: string, _options?: RequestInit) => {
        const urlStr = String(url);
        if (urlStr.includes('openrouter') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
          throw new Error(`TEST TRIPWIRE: External network call attempted: ${urlStr}`);
        }

        if (urlStr === '/api/cocktails?fields=id,name' || urlStr === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (urlStr === '/api/mixi/chat') {
          return Promise.resolve(createMockResponse(reader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      await openMixiAndWait('Welcome!');

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');

      await act(async () => {
        await user.type(input, 'Test');
        await user.click(sendButton);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(
        () => {
          const messages = screen.getByTestId('mixi-chat-messages');
          expect(messages.textContent).toContain('Part 1 Part 2');
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Stream completion behavior', () => {
    it('should handle [DONE] sentinel correctly', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const chunks = [makeSSEChunk('Complete message'), makeDoneChunk()];
      const reader = createMockStreamReader(chunks);

      mockFetch.mockImplementation((url: string) => {
        const urlStr = String(url);
        if (urlStr.includes('openrouter') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
          throw new Error(`TEST TRIPWIRE: External network call attempted: ${urlStr}`);
        }

        if (urlStr === '/api/cocktails?fields=id,name' || urlStr === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (urlStr === '/api/mixi/chat') {
          return Promise.resolve(createMockResponse(reader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      await openMixiAndWait('Welcome!');

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');

      await act(async () => {
        await user.type(input, 'Hello');
        await user.click(sendButton);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(() => {
        const messages = screen.getByTestId('mixi-chat-messages');
        expect(messages.textContent).toContain('Complete message');
      });

      await waitFor(() => {
        expect(screen.getByTestId('mixi-chat-input')).not.toBeDisabled();
      });
    });

    it('should re-enable input after stream completes', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const chunks = [makeSSEChunk('Response'), makeDoneChunk()];
      const reader = createMockStreamReader(chunks);

      mockFetch.mockImplementation((url: string) => {
        const urlStr = String(url);
        if (urlStr.includes('openrouter') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
          throw new Error(`TEST TRIPWIRE: External network call attempted: ${urlStr}`);
        }

        if (urlStr === '/api/cocktails?fields=id,name' || urlStr === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (urlStr === '/api/mixi/chat') {
          return Promise.resolve(createMockResponse(reader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      await openMixiAndWait('Hi!');

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');

      await act(async () => {
        await user.type(input, 'Test');
        await user.click(sendButton);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(
        () => {
          expect(screen.getByTestId('mixi-chat-input')).not.toBeDisabled();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Abort/Cancel behavior', () => {
    it('should stop streaming when dialog is closed', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      let readCallCount = 0;

      const slowReader = {
        read: vi.fn(async () => {
          readCallCount++;
          if (readCallCount === 1) {
            return { done: false, value: makeSSEChunk('Partial...') };
          }
          // Simulate a slow stream; close should abort before lots of reads.
          await new Promise((resolve) => setTimeout(resolve, 5000));
          return { done: false, value: makeSSEChunk('more') };
        }),
        releaseLock: vi.fn(),
        cancel: vi.fn(),
      };

      mockFetch.mockImplementation((url: string) => {
        const urlStr = String(url);
        if (urlStr.includes('openrouter') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
          throw new Error(`TEST TRIPWIRE: External network call attempted: ${urlStr}`);
        }

        if (urlStr === '/api/cocktails?fields=id,name' || urlStr === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (urlStr === '/api/mixi/chat') {
          return Promise.resolve(createMockResponse(slowReader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      await openMixiAndWait('Hello!');

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');

      await act(async () => {
        await user.type(input, 'Long request');
        await user.click(sendButton);
        await vi.advanceTimersByTimeAsync(50);
      });

      const closeButton = screen.getByTestId('mixi-chat-close-button');

      await act(async () => {
        await user.click(closeButton);
        await vi.advanceTimersByTimeAsync(50);
      });

      // We don't assert exact numbers, just that it's not spinning wildly.
      expect(readCallCount).toBeLessThanOrEqual(2);
    });

    it('should use AbortController for fetch cancellation', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      let capturedSignal: AbortSignal | undefined;

      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        const urlStr = String(url);
        if (urlStr.includes('openrouter') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
          throw new Error(`TEST TRIPWIRE: External network call attempted: ${urlStr}`);
        }

        if (urlStr === '/api/cocktails?fields=id,name' || urlStr === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (urlStr === '/api/mixi/chat') {
          capturedSignal = options?.signal as AbortSignal;
          const reader = createMockStreamReader([makeSSEChunk('Starting...')]);
          return Promise.resolve(createMockResponse(reader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      await openMixiAndWait('Hi!');

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');

      await act(async () => {
        await user.type(input, 'Test');
        await user.click(sendButton);
        await vi.advanceTimersByTimeAsync(50);
      });

      expect(capturedSignal).toBeDefined();
      // Avoid instanceof in jsdom/polyfilled environments; just verify AbortSignal-like shape.
      expect(typeof (capturedSignal as any)?.aborted).toBe('boolean');
      expect(typeof (capturedSignal as any)?.addEventListener).toBe('function');
    });
  });

  describe('Error handling', () => {
    it('should display error message on HTTP failure', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      mockFetch.mockImplementation((url: string) => {
        const urlStr = String(url);
        if (urlStr.includes('openrouter') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
          throw new Error(`TEST TRIPWIRE: External network call attempted: ${urlStr}`);
        }

        if (urlStr === '/api/cocktails?fields=id,name' || urlStr === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (urlStr === '/api/mixi/chat') {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            headers: new Headers(),
            body: null,
          } as Response);
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      await openMixiAndWait('Welcome!');

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');

      await act(async () => {
        await user.type(input, 'Hello');
        await user.click(sendButton);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(() => {
        const messages = screen.getByTestId('mixi-chat-messages');
        expect(messages.textContent).toContain('trouble connecting');
      });
    });

    it('should re-enable input after error', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      mockFetch.mockImplementation((url: string) => {
        const urlStr = String(url);
        if (urlStr.includes('openrouter') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
          throw new Error(`TEST TRIPWIRE: External network call attempted: ${urlStr}`);
        }

        if (urlStr === '/api/cocktails?fields=id,name' || urlStr === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (urlStr === '/api/mixi/chat') {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      await openMixiAndWait('Hello!');

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');

      await act(async () => {
        await user.type(input, 'Test');
        await user.click(sendButton);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(
        () => {
          expect(screen.getByTestId('mixi-chat-input')).not.toBeDisabled();
        },
        { timeout: 2000 }
      );
    });

    it('should not crash on malformed SSE data', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const malformedChunk = encoder.encode(
        `data: {invalid json}\n\n` +
          `data: ${JSON.stringify({ content: 'Valid content' })}\n\n` +
          `data: [DONE]\n\n`
      );

      const reader = createMockStreamReader([malformedChunk]);

      mockFetch.mockImplementation((url: string) => {
        const urlStr = String(url);
        if (urlStr.includes('openrouter') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
          throw new Error(`TEST TRIPWIRE: External network call attempted: ${urlStr}`);
        }

        if (urlStr === '/api/cocktails?fields=id,name' || urlStr === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (urlStr === '/api/mixi/chat') {
          return Promise.resolve(createMockResponse(reader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      await openMixiAndWait('Hello!');

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');

      await act(async () => {
        await user.type(input, 'Test');
        await user.click(sendButton);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(() => {
        const messages = screen.getByTestId('mixi-chat-messages');
        expect(messages.textContent).toContain('Valid content');
      });

      expect(screen.getByTestId('mixi-chat-input')).not.toBeDisabled();
    });

    it('should handle missing response body gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      mockFetch.mockImplementation((url: string) => {
        const urlStr = String(url);
        if (urlStr.includes('openrouter') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
          throw new Error(`TEST TRIPWIRE: External network call attempted: ${urlStr}`);
        }

        if (urlStr === '/api/cocktails?fields=id,name' || urlStr === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (urlStr === '/api/mixi/chat') {
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: new Headers(),
            body: null,
          } as Response);
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      await openMixiAndWait('Hi!');

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');

      await act(async () => {
        await user.type(input, 'Test');
        await user.click(sendButton);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(() => {
        const messages = screen.getByTestId('mixi-chat-messages');
        expect(messages.textContent).toContain('trouble connecting');
      });
    });
  });

  describe('No third-party API calls', () => {
    it('should only call internal /api endpoints (via mockFetch calls)', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      const chunks = [makeSSEChunk('Response'), makeDoneChunk()];
      const reader = createMockStreamReader(chunks);

      mockFetch.mockImplementation((url: string) => {
        const urlStr = String(url);
        if (urlStr.includes('openrouter') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
          throw new Error(`TEST TRIPWIRE: External network call attempted: ${urlStr}`);
        }

        if (urlStr === '/api/cocktails?fields=id,name' || urlStr === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (urlStr === '/api/mixi/chat') {
          return Promise.resolve(createMockResponse(reader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      await openMixiAndWait('Hello!');

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');

      await act(async () => {
        await user.type(input, 'Test');
        await user.click(sendButton);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(() => {
        const messages = screen.getByTestId('mixi-chat-messages');
        expect(messages.textContent).toContain('Response');
      });

      const urls = getFetchUrls();
      expect(urls.length).toBeGreaterThan(0);

      for (const url of urls) {
        expect(url).not.toContain('openrouter.ai');
        expect(url).not.toContain('api.openai.com');
        expect(url).not.toContain('https://');
        expect(url).not.toContain('http://');
        expect(url.startsWith('/api/')).toBe(true);
      }
    });

    it('should use mocked fetch throughout test suite', () => {
      expect(global.fetch).toBe(mockFetch);
    });
  });

  describe('UI state during streaming', () => {
    it('should disable input during streaming', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      let resolveStream: (() => void) | null = null;
      const blockingPromise = new Promise<void>((resolve) => {
        resolveStream = resolve;
      });

      const slowReader = {
        read: vi.fn(async () => {
          await blockingPromise;
          return { done: true, value: undefined };
        }),
        releaseLock: vi.fn(),
        cancel: vi.fn(),
      };

      mockFetch.mockImplementation((url: string) => {
        const urlStr = String(url);
        if (urlStr.includes('openrouter') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
          throw new Error(`TEST TRIPWIRE: External network call attempted: ${urlStr}`);
        }

        if (urlStr === '/api/cocktails?fields=id,name' || urlStr === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (urlStr === '/api/mixi/chat') {
          return Promise.resolve(createMockResponse(slowReader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      await openMixiAndWait('Hello!');

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');

      await act(async () => {
        await user.type(input, 'Test');
      });

      await act(async () => {
        fireEvent.click(sendButton);
        await vi.advanceTimersByTimeAsync(10);
      });

      await waitFor(() => {
        expect(screen.getByTestId('mixi-chat-input')).toBeDisabled();
      });

      await act(async () => {
        if (resolveStream) resolveStream();
        await vi.advanceTimersByTimeAsync(50);
      });
    });

    it('should show streaming indicator during streaming', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      let resolveStream: (() => void) | null = null;
      const blockingPromise = new Promise<void>((resolve) => {
        resolveStream = resolve;
      });

      let callCount = 0;
      const slowReader = {
        read: vi.fn(async () => {
          callCount++;
          if (callCount === 1) {
            return { done: false, value: makeSSEChunk('Loading...') };
          }
          await blockingPromise;
          return { done: true, value: undefined };
        }),
        releaseLock: vi.fn(),
        cancel: vi.fn(),
      };

      mockFetch.mockImplementation((url: string) => {
        const urlStr = String(url);
        if (urlStr.includes('openrouter') || urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
          throw new Error(`TEST TRIPWIRE: External network call attempted: ${urlStr}`);
        }

        if (urlStr === '/api/cocktails?fields=id,name' || urlStr === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (urlStr === '/api/mixi/chat') {
          return Promise.resolve(createMockResponse(slowReader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      await openMixiAndWait('Hello!');

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');

      await act(async () => {
        await user.type(input, 'Test');
      });

      await act(async () => {
        fireEvent.click(sendButton);
        await vi.advanceTimersByTimeAsync(10);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('mixi-chat-streaming-indicator')).toBeInTheDocument();
      }, { timeout: 1000 });

      await act(async () => {
        if (resolveStream) resolveStream();
        await vi.advanceTimersByTimeAsync(50);
      });
    });
  });
});