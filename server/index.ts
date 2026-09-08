import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/server-time', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.status(400).json({ error: 'Invalid protocol. Must be http or https.' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL provided.' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout per request

    // Request logic, support redirects
    let fetchResponse = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal
    }).catch(async (headErr) => {
      // Fallback to GET if HEAD completely fails (e.g., connection reset or unsupported)
      if (headErr.name === 'AbortError') throw headErr;

      return fetch(url, {
        method: 'GET',
        cache: 'no-store',
        redirect: 'follow',
        signal: controller.signal
      });
    });

    // Also fallback to GET if HEAD returned 405 Method Not Allowed or 501 Not Implemented
    if (fetchResponse.status === 405 || fetchResponse.status === 501) {
       fetchResponse = await fetch(url, {
         method: 'GET',
         cache: 'no-store',
         redirect: 'follow',
         signal: controller.signal
       });
    }

    clearTimeout(timeoutId);

    const dateHeader = fetchResponse.headers.get('Date') || fetchResponse.headers.get('date');

    if (!dateHeader) {
      return res.status(404).json({ error: 'Target server did not provide an HTTP Date header.' });
    }

    return res.json({ dateHeader });

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Timeout: Unable to reach the target server within the time limit.' });
    }

    return res.status(502).json({
      error: 'Unable to reach the target server. It may be offline, blocking requests, or encountering TLS/DNS errors.',
      details: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server API listening on port ${PORT}`);
});
