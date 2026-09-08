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
    <div className="flex flex-col items-center justify-center w-full">
      <div
        className="text-5xl sm:text-7xl md:text-8xl font-bold font-mono tracking-tighter tabular-nums mb-12"
        aria-live="polite"
      >
        {formatStopwatchTime(elapsedMs)}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleStartPause}
          className="px-8 py-3 rounded-full text-lg font-semibold text-white bg-primary-accent hover:bg-secondary-accent transition-colors focus:outline-none focus:ring-4 focus:ring-primary-accent/50 shadow-md min-w-[120px]"
          aria-label={isRunning ? "Pause Stopwatch" : "Start Stopwatch"}
        >
          {isRunning ? 'Pause' : (elapsedMs > 0 ? 'Resume' : 'Start')}
        </button>
        <button
          onClick={handleReset}
          disabled={!isRunning && elapsedMs === 0}
          className="px-8 py-3 rounded-full text-lg font-semibold text-text-main border-2 border-primary-accent/30 hover:bg-primary-accent/10 transition-colors focus:outline-none focus:ring-4 focus:ring-primary-accent/50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
          aria-label="Reset Stopwatch"
        >
          Reset
        </button>
      </div>

      <div className="mt-8 text-sm text-text-main/60 flex gap-4">
        <span><kbd className="font-mono bg-black/5 px-2 py-1 rounded">Space</kbd> Start/Pause</span>
        <span><kbd className="font-mono bg-black/5 px-2 py-1 rounded">R</kbd> Reset</span>
      </div>
    </div>
  );
}
