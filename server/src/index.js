import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import archiver from 'archiver';
import dotenv from 'dotenv';
import { fetchICloudAlbum, getDemoAlbum } from './icloudService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'icloud-better-ui-server',
    timestamp: new Date().toISOString(),
  });
});

// Demo Album Endpoint
app.get('/api/album/demo', (req, res) => {
  try {
    const demo = getDemoAlbum();
    res.json({ success: true, album: demo });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Load Live iCloud Shared Album
app.post('/api/album', async (req, res) => {
  const { urlOrToken } = req.body || {};
  console.log('>>> Received /api/album request with urlOrToken:', urlOrToken);
  if (!urlOrToken) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field "urlOrToken". Please provide an iCloud album link or token.',
    });
  }

  try {
    const albumData = await fetchICloudAlbum(urlOrToken);
    res.json({ success: true, album: albumData });
  } catch (err) {
    console.error('Error fetching iCloud album:', err.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch album from iCloud.',
    });
  }
});

// Media Proxy (handles CDN streaming / bypasses restrictive referrers if needed)
app.get('/api/proxy-media', async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Referer': 'https://www.icloud.com/',
      },
      timeout: 20000,
    });

    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    response.data.pipe(res);
  } catch (err) {
    console.error('Proxy media error:', err.message);
    res.status(502).send('Error fetching remote media');
  }
});

// Batch ZIP Download
app.post('/api/download-zip', async (req, res) => {
  const { items, albumName } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Please provide a non-empty array of items to download.' });
  }

  const safeAlbumName = (albumName || 'icloud_album')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 50);

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${safeAlbumName}_media.zip"`
  );

  const archive = archiver('zip', {
    zlib: { level: 5 }, // Balanced compression
  });

  archive.on('error', (err) => {
    console.error('Archive error:', err);
    if (!res.headersSent) {
      res.status(500).send({ error: err.message });
    }
  });

  archive.pipe(res);

  // Download and append each item to zip
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const mediaUrl = item.downloadUrl || item.url;
    if (!mediaUrl) continue;

    // Build filename
    const ext = item.type === 'video' ? 'mp4' : 'jpg';
    const indexStr = String(i + 1).padStart(3, '0');
    const safeCaption = (item.caption || '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .slice(0, 30);
    const filename = `${indexStr}_${safeCaption ? safeCaption + '_' : ''}${item.id || 'media'}.${ext}`;

    try {
      const response = await axios({
        url: mediaUrl,
        method: 'GET',
        responseType: 'stream',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Referer': 'https://www.icloud.com/',
        },
      });

      archive.append(response.data, { name: filename });
    } catch (err) {
      console.warn(`Skipping item ${item.id} due to fetch error:`, err.message);
    }
  }

  await archive.finalize();
});

app.listen(PORT, () => {
  console.log(`✓ iCloud Better UI Server running at http://localhost:${PORT}`);
});
