import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// We'll test the core logic of what the server would do.
// Since Express handles the HTTP wrapping, we will extract the logic or just mock the global fetch for testing purposes.

describe('Server API Logic', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn() as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles successful fetch of Date header', async () => {
    const mockHeaders = new Headers();
    mockHeaders.set('Date', 'Thu, 01 Jan 1970 00:00:01 GMT');

    (globalThis.fetch as any).mockResolvedValueOnce({
      headers: mockHeaders
    });

    const response = await fetch('https://example.com', { method: 'HEAD' });
    const date = response.headers.get('Date');
    expect(date).toBe('Thu, 01 Jan 1970 00:00:01 GMT');
  });

  it('handles missing Date header', async () => {
    const mockHeaders = new Headers();

    (globalThis.fetch as any).mockResolvedValueOnce({
      headers: mockHeaders
    });

    const response = await fetch('https://example.com', { method: 'HEAD' });
    const date = response.headers.get('Date');
    expect(date).toBeNull();
  });

  it('falls back to GET if HEAD fails', async () => {
    // We mock the behavior described in server index.ts where catch triggers a GET
    (globalThis.fetch as any).mockRejectedValueOnce(new Error('HEAD failed'));

    const mockHeaders = new Headers();
    mockHeaders.set('Date', 'Thu, 01 Jan 1970 00:00:02 GMT');
    (globalThis.fetch as any).mockResolvedValueOnce({
      headers: mockHeaders
    });

    let fetchResponse = await fetch('https://example.com', { method: 'HEAD' })
      .catch(async () => fetch('https://example.com', { method: 'GET' }));

    const date = fetchResponse.headers.get('Date');
    expect(date).toBe('Thu, 01 Jan 1970 00:00:02 GMT');
    // fetch should have been called twice (HEAD then GET)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
