import { useState, useEffect, useRef, useCallback } from 'react';
import { formatStopwatchTime } from '../utils/timeUtils';

export function Stopwatch() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Keep track of the accumulated time from previous run/pause cycles
  const accumulatedTimeRef = useRef(0);
  // Keep track of when the current run started
  const startTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number>(null);

  const updateTime = useCallback((timestamp: number) => {
    if (startTimeRef.current !== null) {
      const currentRunElapsed = timestamp - startTimeRef.current;
      setElapsedMs(accumulatedTimeRef.current + currentRunElapsed);
    }
    requestRef.current = requestAnimationFrame(updateTime);
  }, []);

  const handleStartPause = useCallback(() => {
    setIsRunning((prevIsRunning: boolean) => {
      if (prevIsRunning) {
        // Pausing: save the accumulated time
        if (startTimeRef.current !== null) {
          accumulatedTimeRef.current += performance.now() - startTimeRef.current;
        }
        startTimeRef.current = null;
        if (requestRef.current !== null) {
          cancelAnimationFrame(requestRef.current);
        }
      } else {
        // Starting / Resuming
        startTimeRef.current = performance.now();
        requestRef.current = requestAnimationFrame(updateTime);
      }
      return !prevIsRunning;
    });
  }, [updateTime]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    accumulatedTimeRef.current = 0;
    startTimeRef.current = null;
    setElapsedMs(0);
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scroll
        handleStartPause();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStartPause, handleReset]);

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto space-y-16 mt-8">
      <div
        className="text-6xl sm:text-8xl md:text-9xl font-light font-mono tracking-tighter tabular-nums text-primary-accent"
        aria-live="polite"
      >
        {formatStopwatchTime(elapsedMs)}
      </div>

      <div className="flex gap-6 sm:gap-10">
        {!isRunning ? (
          <button
            onClick={handleStartPause}
            className="px-10 py-4 font-medium tracking-[0.2em] uppercase text-primary-bg bg-primary-accent hover:bg-primary-accent/90 transition-colors focus:outline-none focus:ring-1 focus:ring-primary-accent min-w-[160px]"
            aria-label="Start Stopwatch"
          >
            {elapsedMs > 0 ? 'Resume' : 'Start'}
          </button>
        ) : (
          <button
            onClick={handleStartPause}
            className="px-10 py-4 font-medium tracking-[0.2em] uppercase text-primary-bg bg-text-main hover:bg-text-main/90 transition-colors focus:outline-none focus:ring-1 focus:ring-text-main min-w-[160px]"
            aria-label="Pause Stopwatch"
          >
            Pause
          </button>
        )}
        <button
          onClick={handleReset}
          disabled={!isRunning && elapsedMs === 0}
          className="px-10 py-4 font-medium tracking-[0.2em] uppercase text-secondary-text border border-secondary-text/30 hover:bg-secondary-text/10 transition-colors focus:outline-none focus:ring-1 focus:ring-secondary-text disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
          aria-label="Reset Stopwatch"
        >
          Reset
        </button>
      </div>

      <div className="mt-8 text-xs tracking-widest text-secondary-text/50 flex gap-6 uppercase">
        <span><kbd className="font-mono text-primary-accent/70 mr-1">Space</kbd> Start/Pause</span>
        <span><kbd className="font-mono text-primary-accent/70 mr-1">R</kbd> Reset</span>
      </div>
    </div>
  );
}
