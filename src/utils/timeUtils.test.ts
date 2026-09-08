import { describe, it, expect } from 'vitest';
import { formatTimeWithMilliseconds, formatStopwatchTime } from './timeUtils';

describe('timeUtils', () => {
  describe('formatTimeWithMilliseconds', () => {
    it('formats a date correctly', () => {
      // Create a specific date: Jan 1, 2020 05:08:09.042
      const date = new Date(2020, 0, 1, 5, 8, 9, 42);
      const result = formatTimeWithMilliseconds(date);
      expect(result).toBe('05:08:09.042');
    });

    it('formats a date correctly for afternoon (24h format)', () => {
      // Create a specific date: Jan 1, 2020 20:41:32.583
      const date = new Date(2020, 0, 1, 20, 41, 32, 583);
      const result = formatTimeWithMilliseconds(date);
      expect(result).toBe('20:41:32.583');
    });
  });

  describe('formatStopwatchTime', () => {
    it('formats 0ms correctly', () => {
      expect(formatStopwatchTime(0)).toBe('00:00:00.000');
    });

    it('formats milliseconds correctly', () => {
      expect(formatStopwatchTime(42)).toBe('00:00:00.042');
      expect(formatStopwatchTime(482)).toBe('00:00:00.482');
    });

    it('formats seconds correctly', () => {
      expect(formatStopwatchTime(5000)).toBe('00:00:05.000');
      expect(formatStopwatchTime(59999)).toBe('00:00:59.999');
    });

    it('formats minutes correctly', () => {
      expect(formatStopwatchTime(60000)).toBe('00:01:00.000');
      // 3 minutes, 27 seconds, 482 ms -> 3 * 60000 + 27 * 1000 + 482 = 180000 + 27000 + 482 = 207482
      expect(formatStopwatchTime(207482)).toBe('00:03:27.482');
    });

    it('formats hours correctly', () => {
      // 1 hour, 1 minute, 1 second, 1 ms
      // 3600000 + 60000 + 1000 + 1 = 3661001
      expect(formatStopwatchTime(3661001)).toBe('01:01:01.001');
    });
  });
});
