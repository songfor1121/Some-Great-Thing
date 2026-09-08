export function formatTimeWithMilliseconds(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const milliseconds = date.getMilliseconds().toString().padStart(3, '0');

  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

export function formatDateFull(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return date.toLocaleDateString(undefined, options);
}

export function formatStopwatchTime(elapsedMilliseconds: number): string {
  const totalSeconds = Math.floor(elapsedMilliseconds / 1000);
  const milliseconds = Math.floor(elapsedMilliseconds % 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  const secondsStr = seconds.toString().padStart(2, '0');
  const msStr = milliseconds.toString().padStart(3, '0');

  return `${hoursStr}:${minutesStr}:${secondsStr}.${msStr}`;
}
