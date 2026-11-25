/**
 * DIALOG COFFEE Cashier - YouTube & YouTube Music Mini Player Module
 * Memutar lagu / playlist publik dari YouTube dan YouTube Music langsung di dalam aplikasi kasir
 * dengan mode minimize agar musik tetap menyala saat barista melayani transaksi POS.
 */

const MusicModule = {
  STORAGE_KEY: 'dialog_coffee_music_playlist_v1',
  VOLUME_KEY: 'dialog_coffee_music_volume_v1',

  PRESETS: [
    {
      id: 'preset-lofi',
      title: 'Lofi Hip Hop Radio (24/7 Cafe Beats)',
      type: 'video',
      videoId: 'jfKfPfyJRdk',
      listId: '',
      url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
      isPreset: true
    },
    {
      id: 'preset-jazz',
      title: 'Relaxing Jazz Piano Radio - Cafe BGM 24/7',
      type: 'video',
      videoId: 'Dx5qFachd3A',
      listId: '',
      url: 'https://www.youtube.com/watch?v=Dx5qFachd3A',
      isPreset: true
    },
    {
      id: 'preset-study',
      title: '1 A.M Study Session (Lofi Chill Mix)',
      type: 'video',
      videoId: 'lTRiuFIWV54',
      listId: '',
      url: 'https://www.youtube.com/watch?v=lTRiuFIWV54',
      isPreset: true
    },
    {
      id: 'preset-synth',
      title: 'Synthwave Radio - Chill Beats 24/7',
      type: 'video',
      videoId: '4xDzrJKXOOY',
      listId: '',
      url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY',
      isPreset: true
    }
  ],

  player: null,
  apiLoading: false,
  apiReady: false,
  isOpen: false,
  isPlaying: false,
  currentItem: null,
  currentVolume: 80,
  pendingLoad: null,
  _cloudListening: false,

  init() {
    try {
      const savedVol = parseInt(localStorage.getItem(this.VOLUME_KEY), 10);
      if (!isNaN(savedVol) && savedVol >= 0 && savedVol <= 100) {
        this.currentVolume = savedVol;
      }
    } catch (e) {}

    const volSlider = document.getElementById('musicVolumeSlider');
    const volLabel = document.getElementById('musicVolumeLabel');
    if (volSlider) volSlider.value = this.currentVolume;
    if (volLabel) volLabel.textContent = `${this.currentVolume}%`;

    const urlInput = document.getElementById('musicUrlInput');
    if (urlInput) {
      urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.playFromInput();
        }
      });
    }

    this.renderPlaylist();
    this.initCloudSync();
  },

  initCloudSync() {
    if (this._cloudListening) return;
    if (window.CloudSync && CloudSync.db) {
      this._cloudListening = true;
      try {
        CloudSync.db.ref('music_playlist').on('value', snap => {
          const data = snap.val();
          if (Array.isArray(data)) {
            try {
              localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            } catch (e) {}
            this.renderPlaylist();
          }
        });
      } catch (e) {}
    }
  },

  getSavedItems() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  },

  saveItems(items) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (e) {}
    if (window.CloudSync && CloudSync.db) {
      try {
        CloudSync.db.ref('music_playlist').set(items);
      } catch (e) {}
    }
    this.renderPlaylist();
  },

  parseYouTubeUrl(rawInput) {
    const input = String(rawInput || '').trim();
    if (!input) return null;

    let videoId = '';
    let listId = '';

    // 1. Cek jika pengguna langsung menempel ID Video (11 karakter)
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
      return {
        type: 'video',
        videoId: input,
        listId: '',
        url: `https://www.youtube.com/watch?v=${input}`
      };
    }

    // 2. Cek jika pengguna langsung menempel ID Playlist (PL..., OLAK5uy_..., RD...)
    if (/^(PL|OLAK5uy_|RD|UU|LL)[a-zA-Z0-9_-]{8,}$/.test(input)) {
      return {
        type: 'playlist',
        videoId: '',
        listId: input,
        url: `https://www.youtube.com/playlist?list=${input}`
      };
    }

    // 3. Parse URL penuh (youtube.com, music.youtube.com, youtu.be, m.youtube.com)
    let urlStr = input;
    if (!/^https?:\/\//i.test(urlStr)) {
      urlStr = 'https://' + urlStr;
    }

    try {
      const u = new URL(urlStr);
      const host = u.hostname.toLowerCase();

      if (u.searchParams.get('list')) {
        listId = u.searchParams.get('list').trim();
      }
      if (u.searchParams.get('v')) {
        videoId = u.searchParams.get('v').trim();
      }

      if (!videoId && host.includes('youtu.be')) {
        const seg = u.pathname.split('/').filter(Boolean)[0];
        if (seg) videoId = seg;
      }

      if (!videoId && (host.includes('youtube.com') || host.includes('youtube-nocookie.com'))) {
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') {
          if (parts[1]) videoId = parts[1];
        }
      }
    } catch (e) {
      // Fallback regex extraction
      const vMatch = input.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/);
      const lMatch = input.match(/[?&]list=([a-zA-Z0-9_-]+)/);
      if (vMatch) videoId = vMatch[1];
      if (lMatch) listId = lMatch[1];
    }

    if (!videoId && !listId) return null;

    const canonicalUrl = listId && !videoId
      ? `https://www.youtube.com/playlist?list=${listId}`
      : `https://www.youtube.com/watch?v=${videoId}${listId ? '&list=' + listId : ''}`;

    return {
      type: (listId && !videoId) ? 'playlist' : (listId ? 'video_playlist' : 'video'),
      videoId: videoId,
      listId: listId,
      url: canonicalUrl
    };
  },

  ensureYouTubeApi(callback) {
    if (this.apiReady && window.YT && typeof YT.Player === 'function') {
      callback();
      return;
    }

    this.pendingLoad = callback;

    if (window.YT && typeof YT.Player === 'function') {
      this.apiReady = true;
      callback();
      return;
    }

    if (!this.apiLoading) {
      this.apiLoading = true;
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        this.apiReady = true;
        this.apiLoading = false;
        if (typeof prevCallback === 'function') {
          try { prevCallback(); } catch (e) {}
        }
        if (typeof this.pendingLoad === 'function') {
          const fn = this.pendingLoad;
          this.pendingLoad = null;
          fn();
        }
      };

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = () => {
        this.apiLoading = false;
        // Fallback ke iframe langsung jika script API gagal dimuat
        if (this.currentItem) {
          this.renderFallbackIframe(this.currentItem);
        }
      };
      document.head.appendChild(tag);
    }
  },

  togglePanel() {
    if (this.isOpen) {
      this.minimizePanel();
    } else {
      this.openPanel();
    }
  },

  openPanel() {
    this.isOpen = true;
    const panel = document.getElementById('musicPlayerPanel');
    const pill = document.getElementById('musicMiniPill');
    if (panel) {
      panel.classList.remove('music-panel-collapsed');
      panel.classList.add('music-panel-open');
    }
    if (pill) pill.style.display = 'none';
    this.initCloudSync();
    this.renderPlaylist();
  },

  minimizePanel() {
    this.isOpen = false;
    const panel = document.getElementById('musicPlayerPanel');
    if (panel) {
      panel.classList.remove('music-panel-open');
      panel.classList.add('music-panel-collapsed');
    }
    this.updateMiniPill();
  },

  updateMiniPill() {
    const pill = document.getElementById('musicMiniPill');
    const pillTitle = document.getElementById('musicMiniPillTitle');
    const pillBtn = document.getElementById('musicMiniPillPlayBtn');
    const topBtn = document.getElementById('topMusicBtn');

    if (topBtn) {
      topBtn.classList.toggle('music-playing', this.isPlaying);
    }

    if (!pill) return;
    if (!this.isOpen && this.currentItem) {
      pill.style.display = 'flex';
      if (pillTitle) {
        pillTitle.textContent = this.currentItem.title || 'Memutar YouTube...';
      }
      if (pillBtn) {
        pillBtn.textContent = this.isPlaying ? '⏸' : '▶';
      }
    } else {
      pill.style.display = 'none';
    }
  },

  setStatus(text, isError = false) {
    const statusEl = document.getElementById('musicPlayerStatus');
    const errorEl = document.getElementById('musicPlayerError');
    if (statusEl && !isError) {
      statusEl.textContent = text;
    }
    if (errorEl) {
      if (isError) {
        errorEl.innerHTML = text;
        errorEl.style.display = 'block';
      } else {
        errorEl.style.display = 'none';
      }
    }
  },

  updatePlayButtons() {
    const playBtn = document.getElementById('btnMusicPlayPause');
    if (playBtn) {
      playBtn.innerHTML = this.isPlaying ? '<span>⏸</span> Jeda' : '<span>▶</span> Putar';
    }
    const nowTitle = document.getElementById('musicNowPlayingTitle');
    if (nowTitle && this.currentItem) {
      nowTitle.textContent = this.currentItem.title || 'Memutar YouTube...';
    }
    this.updateMiniPill();
  },

  async fetchTrackTitle(url, fallbackTitle) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
        signal: controller.signal
      });
      clearTimeout(timer);
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.title) return data.title;
      }
    } catch (e) {}
    return fallbackTitle;
  },

  async playFromInput() {
    const input = document.getElementById('musicUrlInput');
    const raw = input ? input.value.trim() : '';
    const parsed = this.parseYouTubeUrl(raw);

    if (!parsed) {
      this.setStatus('Link tidak valid. Tempel link YouTube atau YouTube Music (lagu / playlist).', true);
      if (window.App) App.playBeep(260, 0.12, 'sawtooth');
      return;
    }

    const fallbackTitle = parsed.listId && !parsed.videoId
      ? `Playlist YouTube (${parsed.listId.slice(0, 10)}...)`
      : `Lagu YouTube (${parsed.videoId})`;

    const item = {
      id: 'custom_' + Date.now(),
      title: fallbackTitle,
      type: parsed.type,
      videoId: parsed.videoId,
      listId: parsed.listId,
      url: parsed.url
    };

    this.playItem(item);

    // Ambil judul asli di latar belakang
    const realTitle = await this.fetchTrackTitle(parsed.url, fallbackTitle);
    if (this.currentItem && this.currentItem.id === item.id) {
      this.currentItem.title = realTitle;
      this.updatePlayButtons();
    }
  },

  async saveFromInput() {
    const input = document.getElementById('musicUrlInput');
    const raw = input ? input.value.trim() : '';
    const parsed = this.parseYouTubeUrl(raw);

    if (!parsed) {
      this.setStatus('Tempel link YouTube / YouTube Music yang valid terlebih dahulu untuk disimpan.', true);
      return;
    }

    const fallbackTitle = parsed.listId && !parsed.videoId
      ? 'Playlist YouTube Kafe'
      : 'Lagu YouTube Kafe';

    const autoTitle = await this.fetchTrackTitle(parsed.url, fallbackTitle);
    const customTitle = prompt('Masukkan nama lagu / playlist untuk disimpan ke Daftar Putar Kafe:', autoTitle);
    if (customTitle === null) return;

    const finalTitle = customTitle.trim() || autoTitle;
    const saved = this.getSavedItems();
    const newItem = {
      id: 'saved_' + Date.now(),
      title: finalTitle,
      type: parsed.type,
      videoId: parsed.videoId,
      listId: parsed.listId,
      url: parsed.url,
      isPreset: false
    };

    saved.unshift(newItem);
    this.saveItems(saved);

    if (input) input.value = '';
    if (window.App && App.showToast) {
      App.showToast(`🎵 "${finalTitle}" disimpan ke Daftar Putar Kafe!`, 'success');
    }
  },

  deleteSavedItem(itemId, event) {
    if (event) event.stopPropagation();
    const saved = this.getSavedItems().filter(i => i.id !== itemId);
    this.saveItems(saved);
    if (window.App && App.showToast) {
      App.showToast('Item dihapus dari Daftar Putar Kafe.', 'info');
    }
  },

  playItem(item) {
    if (!item) return;
    this.currentItem = item;
    this.setStatus('Memuat pemutar YouTube...', false);
    this.updatePlayButtons();
    this.renderPlaylist();

    const placeholder = document.getElementById('musicEmptyPlaceholder');
    if (placeholder) placeholder.style.display = 'none';

    this.ensureYouTubeApi(() => {
      this.loadIntoPlayer(item);
    });
  },

  loadIntoPlayer(item) {
    const mountEl = document.getElementById('ytPlayerMount');
    if (!mountEl) return;

    // Jika player sudah ada dan valid, langsung muat video/playlist baru
    if (this.player && typeof this.player.loadVideoById === 'function') {
      try {
        if (item.listId && !item.videoId) {
          this.player.loadPlaylist({ list: item.listId, listType: 'playlist' });
        } else if (item.listId && item.videoId) {
          this.player.loadPlaylist({ list: item.listId, listType: 'playlist' });
        } else if (item.videoId) {
          this.player.loadVideoById(item.videoId);
        }
        this.player.setVolume(this.currentVolume);
        this.player.playVideo();
        return;
      } catch (e) {
        try { this.player.destroy(); } catch (err) {}
        this.player = null;
      }
    }

    // Buat instance YouTube IFrame Player baru
    mountEl.innerHTML = '<div id="ytPlayerInner"></div>';

    const playerVars = {
      autoplay: 1,
      controls: 1,
      playsinline: 1,
      rel: 0,
      modestbranding: 1,
      enablejsapi: 1
    };

    if (window.location && /^https?:\/\//i.test(window.location.origin)) {
      playerVars.origin = window.location.origin;
    }

    if (item.listId) {
      playerVars.listType = 'playlist';
      playerVars.list = item.listId;
    }

    try {
      this.player = new YT.Player('ytPlayerInner', {
        width: '100%',
        height: '185',
        videoId: item.videoId || undefined,
        playerVars: playerVars,
        events: {
          onReady: (event) => {
            try {
              const iframe = event.target.getIframe();
              if (iframe) {
                iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
                iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
              }
              event.target.setVolume(this.currentVolume);
              event.target.playVideo();
            } catch (e) {}
          },
          onStateChange: (event) => {
            if (!window.YT || !YT.PlayerState) return;
            const st = event.data;
            if (st === YT.PlayerState.PLAYING) {
              this.isPlaying = true;
              this.setStatus('Sedang Diputar', false);
              try {
                const vData = event.target.getVideoData();
                if (vData && vData.title && this.currentItem) {
                  this.currentItem.title = vData.title;
                }
              } catch (e) {}
              this.updatePlayButtons();
            } else if (st === YT.PlayerState.PAUSED) {
              this.isPlaying = false;
              this.setStatus('Dijeda', false);
              this.updatePlayButtons();
            } else if (st === YT.PlayerState.BUFFERING) {
              this.setStatus('Memuat buffer...', false);
            } else if (st === YT.PlayerState.ENDED) {
              this.isPlaying = false;
              this.setStatus('Selesai', false);
              this.updatePlayButtons();
              // Otomatis lanjut ke lagu berikutnya jika bukan playlist bawaan YouTube
              if (!this.currentItem || !this.currentItem.listId) {
                this.nextTrack();
              }
            }
          },
          onError: (event) => {
            this.isPlaying = false;
            this.updatePlayButtons();
            const code = event.data;
            const openUrl = (this.currentItem && this.currentItem.url) ? this.currentItem.url : 'https://music.youtube.com';
            if (code === 101 || code === 150 || code === 153) {
              this.setStatus(
                `Lagu ini dibatasi pemilik hak cipta untuk diputar di dalam aplikasi (Kode ${code}). Coba versi lain atau <a href="${openUrl}" target="_blank" style="color:inherit;text-decoration:underline;font-weight:800;">Buka di YouTube</a>.`,
                true
              );
            } else {
              this.setStatus(
                `Gagal memutar video/playlist (Kode ${code}). Pastikan link publik & koneksi internet aktif.`,
                true
              );
            }
          }
        }
      });
    } catch (e) {
      this.renderFallbackIframe(item);
    }
  },

  renderFallbackIframe(item) {
    const mountEl = document.getElementById('ytPlayerMount');
    if (!mountEl || !item) return;
    const src = item.listId && !item.videoId
      ? `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(item.listId)}&autoplay=1&playsinline=1`
      : `https://www.youtube.com/embed/${encodeURIComponent(item.videoId)}?autoplay=1&playsinline=1${item.listId ? '&list=' + encodeURIComponent(item.listId) : ''}`;
    mountEl.innerHTML = `<iframe src="${src}" width="100%" height="185" frameborder="0" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="border-radius: 10px; display: block;"></iframe>`;
    this.isPlaying = true;
    this.setStatus('Sedang Diputar', false);
    this.updatePlayButtons();
  },

  togglePlayPause() {
    if (!this.currentItem) {
      // Putar preset pertama jika belum ada yang dipilih
      this.playItem(this.PRESETS[0]);
      return;
    }
    if (this.player && typeof this.player.getPlayerState === 'function') {
      try {
        const st = this.player.getPlayerState();
        if (st === YT.PlayerState.PLAYING) {
          this.player.pauseVideo();
        } else {
          this.player.playVideo();
        }
      } catch (e) {}
    } else {
      this.playItem(this.currentItem);
    }
  },

  stopPlayback() {
    if (this.player && typeof this.player.stopVideo === 'function') {
      try {
        this.player.stopVideo();
        this.player.destroy();
      } catch (e) {}
      this.player = null;
    }
    const mountEl = document.getElementById('ytPlayerMount');
    if (mountEl) mountEl.innerHTML = '';
    const placeholder = document.getElementById('musicEmptyPlaceholder');
    if (placeholder) placeholder.style.display = 'flex';
    this.isPlaying = false;
    this.currentItem = null;
    this.setStatus('Siap Memutar', false);
    const nowTitle = document.getElementById('musicNowPlayingTitle');
    if (nowTitle) nowTitle.textContent = 'Belum ada lagu diputar';
    this.updatePlayButtons();
    this.renderPlaylist();
  },

  getAllQueue() {
    return [...this.getSavedItems(), ...this.PRESETS];
  },

  prevTrack() {
    if (this.currentItem && this.currentItem.listId && this.player && typeof this.player.previousVideo === 'function') {
      try { this.player.previousVideo(); return; } catch (e) {}
    }
    const queue = this.getAllQueue();
    if (!queue.length) return;
    const idx = this.currentItem ? queue.findIndex(i => i.id === this.currentItem.id) : -1;
    const prevIdx = idx <= 0 ? queue.length - 1 : idx - 1;
    this.playItem(queue[prevIdx]);
  },

  nextTrack() {
    if (this.currentItem && this.currentItem.listId && this.player && typeof this.player.nextVideo === 'function') {
      try { this.player.nextVideo(); return; } catch (e) {}
    }
    const queue = this.getAllQueue();
    if (!queue.length) return;
    const idx = this.currentItem ? queue.findIndex(i => i.id === this.currentItem.id) : -1;
    const nextIdx = (idx + 1) % queue.length;
    this.playItem(queue[nextIdx]);
  },

  setVolume(val) {
    const v = Math.min(100, Math.max(0, parseInt(val, 10) || 0));
    this.currentVolume = v;
    try { localStorage.setItem(this.VOLUME_KEY, String(v)); } catch (e) {}
    const volLabel = document.getElementById('musicVolumeLabel');
    if (volLabel) volLabel.textContent = `${v}%`;
    if (this.player && typeof this.player.setVolume === 'function') {
      try { this.player.setVolume(v); } catch (e) {}
    }
  },

  escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  },

  renderPlaylist() {
    const listEl = document.getElementById('musicPlaylistContainer');
    if (!listEl) return;

    const saved = this.getSavedItems();
    const allItems = [...saved, ...this.PRESETS];

    listEl.innerHTML = allItems.map(item => {
      const isActive = this.currentItem && this.currentItem.id === item.id;
      const badge = item.listId ? 'Playlist' : (item.isPreset ? 'Kafe' : 'Tersimpan');
      const icon = isActive && this.isPlaying ? '🔊' : (item.listId ? '🎶' : '🎵');
      return `
        <div class="music-playlist-item ${isActive ? 'active' : ''}" onclick="MusicModule.playById('${item.id}')">
          <div class="music-item-left">
            <span class="music-item-icon">${icon}</span>
            <div class="music-item-info">
              <div class="music-item-title">${this.escapeHtml(item.title)}</div>
              <div class="music-item-badge">${badge}</div>
            </div>
          </div>
          ${!item.isPreset ? `<button type="button" class="music-item-del" onclick="MusicModule.deleteSavedItem('${item.id}', event)" title="Hapus dari daftar">✕</button>` : ''}
        </div>
      `;
    }).join('');
  },

  playById(itemId) {
    const allItems = this.getAllQueue();
    const found = allItems.find(i => i.id === itemId);
    if (found) {
      this.playItem(found);
    }
  }
};

window.MusicModule = MusicModule;
