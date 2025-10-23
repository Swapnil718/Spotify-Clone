// ---------- CONFIG ----------
const API_BASE = (window.API_BASE || "http://localhost:5050").replace(/\/$/, "");

// a default playlist to try first (Today's Top Hits)
const DEFAULT_PLAYLIST_ID = "37i9dQZF1DXcBWIGoYBM5M";

// fallback queries (we take first result that has preview_url)
const FALLBACK_PICKS = [
  "The Weeknd Blinding Lights",
  "Dua Lipa Levitating",
  "Billie Eilish bad guy",
  "Ed Sheeran Shape of You",
  "Imagine Dragons Believer"
];

// ---------- DOM ----------
const hitsEl = document.getElementById("hits");
const featuredEl = document.getElementById("featured");
const artistsEl = document.getElementById("artists");
const releasesEl = document.getElementById("releases");

const audio = document.getElementById("audio");
const npCover = document.getElementById("np-cover");
const npTitle = document.getElementById("np-title");
const npArtist = document.getElementById("np-artist");
const btnPlay = document.getElementById("play");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");
const seek = document.getElementById("seek");
const vol = document.getElementById("volume");
const current = document.getElementById("current");
const duration = document.getElementById("duration");

// ---------- STATE ----------
let queue = [];
let currentIndex = 0;

// ---------- UTIL ----------
function formatTime(sec){ if(isNaN(sec)) return "0:00"; const m=Math.floor(sec/60), s=Math.floor(sec%60); return `${m}:${String(s).padStart(2,"0")}`; }
function setNowPlaying(t){ npCover.src=t.cover||""; npTitle.textContent=t.title||"—"; npArtist.textContent=t.artist||"—"; }
function load(i){ currentIndex=i; const t=queue[i]; if(!t) return; audio.src=t.preview_url; setNowPlaying(t); }
function play(){ audio.play().catch(()=>{}); btnPlay.textContent="⏸"; }
function pause(){ audio.pause(); btnPlay.textContent="▶️"; }
function loadAndPlay(i){ load(i); play(); }

btnPlay.addEventListener("click", ()=> audio.paused ? play() : pause());
btnPrev.addEventListener("click", ()=>{ if(!queue.length) return; currentIndex=(currentIndex-1+queue.length)%queue.length; loadAndPlay(currentIndex); });
btnNext.addEventListener("click", ()=>{ if(!queue.length) return; currentIndex=(currentIndex+1)%queue.length; loadAndPlay(currentIndex); });
audio.addEventListener("timeupdate", ()=>{
  seek.value=(audio.currentTime/audio.duration)*100||0;
  current.textContent=formatTime(audio.currentTime);
  duration.textContent=formatTime(audio.duration);
});
seek.addEventListener("input", ()=>{ audio.currentTime=(seek.value/100)*(audio.duration||0); });
vol.addEventListener("input", ()=>{ audio.volume=vol.value; });
audio.addEventListener("ended", ()=> btnNext.click());

function card(t, idx){
  return `
    <article class="card" data-idx="${idx}">
      <img src="${t.cover}" alt="">
      <div class="title">${t.title}</div>
      <div class="sub">${t.artist}</div>
    </article>`;
}
function bindCards(container){
  container.querySelectorAll(".card").forEach(el=>{
    el.addEventListener("click", ()=> loadAndPlay(Number(el.dataset.idx)));
  });
}

function showMessage(el, msg){
  el.innerHTML = `<div style="color:#b3b3b3">${msg}</div>`;
}

// ---------- API HELPERS ----------
async function getFeatured(){
  const res = await fetch(`${API_BASE}/api/featured`);
  if(!res.ok) throw new Error(`featured ${res.status}`);
  return res.json(); // [{id,name,image,description}]
}
async function getPlaylist(id){
  const res = await fetch(`${API_BASE}/api/playlist/${id}`);
  if(!res.ok) throw new Error(`playlist ${res.status}`);
  return res.json(); // {name, items:[{title,artist,cover,preview_url}]}
}
async function searchPick(q){
  const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(q)}`);
  if(!res.ok) throw new Error(`search ${res.status}`);
  const {items=[]} = await res.json();
  return items.find(t => t.preview_url) || null;
}

// ---------- LOADERS ----------
async function loadDefaultPlaylistRow(){
  try{
    showMessage(hitsEl, "Loading songs…");
    const data = await getPlaylist(DEFAULT_PLAYLIST_ID);
    queue = data.items || [];
    if(queue.length === 0){
      throw new Error("no previews in playlist");
    }
    hitsEl.innerHTML = queue.slice(0,8).map((t,i)=>card(t,i)).join("");
    bindCards(hitsEl);
    load(0);
  }catch(e){
    // fallback to hard-coded picks
    const results = [];
    for(const q of FALLBACK_PICKS){
      try{
        const t = await searchPick(q);
        if(t) results.push(t);
      }catch{ /* ignore */ }
    }
    if(results.length === 0){
      showMessage(hitsEl, "No previews available at the moment.");
      return;
    }
    queue = results;
    hitsEl.innerHTML = queue.map((t,i)=>card(t,i)).join("");
    bindCards(hitsEl);
    load(0);
  }
}

async function loadFeaturedRow(){
  try{
    const items = await getFeatured();
    if(!Array.isArray(items) || items.length===0){
      showMessage(featuredEl, "No featured playlists.");
      return;
    }
    featuredEl.innerHTML = items.slice(0,6).map((p,i)=>`
      <article class="card" data-pl="${p.id}">
        <img src="${p.image}" alt="">
        <div class="title">${p.name}</div>
        <div class="sub">${p.description||""}</div>
      </article>
    `).join("");
    // clicking a featured playlist replaces the queue with its previewable tracks
    featuredEl.querySelectorAll("[data-pl]").forEach(el=>{
      el.addEventListener("click", async ()=>{
        const id = el.getAttribute("data-pl");
        const data = await getPlaylist(id);
        const items = data.items || [];
        if(items.length === 0){
          alert("This playlist has no 30-sec previews. Try another one.");
          return;
        }
        queue = items;
        hitsEl.innerHTML = queue.slice(0,8).map((t,i)=>card(t,i)).join("");
        bindCards(hitsEl);
        load(0);
      });
    });
  }catch(_e){
    showMessage(featuredEl, "Couldn’t load featured playlists.");
  }
}

// optional filler from whatever is in queue
function renderFiller(){
  if(queue.length>=3){
    artistsEl.innerHTML = queue.slice(1,4).map((t,i)=>card(t,i)).join("");
    bindCards(artistsEl);
  }
  if(queue.length>=2){
    releasesEl.innerHTML = queue.slice(0,2).map((t,i)=>card(t,i)).join("");
    bindCards(releasesEl);
  }
}

// ---------- INIT ----------
(async function init(){
  await loadDefaultPlaylistRow();
  await loadFeaturedRow();
  renderFiller();
  audio.volume = vol.value;
})();
