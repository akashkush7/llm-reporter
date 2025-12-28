/**
 * HTTP utilities with retry and timeout - Available to all plugins
 */
export class HttpClient {
  static async fetchWithRetry(
    url: string,
    options: {
      timeout?: number;
      retries?: number;
      headers?: Record<string, string>;
      method?: string;
      body?: string | FormData | null;
    } = {}
  ): Promise<Response> {
    const {
      timeout = 30000,
      retries = 3,
      headers = {},
      method = "GET",
      body = null,
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const fetchOptions: RequestInit = {
          method,
          signal: controller.signal,
          headers: {
            "User-Agent": "Report-Framework/1.0",
            ...headers,
          },
        };

        // Only add body for non-GET requests
        if (body && method !== "GET" && method !== "HEAD") {
          fetchOptions.body = body;
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        // 🔥 FIX: Check if response is OK, if not retry on server errors (5xx)
        if (response.ok || response.status < 500) {
          // Return successful responses or client errors (don't retry client errors)
          return response;
        }

        // Server error (5xx) - will retry
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error: any) {
        lastError = error;

        // Check if it's an abort error (timeout)
        const isTimeout =
          error.name === "AbortError" || error.message.includes("aborted");
        const isNetworkError =
          error.message.includes("fetch") || error.message.includes("network");

        console.warn(
          `[HttpClient] Attempt ${attempt + 1}/${retries} failed: ${
            error.message
          }${isTimeout ? " (timeout)" : ""}`
        );

        // If this is the last attempt, throw the error
        if (attempt === retries - 1) {
          break;
        }

        // 🔥 FIX: Exponential backoff with proper calculation
        // attempt 0 -> 1000ms, attempt 1 -> 2000ms, attempt 2 -> 4000ms
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.warn(`[HttpClient] Retrying in ${backoffMs}ms...`);
        await this.sleep(backoffMs);
      }
    }

    throw new Error(
      `Failed after ${retries} attempts: ${
        lastError?.message || "Unknown error"
      }`
    );
  }

  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
