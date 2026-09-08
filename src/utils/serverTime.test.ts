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
        return callCount === 1 ? 100 : 200; // 100ms latency
      });

      // Mock Date.now for predictable local time
      let dateCallCount = 0;
      vi.spyOn(Date, 'now').mockImplementation(() => {
        dateCallCount++;
        // return 1000 then 1100 => latency 100
        return dateCallCount === 1 ? 1000 : 1100;
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

    it('handles CORS or network errors correctly', async () => {
      // Simulate a TypeError which happens on CORS blocks or network failures
      (globalThis.fetch as any).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const result = await fetchServerTime('https://example.com');

      expect(result.error).toContain('CORS restrictions or network errors');
      expect(result.isCorsError).toBe(true);
      expect(result.serverTime).toBeNull();
    });

    it('calculates server time difference correctly', async () => {
      // Midpoint local time will be 1000 + (100 / 2) = 1050
      // Let's say server returns a date that evaluates to 1200ms (note: toUTCString only gives seconds precision, so we use 2000 to be safe and test difference)
      // So estimated difference should be 2000 - 1050 = 950

      const mockHeaders = new Headers();
      // "Thu, 01 Jan 1970 00:00:02 GMT" is 2000ms after epoch
      mockHeaders.set('Date', new Date(2000).toUTCString());

      (globalThis.fetch as any).mockResolvedValueOnce({
        headers: mockHeaders
      });

      const result = await fetchServerTime('https://example.com');

      expect(result.error).toBeUndefined();
      expect(result.networkLatencyMs).toBe(100);
      expect(result.estimatedDifferenceMs).toBe(950); // 2000 - 1050
      expect(result.serverTime?.getTime()).toBe(2000);
    });

    it('returns error if server has no Date header', async () => {
      const mockHeaders = new Headers();
      (globalThis.fetch as any).mockResolvedValueOnce({
        headers: mockHeaders
      });

      const result = await fetchServerTime('https://example.com');

      expect(result.error).toContain('did not return a Date header');
      expect(result.serverTime).toBeNull();
    });
  });
});
