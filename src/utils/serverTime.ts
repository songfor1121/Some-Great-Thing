export interface ServerTimeResult {
  serverTime: Date | null;
  localTime: Date;
  estimatedDifferenceMs: number | null;
  networkLatencyMs: number | null;
  error?: string;
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

  const SAMPLES = 3;
  let bestResult: ServerTimeResult | null = null;

  // Make multiple requests and prefer the lowest RTT
  for (let i = 0; i < SAMPLES; i++) {
    const startMark = performance.now();
    const startLocalTime = Date.now();

    try {
      const response = await fetch('http://localhost:3001/api/server-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const endMark = performance.now();
      const latency = endMark - startMark;
      const midpointLocalTime = startLocalTime + (latency / 2);

      const data = await response.json();

      if (!response.ok) {
        // Return immediately if it's an API error (not a latency selection issue)
        return {
          serverTime: null,
          localTime: new Date(midpointLocalTime),
          estimatedDifferenceMs: null,
          networkLatencyMs: latency,
          error: data.error || 'Failed to fetch server time.',
        };
      }

      const dateHeader = data.dateHeader;
      const serverDate = new Date(dateHeader);
      const serverTimeMs = serverDate.getTime();
      const estimatedDifferenceMs = serverTimeMs - midpointLocalTime;

      const currentResult: ServerTimeResult = {
        serverTime: serverDate,
        localTime: new Date(midpointLocalTime),
        estimatedDifferenceMs,
        networkLatencyMs: latency,
      };

      if (!bestResult || latency < (bestResult.networkLatencyMs || Infinity)) {
        bestResult = currentResult;
      }

    } catch (error: any) {
      // Network error reaching our own API
      return {
        serverTime: null,
        localTime: new Date(),
        estimatedDifferenceMs: null,
        networkLatencyMs: null,
        error: 'Unable to connect to the proxy server API.',
      };
    }
  }

  return bestResult || {
    serverTime: null,
    localTime: new Date(),
    estimatedDifferenceMs: null,
    networkLatencyMs: null,
    error: 'Failed to process server time.',
  };
}
