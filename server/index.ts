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
    // Attempt to request the URL. Use HEAD to just get headers and save bandwidth.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    let fetchResponse = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal
    }).catch(async (headErr) => {
      // If HEAD fails (e.g. 405 Method Not Allowed), try GET.
      return fetch(url, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
    });

    clearTimeout(timeoutId);

    const dateHeader = fetchResponse.headers.get('Date') || fetchResponse.headers.get('date');

    if (!dateHeader) {
      return res.status(404).json({ error: 'The server did not return a Date header.' });
    }

    return res.json({ dateHeader });

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'The request to the target website timed out.' });
    }

    return res.status(502).json({
      error: 'Failed to access the target website. It may be offline or blocking requests.',
      details: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server API listening on port ${PORT}`);
});
