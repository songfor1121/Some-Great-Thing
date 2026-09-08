# Jecadove Precision Time

A premium, highly accurate web-based precision time utility built with React, TypeScript, and Vite. The design features a minimal, modern, and dark aesthetic (Deep Navy, Cream, and Muted Gold).

## Features

This application includes three main sections accessible via a top navigation bar:

### 1. Clock (Local & Target Website Sync)
Displays a highly accurate local time down to the millisecond using the system monotonic clock. It also features an **Advanced Server-Time Synchronization Algorithm**.

**Why a Proxy is Required:**
Because browsers are strictly limited by Cross-Origin Resource Sharing (CORS) rules which prevent directly reading HTTP `Date` headers across domains, this feature is powered by an integrated Express backend proxy that bypasses CORS blockages.

**How Server-Time Synchronization Works:**
1. The frontend commands the proxy to fetch the target URL.
2. The proxy returns the HTTP Date header.
3. The frontend executes a burst of synchronization samples (e.g. 8 samples) and records monotonic high-resolution timestamps (`performance.now()`) immediately before (`T1`) and after (`T2`) the response.
4. It analyzes the Round-Trip Time (RTT = `T2 - T1`) of each sample and **selects the response with the lowest RTT** to minimize uncertainty.
5. It estimates the server offset by finding the precise midpoint of the request interval.
6. **Important Note on Precision:** HTTP Date headers are only precise to the *second*. We cannot guarantee true millisecond precision to the server's real clock. We combine the Date reference with the RTT midpoint to provide an *Estimated Server Time*.
7. **Periodic Resync & Drift Prevention:** Once synchronized, the estimated server time is calculated locally by drawing strictly from `performance.now()`. We *never* use `setInterval` to increment a counter, completely eliminating arbitrary drift. It also continuously resynchronizes seamlessly in the background (every ~20 seconds) to adapt to small system drifts.

### 2. Timer
A robust countdown timer supporting custom Hours, Minutes, and Seconds. Uses `performance.now()` under the hood to completely avoid `setInterval` skewing.

### 3. Stopwatch
A highly accurate elapsed-time timer featuring Start, Pause, Resume, and Reset functionality.
**Keyboard shortcuts:**
- `Space`: Start/Pause
- `R`: Reset

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
The test suite ensures proper validation of the synchronization calculations, UI logic, and backend proxy response logic.

## Tech Stack
- **React 19**
- **TypeScript**
- **Vite**
- **Tailwind CSS v4**
- **Express / Node.js** (for Server-Time Proxy)
- **Vitest** for testing