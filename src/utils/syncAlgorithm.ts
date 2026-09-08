export interface SyncSample {
  t1: number;
  t2: number;
  rtt: number;
  serverDateMs: number;
  estimatedOffsetMs: number;
}

export interface SyncResult {
  samples: SyncSample[];
  bestSample: SyncSample | null;
  offsetMs: number | null;
  rttMs: number | null;
  error?: string;
}

/**
 * Make a single request to the backend proxy to get the Date header of the target URL.
 * Records monotonic timestamps (t1, t2) around the request to precisely calculate RTT and offset.
 */
async function fetchSyncSample(url: string): Promise<SyncSample | null> {
  const t1 = performance.now();

  try {
    const response = await fetch('http://localhost:3001/api/server-time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const t2 = performance.now();
    const rtt = t2 - t1;

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch server time.');
    }

    const serverDate = new Date(data.dateHeader);
    const serverDateMs = serverDate.getTime();

    // Convert t1 to a standard system timestamp equivalent (so we can compare to serverDateMs)
    // T1 in absolute time = Date.now() minus the elapsed time since T1.
    // However, it is more precise to calculate the midpoint local absolute time:
    const t2Absolute = Date.now();
    const t1Absolute = t2Absolute - rtt;
    const midpointAbsolute = t1Absolute + (rtt / 2);

    // offset = Server Time - Local Time
    const estimatedOffsetMs = serverDateMs - midpointAbsolute;

    return {
      t1,
      t2,
      rtt,
      serverDateMs,
      estimatedOffsetMs
    };
  } catch (error) {
    // Re-throw to be handled by caller
    throw error;
  }
}

/**
 * Perform a burst of synchronization samples to robustly estimate the server clock offset.
 */
export async function synchronizeClock(url: string, samplesCount = 8): Promise<SyncResult> {
  const samples: SyncSample[] = [];
  let lastError: string | undefined = undefined;

  for (let i = 0; i < samplesCount; i++) {
    try {
      const sample = await fetchSyncSample(url);
      if (sample) {
        samples.push(sample);
      }
    } catch (err: any) {
      lastError = err.message;
      // If we hit an error (e.g. invalid URL, offline), we might want to fail early,
      // but for temporary network blips, we could continue. We'll fail early to be safe.
      break;
    }
  }

  if (samples.length === 0) {
    return {
      samples: [],
      bestSample: null,
      offsetMs: null,
      rttMs: null,
      error: lastError || 'Failed to obtain any synchronization samples.'
    };
  }

  // Find the sample with the lowest RTT.
  // Lower RTT means less uncertainty about when the server generated the Date header.
  const bestSample = samples.reduce((prev, current) =>
    (prev.rtt < current.rtt) ? prev : current
  );

  return {
    samples,
    bestSample,
    offsetMs: bestSample.estimatedOffsetMs,
    rttMs: bestSample.rtt
  };
}
