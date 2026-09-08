import { useEffect, useState, useRef } from 'react';
import { formatTimeWithMilliseconds, formatDateFull } from '../utils/timeUtils';

export function CurrentTime() {
  const [now, setNow] = useState(new Date());
  const requestRef = useRef<number>(null);

  useEffect(() => {
    // We use requestAnimationFrame to get a smooth and continuous update,
    // avoiding the drift and chunkiness of setInterval.
    const updateTime = () => {
      setNow(new Date());
      requestRef.current = requestAnimationFrame(updateTime);
    };

    requestRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center w-full">
      <div className="mb-4 text-xl sm:text-2xl font-medium text-text-main/70 tracking-wide">
        {formatDateFull(now)}
      </div>
      <div
        className="text-5xl sm:text-7xl md:text-8xl font-bold font-mono tracking-tighter tabular-nums"
        aria-live="polite"
        aria-atomic="true"
      >
        {formatTimeWithMilliseconds(now)}
      </div>
    </div>
  );
}
