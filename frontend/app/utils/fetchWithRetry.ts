/**
 * Fetch with automatic retry logic and exponential backoff
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  onRetry: () => {},
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculate delay with exponential backoff
 */
const calculateDelay = (attempt: number, options: Required<RetryOptions>): number => {
  const delay = Math.min(
    options.initialDelay * Math.pow(options.backoffFactor, attempt),
    options.maxDelay
  );
  return delay;
};

/**
 * Fetch with retry logic
 * 
 * @param url - The URL to fetch
 * @param init - Fetch init options
 * @param retryOptions - Retry configuration options
 * @returns Promise<Response>
 * 
 * @example
 * ```ts
 * const response = await fetchWithRetry('https://api.example.com/data', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ data: 'test' })
 * }, {
 *   maxRetries: 3,
 *   onRetry: (attempt, error) => {
 *     console.log(`Retry attempt ${attempt}: ${error.message}`);
 *   }
 * });
 * ```
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  const options = { ...defaultOptions, ...retryOptions };
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      const response = await fetch(url, init);

      // Retry on 5xx server errors or 429 (Too Many Requests)
      if (response.status >= 500 || response.status === 429) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      // Return successful response (including 4xx client errors - don't retry those)
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this was the last attempt, throw the error
      if (attempt === options.maxRetries) {
        break;
      }

      // Calculate delay and notify about retry
      const delay = calculateDelay(attempt, options);
      options.onRetry(attempt + 1, lastError);

      // Wait before retrying
      await sleep(delay);
    }
  }

  // All retries failed
  throw new Error(
    `Failed after ${options.maxRetries} retries: ${lastError.message}`
  );
}

/**
 * Fetch JSON with retry logic
 * 
 * @param url - The URL to fetch
 * @param init - Fetch init options
 * @param retryOptions - Retry configuration options
 * @returns Promise<T> - Parsed JSON response
 */
export async function fetchJsonWithRetry<T>(
  url: string,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<T> {
  const response = await fetchWithRetry(url, init, retryOptions);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Check if error is retriable
 */
export function isRetriableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const retriableErrors = [
    "Failed to fetch", // Network error
    "NetworkError", // Network error
    "TimeoutError", // Timeout
    "Server error: 5", // 5xx errors
    "Server error: 429", // Rate limiting
  ];

  return retriableErrors.some((msg) => error.message.includes(msg));
}
