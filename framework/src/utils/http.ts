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
    let lastError: any;

    for (let attempt = 1; attempt <= retries; attempt++) {
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
        return response;
      } catch (error: any) {
        lastError = error;

        if (attempt < retries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          await this.sleep(backoffMs);
        }
      }
    }

    throw new Error(`Failed after ${retries} attempts: ${lastError.message}`);
  }

  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
