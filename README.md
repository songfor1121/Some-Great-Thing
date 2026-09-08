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
Investigates a given target website's server time based on HTTP response headers (specifically the `Date` header), inspired by Navyism. It estimates the server's time and the network latency by calculating the request and response time differences. The displayed estimated server time will continue to update locally in real-time.

## Limitations of Browser-Based Server-Time Detection

When checking website server time, a browser is strictly limited by Cross-Origin Resource Sharing (CORS) rules:

- The `Date` header in an HTTP response cannot be read via `fetch` unless the server explicitly sets `Access-Control-Expose-Headers: Date` or if the request operates within the same origin.
- Many websites completely block cross-origin requests, in which case the browser will immediately reject the network call resulting in a network/CORS error.
- **Note:** The application *never* fakes the server time. If it encounters a CORS blockage, it explicitly warns the user that direct access is restricted.

### Production Solution
To reliably check the server time of *any* arbitrary website, the application could be updated to route the request through a small backend proxy server (e.g. built in Node.js/Express) which doesn't have the CORS restrictions of a browser.

## Installation

1. Clone or download the repository.
2. Install the dependencies using npm:
   ```bash
   npm install
   ```

## Development

To run the application locally:
```bash
npm run dev
```

To run the test suite:
```bash
npm run test
```
The test suite ensures proper validation of the time calculations and URL validation logic.

## Tech Stack
- **React 19**
- **TypeScript**
- **Vite**
- **Tailwind CSS v4**
- **Vitest** for testing