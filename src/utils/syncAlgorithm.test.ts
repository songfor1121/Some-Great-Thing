import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { synchronizeClock } from './syncAlgorithm';

describe('syncAlgorithm', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn() as any;

    let perfCallCount = 0;
    // Mock performance.now(): t1 = 100, t2 = 200 (RTT = 100)
    vi.spyOn(performance, 'now').mockImplementation(() => {
      perfCallCount++;
      return (perfCallCount % 2 !== 0) ? 100 : 200;
    });

    // Mock Date.now() for the t2Absolute = Date.now() call.
    // If t2Absolute = 1000, then t1Absolute = 1000 - 100 = 900
    // midpointAbsolute = 900 + 50 = 950.
    vi.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calculates offset and correctly finds best sample (lowest RTT)', async () => {
    // We will make 3 samples instead of 8 to test the logic easily.

    const mockResponses = [
      { rttModifier: 0, serverTime: 2000 },  // Normal: RTT = 100 (t2=200, t1=100)
      { rttModifier: 50, serverTime: 2000 }, // Worse RTT: 150 (t2=250, t1=100)
      { rttModifier: -50, serverTime: 2000 } // Best RTT: 50 (t2=150, t1=100)
    ];

    let fetchCount = 0;
    // Override performance.now to simulate varying RTTs
    vi.spyOn(performance, 'now').mockImplementation(() => {
      const isStart = fetchCount % 2 === 0;
      if (!isStart) {
        // Return t2
        const rttMod = mockResponses[Math.floor(fetchCount/2)].rttModifier;
        fetchCount++;
        return 200 + rttMod;
      }
      fetchCount++;
      return 100; // t1
    });

    (globalThis.fetch as any).mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: async () => ({ dateHeader: new Date(2000).toUTCString() })
      });
    });

    const result = await synchronizeClock('https://example.com', 3);

    expect(result.error).toBeUndefined();
    expect(result.samples.length).toBe(3);

    // The best sample should be the 3rd one (index 2) with RTT of 50
    expect(result.bestSample?.rtt).toBe(50);
    expect(result.rttMs).toBe(50);

    // For RTT = 50:
    // t1Absolute = 1000 - 50 = 950
    // midpointAbsolute = 950 + 25 = 975
    // estimatedOffsetMs = 2000 - 975 = 1025
    expect(result.offsetMs).toBe(1025);
  });

  it('returns error if proxy is unreachable', async () => {
    (globalThis.fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const result = await synchronizeClock('https://example.com', 2);

    expect(result.error).toContain('Failed to fetch');
    expect(result.samples.length).toBe(0);
    expect(result.bestSample).toBeNull();
  });
});
