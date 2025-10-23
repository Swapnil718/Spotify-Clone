// server/server.js
const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ---- App-only token (Client Credentials) with simple cache ----
let cachedToken = null;
let tokenExpiresAt = 0;

async function getAppToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60_000) return cachedToken;

  const auth = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({ grant_type: "client_credentials" }),
    { headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" } }
  );

  cachedToken = res.data.access_token;
  tokenExpiresAt = now + res.data.expires_in * 1000; // ~3600s
  return cachedToken;
}

async function spotifyGET(path, params = {}) {
  const token = await getAppToken();
  const url = `https://api.spotify.com/v1/${path}`;
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data;
}

// ---- PUBLIC API for frontend (no login) ----

app.get("/", (_req, res) => {
  res.send("Spotify API backend running. Try /api/featured or /api/search?q=Billie%20Eilish");
});

app.get("/api/featured", async (_req, res) => {
  try {
    const data = await spotifyGET("browse/featured-playlists", { country: "US", limit: 8 });
    res.json(data.playlists.items.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      image: p.images?.[0]?.url || "",
    })));
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: "Failed to load featured playlists" });
  }
});

app.get("/api/playlist/:id", async (req, res) => {
  try {
    const data = await spotifyGET(`playlists/${req.params.id}`, { limit: 50 });
    const items = (data.tracks?.items || [])
      .map(i => i.track)
      .filter(Boolean)
      .map(t => ({
        id: t.id,
        title: t.name,
        artist: t.artists.map(a => a.name).join(", "),
        cover: t.album?.images?.[0]?.url || "",
        preview_url: t.preview_url
      }))
      .filter(t => t.preview_url);
    res.json({ name: data.name, items });
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: "Failed to load playlist" });
  }
});

// search helper used by the picks
app.get("/api/search", async (req, res) => {
  const q = req.query.q || "";
  if (!q) return res.json({ items: [] });
  try {
    const data = await spotifyGET("search", { q, type: "track", limit: 8 });
    const items = (data.tracks?.items || [])
      .map(t => ({
        id: t.id,
        title: t.name,
        artist: t.artists.map(a => a.name).join(", "),
        cover: t.album?.images?.[0]?.url || "",
        preview_url: t.preview_url
      }))
      .filter(t => t.preview_url);
    res.json({ items });
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.status(500).json({ error: "Search failed" });
  }
});

app.listen(process.env.PORT || 5050, () => {
  console.log(`API running on http://localhost:${process.env.PORT || 5050}`);
});
