import { useState, useEffect, useRef } from 'react';
import { fetchServerTime, type ServerTimeResult } from '../utils/serverTime';
import { formatTimeWithMilliseconds } from '../utils/timeUtils';

export function WebsiteTime() {
  const [url, setUrl] = useState('https://example.com');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ServerTimeResult | null>(null);

  const [continuousServerTime, setContinuousServerTime] = useState<Date | null>(null);
  const requestRef = useRef<number>(null);

  // Update the continuous server time based on local elapsed time since the request completed
  useEffect(() => {
    if (!result || result.estimatedDifferenceMs === null) {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
      return;
    }

    const diff = result.estimatedDifferenceMs;

    const updateTime = () => {
      // server time = local time + (server - local difference)
      setContinuousServerTime(new Date(Date.now() + diff));
      requestRef.current = requestAnimationFrame(updateTime);
    };

    requestRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [result]);

  const handleCheck = async (e?: { preventDefault: () => void }) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    // ensure protocol exists
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
      setUrl(formattedUrl);
    }

    setIsLoading(true);
    setResult(null);
    setContinuousServerTime(null);

    const data = await fetchServerTime(formattedUrl);
    setResult(data);
    setIsLoading(false);
  };

  const formatDiff = (diff: number | null) => {
    if (diff === null) return null;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${Math.round(diff)} ms`;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      <form onSubmit={handleCheck} className="w-full flex flex-col sm:flex-row gap-4 mb-10">
        <div className="flex-grow">
          <label htmlFor="url-input" className="sr-only">Website URL</label>
          <input
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-6 py-4 rounded-xl border-2 border-primary-accent/20 bg-white/50 focus:bg-white focus:outline-none focus:border-primary-accent focus:ring-4 focus:ring-primary-accent/20 transition-all text-lg shadow-sm"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="px-8 py-4 rounded-xl font-semibold text-white bg-primary-accent hover:bg-secondary-accent transition-colors focus:outline-none focus:ring-4 focus:ring-primary-accent/50 shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? 'Checking...' : 'Check Server Time'}
        </button>
      </form>

      {result && (
        <div className="w-full bg-white/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-sm border border-primary-accent/10">

          <div className="mb-6 pb-6 border-b border-primary-accent/10">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-main/50 mb-1">Target Website</h3>
            <div className="text-xl font-medium truncate" title={url}>{url}</div>
          </div>

          {result.error ? (
            <div className="text-red-700 bg-red-50 p-4 rounded-lg border border-red-100 flex flex-col gap-2">
              <p className="font-medium">Error checking server time</p>
              <p className="text-sm opacity-90">{result.error}</p>
              {result.isCorsError && (
                <p className="text-xs mt-2 opacity-80 italic">
                  Note: Browser security prevents checking most websites directly. In a production environment,
                  this application would need a proxy server to bypass CORS.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-main/50 mb-2">Estimated Server Time</h3>
                <div className="text-3xl font-bold font-mono tracking-tighter tabular-nums text-secondary-accent">
                  {continuousServerTime ? formatTimeWithMilliseconds(continuousServerTime) : 'N/A'}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-main/50 mb-2">Local Time at Request</h3>
                <div className="text-3xl font-bold font-mono tracking-tighter tabular-nums">
                  {formatTimeWithMilliseconds(result.localTime)}
                </div>
              </div>

              <div className="sm:col-span-2 grid grid-cols-2 gap-4 mt-2 bg-primary-accent/5 p-4 rounded-xl">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-main/50 mb-1">Server Offset</h3>
                  <div className="text-xl font-mono">
                    {formatDiff(result.estimatedDifferenceMs)}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-main/50 mb-1">Network Latency (RTT)</h3>
                  <div className="text-xl font-mono">
                    {result.networkLatencyMs ? `${Math.round(result.networkLatencyMs)} ms` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
