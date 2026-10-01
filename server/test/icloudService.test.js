import assert from 'node:assert';
import { parseToken, base62ToInt, computeBaseUrl, enrichMedia, getDemoAlbum } from '../src/icloudService.js';

console.log('--- Running icloudService Tests ---');

// 1. Test parseToken
console.log('1. Testing parseToken...');
const url1 = 'https://www.icloud.com/sharedalbum/#B1234567890ABCD';
assert.strictEqual(parseToken(url1), 'B1234567890ABCD');

const url2 = 'https://www.icloud.com/sharedalbum/en-us/#B0987654321WXYZ';
assert.strictEqual(parseToken(url2), 'B0987654321WXYZ');

const url3 = 'https://www.icloud.com/sharedalbum/#B1234567890ABCD;someParam?extra=true';
assert.strictEqual(parseToken(url3), 'B1234567890ABCD');

const rawToken = 'B0123456789';
assert.strictEqual(parseToken(rawToken), 'B0123456789');

assert.throws(() => parseToken(''), /Invalid input/);
console.log('✓ parseToken tests passed');

// 2. Test base62ToInt and computeBaseUrl
console.log('2. Testing base62ToInt and computeBaseUrl...');
assert.strictEqual(base62ToInt('0'), 0);
assert.strictEqual(base62ToInt('1'), 1);
assert.strictEqual(base62ToInt('A'), 10);
assert.strictEqual(base62ToInt('a'), 36);

// Partition calculation: token starting with 'A' vs 'B'
const urlA = computeBaseUrl('A5123456789');
assert(urlA.includes('sharedstreams.icloud.com/A5123456789/sharedstreams/'));

const urlB = computeBaseUrl('B05123456789');
assert(urlB.includes('sharedstreams.icloud.com/B05123456789/sharedstreams/'));
console.log('✓ base62 and partition tests passed');

// 3. Test enrichMedia & vertical video detection
console.log('3. Testing enrichMedia & vertical detection...');
const mockWebstream = {
  streamName: 'Test Album',
  userFirstName: 'Jane',
  userLastName: 'Doe',
  photos: [
    {
      photoGuid: 'p1',
      width: 1080,
      height: 1920,
      mediaAssetType: 'video',
      derivatives: {
        '1': { checksum: 'c1', fileSize: 15000000, width: 1080, height: 1920 },
        '2': { checksum: 'c2', fileSize: 40000, width: 360, height: 640 },
      },
    },
    {
      photoGuid: 'p2',
      width: 2560,
      height: 1440,
      derivatives: {
        '1': { checksum: 'c3', fileSize: 3000000, width: 2560, height: 1440 },
      },
    },
  ],
};

const mockUrls = {
  c1: 'https://cvws.icloud-content.com/video.mp4',
  c2: 'https://cvws.icloud-content.com/thumb.jpg',
  c3: 'https://cvws.icloud-content.com/photo.jpg',
};

const enriched = enrichMedia(mockWebstream, mockUrls);
assert.strictEqual(enriched.metadata.streamName, 'Test Album');
assert.strictEqual(enriched.metadata.totalItems, 2);
assert.strictEqual(enriched.metadata.photoCount, 1);
assert.strictEqual(enriched.metadata.videoCount, 1);
assert.strictEqual(enriched.metadata.verticalCount, 1);

const videoItem = enriched.items.find((i) => i.id === 'p1');
assert.strictEqual(videoItem.type, 'video');
assert.strictEqual(videoItem.isVertical, true);
assert(videoItem.aspectRatio < 1);
assert.strictEqual(videoItem.url, 'https://cvws.icloud-content.com/video.mp4');

const photoItem = enriched.items.find((i) => i.id === 'p2');
assert.strictEqual(photoItem.type, 'photo');
assert.strictEqual(photoItem.isVertical, false);
console.log('✓ enrichMedia tests passed');

// 4. Test Demo Album
console.log('4. Testing Demo Album...');
const demo = getDemoAlbum();
assert(demo.items.length > 5);
assert(demo.items.some((i) => i.type === 'video' && i.isVertical));
assert(demo.items.some((i) => i.type === 'photo' && !i.isVertical));
assert.strictEqual(demo.metadata.totalItems, demo.items.length);
console.log('✓ Demo album tests passed');

console.log('\nAll server tests passed successfully! 🎉');
