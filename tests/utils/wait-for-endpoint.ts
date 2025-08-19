export interface WaitForEndpointOptions {
  timeoutMs?: number;
  intervalMs?: number;
}

/**
 * Polls the provided URL until it responds or the timeout is reached.
 * Resolves with the first successful Response object.
 * Throws an error if the server doesn't respond within the timeout.
 */
export async function waitForEndpoint(
  url: string,
  { timeoutMs = 5000, intervalMs = 250 }: WaitForEndpointOptions = {}
): Promise<Response> {
  const start = Date.now();
  let lastError: unknown;

  while (Date.now() - start < timeoutMs) {
    try {
      // Any response (even non-2xx) indicates the server is reachable
      return await fetch(url);
    } catch (err) {
      lastError = err;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    `Failed to reach ${url} after ${timeoutMs}ms` +
      (lastError ? ` (last error: ${String(lastError)})` : '')
  );
}
