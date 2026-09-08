import { useState, useEffect, useRef, useCallback } from 'react';
import { synchronizeClock, type SyncResult } from '../utils/syncAlgorithm';
import { formatTimeWithMilliseconds, formatDateFull } from '../utils/timeUtils';

// This combines the Local Time and the Server Time checker.
export function Clock() {
  // Local time state
  const [localNow, setLocalNow] = useState(new Date());
  const requestRef = useRef<number>(null);

  // Server time state
  const [url, setUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('');

  // To prevent drift, we store the monotonic time at the exact moment of the best sync,
  // and the estimated server time at that same moment.
  const syncStateRef = useRef<{
    serverTimeAtSyncMs: number;
    performanceAtSync: number;
    localEpochAtSync: number;
  } | null>(null);

  const [continuousServerTime, setContinuousServerTime] = useState<Date | null>(null);

  // Ref to hold the timeout for periodic resync
  const resyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The main render loop for clocks
  useEffect(() => {
    const updateTime = () => {
      const nowMs = Date.now();
      const perfNow = performance.now();

      // 1. Update local time
      setLocalNow(new Date(nowMs));

      // 2. Update server time (if we are synchronized)
      if (syncStateRef.current) {
        const { serverTimeAtSyncMs, performanceAtSync } = syncStateRef.current;
        const elapsedSinceSync = perfNow - performanceAtSync;
        const estimatedServerNowMs = serverTimeAtSyncMs + elapsedSinceSync;
        setContinuousServerTime(new Date(estimatedServerNowMs));
      }

      requestRef.current = requestAnimationFrame(updateTime);
    };

    requestRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  const performSync = useCallback(async (targetUrl: string, isInitial = false) => {
    if (isInitial) {
      setIsSyncing(true);
      setStatusMsg('Synchronizing (taking 8 samples)...');
      setSyncResult(null);
      setContinuousServerTime(null);
      syncStateRef.current = null;
    } else {
      setStatusMsg('Resynchronizing in background...');
    }

    const result = await synchronizeClock(targetUrl, 8);

    if (result.error) {
      if (isInitial) {
        setSyncResult(result);
        setIsSyncing(false);
        setStatusMsg('Error');
      } else {
        setStatusMsg('Connection lost — using last synchronization');
        // Do not overwrite previous successful sync state
      }
      return;
    }

    if (result.bestSample) {
      // Calculate exactly what the monotonic performance time was at the *midpoint* of the best sample.
      // t1 = before fetch, t2 = after fetch, rtt = t2 - t1
      // Midpoint performance time = t1 + (rtt / 2)
      const bestMidpointPerf = result.bestSample.t1 + (result.bestSample.rtt / 2);

      // At `bestMidpointPerf`, the server time was exactly `serverDateMs`.
      // However, HTTP Date is only accurate to the second. But it's the best reference we have.
      syncStateRef.current = {
        serverTimeAtSyncMs: result.bestSample.serverDateMs,
        performanceAtSync: bestMidpointPerf,
        localEpochAtSync: Date.now() // rough tracking for display
      };

      setSyncResult(result);
      setStatusMsg('Synchronized');

      if (isInitial) {
        setIsSyncing(false);
      }

      // Schedule next resync (e.g., 20 seconds)
      if (resyncTimeoutRef.current) clearTimeout(resyncTimeoutRef.current);
      resyncTimeoutRef.current = setTimeout(() => {
        performSync(targetUrl, false);
      }, 20000);
    }
  }, []);

  const handleCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    // ensure protocol exists
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
      setUrl(formattedUrl);
    }

    // Clear old resyncs
    if (resyncTimeoutRef.current) clearTimeout(resyncTimeoutRef.current);

    await performSync(formattedUrl, true);
  };

  // Cleanup resync on unmount
  useEffect(() => {
    return () => {
      if (resyncTimeoutRef.current) clearTimeout(resyncTimeoutRef.current);
    };
  }, []);

  const formatDiff = (diff: number | null) => {
    if (diff === null) return null;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${Math.round(diff)} ms`;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-20">

      {/* 1. LOCAL CLOCK */}
      <div className="flex flex-col items-center justify-center text-center w-full">
        <div
          className="text-6xl sm:text-8xl md:text-9xl font-light font-mono tracking-tighter tabular-nums text-text-main"
          aria-live="polite"
          aria-atomic="true"
        >
          {formatTimeWithMilliseconds(localNow)}
        </div>
        <div className="mt-6 text-xl tracking-[0.2em] uppercase text-secondary-text">
          Current Local Time
        </div>
        <div className="mt-2 text-sm text-secondary-text/60 tracking-wider">
          {formatDateFull(localNow)}
        </div>
      </div>

      <div className="w-full h-px bg-primary-accent/20"></div>

      {/* 2. TARGET WEBSITE TIME */}
      <div className="flex flex-col items-center w-full">
        <h2 className="text-2xl font-light tracking-[0.3em] uppercase text-text-main mb-8">
          Website Time
        </h2>

        <form onSubmit={handleCheck} className="w-full flex flex-col sm:flex-row gap-4 mb-12 max-w-2xl">
          <div className="flex-grow">
            <label htmlFor="url-input" className="sr-only">Website URL</label>
            <input
              id="url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL (e.g. weverse.io)"
              className="w-full px-6 py-4 rounded-none bg-primary-bg border border-secondary-text/30 focus:outline-none focus:border-primary-accent transition-colors text-lg text-text-main placeholder-secondary-text/50"
              disabled={isSyncing}
            />
          </div>
          <button
            type="submit"
            disabled={isSyncing || !url.trim()}
            className="px-10 py-4 font-medium tracking-widest uppercase text-primary-bg bg-primary-accent hover:bg-primary-accent/90 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isSyncing ? 'Checking...' : 'Check Time'}
          </button>
        </form>

        {syncResult && (
          <div className="w-full max-w-2xl glass-panel p-8 sm:p-10 text-left">

            <div className="mb-8 pb-6 border-b border-primary-accent/20 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="overflow-hidden w-full">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-text mb-2">Target Website</h3>
                <div className="text-xl font-medium text-text-main truncate" title={url}>{url}</div>
              </div>

              {!syncResult.error && (
                <div className="flex flex-col sm:items-end shrink-0">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-text mb-2">Status</span>
                  <span className={`inline-flex items-center gap-2 text-sm font-medium ${statusMsg.includes('Connection lost') ? 'text-red-400' : 'text-primary-accent'}`}>
                    <span className={`w-2 h-2 rounded-full ${statusMsg.includes('Connection lost') ? 'bg-red-400' : 'bg-primary-accent animate-pulse'}`}></span>
                    {statusMsg}
                  </span>
                </div>
              )}
            </div>

            {syncResult.error && !syncStateRef.current ? (
              <div className="text-red-400 p-4 border border-red-900/50 bg-red-900/10 flex flex-col gap-2">
                <p className="font-medium tracking-wider uppercase text-sm">Error Synchronization</p>
                <p className="text-sm opacity-90">{syncResult.error}</p>
                <p className="text-xs mt-2 opacity-60">Please check the URL or try again later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">

                {/* Time Displays */}
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-text mb-3">Estimated Server Time</h3>
                    <div className="text-3xl font-light font-mono tracking-tighter tabular-nums text-primary-accent">
                      {continuousServerTime ? formatTimeWithMilliseconds(continuousServerTime) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-text mb-3">Local Time</h3>
                    <div className="text-3xl font-light font-mono tracking-tighter tabular-nums text-text-main">
                      {formatTimeWithMilliseconds(localNow)}
                    </div>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-secondary-text/20">
                  <div>
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-secondary-text mb-2">Server Offset</h3>
                    <div className="text-lg font-mono text-text-main">
                      {formatDiff(syncResult.offsetMs)}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-secondary-text mb-2">Lowest RTT</h3>
                    <div className="text-lg font-mono text-text-main">
                      {syncResult.rttMs ? `${Math.round(syncResult.rttMs)} ms` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-secondary-text mb-2">Samples</h3>
                    <div className="text-lg font-mono text-text-main">
                      {syncResult.samples.length} / 8
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-secondary-text mb-2">Reference Date</h3>
                    <div className="text-xs font-mono text-secondary-text truncate" title={syncResult.bestSample ? new Date(syncResult.bestSample.serverDateMs).toUTCString() : ''}>
                      {syncResult.bestSample ? new Date(syncResult.bestSample.serverDateMs).toLocaleTimeString() : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Diagnostics Section */}
                <div className="sm:col-span-2 pt-6 border-t border-secondary-text/20">
                    <details className="text-xs text-secondary-text font-mono group">
                      <summary className="cursor-pointer tracking-wider uppercase opacity-70 hover:opacity-100 transition-opacity outline-none">
                        Show Technical Diagnostics
                      </summary>
                      <div className="mt-4 p-4 bg-black/30 border border-secondary-text/10 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-secondary-text/20">
                              <th className="pb-2 pr-4 font-normal text-secondary-text/70">#</th>
                              <th className="pb-2 pr-4 font-normal text-secondary-text/70">RTT (ms)</th>
                              <th className="pb-2 pr-4 font-normal text-secondary-text/70">Offset (ms)</th>
                              <th className="pb-2 font-normal text-secondary-text/70">Selected</th>
                            </tr>
                          </thead>
                          <tbody>
                            {syncResult.samples.map((s, idx) => {
                              const isBest = s === syncResult.bestSample;
                              return (
                                <tr key={idx} className={`border-b border-secondary-text/10 ${isBest ? 'text-primary-accent' : 'text-text-main/70'}`}>
                                  <td className="py-2 pr-4">{idx + 1}</td>
                                  <td className="py-2 pr-4">{Math.round(s.rtt)}</td>
                                  <td className="py-2 pr-4">{Math.round(s.estimatedOffsetMs)}</td>
                                  <td className="py-2">{isBest ? '✓' : ''}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                        <div className="mt-4 opacity-60 leading-relaxed max-w-prose">
                          * Note: The HTTP Date header provides time to 1-second precision. By selecting the sample with the lowest RTT ({syncResult.rttMs ? Math.round(syncResult.rttMs) : 0}ms), we calculate a midpoint offset to minimize uncertainty. Continuous time is drawn monotonically from `performance.now()` utilizing this fixed offset, completely avoiding `setInterval` drift.
                        </div>
                      </div>
                    </details>
                </div>

              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
