# iCloud Better UI ☁️✨

A high-performance modern web application designed to fix the usability and layout shortcomings of Apple's default iCloud Shared Album web interface.

---

## 🌟 Key Features & Problem Solvers

### 1. 📱 Fix for Vertical Videos (No more endless scrolling)
- **Uniform Aspect Ratio Grid (Default)**: Normalizes card heights across all media types. Vertical videos are framed with an ambient blur backdrop and labeled with a clean video pill, taking up the exact same clean grid space as horizontal media.
- **Capped Masonry Grid**: Renders media in natural aspect ratios while capping vertical videos and photos at `max-h-[380px]` so they never dominate your screen.
- **Square Grid (1:1)**: Apple/Instagram style square tiles with duration badges.
- **Hover Previews**: Muted video previews automatically play when hovering over any video card.

### 2. 🗂️ 3-State Collapsible Sidebar
- **Expanded (280px)**: Displays active album metadata, photo/video statistics, navigation shortcuts, and your saved album library.
- **Mini (68px)**: Compact icon-only bar for fast access without taking up screen width.
- **Hidden (0px)**: Completely tucks the sidebar away for an edge-to-edge media experience. Includes a subtle floating toggle button on the screen edge.
- **Keyboard Shortcut**: Press `[` or `Ctrl+B` anytime to toggle sidebar states.
- **State Persistence**: Remembers your preferred sidebar state in `localStorage`.

### 3. 🔍 Comprehensive QoL Filtering & Sorting
- **Media Type Filters**: One-click pills for `All`, `Photos (📷)`, `Videos (🎥)`, `Vertical Only (📱)` (to isolate tall reels), and `Favorites (⭐)`.
- **Contributor Filter**: Dropdown dynamically listing all album contributors with item counts and avatar initials.
- **Orientation Filter**: Filter by Portrait (Vertical), Landscape (Horizontal), or Square.
- **Instant Search**: Live search across captions, contributor names, and formatted dates (`/` keyboard shortcut).
- **Sort Options**:
  - Date (Newest First / Oldest First)
  - File Size (Largest First / Smallest First) — great for identifying heavy 4K videos
  - Contributor Name (A → Z)
  - Media Type (Videos First)
- **Timeline Grouping**:
  - Continuous Grid
  - Group by Day (with sticky date headers)
  - Group by Month
  - Group by Year
  - Group by Contributor
  - Includes a "Select Section" button to quickly select all photos in a date/contributor section.

### 4. 🎬 Immersive Media Lightbox
- **Zero Vertical Scrolling**: Vertical videos are centered and scaled to fit 100% within the viewport height.
- **Advanced Video Controls**:
  - Play / Pause (click or `Spacebar`)
  - Timeline Scrubber with buffered progress
  - Volume slider and Mute toggle
  - Playback Speed: `0.5x`, `1.0x`, `1.5x`, `2.0x`
  - Loop toggle (repeats short vertical reels)
  - Fullscreen toggle (`F`)
- **Photo Controls**: Interactive zoom (`1x`, `1.5x`, `2x`, `3x`) and pan controls.
- **Metadata Drawer (`I` key)**: Displays capture date, dimensions, file size, contributor, caption, and high-resolution download button.

### 5. 📦 Batch ZIP Downloader
- Toggle Selection Mode or click checkboxes on cards.
- "Select All" or "Select Section" shortcuts.
- Streams a compressed `.zip` archive of selected or all media items directly from the backend.

### 6. 🔗 Connect to iCloud Shared Albums
- Accepts any public iCloud Shared Album web link (`https://www.icloud.com/sharedalbum/#<token>`) or raw token.
- Handles Apple's partition resolution (base62) and 330 redirects automatically via a lightweight local Express proxy.
- No Apple ID password or 2FA credentials needed — completely secure and private.
- Built-in **Demo Album** with curated vertical videos, landscape videos, and photos for instant offline testing.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Running

From the project root:

```bash
# Install dependencies for both server and client
npm run install:all

# Start both backend proxy and frontend simultaneously
npm run dev
```

Open your browser to:
👉 **`http://localhost:5173`**

### Running Automated Tests

```bash
npm test
```

---

## 🛠️ Architecture

```mermaid
flowchart TD
    Client["React 18 + Vite + Tailwind CSS (Port 5173)"]
    Server["Express Proxy Server (Port 3001)"]
    iCloud["Apple SharedStreams Service"]

    Client -->|API Requests (/api/*)| Server
    Server -->|webstream / webasseturls| iCloud
    Server -->|Stream ZIP Archive| Client
    Client -->|Direct Media Streaming| AppleCDN["Apple Akamai/CloudFront CDN"]
```

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React.
- **Backend**: Express, Axios, Archiver (ZIP streaming), CORS.
