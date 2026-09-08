import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isValidUrl, fetchServerTime } from './serverTime';

describe('serverTime', () => {
  describe('isValidUrl', () => {
    it('returns true for valid http/https URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://sub.domain.co.uk/path?q=1')).toBe(true);
    });

    it('returns false for invalid URLs or schemes', () => {
      expect(isValidUrl('example.com')).toBe(false); // missing protocol
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('not a url')).toBe(false);
    });
  });

  describe('fetchServerTime', () => {
    beforeEach(() => {
      // Mock fetch
      globalThis.fetch = vi.fn() as any;

      // Mock performance.now to simulate latency
      let callCount = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => {
        callCount++;
        // Start mark, End mark. Diff = 100ms.
        return (callCount % 2 === 1) ? 100 : 200;
      });

      // Mock Date.now for predictable local time
      vi.spyOn(Date, 'now').mockImplementation(() => {
        return 1000;
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns error for invalid URL', async () => {
      const result = await fetchServerTime('invalid-url');
      expect(result.error).toContain('Invalid URL');
      expect(result.serverTime).toBeNull();
    });

    it('handles proxy server network errors correctly', async () => {
      // Simulate network error connecting to our local API proxy
      (globalThis.fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const result = await fetchServerTime('https://example.com');

      expect(result.error).toContain('Unable to connect to the proxy server API');
      expect(result.serverTime).toBeNull();
    });

    it('calculates server time difference correctly over multiple samples', async () => {
      // It makes SAMPLES (3) requests. We will return successful responses for all 3.
      // We use 2000 as our server time. Midpoint is 1050 (1000 start + 100 latency / 2).
      // Difference = 2000 - 1050 = 950.

      const mockResponse = {
        ok: true,
        json: async () => ({ dateHeader: new Date(2000).toUTCString() })
      };

      (globalThis.fetch as any)
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockResponse);

      const result = await fetchServerTime('https://example.com');

      expect(result.error).toBeUndefined();
      expect(result.networkLatencyMs).toBe(100); // 100 is mocked in beforeEach
      expect(result.estimatedDifferenceMs).toBe(950);
      expect(result.serverTime?.getTime()).toBe(2000);
    });

    it('returns error if local proxy server responds with an error', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'The server did not return a Date header.' })
      });

      const result = await fetchServerTime('https://example.com');

      expect(result.error).toContain('did not return a Date header');
      expect(result.serverTime).toBeNull();
    });
  });
});
