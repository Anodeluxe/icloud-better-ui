import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';

const httpsAgent = new https.Agent({
  family: 4,
  keepAlive: false,
});

// In-memory album cache: token -> { data, timestamp }
const albumMemoryCache = new Map();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

const BASE_62_CHAR_SET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function base62ToInt(str) {
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    const idx = BASE_62_CHAR_SET.indexOf(str[i]);
    if (idx === -1) continue;
    result = result * 62 + idx;
  }
  return result;
}

const COMMON_HEADERS = {
  'Origin': 'https://www.icloud.com',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Content-Type': 'text/plain',
  'Accept': '*/*',
  'Referer': 'https://www.icloud.com/sharedalbum/',
};

/**
 * Extracts the album token from various iCloud URL formats or a raw token string.
 * Handles URL decoding, hashes, query parameters, and trailing path segments.
 */
export function parseToken(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input: Please provide an iCloud Shared Album URL or token.');
  }

  let clean = decodeURIComponent(input.trim().replace(/^["']|["']$/g, ''));

  // If full URL with hash e.g. https://www.icloud.com/sharedalbum/#B1234567890ABCD
  if (clean.includes('#')) {
    clean = clean.split('#')[1];
  }

  // Handle path segments if URL like share.icloud.com/photos/XYZ
  if (clean.includes('/photos/')) {
    clean = clean.split('/photos/')[1];
  }

  // Strip query parameters
  if (clean.includes('?')) {
    clean = clean.split('?')[0];
  }

  // Strip sub-tokens after semicolon
  if (clean.includes(';')) {
    clean = clean.split(';')[0];
  }

  // Clean trailing slashes
  clean = clean.replace(/\/+$/, '');

  if (!clean || clean.length < 5) {
    throw new Error(`Invalid iCloud token format: "${input}"`);
  }

  return clean;
}

/**
 * Resolves share.icloud.com / photos.icloud.com links by inspecting HTTP redirects,
 * or falls back to direct token extraction.
 */
export async function resolveToken(input) {
  let clean = decodeURIComponent(input.trim().replace(/^["']|["']$/g, ''));

  // If it's an HTTP URL pointing to share.icloud.com, attempt to resolve redirect
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    if (clean.includes('share.icloud.com') || clean.includes('photos.icloud.com')) {
      try {
        const response = await axios.get(clean, {
          headers: COMMON_HEADERS,
          maxRedirects: 5,
          timeout: 5000,
          validateStatus: () => true,
        });

        const finalUrl = response.request?.res?.responseUrl || '';
        if (finalUrl && finalUrl.includes('#')) {
          clean = finalUrl;
        } else if (typeof response.data === 'string') {
          const match = response.data.match(/sharedalbum\/#([a-zA-Z0-9_-]+)/)
            || response.data.match(/streamCguid['"]\s*:\s*['"]([a-zA-Z0-9_-]+)['"]/);
          if (match) {
            return match[1];
          }
        }
      } catch (e) {
        console.warn('[iCloud] Redirect lookup failed, continuing with direct parsing:', e.message);
      }
    }
  }

  return parseToken(clean);
}

/**
 * Computes a list of candidate Apple SharedStreams base URLs.
 * Apple uses sharded partition hosts (e.g. p01, p02, ..., p33, p42, etc.)
 * with p23-sharedstreams.icloud.com acting as a primary global gateway/redirector.
 */
export function getCandidateBaseUrls(token) {
  const candidates = [];
  const firstChar = token[0];
  let partition = null;

  if (firstChar === 'A' && token.length > 1) {
    partition = base62ToInt(token[1]);
  } else if (token.length > 2) {
    const sub = token.substring(1, 3);
    const p = base62ToInt(sub);
    // Apple partitions range from 1 up to ~200
    if (p >= 1 && p <= 200) {
      partition = p;
    }
  }

  if (partition !== null && partition >= 1 && partition <= 200) {
    const pStr = partition < 10 ? '0' + partition : partition.toString();
    candidates.push(`https://p${pStr}-sharedstreams.icloud.com/${token}/sharedstreams/`);
  }

  // Reliable Apple sharedstream ingress / gateway partitions
  candidates.push(`https://p23-sharedstreams.icloud.com/${token}/sharedstreams/`);
  candidates.push(`https://p01-sharedstreams.icloud.com/${token}/sharedstreams/`);
  candidates.push(`https://p02-sharedstreams.icloud.com/${token}/sharedstreams/`);
  candidates.push(`https://p33-sharedstreams.icloud.com/${token}/sharedstreams/`);

  return [...new Set(candidates)];
}

/**
 * Computes the primary Apple SharedStreams base partition URL from token
 */
export function computeBaseUrl(token) {
  const candidates = getCandidateBaseUrls(token);
  return candidates[0];
}

/**
 * Contacts candidate Apple SharedStreams gateways, handles 330 redirects,
 * and retrieves the raw webstream metadata from Apple.
 */
export async function getWebstreamWithRedirect(token) {
  const candidates = getCandidateBaseUrls(token);
  const postData = JSON.stringify({ streamCtag: null });
  let lastError = null;

  for (const candidate of candidates) {
    console.log(`[iCloud] Contacting candidate endpoint: ${candidate}webstream`);
    try {
      const response = await axios({
        url: `${candidate}webstream`,
        method: 'POST',
        headers: COMMON_HEADERS,
        data: postData,
        httpsAgent,
        validateStatus: (status) => status < 400 || status === 330,
        timeout: 90000,
      });

      let finalBaseUrl = candidate;
      let webstreamData = response.data;
      let currentStatus = response.status;
      let redirectHops = 0;

      // Handle multi-hop 330 redirects (e.g. p23 -> p152 -> p113)
      while (currentStatus === 330 && redirectHops < 5) {
        redirectHops++;
        const redirectHost = webstreamData?.['X-Apple-MMe-Host'];
        if (!redirectHost) break;
        console.log(`[iCloud] Apple returned 330 Redirect (hop ${redirectHops}) to: ${redirectHost}`);
        finalBaseUrl = `https://${redirectHost}/${token}/sharedstreams/`;

        const redirectResponse = await axios({
          url: `${finalBaseUrl}webstream`,
          method: 'POST',
          headers: COMMON_HEADERS,
          data: postData,
          httpsAgent,
          validateStatus: (status) => status < 400 || status === 330,
          timeout: 90000,
        });
        currentStatus = redirectResponse.status;
        webstreamData = redirectResponse.data;
      }

      if (webstreamData && webstreamData.photos) {
        console.log(`[iCloud] Successfully loaded album "${webstreamData.streamName || 'Shared Album'}" with ${webstreamData.photos.length} items`);
        return { finalBaseUrl, webstreamData };
      }

      if (response.status === 404) {
        console.log(`[iCloud] Endpoint ${candidate} returned 404. Trying next candidate...`);
      }
    } catch (err) {
      console.warn(`[iCloud] Endpoint ${candidate} failed: ${err.message}`);
      lastError = err;
    }
  }

  throw new Error(`Failed to contact iCloud stream service: ${lastError?.message || 'Could not reach Apple SharedStreams servers. Please verify your internet connection and ensure the album is set to Public Website.'}`);
}

/**
 * Retrieves signed CDN URLs for given photo GUIDs in batches in parallel
 */
export async function getAssetUrls(baseUrl, photoGuids) {
  const chunkSize = 400;
  const chunks = [];
  for (let i = 0; i < photoGuids.length; i += chunkSize) {
    chunks.push(photoGuids.slice(i, i + chunkSize));
  }

  const allUrls = {};

  await Promise.all(chunks.map(async (chunk) => {
    try {
      const response = await axios({
        url: `${baseUrl}webasseturls`,
        method: 'POST',
        headers: COMMON_HEADERS,
        data: JSON.stringify({ photoGuids: chunk }),
        httpsAgent,
        timeout: 30000,
      });

      if (response.data && response.data.items) {
        for (const [checksum, item] of Object.entries(response.data.items)) {
          if (item && item.url_path) {
            const loc = item.url_location || 'cvws.icloud-content.com';
            allUrls[checksum] = `https://${loc}${item.url_path}`;
          }
        }
      }
    } catch (err) {
      console.warn('Warning: Failed to fetch chunk of asset URLs:', err.message);
    }
  }));

  return allUrls;
}

/**
 * Formats and enriches photos into a standardized, clean media item format
 */
export function enrichMedia(webstreamData, urlsMap) {
  const rawPhotos = webstreamData.photos || [];

  const mediaItems = rawPhotos.map((photo) => {
    const photoGuid = photo.photoGuid;
    const derivativesObj = photo.derivatives || {};
    const derivativeList = Object.values(derivativesObj).map((d) => ({
      checksum: d.checksum,
      fileSize: Number(d.fileSize) || 0,
      width: Number(d.width) || 0,
      height: Number(d.height) || 0,
      url: urlsMap[d.checksum] || null,
    })).filter((d) => Boolean(d.url));

    // Sort derivatives by resolution / fileSize descending
    derivativeList.sort((a, b) => (b.width * b.height || b.fileSize) - (a.width * a.height || a.fileSize));

    // Check if this item is a video
    const isVideoExplicit = photo.mediaAssetType === 'video';
    const isVideoDerivative = derivativeList.some((d) => {
      const lowerUrl = (d.url || '').toLowerCase();
      return lowerUrl.includes('.mp4') || lowerUrl.includes('.m4v') || lowerUrl.includes('.mov');
    });
    const isVideo = isVideoExplicit || isVideoDerivative;

    // Separate still image derivatives from video stream derivatives
    const imageDerivatives = derivativeList.filter((d) => {
      const lower = (d.url || '').toLowerCase();
      return !lower.includes('.mp4') && !lower.includes('.m4v') && !lower.includes('.mov');
    });
    const videoDerivatives = derivativeList.filter((d) => {
      const lower = (d.url || '').toLowerCase();
      return lower.includes('.mp4') || lower.includes('.m4v') || lower.includes('.mov');
    });

    // Best video stream (highest quality mp4/mov)
    const bestVideoStream = videoDerivatives[0] || null;

    // Highest resolution still image
    const highestResPhoto = imageDerivatives[0] || derivativeList[0] || null;

    // Choose thumbnail: ALWAYS prefer a lightweight still image derivative!
    let thumbnailDerivative = null;
    if (imageDerivatives.length > 0) {
      // Sort ascending by resolution to pick the fastest-loading crisp thumbnail (~240-640px)
      const imageDerivativesAsc = [...imageDerivatives].sort(
        (a, b) => (a.width * a.height || a.fileSize) - (b.width * b.height || b.fileSize)
      );
      // Pick smallest derivative with height >= 240px for fast loading and crisp retina rendering
      thumbnailDerivative = imageDerivativesAsc.find((d) => d.height >= 240) || imageDerivativesAsc[0];
    } else {
      // Fallback if only video files exist
      thumbnailDerivative = derivativeList[derivativeList.length - 1] || derivativeList[0];
    }

    const videoStreamUrl = isVideo ? (bestVideoStream ? bestVideoStream.url : null) : null;
    const stillThumbnailUrl = thumbnailDerivative ? thumbnailDerivative.url : (highestResPhoto ? highestResPhoto.url : '');

    const originalWidth = Number(photo.width) || (highestResPhoto ? highestResPhoto.width : (bestVideoStream ? bestVideoStream.width : 1920));
    const originalHeight = Number(photo.height) || (highestResPhoto ? highestResPhoto.height : (bestVideoStream ? bestVideoStream.height : 1080));
    const isVertical = originalHeight > originalWidth;
    const aspectRatio = originalHeight > 0 ? Number((originalWidth / originalHeight).toFixed(3)) : 1;

    let contributor = photo.contributorFullName || '';
    if (!contributor) {
      const parts = [photo.contributorFirstName, photo.contributorLastName].filter(Boolean);
      contributor = parts.join(' ');
    }
    if (!contributor) {
      const owner = [webstreamData.userFirstName, webstreamData.userLastName].filter(Boolean).join(' ');
      contributor = owner || 'Album Owner';
    }

    const dateCreated = photo.dateCreated || photo.batchDateCreated || new Date().toISOString();

    return {
      id: photoGuid,
      type: isVideo ? 'video' : 'photo',
      isVertical,
      width: originalWidth,
      height: originalHeight,
      aspectRatio,
      url: isVideo ? videoStreamUrl : (highestResPhoto ? highestResPhoto.url : null),
      thumbnailUrl: stillThumbnailUrl,
      posterUrl: stillThumbnailUrl,
      downloadUrl: isVideo ? videoStreamUrl : (highestResPhoto ? highestResPhoto.url : null),
      fileSize: isVideo ? (bestVideoStream?.fileSize || 0) : (highestResPhoto?.fileSize || 0),
      caption: photo.caption || '',
      dateCreated,
      contributor,
      derivatives: derivativeList,
    };
  }).filter((item) => Boolean(item.url || item.thumbnailUrl));

  const ownerName = [webstreamData.userFirstName, webstreamData.userLastName].filter(Boolean).join(' ') || 'iCloud User';

  return {
    metadata: {
      streamName: webstreamData.streamName || 'iCloud Shared Album',
      ownerName,
      userFirstName: webstreamData.userFirstName || '',
      userLastName: webstreamData.userLastName || '',
      totalItems: mediaItems.length,
      photoCount: mediaItems.filter((m) => m.type === 'photo').length,
      videoCount: mediaItems.filter((m) => m.type === 'video').length,
      verticalCount: mediaItems.filter((m) => m.isVertical).length,
    },
    items: mediaItems,
  };
}

/**
 * Full orchestrator to load an iCloud Shared Album
 */
export async function fetchICloudAlbum(urlOrToken) {
  console.log(`[iCloud] Resolving token for: "${urlOrToken}"`);
  const token = await resolveToken(urlOrToken);
  console.log(`[iCloud] Parsed token: "${token}"`);

  // 1. Check in-memory cache
  const cached = albumMemoryCache.get(token);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    console.log(`[iCloud] Serving album "${token}" from in-memory cache (${cached.data.items?.length} items)`);
    return cached.data;
  }

  // 2. Check disk cache
  const diskCacheFile = path.resolve(`./cache_album_${token}.json`);
  if (fs.existsSync(diskCacheFile)) {
    try {
      const diskContent = fs.readFileSync(diskCacheFile, 'utf8');
      const parsed = JSON.parse(diskContent);
      if (parsed && parsed.items && parsed.cachedAt && (Date.now() - parsed.cachedAt < CACHE_TTL_MS)) {
        console.log(`[iCloud] Serving album "${token}" from disk cache (${parsed.items.length} items)`);
        albumMemoryCache.set(token, { data: parsed, timestamp: parsed.cachedAt });
        return parsed;
      }
    } catch (e) {
      console.warn('[iCloud] Failed reading disk cache:', e.message);
    }
  }

  // 3. Fetch from Apple
  const { finalBaseUrl, webstreamData } = await getWebstreamWithRedirect(token);

  const photoGuids = (webstreamData.photos || []).map((p) => p.photoGuid).filter(Boolean);
  console.log(`[iCloud] Fetching asset URLs for ${photoGuids.length} items...`);
  const urlsMap = await getAssetUrls(finalBaseUrl, photoGuids);

  const enriched = enrichMedia(webstreamData, urlsMap);
  const result = {
    token,
    ...enriched,
    cachedAt: Date.now(),
  };

  // Save to memory cache
  albumMemoryCache.set(token, { data: result, timestamp: Date.now() });

  // Save to disk cache
  try {
    fs.writeFileSync(diskCacheFile, JSON.stringify(result));
    console.log(`[iCloud] Album "${token}" saved to disk cache.`);
  } catch (e) {
    console.warn('[iCloud] Failed saving disk cache:', e.message);
  }

  return result;
}

/**
 * Realistic preloaded demo album dataset with vertical videos,
 * horizontal videos, and diverse photos to test all QoL filters and layouts
 */
export function getDemoAlbum() {
  const items = [
    {
      id: 'demo-vert-vid-1',
      type: 'video',
      isVertical: true,
      width: 1080,
      height: 1920,
      aspectRatio: 0.562,
      url: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-view-of-a-waterfall-in-a-forest-41315-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=720&q=80',
      downloadUrl: 'https://assets.mixkit.co/videos/preview/mixkit-vertical-view-of-a-waterfall-in-a-forest-41315-large.mp4',
      fileSize: 18450000,
      caption: 'Stunning secret waterfall hike! 🌿💦',
      dateCreated: '2026-09-28T14:22:00Z',
      contributor: 'Sarah Jenkins',
      derivatives: [],
    },
    {
      id: 'demo-photo-1',
      type: 'photo',
      isVertical: false,
      width: 2560,
      height: 1440,
      aspectRatio: 1.778,
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=90',
      thumbnailUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      downloadUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=90',
      fileSize: 4210000,
      caption: 'Yosemite valley morning mist and golden hour',
      dateCreated: '2026-09-28T09:15:00Z',
      contributor: 'Alex Rivera',
      derivatives: [],
    },
    {
      id: 'demo-vert-vid-2',
      type: 'video',
      isVertical: true,
      width: 1080,
      height: 1920,
      aspectRatio: 0.562,
      url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-coming-to-the-beach-5016-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=720&q=80',
      downloadUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waves-coming-to-the-beach-5016-large.mp4',
      fileSize: 22100000,
      caption: 'Sunset ocean tides rolling in',
      dateCreated: '2026-09-25T18:40:00Z',
      contributor: 'David Chen',
      derivatives: [],
    },
    {
      id: 'demo-photo-2',
      type: 'photo',
      isVertical: true,
      width: 1440,
      height: 2160,
      aspectRatio: 0.667,
      url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2000&q=90',
      thumbnailUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=720&q=80',
      downloadUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=2000&q=90',
      fileSize: 3180000,
      caption: 'Starry night over the snow-capped mountains',
      dateCreated: '2026-09-25T22:10:00Z',
      contributor: 'Sarah Jenkins',
      derivatives: [],
    },
    {
      id: 'demo-horiz-vid-1',
      type: 'video',
      isVertical: false,
      width: 1920,
      height: 1080,
      aspectRatio: 1.778,
      url: 'https://assets.mixkit.co/videos/preview/mixkit-fog-over-the-mountain-peaks-32867-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
      downloadUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fog-over-the-mountain-peaks-32867-large.mp4',
      fileSize: 15400000,
      caption: 'Early morning drone timelapse above the clouds',
      dateCreated: '2026-08-14T07:30:00Z',
      contributor: 'Alex Rivera',
      derivatives: [],
    },
    {
      id: 'demo-photo-3',
      type: 'photo',
      isVertical: false,
      width: 2400,
      height: 1600,
      aspectRatio: 1.5,
      url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=2400&q=90',
      thumbnailUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
      downloadUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=2400&q=90',
      fileSize: 2950000,
      caption: 'Lush green wilderness and morning breeze',
      dateCreated: '2026-08-14T11:05:00Z',
      contributor: 'Emma Watson',
      derivatives: [],
    },
    {
      id: 'demo-vert-vid-3',
      type: 'video',
      isVertical: true,
      width: 1080,
      height: 1920,
      aspectRatio: 0.562,
      url: 'https://assets.mixkit.co/videos/preview/mixkit-urban-traffic-at-night-vertical-view-41473-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=720&q=80',
      downloadUrl: 'https://assets.mixkit.co/videos/preview/mixkit-urban-traffic-at-night-vertical-view-41473-large.mp4',
      fileSize: 19800000,
      caption: 'Downtown neon lights and night drive 🏙️✨',
      dateCreated: '2026-07-04T21:45:00Z',
      contributor: 'David Chen',
      derivatives: [],
    },
    {
      id: 'demo-photo-4',
      type: 'photo',
      isVertical: true,
      width: 1600,
      height: 2400,
      aspectRatio: 0.667,
      url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=2000&q=90',
      thumbnailUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=720&q=80',
      downloadUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=2000&q=90',
      fileSize: 3450000,
      caption: 'Ancient redwood trees reaching into the sky',
      dateCreated: '2026-07-03T15:20:00Z',
      contributor: 'Emma Watson',
      derivatives: [],
    },
    {
      id: 'demo-photo-5',
      type: 'photo',
      isVertical: false,
      width: 2500,
      height: 1667,
      aspectRatio: 1.5,
      url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=2500&q=90',
      thumbnailUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=800&q=80',
      downloadUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=2500&q=90',
      fileSize: 3800000,
      caption: 'Rolling hills during golden hour serenity',
      dateCreated: '2026-06-18T17:50:00Z',
      contributor: 'Alex Rivera',
      derivatives: [],
    },
    {
      id: 'demo-vert-vid-4',
      type: 'video',
      isVertical: true,
      width: 1080,
      height: 1920,
      aspectRatio: 0.562,
      url: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-cup-with-latte-art-vertical-video-41712-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=720&q=80',
      downloadUrl: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-cup-with-latte-art-vertical-video-41712-large.mp4',
      fileSize: 14200000,
      caption: 'Morning brew latte art perfection ☕',
      dateCreated: '2026-05-10T08:30:00Z',
      contributor: 'Sarah Jenkins',
      derivatives: [],
    },
    {
      id: 'demo-photo-6',
      type: 'photo',
      isVertical: false,
      width: 2400,
      height: 1600,
      aspectRatio: 1.5,
      url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=2400&q=90',
      thumbnailUrl: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80',
      downloadUrl: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=2400&q=90',
      fileSize: 4500000,
      caption: 'Autumn woodland pathway with golden leaves',
      dateCreated: '2026-05-02T13:45:00Z',
      contributor: 'David Chen',
      derivatives: [],
    },
    {
      id: 'demo-photo-7',
      type: 'photo',
      isVertical: true,
      width: 1440,
      height: 2160,
      aspectRatio: 0.667,
      url: 'https://images.unsplash.com/photo-1498036882173-b41c28a8ba34?auto=format&fit=crop&w=2000&q=90',
      thumbnailUrl: 'https://images.unsplash.com/photo-1498036882173-b41c28a8ba34?auto=format&fit=crop&w=720&q=80',
      downloadUrl: 'https://images.unsplash.com/photo-1498036882173-b41c28a8ba34?auto=format&fit=crop&w=2000&q=90',
      fileSize: 2900000,
      caption: 'Shibuya crossing perspective in Tokyo',
      dateCreated: '2026-04-12T19:10:00Z',
      contributor: 'Sarah Jenkins',
      derivatives: [],
    },
  ];

  return {
    token: 'DEMO_ALBUM_TOKEN',
    metadata: {
      streamName: 'Pacific Coast & Sierra Adventures',
      ownerName: 'Sarah Jenkins',
      userFirstName: 'Sarah',
      userLastName: 'Jenkins',
      totalItems: items.length,
      photoCount: items.filter((m) => m.type === 'photo').length,
      videoCount: items.filter((m) => m.type === 'video').length,
      verticalCount: items.filter((m) => m.isVertical).length,
    },
    items,
  };
}
