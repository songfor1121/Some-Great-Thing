# Web-Based Timer Application

A modern, highly accurate web-based timer application built with React, TypeScript, and Vite. The design features a minimal, polished UI with a light yellow and green color palette for a calm, simple experience.

## Features

This application includes three main sections accessible via a navigation bar:

### 1. Current Time
Displays a highly accurate local time down to the milliseconds, updated smoothly without drift using `requestAnimationFrame`. The date is also clearly shown.

### 2. Stopwatch
A highly accurate elapsed-time timer featuring Start, Pause, Resume, and Reset functionality. Time is derived using `performance.now()` instead of counting interval intervals, ensuring no significant drift even if the browser momentarily halts execution.
**Keyboard shortcuts:**
- `Space`: Start/Pause
- `R`: Reset

### 3. Website Server Time
Investigates a given target website's server time based on HTTP response headers (specifically the `Date` header), inspired by Navyism.

Because browsers are strictly limited by Cross-Origin Resource Sharing (CORS) rules which prevent directly reading `Date` headers across domains, this feature is powered by an integrated Express backend proxy.

The process:
1. The frontend asks the backend proxy to check the target URL.
2. The proxy makes the request, reads the HTTP Date header, and bypasses CORS.
3. The frontend makes multiple samples (e.g. 3) and records the round-trip network latency (RTT) for each.
4. It selects the response with the *lowest* RTT to calculate an Estimated Server Offset based on the midpoint of the request.
5. The displayed estimated server time then updates locally in real-time using `requestAnimationFrame`, meaning it won't repeatedly hammer the target server.

## Installation

1. Clone or download the repository.
2. Install the dependencies using npm:
   ```bash
   npm install
   ```

## Development

To run both the Vite frontend application and the Express backend API proxy locally at the same time, run:
```bash
npm run dev
```
(This executes `concurrently` to start both servers on ports 5173 and 3001).

To run the test suite:
```bash
npm run test
```
The test suite ensures proper validation of the time calculations, UI logic, and backend proxy response logic.

## Tech Stack
- **React 19**
- **TypeScript**
- **Vite**
- **Tailwind CSS v4**
- **Express / Node.js** (for Server-Time Proxy)
- **Vitest** for testing