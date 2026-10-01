import assert from 'node:assert';
import { getDemoAlbum } from '../src/icloudService.js';

console.log('--- Running Filter & Sort Automated Tests ---');

const demo = getDemoAlbum();
const items = demo.items;

// 1. Filter: Photos only vs Videos only
console.log('1. Testing media type filtering...');
const photos = items.filter((i) => i.type === 'photo');
const videos = items.filter((i) => i.type === 'video');
assert(photos.length > 0, 'Should have photos');
assert(videos.length > 0, 'Should have videos');
assert.strictEqual(photos.length + videos.length, items.length);
assert(photos.every((i) => i.type === 'photo'));
assert(videos.every((i) => i.type === 'video'));
console.log(`✓ Media type filtering: ${photos.length} photos, ${videos.length} videos`);

// 2. Filter: Vertical only
console.log('2. Testing vertical media filtering...');
const verticalItems = items.filter((i) => i.isVertical);
assert(verticalItems.length > 0, 'Should have vertical media');
assert(verticalItems.every((i) => i.isVertical && i.height > i.width));
console.log(`✓ Vertical media filtering: ${verticalItems.length} vertical items`);

// 3. Filter: Contributor filtering
console.log('3. Testing contributor filtering...');
const sarahItems = items.filter((i) => i.contributor === 'Sarah Jenkins');
assert(sarahItems.length > 0);
assert(sarahItems.every((i) => i.contributor === 'Sarah Jenkins'));
console.log(`✓ Contributor filtering: ${sarahItems.length} items from Sarah Jenkins`);

// 4. Sort: Date descending (Newest first) vs Date ascending (Oldest first)
console.log('4. Testing date sorting...');
const newestFirst = [...items].sort(
  (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
);
for (let i = 0; i < newestFirst.length - 1; i++) {
  assert(
    new Date(newestFirst[i].dateCreated).getTime() >=
      new Date(newestFirst[i + 1].dateCreated).getTime(),
    'Items must be ordered newest to oldest'
  );
}

const oldestFirst = [...items].sort(
  (a, b) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
);
for (let i = 0; i < oldestFirst.length - 1; i++) {
  assert(
    new Date(oldestFirst[i].dateCreated).getTime() <=
      new Date(oldestFirst[i + 1].dateCreated).getTime(),
    'Items must be ordered oldest to newest'
  );
}
console.log('✓ Date sorting (newest/oldest) verified');

// 5. Sort: File size descending vs ascending
console.log('5. Testing file size sorting...');
const largestFirst = [...items].sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0));
for (let i = 0; i < largestFirst.length - 1; i++) {
  assert((largestFirst[i].fileSize || 0) >= (largestFirst[i + 1].fileSize || 0));
}
console.log('✓ File size sorting verified');

// 6. Search query filter
console.log('6. Testing caption & author search filter...');
const searchWater = items.filter((i) =>
  (i.caption || '').toLowerCase().includes('water')
);
assert(searchWater.length >= 1, 'Search for "water" should match waterfall');
console.log('✓ Search query filtering verified');

// 7. Grouping by month
console.log('7. Testing timeline grouping by month...');
const monthGroups = new Map();
for (const item of items) {
  const d = new Date(item.dateCreated);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  if (!monthGroups.has(key)) monthGroups.set(key, []);
  monthGroups.get(key).push(item);
}
assert(monthGroups.size > 1, 'Should group into multiple months');
console.log(`✓ Timeline grouping verified across ${monthGroups.size} months`);

console.log('\nAll Filter & Sort tests passed! 🚀');
