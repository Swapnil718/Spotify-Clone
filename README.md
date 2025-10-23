## Spotify-Clone: Music Player 

A minimal Spotify-style web player 

---
## ✨ Features

🎨 Spotify-like UI (sidebar, header chips, rows, bottom player)

▶️ Click a card to play/pause a 30s preview (preview_url)

🧠 No auth / no profile — just public data

---
## 🧩 Small Express API:

GET /api/featured — Featured playlists

GET /api/playlist/:id — Tracks (filtered to those with preview)

GET /api/search?q= — Tracks by query (preview only)

GET /api/tracks?ids= — Direct tracks by IDs (preview only) ✅ best for a fixed list

Note: Not every Spotify track has a preview; the app filters out items with preview_url = null.

---
## 🖼️ Screenshots


## 🧱 Project Structure
spotify-clone/

├─ server/      # Node/Express API (no user auth)

│  ├─ server.js

│  ├─ package.json

│  └─ .env     # SPOTIFY_CLIENT_ID/SECRET (not committed)

└─ public/               # Static frontend (HTML/CSS/JS)

   ├─ index.html
   
   ├─ styles.css
   
   └─ app.js

🚀 Quickstart
1) Node.js 18+ and npm

A free Spotify Developer account (https://developer.spotify.com)

2) Create a Spotify app

Dashboard → Create app

Any name/description

Redirect URI: http://localhost:8080/callback (required by form; unused here)

Only check Web API

Grab Client ID and Client Secret

3) Backend setup
cd server
npm install
Create server/.env:
SPOTIFY_CLIENT_ID=YOUR_CLIENT_ID
SPOTIFY_CLIENT_SECRET=YOUR_CLIENT_SECRET
PORT=5050

Run:npm start
You should see: API running on http://localhost:5050

Test in browser:
http://localhost:5050/api/featured
http://localhost:5050/api/search?q=Billie%20Eilish
http://localhost:5050/api/tracks?ids=0VjIjW4GlUZAMYd2vXMi3b,463CkQjx2Zk1yXoBuierM9

4) Frontend
Serve the static public/ folder (any static server works):
# from project root or ./public
npx http-server public -p 8080
Open: http://localhost:8080
🔧 Configuration
Market / Region

Some previews are region-dependent. In server/server.js:

const MARKET = "US"; // change to your country code, e.g., "IN", "GB", "DE"
The value is used in /api/search, /api/playlist/:id, and /api/tracks?ids=.
Fixed “Today’s biggest hits” picks

---
## ⚠️ Legal
This project uses the Spotify Web API.
“Spotify” and associated imagery are trademarks of Spotify AB.
This is a learning/demo project and is not affiliated with Spotify.
