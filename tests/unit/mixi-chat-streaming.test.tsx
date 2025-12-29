import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

function createMockResponse(reader: ReturnType<typeof createMockStreamReader>, ok = true, status = 200) {
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
  let fetchCallHistory: Array<{ url: string; options?: RequestInit }> = [];

  beforeEach(() => {
    originalFetch = global.fetch;
    fetchCallHistory = [];
    mockFetch = vi.fn((url: string, options?: RequestInit) => {
      fetchCallHistory.push({ url, options });
      if (url === '/api/cocktails?fields=id,name' || url === '/api/cocktails') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        } as Response);
      }
      return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
    });
    global.fetch = mockFetch;
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Streaming chunk handling and accumulation', () => {
    it('should accumulate streaming chunks in order', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      const chunks = [
        makeSSEChunk('Hello '),
        makeSSEChunk('from '),
        makeSSEChunk('Mixi!'),
        makeDoneChunk(),
      ];
      
      const reader = createMockStreamReader(chunks);
      
      mockFetch.mockImplementation((url: string) => {
        fetchCallHistory.push({ url });
        if (url === '/api/cocktails?fields=id,name' || url === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (url === '/api/mixi/chat') {
          return Promise.resolve(createMockResponse(reader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      
      await act(async () => {
        openMixi({ seed: 'Welcome!' });
        await vi.advanceTimersByTimeAsync(50);
      });

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');
      
      await act(async () => {
        await user.type(input, 'Test message');
      });
      
      await act(async () => {
        await user.click(sendButton);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(() => {
        const messages = screen.getByTestId('mixi-chat-messages');
        expect(messages.textContent).toContain('Hello from Mixi!');
      }, { timeout: 2000 });
    });

    it('should handle multi-line SSE chunks correctly', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      const combinedChunk = encoder.encode(
        `data: ${JSON.stringify({ content: 'Part 1 ' })}\n\n` +
        `data: ${JSON.stringify({ content: 'Part 2' })}\n\n` +
        `data: [DONE]\n\n`
      );
      
      const reader = createMockStreamReader([combinedChunk]);
      
      mockFetch.mockImplementation((url: string) => {
        fetchCallHistory.push({ url });
        if (url === '/api/cocktails?fields=id,name' || url === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (url === '/api/mixi/chat') {
          return Promise.resolve(createMockResponse(reader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      
      await act(async () => {
        openMixi({ seed: 'Welcome!' });
        await vi.advanceTimersByTimeAsync(50);
      });

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');
      
      await act(async () => {
        await user.type(input, 'Test');
        await user.click(sendButton);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(() => {
        const messages = screen.getByTestId('mixi-chat-messages');
        expect(messages.textContent).toContain('Part 1 Part 2');
      }, { timeout: 2000 });
    });
  });

  describe('Stream completion behavior', () => {
    it('should handle [DONE] sentinel correctly', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      const chunks = [
        makeSSEChunk('Complete message'),
        makeDoneChunk(),
      ];
      
      const reader = createMockStreamReader(chunks);
      
      mockFetch.mockImplementation((url: string) => {
        fetchCallHistory.push({ url });
        if (url === '/api/cocktails?fields=id,name' || url === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (url === '/api/mixi/chat') {
          return Promise.resolve(createMockResponse(reader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      
      await act(async () => {
        openMixi({ seed: 'Welcome!' });
        await vi.advanceTimersByTimeAsync(50);
      });

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
        const input = screen.getByTestId('mixi-chat-input');
        expect(input).not.toBeDisabled();
      });
    });

    it('should re-enable input after stream completes', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      const chunks = [
        makeSSEChunk('Response'),
        makeDoneChunk(),
      ];
      
      const reader = createMockStreamReader(chunks);
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/cocktails?fields=id,name' || url === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (url === '/api/mixi/chat') {
          return Promise.resolve(createMockResponse(reader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      
      await act(async () => {
        openMixi({ seed: 'Hi!' });
        await vi.advanceTimersByTimeAsync(50);
      });

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');
      
      await act(async () => {
        await user.type(input, 'Test');
        await user.click(sendButton);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(() => {
        const inputAfter = screen.getByTestId('mixi-chat-input');
        expect(inputAfter).not.toBeDisabled();
      }, { timeout: 2000 });
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
          await new Promise(resolve => setTimeout(resolve, 5000));
          return { done: false, value: makeSSEChunk('more') };
        }),
        releaseLock: vi.fn(),
        cancel: vi.fn(),
      };
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/cocktails?fields=id,name' || url === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (url === '/api/mixi/chat') {
          return Promise.resolve(createMockResponse(slowReader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      
      await act(async () => {
        openMixi({ seed: 'Hello!' });
        await vi.advanceTimersByTimeAsync(50);
      });

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

      expect(readCallCount).toBeLessThanOrEqual(2);
    });

    it('should use AbortController for fetch cancellation', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      let capturedSignal: AbortSignal | undefined;
      
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/cocktails?fields=id,name' || url === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (url === '/api/mixi/chat') {
          capturedSignal = options?.signal as AbortSignal;
          const reader = createMockStreamReader([
            makeSSEChunk('Starting...'),
          ]);
          return Promise.resolve(createMockResponse(reader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      
      await act(async () => {
        openMixi({ seed: 'Hi!' });
        await vi.advanceTimersByTimeAsync(50);
      });

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');
      
      await act(async () => {
        await user.type(input, 'Test');
        await user.click(sendButton);
        await vi.advanceTimersByTimeAsync(50);
      });

      expect(capturedSignal).toBeDefined();
      expect(capturedSignal instanceof AbortSignal).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should display error message on HTTP failure', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/cocktails?fields=id,name' || url === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (url === '/api/mixi/chat') {
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
      
      await act(async () => {
        openMixi({ seed: 'Welcome!' });
        await vi.advanceTimersByTimeAsync(50);
      });

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');
      
      await act(async () => {
        await user.type(input, 'Hello');
        await user.click(sendButton);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(() => {
        const messages = screen.getByTestId('mixi-chat-messages');
        expect(messages.textContent).toContain("trouble connecting");
      });
    });

    it('should re-enable input after error', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/cocktails?fields=id,name' || url === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (url === '/api/mixi/chat') {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      
      await act(async () => {
        openMixi({ seed: 'Hello!' });
        await vi.advanceTimersByTimeAsync(50);
      });

      const input = screen.getByTestId('mixi-chat-input');
      const sendButton = screen.getByTestId('mixi-chat-send-button');
      
      await act(async () => {
        await user.type(input, 'Test');
        await user.click(sendButton);
        await vi.advanceTimersByTimeAsync(100);
      });

      await waitFor(() => {
        const inputAfter = screen.getByTestId('mixi-chat-input');
        expect(inputAfter).not.toBeDisabled();
      }, { timeout: 2000 });
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
        if (url === '/api/cocktails?fields=id,name' || url === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (url === '/api/mixi/chat') {
          return Promise.resolve(createMockResponse(reader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      
      await act(async () => {
        openMixi({ seed: 'Hello!' });
        await vi.advanceTimersByTimeAsync(50);
      });

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
        if (url === '/api/cocktails?fields=id,name' || url === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (url === '/api/mixi/chat') {
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
      
      await act(async () => {
        openMixi({ seed: 'Hi!' });
        await vi.advanceTimersByTimeAsync(50);
      });

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
    it('should only call internal API endpoints', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      const chunks = [
        makeSSEChunk('Response'),
        makeDoneChunk(),
      ];
      
      const reader = createMockStreamReader(chunks);
      
      mockFetch.mockImplementation((url: string) => {
        fetchCallHistory.push({ url });
        if (url === '/api/cocktails?fields=id,name' || url === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (url === '/api/mixi/chat') {
          return Promise.resolve(createMockResponse(reader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      
      await act(async () => {
        openMixi({ seed: 'Hello!' });
        await vi.advanceTimersByTimeAsync(50);
      });

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

      for (const call of fetchCallHistory) {
        expect(call.url).not.toContain('openrouter.ai');
        expect(call.url).not.toContain('api.openai.com');
        expect(call.url).not.toContain('https://');
        expect(call.url).not.toContain('http://');
        expect(call.url.startsWith('/api/')).toBe(true);
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
      const blockingPromise = new Promise<void>(resolve => { resolveStream = resolve; });
      
      const slowReader = {
        read: vi.fn(async () => {
          await blockingPromise;
          return { done: true, value: undefined };
        }),
        releaseLock: vi.fn(),
        cancel: vi.fn(),
      };
      
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/cocktails?fields=id,name' || url === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (url === '/api/mixi/chat') {
          return Promise.resolve(createMockResponse(slowReader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      
      await act(async () => {
        openMixi({ seed: 'Hello!' });
        await vi.advanceTimersByTimeAsync(50);
      });

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
      const blockingPromise = new Promise<void>(resolve => { resolveStream = resolve; });
      
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
        if (url === '/api/cocktails?fields=id,name' || url === '/api/cocktails') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([]),
          } as Response);
        }
        if (url === '/api/mixi/chat') {
          return Promise.resolve(createMockResponse(slowReader, true));
        }
        return Promise.resolve(createMockResponse(createMockStreamReader([]), true));
      });

      render(<MixiChat />);
      
      await act(async () => {
        openMixi({ seed: 'Hello!' });
        await vi.advanceTimersByTimeAsync(50);
      });

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
