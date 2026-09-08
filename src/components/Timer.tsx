import { useState, useEffect, useRef, useCallback } from 'react';
import { formatStopwatchTime } from '../utils/timeUtils';

export function Timer() {
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('5');
  const [seconds, setSeconds] = useState('0');

  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // time remaining in milliseconds
  const [remainingMs, setRemainingMs] = useState(0);

  const endTimeRef = useRef<number | null>(null);
  const pausedRemainingRef = useRef<number>(0);
  const requestRef = useRef<number>(null);

  const parseInputTime = () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    return (h * 3600000) + (m * 60000) + (s * 1000);
  };

  const updateTime = useCallback(() => {
    if (endTimeRef.current !== null) {
      const now = performance.now();
      const left = endTimeRef.current - now;

      if (left <= 0) {
        setRemainingMs(0);
        setIsRunning(false);
        setIsFinished(true);
        if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
        return;
      }

      setRemainingMs(left);
      requestRef.current = requestAnimationFrame(updateTime);
    }
  }, []);

  const handleStart = () => {
    setIsFinished(false);

    // If not currently tracking anything, read from inputs
    let msToCount = pausedRemainingRef.current;
    if (msToCount <= 0) {
      msToCount = parseInputTime();
    }

    if (msToCount <= 0) return;

    endTimeRef.current = performance.now() + msToCount;
    setRemainingMs(msToCount);
    setIsRunning(true);
    pausedRemainingRef.current = 0;

    requestRef.current = requestAnimationFrame(updateTime);
  };

  const handlePause = () => {
    if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    if (endTimeRef.current !== null) {
      pausedRemainingRef.current = endTimeRef.current - performance.now();
    }
    endTimeRef.current = null;
    setIsRunning(false);
  };

  const handleReset = () => {
    if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    endTimeRef.current = null;
    pausedRemainingRef.current = 0;
    setRemainingMs(0);
    setIsRunning(false);
    setIsFinished(false);
  };

  useEffect(() => {
    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const hasStarted = remainingMs > 0 || isRunning || pausedRemainingRef.current > 0;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto space-y-16 mt-8">

      {/* Time Display or Input */}
      <div className="flex flex-col items-center w-full">
        {hasStarted ? (
          <div className="flex flex-col items-center">
            <div
              className={`text-6xl sm:text-8xl md:text-9xl font-light font-mono tracking-tighter tabular-nums ${isFinished ? 'text-red-400 animate-pulse' : 'text-primary-accent'}`}
            >
              {formatStopwatchTime(remainingMs)}
            </div>
            {isFinished && (
              <div className="mt-8 text-xl tracking-[0.3em] uppercase text-red-400">
                Time's Up
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4 sm:gap-8 text-4xl sm:text-6xl font-light font-mono text-text-main">
            <div className="flex flex-col items-center">
              <input
                type="number"
                min="0"
                max="99"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-20 sm:w-28 text-center bg-transparent border-b-2 border-secondary-text/30 focus:outline-none focus:border-primary-accent transition-colors"
              />
              <span className="text-xs tracking-[0.2em] text-secondary-text mt-4 uppercase">Hours</span>
            </div>
            <span className="text-secondary-text/50 mb-8">:</span>
            <div className="flex flex-col items-center">
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-20 sm:w-28 text-center bg-transparent border-b-2 border-secondary-text/30 focus:outline-none focus:border-primary-accent transition-colors"
              />
              <span className="text-xs tracking-[0.2em] text-secondary-text mt-4 uppercase">Minutes</span>
            </div>
            <span className="text-secondary-text/50 mb-8">:</span>
            <div className="flex flex-col items-center">
              <input
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                className="w-20 sm:w-28 text-center bg-transparent border-b-2 border-secondary-text/30 focus:outline-none focus:border-primary-accent transition-colors"
              />
              <span className="text-xs tracking-[0.2em] text-secondary-text mt-4 uppercase">Seconds</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-6 sm:gap-10">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="px-10 py-4 font-medium tracking-[0.2em] uppercase text-primary-bg bg-primary-accent hover:bg-primary-accent/90 transition-colors focus:outline-none focus:ring-1 focus:ring-primary-accent min-w-[160px]"
          >
            {hasStarted && !isFinished ? 'Resume' : 'Start'}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="px-10 py-4 font-medium tracking-[0.2em] uppercase text-primary-bg bg-text-main hover:bg-text-main/90 transition-colors focus:outline-none focus:ring-1 focus:ring-text-main min-w-[160px]"
          >
            Pause
          </button>
        )}

        <button
          onClick={handleReset}
          disabled={!hasStarted && !isFinished}
          className="px-10 py-4 font-medium tracking-[0.2em] uppercase text-secondary-text border border-secondary-text/30 hover:bg-secondary-text/10 transition-colors focus:outline-none focus:ring-1 focus:ring-secondary-text disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
