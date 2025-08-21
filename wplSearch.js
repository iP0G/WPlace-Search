(async () => {
  const CONFIG = {
    DELAY: 1, // delay between pixel requests (ms)
    THEME: {
      primary: '#000000',
      secondary: '#111111',
      accent: '#222222',
      text: '#ffffff',
      highlight: '#775ce3',
      success: '#00ff00',
      error: '#ff0000'
    }
  };

  const state = {
    running: false,
    pixelsFound: 0,
    userToSearch: null,
    centerQX: 0,
    centerQY: 0,
    radius: 0,
    minimized: false,
    menuOpen: false,
    language: 'en'
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const fetchAPI = async (url) => {
    try {
      const res = await fetch(url, { credentials: 'include' });
      return await res.json();
    } catch {
      return null;
    }
  };

  const searchPixel = async (qX, qY, x, y) => {
    const url = `https://backend.wplace.live/s0/pixel/${qX}/${qY}?x=${x}&y=${y}`;
    const data = await fetchAPI(url);
    if (data?.paintedBy?.name === state.userToSearch) {
      state.pixelsFound++;
      console.log(`✅ Pixel found at quadrant (${qX},${qY}) pixel (${x},${y})`);
      updateUI(`Pixels found: ${state.pixelsFound}`, 'success');
    }
  };

  const scanQuadrants = async () => {
    const { centerQX, centerQY, radius } = state;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (!state.running) return;
        const qX = centerQX + dx;
        const qY = centerQY + dy;
        for (let x = 0; x <= 999; x++) {
          for (let y = 0; y <= 999; y++) {
            if (!state.running) return;
            await searchPixel(qX, qY, x, y);
            await sleep(CONFIG.DELAY);
          }
        }
      }
    }
    updateUI('Scan completed.', 'success');
  };

  const createUI = () => {
    if (state.menuOpen) return;
    state.menuOpen = true;

    const style = document.createElement('style');
    style.textContent = `
      .wplace-panel { position: fixed; top:20px; right:20px; width:300px; background:${CONFIG.THEME.primary}; border:1px solid ${CONFIG.THEME.accent}; border-radius:8px; padding:0; box-shadow:0 5px 15px rgba(0,0,0,0.5); z-index:9999; color:${CONFIG.THEME.text}; font-family:'Segoe UI',sans-serif;}
      .wplace-header { padding:12px 15px; background:${CONFIG.THEME.secondary}; color:${CONFIG.THEME.highlight}; font-weight:600; display:flex; justify-content:space-between; cursor:move;}
      .wplace-content { padding:15px; display:block; }
      .wplace-btn { padding:10px; border:none; border-radius:6px; width:100%; cursor:pointer; margin-bottom:8px; background:${CONFIG.THEME.accent}; color:white; font-weight:600;}
      .wplace-status { padding:8px; border-radius:4px; text-align:center; font-size:13px; background:rgba(255,255,255,0.1); margin-top:5px;}
      .status-success { background:rgba(0,255,0,0.1); color:${CONFIG.THEME.success}; }
      .status-error { background:rgba(255,0,0,0.1); color:${CONFIG.THEME.error}; }
      input { width:100%; padding:6px; margin-bottom:6px; border-radius:4px; border:1px solid #333; box-sizing:border-box;}
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.className = 'wplace-panel';
    panel.innerHTML = `
      <div class="wplace-header">Search User Pixels</div>
      <div class="wplace-content">
        <input id="userInput" type="text" placeholder="Enter username" />
        <input id="centerQXInput" type="number" placeholder="Center quadrant X" />
        <input id="centerQYInput" type="number" placeholder="Center quadrant Y" />
        <input id="radiusInput" type="number" placeholder="Quadrants radius" />
        <button id="startBtn" class="wplace-btn">Start Scan</button>
        <button id="stopBtn" class="wplace-btn" style="background:${CONFIG.THEME.error};">Stop Scan</button>
        <div id="statusText" class="wplace-status">Ready</div>
      </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('startBtn').onclick = () => {
      const username = document.getElementById('userInput').value.trim();
      const cx = parseInt(document.getElementById('centerQXInput').value, 10);
      const cy = parseInt(document.getElementById('centerQYInput').value, 10);
      const radius = parseInt(document.getElementById('radiusInput').value, 10);

      if (!username || isNaN(cx) || isNaN(cy) || isNaN(radius)) {
        return alert('Please fill in all fields with valid numbers!');
      }

      state.userToSearch = username;
      state.centerQX = cx;
      state.centerQY = cy;
      state.radius = radius;
      state.running = true;
      state.pixelsFound = 0;

      updateUI(`Scanning for ${username}...`, 'success');
      scanQuadrants();
    };

    document.getElementById('stopBtn').onclick = () => {
      state.running = false;
      updateUI('Scan stopped.', 'error');
    };
  };

  const updateUI = (msg, type='default') => {
    const el = document.getElementById('statusText');
    if(el) {
      el.textContent = msg;
      el.className = `wplace-status ${type==='success'?'status-success':type==='error'?'status-error':''}`;
    }
  };

  createUI();
})();
