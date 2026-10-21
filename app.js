/**
 * ============================================================================
 * KICK PREDICTION OVERLAY - OBS STUDIO
 * Ultra-responsive, real-time prediction monitor with animations & sound
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. CONFIGURATION & STATE
  // --------------------------------------------------------------------------
  const urlParams = new URLSearchParams(window.location.search);

  const CONFIG = {
    channel: urlParams.get('channel') || 'xqc',
    layout: urlParams.get('layout') || localStorage.getItem('kick_overlay_layout') || 'compact',
    cleanMode: urlParams.get('clean') === '1' || urlParams.get('clean') === 'true',
    autoHideInactive: urlParams.get('autohide') !== '0' && urlParams.get('autohide') !== 'false', // Activado por defecto
    isDemo: urlParams.get('demo') === '1' || urlParams.get('demo') === 'true',
    activePollInterval: 2500, // 2.5s when prediction is open/voting
    lockedPollInterval: 3000, // 3.0s when prediction is locked/waiting resolution
    idlePollInterval: 7500,   // 7.5s when resolved or idle
  };

  const STATE = {
    currentPrediction: null,
    previousState: null,
    pollTimer: null,
    countdownInterval: null,
    autoHideTimer: null,
    isDemoActive: false,
    channelData: null,
    winnerAnnounced: false
  };

  // --------------------------------------------------------------------------
  // 2. DOM ELEMENTS
  // --------------------------------------------------------------------------
  const DOM = {
    widget: document.getElementById('prediction-card'),
    streamerAvatar: document.getElementById('streamer-avatar'),
    channelName: document.getElementById('channel-name'),
    statusPill: document.getElementById('status-pill'),
    statusText: document.getElementById('status-text'),
    timerText: document.getElementById('timer-text'),
    title: document.getElementById('prediction-title'),
    totalPoints: document.getElementById('total-points-display'),
    totalVoters: document.getElementById('total-voters-display'),
    
    // Outcome 1
    card1: document.getElementById('outcome-card-1'),
    title1: document.getElementById('outcome-1-title'),
    multiplier1: document.getElementById('outcome-1-multiplier'),
    percent1: document.getElementById('outcome-1-percent'),
    points1: document.getElementById('outcome-1-points'),
    voters1: document.getElementById('outcome-1-voters'),

    // Outcome 2
    card2: document.getElementById('outcome-card-2'),
    title2: document.getElementById('outcome-2-title'),
    multiplier2: document.getElementById('outcome-2-multiplier'),
    percent2: document.getElementById('outcome-2-percent'),
    points2: document.getElementById('outcome-2-points'),
    voters2: document.getElementById('outcome-2-voters'),

    // Progress Bar
    progressBar1: document.getElementById('progress-bar-1'),
    progressBar2: document.getElementById('progress-bar-2'),
    progressDivider: document.getElementById('progress-divider'),

    // Winner banner
    winnerBanner: document.getElementById('winner-banner'),
    winnerName: document.getElementById('winner-name-display'),

    // Controller Dock
    controllerDock: document.getElementById('controller-dock'),
    toggleDockBtn: document.getElementById('toggle-dock-btn'),
    dockPanel: document.getElementById('dock-panel'),
    closeDockBtn: document.getElementById('close-dock-btn'),
    channelInput: document.getElementById('channel-input'),
    btnConnect: document.getElementById('btn-connect'),
    autohideToggle: document.getElementById('autohide-toggle'),
    obsUrlPreview: document.getElementById('obs-url-preview'),
    btnCopyObsUrl: document.getElementById('btn-copy-obs-url'),

    // Demo Buttons
    btnDemoStart: document.getElementById('btn-demo-start'),
    btnDemoVotes: document.getElementById('btn-demo-votes'),
    btnDemoLock: document.getElementById('btn-demo-lock'),
    btnDemoWin1: document.getElementById('btn-demo-win-1'),
    btnDemoWin2: document.getElementById('btn-demo-win-2'),
    btnDemoWinAutohide: document.getElementById('btn-demo-win-autohide'),
    btnDemoCancel: document.getElementById('btn-demo-cancel'),
    btnDemoInactive: document.getElementById('btn-demo-inactive'),
    btnDemoReset: document.getElementById('btn-demo-reset'),

    // Canvas
    confettiCanvas: document.getElementById('confetti-canvas'),
  };

  // --------------------------------------------------------------------------
  // 3. CANVAS CONFETTI ENGINE (High performance, 60fps)
  // --------------------------------------------------------------------------
  class ConfettiEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.animating = false;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    burst(count = 90) {
      const colors = ['#FFD700', '#53FC18', '#00E5FF', '#FF2A85', '#FFFFFF', '#FFA751'];
      const cx = this.canvas.width / 2;
      const cy = this.canvas.height / 2;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 12 + 6;
        this.particles.push({
          x: cx + (Math.random() - 0.5) * 300,
          y: cy + (Math.random() - 0.5) * 100,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 5,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 12,
          opacity: 1,
          gravity: 0.25,
          drag: 0.96
        });
      }

      if (!this.animating) {
        this.animating = true;
        this.render();
      }
    }

    render() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.opacity -= 0.008;

        if (p.opacity <= 0 || p.y > this.canvas.height) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0, p.opacity);
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        requestAnimationFrame(() => this.render());
      } else {
        this.animating = false;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }

  const confetti = new ConfettiEngine(DOM.confettiCanvas);

  // --------------------------------------------------------------------------
  // 5. DATA FORMATTING HELPERS
  // --------------------------------------------------------------------------
  function formatPoints(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0 pts';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace('.0', '') + 'M pts';
    }
    if (num >= 10000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'K pts';
    }
    return num.toLocaleString('es-ES') + ' pts';
  }

  function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return num.toLocaleString('es-ES');
  }

  function formatTime(seconds) {
    if (seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // --------------------------------------------------------------------------
  // 6. KICK API CLIENT
  // --------------------------------------------------------------------------
  const KickAPI = {
    async fetchChannel(slug) {
      try {
        const response = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) return null;
        return await response.json();
      } catch (err) {
        console.warn('[KickAPI] Error fetching channel info:', err);
        return null;
      }
    },

    async fetchLatestPrediction(slug) {
      try {
        const response = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}/predictions/latest`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) return null;
        const json = await response.json();
        return json?.data?.prediction || null;
      } catch (err) {
        console.warn('[KickAPI] Error fetching prediction:', err);
        return null;
      }
    }
  };

  // --------------------------------------------------------------------------
  // 7. OVERLAY RENDERER & LOGIC
  // --------------------------------------------------------------------------
  function renderPrediction(prediction) {
    if (!prediction) {
      // Inactive / No prediction state
      clearTimeout(STATE.autoHideTimer);
      if (CONFIG.autoHideInactive) {
        DOM.widget.classList.add('hidden-state');
      } else {
        DOM.widget.classList.remove('hidden-state');
        DOM.title.textContent = 'Sin predicción activa en este canal';
        DOM.statusPill.className = 'status-pill status-cancelled';
        DOM.statusText.textContent = 'Inactivo';
        DOM.timerText.textContent = '--:--';
        DOM.totalPoints.textContent = '0 pts';
        DOM.totalVoters.textContent = '0 votantes';
        DOM.card1.className = 'outcome-card option-1';
        DOM.card2.className = 'outcome-card option-2';
        DOM.winnerBanner.classList.remove('active');
        DOM.percent1.textContent = '50';
        DOM.percent2.textContent = '50';
        DOM.progressBar1.style.width = '50%';
        DOM.progressBar2.style.width = '50%';
        DOM.progressDivider.style.left = '50%';
      }
      return;
    }

    // Si es una predicción antigua finalizada o cancelada hace más de 45 segundos y estamos en modo OBS limpia (?clean=1), se oculta
    // En modo navegador/preview, la mantenemos visible para que el usuario pueda previsualizar su diseño
    const finishedTime = new Date(prediction.updated_at || prediction.created_at || 0).getTime();
    const isOldFinished = (prediction.state === 'RESOLVED' || prediction.state === 'CANCELLED') &&
      finishedTime > 0 &&
      !STATE.isDemoActive &&
      (Date.now() - finishedTime > 45 * 1000);

    if (isOldFinished && CONFIG.autoHideInactive && CONFIG.cleanMode) {
      DOM.widget.classList.add('hidden-state');
      return;
    }

    // Si está activa o bloqueada, se muestra siempre
    if (prediction.state === 'ACTIVE' || prediction.state === 'LOCKED') {
      clearTimeout(STATE.autoHideTimer);
      DOM.widget.classList.remove('hidden-state');
    } else {
      DOM.widget.classList.remove('hidden-state');
    }

    // Title
    DOM.title.textContent = prediction.title || 'Predicción en Vivo';

    // Outcomes data
    const outcome1 = prediction.outcomes?.[0] || { id: '1', title: 'Opción A', total_vote_amount: 0, vote_count: 0, return_rate: 1 };
    const outcome2 = prediction.outcomes?.[1] || { id: '2', title: 'Opción B', total_vote_amount: 0, vote_count: 0, return_rate: 1 };

    const pts1 = outcome1.total_vote_amount || 0;
    const pts2 = outcome2.total_vote_amount || 0;
    const totalPts = pts1 + pts2;

    const voters1 = outcome1.vote_count || 0;
    const voters2 = outcome2.vote_count || 0;
    const totalVoters = voters1 + voters2;

    // Percentages
    let p1 = 50;
    let p2 = 50;
    if (totalPts > 0) {
      p1 = Math.round((pts1 / totalPts) * 100);
      p2 = 100 - p1;
    }

    // Update Outcome 1 Card
    DOM.title1.textContent = outcome1.title;
    DOM.multiplier1.textContent = `${Number(outcome1.return_rate || 1).toFixed(2)}x`;
    DOM.percent1.textContent = p1;
    DOM.points1.textContent = formatPoints(pts1);
    DOM.voters1.textContent = `${formatNumber(voters1)} votos`;

    // Update Outcome 2 Card
    DOM.title2.textContent = outcome2.title;
    DOM.multiplier2.textContent = `${Number(outcome2.return_rate || 1).toFixed(2)}x`;
    DOM.percent2.textContent = p2;
    DOM.points2.textContent = formatPoints(pts2);
    DOM.voters2.textContent = `${formatNumber(voters2)} votos`;

    // Update Pool Stats
    DOM.totalPoints.textContent = formatPoints(totalPts);
    DOM.totalVoters.textContent = `${formatNumber(totalVoters)} votantes`;

    // Update Progress Bar
    DOM.progressBar1.style.width = `${p1}%`;
    DOM.progressBar2.style.width = `${p2}%`;
    DOM.progressDivider.style.left = `${p1}%`;

    // State handling: ACTIVE, LOCKED, RESOLVED, CANCELLED
    const state = (prediction.state || 'ACTIVE').toUpperCase();

    // Check for State Transitions
    handleStateTransitions(state, prediction);

    // Apply Styles and Content based on State
    if (state === 'ACTIVE') {
      DOM.statusPill.className = 'status-pill status-active';
      DOM.statusText.textContent = 'Votación Abierta';
      DOM.card1.className = 'outcome-card option-1';
      DOM.card2.className = 'outcome-card option-2';
      DOM.winnerBanner.classList.remove('active');

      startCountdown(prediction);
    } else if (state === 'LOCKED') {
      DOM.statusPill.className = 'status-pill status-locked';
      DOM.statusText.textContent = 'Votación Cerrada';
      DOM.timerText.textContent = 'BLOQUEADO';
      DOM.card1.className = 'outcome-card option-1';
      DOM.card2.className = 'outcome-card option-2';
      DOM.winnerBanner.classList.remove('active');

      stopCountdown();
    } else if (state === 'RESOLVED') {
      DOM.statusPill.className = 'status-pill status-resolved';
      DOM.statusText.textContent = 'Finalizada';
      DOM.timerText.textContent = 'GANADOR';
      stopCountdown();

      const winId = prediction.winning_outcome_id;
      if (winId === outcome1.id) {
        DOM.card1.className = 'outcome-card option-1 is-winner';
        DOM.card2.className = 'outcome-card option-2 is-loser';
        DOM.winnerName.textContent = outcome1.title;
      } else if (winId === outcome2.id) {
        DOM.card1.className = 'outcome-card option-1 is-loser';
        DOM.card2.className = 'outcome-card option-2 is-winner';
        DOM.winnerName.textContent = outcome2.title;
      }

      DOM.winnerBanner.classList.add('active');

      // Auto-ocultar tras mostrar el ganador durante 18 segundos
      if (CONFIG.autoHideInactive) {
        clearTimeout(STATE.autoHideTimer);
        STATE.autoHideTimer = setTimeout(() => {
          DOM.widget.classList.add('hidden-state');
        }, 18000);
      }
    } else if (state === 'CANCELLED') {
      DOM.statusPill.className = 'status-pill status-cancelled';
      DOM.statusText.textContent = 'Cancelada';
      DOM.timerText.textContent = 'REEMBOLSADO';
      DOM.card1.className = 'outcome-card option-1 is-loser';
      DOM.card2.className = 'outcome-card option-2 is-loser';
      DOM.winnerBanner.classList.remove('active');
      stopCountdown();

      if (CONFIG.autoHideInactive) {
        clearTimeout(STATE.autoHideTimer);
        STATE.autoHideTimer = setTimeout(() => {
          DOM.widget.classList.add('hidden-state');
        }, 8000);
      }
    }

    STATE.previousState = state;
  }

  function handleStateTransitions(newState, prediction) {
    if (STATE.previousState && STATE.previousState !== newState) {
      if (newState === 'ACTIVE') {
        STATE.winnerAnnounced = false;
      } else if (newState === 'RESOLVED' && !STATE.winnerAnnounced) {
        confetti.burst(120);
        STATE.winnerAnnounced = true;
      }
    } else if (newState === 'RESOLVED' && !STATE.winnerAnnounced) {
      // First load already resolved
      confetti.burst(80);
      STATE.winnerAnnounced = true;
    }
  }

  // --------------------------------------------------------------------------
  // 8. COUNTDOWN TIMER LOGIC
  // --------------------------------------------------------------------------
  function startCountdown(prediction) {
    stopCountdown();

    const createdAt = new Date(prediction.created_at).getTime();
    const durationMs = (prediction.duration || 300) * 1000;
    const expiresAt = createdAt + durationMs;

    function update() {
      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));
      DOM.timerText.textContent = formatTime(remainingSeconds);

      if (remainingSeconds <= 0) {
        DOM.timerText.textContent = 'CERRANDO...';
        stopCountdown();
      }
    }

    update();
    STATE.countdownInterval = setInterval(update, 1000);
  }

  function stopCountdown() {
    if (STATE.countdownInterval) {
      clearInterval(STATE.countdownInterval);
      STATE.countdownInterval = null;
    }
  }

  // --------------------------------------------------------------------------
  // 9. POLLING LOOP & CHANNEL UPDATES
  // --------------------------------------------------------------------------
  async function updateChannelInfo(channelSlug) {
    const data = await KickAPI.fetchChannel(channelSlug);
    if (data) {
      STATE.channelData = data;
      if (DOM.channelName) {
        DOM.channelName.textContent = data.user?.username || data.slug || channelSlug;
      }
      if (data.user?.profile_pic && DOM.streamerAvatar) {
        DOM.streamerAvatar.src = data.user.profile_pic;
      }
    } else {
      if (DOM.channelName) {
        DOM.channelName.textContent = channelSlug;
      }
    }
  }

  async function pollPrediction() {
    if (STATE.isDemoActive) return;

    try {
      const prediction = await KickAPI.fetchLatestPrediction(CONFIG.channel);
      STATE.currentPrediction = prediction;
      renderPrediction(prediction);

      // Adaptive Polling Rate
      let nextInterval = CONFIG.idlePollInterval;
      if (prediction) {
        if (prediction.state === 'ACTIVE') {
          nextInterval = CONFIG.activePollInterval;
        } else if (prediction.state === 'LOCKED') {
          nextInterval = CONFIG.lockedPollInterval;
        }
      }

      scheduleNextPoll(nextInterval);
    } catch (err) {
      console.warn('[Overlay] Polling error:', err);
      scheduleNextPoll(CONFIG.idlePollInterval);
    }
  }

  function scheduleNextPoll(delayMs) {
    clearTimeout(STATE.pollTimer);
    if (!STATE.isDemoActive) {
      STATE.pollTimer = setTimeout(pollPrediction, delayMs);
    }
  }

  function connectToChannel(slug) {
    if (!slug) return;
    CONFIG.channel = slug.trim().toLowerCase();
    STATE.isDemoActive = false;
    STATE.winnerAnnounced = false;
    STATE.previousState = null;

    DOM.title.textContent = `Conectando a ${CONFIG.channel}...`;
    updateChannelInfo(CONFIG.channel);
    pollPrediction();
    updateObsUrlPreview();
  }

  // --------------------------------------------------------------------------
  // 10. SIMULATOR / DEMO MODE (For Testing & OBS Setup)
  // --------------------------------------------------------------------------
  const DemoSimulator = {
    mockPrediction: null,

    start() {
      STATE.isDemoActive = true;
      clearTimeout(STATE.pollTimer);
      clearTimeout(STATE.autoHideTimer);
      stopCountdown();
      DOM.widget.classList.remove('hidden-state');

      this.mockPrediction = {
        id: 'demo-pred-1',
        title: '¿Ganará la partida actual en vivo?',
        created_at: new Date().toISOString(),
        duration: 240,
        state: 'ACTIVE',
        winning_outcome_id: null,
        outcomes: [
          {
            id: 'demo-opt-1',
            title: 'SÍ, VICTORIA',
            total_vote_amount: 145000,
            vote_count: 82,
            return_rate: 1.62
          },
          {
            id: 'demo-opt-2',
            title: 'NO, DERROTA',
            total_vote_amount: 89000,
            vote_count: 54,
            return_rate: 2.64
          }
        ]
      };

      STATE.winnerAnnounced = false;
      renderPrediction(this.mockPrediction);
    },

    addVotes() {
      if (!this.mockPrediction || this.mockPrediction.state !== 'ACTIVE') return;

      const delta1 = Math.floor(Math.random() * 25000) + 5000;
      const delta2 = Math.floor(Math.random() * 20000) + 4000;

      this.mockPrediction.outcomes[0].total_vote_amount += delta1;
      this.mockPrediction.outcomes[0].vote_count += Math.floor(Math.random() * 6) + 1;

      this.mockPrediction.outcomes[1].total_vote_amount += delta2;
      this.mockPrediction.outcomes[1].vote_count += Math.floor(Math.random() * 5) + 1;

      // Recalculate multipliers
      const t1 = this.mockPrediction.outcomes[0].total_vote_amount;
      const t2 = this.mockPrediction.outcomes[1].total_vote_amount;
      const total = t1 + t2;
      this.mockPrediction.outcomes[0].return_rate = total / t1;
      this.mockPrediction.outcomes[1].return_rate = total / t2;

      renderPrediction(this.mockPrediction);
    },

    lock() {
      if (!this.mockPrediction) return;
      this.mockPrediction.state = 'LOCKED';
      renderPrediction(this.mockPrediction);
    },

    declareWinner(optionIndex) {
      if (!this.mockPrediction) return;
      this.mockPrediction.state = 'RESOLVED';
      this.mockPrediction.winning_outcome_id = this.mockPrediction.outcomes[optionIndex].id;
      renderPrediction(this.mockPrediction);
    },

    winAndAutoHide(optionIndex = 0, delayMs = 5000) {
      if (!this.mockPrediction) this.start();
      this.declareWinner(optionIndex);
      clearTimeout(STATE.autoHideTimer);
      STATE.autoHideTimer = setTimeout(() => {
        DOM.widget.classList.add('hidden-state');
      }, delayMs);
    },

    cancelAndAutoHide(delayMs = 5000) {
      if (!this.mockPrediction) this.start();
      this.mockPrediction.state = 'CANCELLED';
      this.mockPrediction.winning_outcome_id = null;
      renderPrediction(this.mockPrediction);
      if (CONFIG.autoHideInactive) {
        clearTimeout(STATE.autoHideTimer);
        STATE.autoHideTimer = setTimeout(() => {
          DOM.widget.classList.add('hidden-state');
        }, delayMs);
      }
    },

    simulateInactive() {
      STATE.isDemoActive = true;
      clearTimeout(STATE.pollTimer);
      clearTimeout(STATE.autoHideTimer);
      stopCountdown();
      this.mockPrediction = null;
      STATE.currentPrediction = null;
      renderPrediction(null);
    },

    reset() {
      STATE.isDemoActive = false;
      clearTimeout(STATE.autoHideTimer);
      connectToChannel(CONFIG.channel);
    }
  };

  // --------------------------------------------------------------------------
  // 11. CONTROLLER DOCK & UI INTERACTIONS
  // --------------------------------------------------------------------------
  function setupControllerUI() {
    // Clean mode hides UI for OBS
    if (CONFIG.cleanMode) {
      document.body.classList.add('clean-mode');
    }

    // Preview HUD Background Switcher
    const bgButtons = document.querySelectorAll('.btn-bg');
    bgButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const bg = btn.getAttribute('data-bg');
        document.body.setAttribute('data-bg', bg);
        bgButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Preview HUD Toggle Visibility
    const btnToggleVis = document.getElementById('btn-toggle-visibility');
    if (btnToggleVis) {
      btnToggleVis.addEventListener('click', () => {
        DOM.widget.classList.toggle('hidden-state');
      });
    }

    // Preview HUD Open Settings
    const btnOpenSettings = document.getElementById('btn-open-settings');
    if (btnOpenSettings) {
      btnOpenSettings.addEventListener('click', () => {
        DOM.dockPanel.classList.remove('collapsed');
      });
    }

    // Toggle Dock
    DOM.toggleDockBtn.addEventListener('click', () => {
      DOM.dockPanel.classList.toggle('collapsed');
    });

    DOM.closeDockBtn.addEventListener('click', () => {
      DOM.dockPanel.classList.add('collapsed');
    });

    // Connect button
    DOM.btnConnect.addEventListener('click', () => {
      const channel = DOM.channelInput.value;
      if (channel) connectToChannel(channel);
    });

    DOM.channelInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const channel = DOM.channelInput.value;
        if (channel) connectToChannel(channel);
      }
    });

    // Layout Selector Buttons
    const layoutButtons = document.querySelectorAll('.btn-layout-option');
    layoutButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const selected = btn.getAttribute('data-layout');
        if (selected) applyLayout(selected);
      });
    });

    // Auto-hide toggle
    DOM.autohideToggle.checked = CONFIG.autoHideInactive;
    DOM.autohideToggle.addEventListener('change', (e) => {
      CONFIG.autoHideInactive = e.target.checked;
      if (!CONFIG.autoHideInactive) {
        clearTimeout(STATE.autoHideTimer);
        DOM.widget.classList.remove('hidden-state');
        if (!STATE.currentPrediction && !STATE.isDemoActive) {
          renderPrediction(null);
        }
      } else {
        // If inactive or ancient resolved, hide it
        if (!STATE.currentPrediction) {
          DOM.widget.classList.add('hidden-state');
        } else if (STATE.currentPrediction.state === 'RESOLVED') {
          DOM.widget.classList.add('hidden-state');
        }
      }
      updateObsUrlPreview();
    });

    // Demo buttons
    DOM.btnDemoStart.addEventListener('click', () => DemoSimulator.start());
    DOM.btnDemoVotes.addEventListener('click', () => DemoSimulator.addVotes());
    DOM.btnDemoLock.addEventListener('click', () => DemoSimulator.lock());
    DOM.btnDemoWin1.addEventListener('click', () => DemoSimulator.declareWinner(0));
    DOM.btnDemoWin2.addEventListener('click', () => DemoSimulator.declareWinner(1));
    if (DOM.btnDemoWinAutohide) {
      DOM.btnDemoWinAutohide.addEventListener('click', () => DemoSimulator.winAndAutoHide(0, 5000));
    }
    if (DOM.btnDemoCancel) {
      DOM.btnDemoCancel.addEventListener('click', () => DemoSimulator.cancelAndAutoHide(5000));
    }
    if (DOM.btnDemoInactive) {
      DOM.btnDemoInactive.addEventListener('click', () => DemoSimulator.simulateInactive());
    }
    DOM.btnDemoReset.addEventListener('click', () => DemoSimulator.reset());

    // OBS URL copy
    DOM.btnCopyObsUrl.addEventListener('click', () => {
      const url = getObsCleanUrl();
      navigator.clipboard.writeText(url).then(() => {
        DOM.btnCopyObsUrl.textContent = '✓ ¡Copiado!';
        setTimeout(() => {
          DOM.btnCopyObsUrl.textContent = '📋 Copiar Link para OBS';
        }, 2000);
      });
    });

    updateObsUrlPreview();
  }

  function applyLayout(layoutName) {
    const validLayouts = ['compact', 'standard', 'horizontal', 'minimal'];
    if (!validLayouts.includes(layoutName)) layoutName = 'compact';

    CONFIG.layout = layoutName;
    try {
      localStorage.setItem('kick_overlay_layout', layoutName);
    } catch (e) {}

    // Update body classes
    document.body.classList.remove('layout-compact', 'layout-standard', 'layout-horizontal', 'layout-minimal');
    document.body.classList.add(`layout-${layoutName}`);

    // Update active button state
    const buttons = document.querySelectorAll('.btn-layout-option');
    buttons.forEach(btn => {
      if (btn.getAttribute('data-layout') === layoutName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    updateObsUrlPreview();
  }

  function getObsCleanUrl() {
    const loc = window.location;
    const base = `${loc.protocol}//${loc.host}${loc.pathname}`;
    const params = new URLSearchParams();
    params.set('channel', CONFIG.channel);
    params.set('clean', '1');
    if (CONFIG.layout && CONFIG.layout !== 'compact') params.set('layout', CONFIG.layout);
    if (CONFIG.autoHideInactive) params.set('autohide', '1');
    return `${base}?${params.toString()}`;
  }

  function updateObsUrlPreview() {
    DOM.obsUrlPreview.textContent = getObsCleanUrl();
    DOM.channelInput.value = CONFIG.channel;
  }

  // --------------------------------------------------------------------------
  // 12. INITIALIZATION
  // --------------------------------------------------------------------------
  function init() {
    setupControllerUI();
    applyLayout(CONFIG.layout);

    if (CONFIG.isDemo) {
      DemoSimulator.start();
    } else {
      connectToChannel(CONFIG.channel);
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
