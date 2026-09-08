export interface ServerTimeResult {
  serverTime: Date | null;
  localTime: Date;
  estimatedDifferenceMs: number | null;
  networkLatencyMs: number | null;
  error?: string;
  isCorsError?: boolean;
}

export function isValidUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

export async function fetchServerTime(url: string): Promise<ServerTimeResult> {
  if (!isValidUrl(url)) {
    return {
      serverTime: null,
      localTime: new Date(),
      estimatedDifferenceMs: null,
      networkLatencyMs: null,
      error: 'Invalid URL. Please enter a valid HTTP or HTTPS URL.',
    };
  }

  const startMark = performance.now();
  const startLocalTime = Date.now();

  try {
    // Try HEAD request first, if not allowed, some servers might need GET, but HEAD is lighter.
    const response = await fetch(url, {
      method: 'HEAD',
      // No mode: 'no-cors' here because we NEED to read headers, which no-cors prevents (opaque response).
      // We rely on the server having CORS enabled or we catch the error.
      cache: 'no-cache',
    });

    const endMark = performance.now();

    const latency = endMark - startMark;
    const midpointLocalTime = startLocalTime + (latency / 2);

    const dateHeader = response.headers.get('Date');

    if (!dateHeader) {
      return {
        serverTime: null,
        localTime: new Date(midpointLocalTime),
        estimatedDifferenceMs: null,
        networkLatencyMs: latency,
        error: 'The server did not return a Date header.',
      };
    }

    const serverDate = new Date(dateHeader);
    const serverTimeMs = serverDate.getTime();

    // Calculate difference (server time - local time).
    // Positive means server is ahead, negative means server is behind.
    const estimatedDifferenceMs = serverTimeMs - midpointLocalTime;

    return {
      serverTime: serverDate,
      localTime: new Date(midpointLocalTime),
      estimatedDifferenceMs,
      networkLatencyMs: latency,
    };
  } catch (error: any) {
    // Determine if it might be a CORS error (fetch fails with TypeError when CORS blocks).
    // Note: It could also be a network error or invalid domain.
    const isTypeError = error instanceof TypeError;

    return {
      serverTime: null,
      localTime: new Date(),
      estimatedDifferenceMs: null,
      networkLatencyMs: null,
      error: isTypeError
        ? 'Unable to directly access this website from the browser because of CORS restrictions or network errors.'
        : 'An error occurred while fetching the server time.',
      isCorsError: isTypeError
    };
  }
}
