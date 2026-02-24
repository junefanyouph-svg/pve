(function () {
  // ── Loading tracker ───────────────────────────────────────────────────────
  let _loadTotal = 0;
  let _loadDone  = 0;
  function _trackImg(img) {
    _loadTotal++;
    const finish = () => { _loadDone++; _updateLoadBar(); };
    if (img.complete) { finish(); }
    else { img.addEventListener('load', finish); img.addEventListener('error', finish); }
    return img;
  }
  function _updateLoadBar() {
    const pct = _loadTotal === 0 ? 100 : Math.round((_loadDone / _loadTotal) * 100);
    const bar = document.getElementById('loading-bar');
    const lbl = document.getElementById('loading-label');
    if (bar) bar.style.width = pct + '%';
    if (lbl) lbl.textContent = pct < 100 ? 'Loading assets... ' + pct + '%' : 'Ready!';
    if (pct >= 100 && _wordsReady) _onAllLoaded();
  }
  let _wordsReady = false;
  function _markWordsReady() {
    _wordsReady = true;
    _updateLoadBar();
  }
  function _onAllLoaded() {
    if (_onAllLoaded._fired) return;
    _onAllLoaded._fired = true;
    setTimeout(() => {
      const loading = document.getElementById('screen-loading');
      const landing = document.getElementById('screen-landing');
      // Fade out loading
      loading.style.transition = 'opacity 0.4s';
      loading.style.opacity = '0';
      setTimeout(() => {
        loading.style.display = 'none';
        loading.style.opacity = '';
        loading.style.transition = '';
        // Fade in landing
        landing.style.display = 'flex';
        landing.style.opacity = '0';
        landing.style.transition = 'opacity 0.4s';
        requestAnimationFrame(() => { landing.style.opacity = '1'; });
        setTimeout(() => { landing.style.transition = ''; }, 450);
      }, 400);
    }, 300);
  }

  // ── Word list ─────────────────────────────────────────────────────────────
  let VALID_WORDS = new Set();
  let wordsLoaded = false;

  (async () => {
    try {
      const res = await fetch(
        "https://cdn.jsdelivr.net/npm/an-array-of-english-words@2.0.0/index.json",
      );
      const arr = await res.json();
      VALID_WORDS = new Set(arr.filter((w) => w.length >= 3));
      wordsLoaded = true;
    } catch (e) {
      console.error("Failed to load word list:", e);
      wordsLoaded = true;
    }
    _markWordsReady();
  })();

  const LETTER_POOL =
    "AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ";
  const LETTER_SCORE = {
    A: 1,
    B: 3,
    C: 3,
    D: 2,
    E: 1,
    F: 4,
    G: 2,
    H: 4,
    I: 1,
    J: 8,
    K: 5,
    L: 1,
    M: 3,
    N: 1,
    O: 1,
    P: 3,
    Q: 10,
    R: 1,
    S: 1,
    T: 1,
    U: 1,
    V: 4,
    W: 4,
    X: 8,
    Y: 4,
    Z: 10,
  };

  function randomLetter() {
    return LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
  }
  function generateLetters() {
    const letters = [];
    let vowels = 0;
    while (letters.length < 6) {
      const l = randomLetter();
      const isVowel = "AEIOU".includes(l);
      if (isVowel && vowels >= 2 && letters.length < 4) continue;
      if (isVowel) vowels++;
      letters.push(l);
    }
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters;
  }

  function calcDamage(word) {
    let s = 0;
    for (const c of word.toUpperCase()) s += LETTER_SCORE[c] || 1;
    s += Math.max(0, word.length - 3) * 5;
    return Math.round(s * 0.5);
  }

  // ── Farm animals & enemies ────────────────────────────────────────────────
  // ============================================================
  // ASSET CONFIGURATION — replace src paths with your own files
  // ============================================================

  // ── Asset helper — always use makeImg() so GIFs animate on canvas ──
  // Regular new Image() / HTMLImageElement won't animate GIFs when drawn to canvas.
  // makeImg() creates a real <img> tag inside a hidden DOM container so the browser
  // keeps the GIF running; drawImage() then reads the current live frame each tick.
  function makeImg(src) {
    const el = new Image();
    el.src = src;
    _trackImg(el);
    return el;
  }
  function makeGif(src) {
    const el = document.createElement("img");
    el.src = src;
    el.style.display = "none";
    document.getElementById("gif-cache").appendChild(el);
    _trackImg(el);
    return el;
  }

  // ============================================================
  // ASSET CONFIGURATION
  // For GIFs  → use makeGif('path/to/file.gif')  ← renders as DOM overlay, fully animated
  // For PNGs  → use makeImg('path/to/file.png')  ← drawn directly to canvas
  // ============================================================
  const ASSETS = {
    // ── Player ──
    player:        makeImg("assets/player/player1_idle.gif"),
    playerWalk:    makeImg("assets/player/player1_walk.gif"),
    playerAttack:  makeImg("assets/player/player1_standingatk.gif"),
    playerRunAtk:  makeImg("assets/player/player1_runningatk.gif"),

    // ── Potion ──
    potion: makeImg("assets/potion.png"),

    // ── Projectile ──
    knife: makeGif("assets/player/boom1.gif"),
    boom: makeGif("assets/player/boom.gif"),

    // ── Enemies ──
    enemyBasic:       makeImg("./assets/enemy/enemy1_running.gif"),
    enemyBasicWalk:   makeImg("assets/enemy/enemy1/enemy1_running.gif"),
    enemyBasicIdle:   makeImg("assets/enemy/enemy1/enemy1_idle.gif"),
    enemyBasicAttack: makeImg("assets/enemy/enemy1/enemy1_attack.gif"),
    enemyFast:        makeImg("assets/enemy/enemy2/enemy2_running.gif"),
    enemyFastWalk:    makeImg("assets/enemy/enemy2/enemy2_running.gif"),
    enemyFastIdle:    makeImg("assets/enemy/enemy2/enemy2_idle.gif"),
    enemyFastAttack:  makeImg("assets/enemy/enemy2/enemy2_attack.gif"),
    enemyTank:        makeImg("assets/enemy/enemy3/enemy3_running.gif"),
    enemyTankWalk:    makeImg("assets/enemy/enemy3/enemy3_running.gif"),
    enemyTankIdle:    makeImg("assets/enemy/enemy3/enemy3_idle.gif"),
    enemyTankAttack:  makeImg("assets/enemy/enemy3/enemy3_attack.gif"),

    // ── Background — seasonal, loops every 4 stages ──
    bgWinter: makeImg("assets/bg/winter_cmp.png"),
    bgAutumn: makeImg("assets/bg/autumn_cmp.png"),
    bgSpring: makeImg("assets/bg/spring_cmp.png"),
    bgSummer: makeImg("assets/bg/summer_cmp.png"),
  };
  // ============================================================
  // END ASSET CONFIGURATION
  // ============================================================

  // Fallback emoji used when an ASSETS image is null
  const PLAYER_EMOJI = "🐄";
  const KNIFE_EMOJI = "🔪";
  const ENEMY_EMOJIS = { basic: "🐺", fast: "🦊", tank: "🐗" };
  const FLOWER_EMOJIS = ["🌸", "🌼", "🌻", "🌺"];

  // ── Canvas ────────────────────────────────────────────────────────────────
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return; // screen not visible yet
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = rect.width;
    H = rect.height;
  }
  // Do NOT call resizeCanvas() here — canvas is inside display:none screen
  window.addEventListener("resize", resizeCanvas);

  // ── UI refs ───────────────────────────────────────────────────────────────
  const nextStageBtn = document.getElementById("next-stage-btn");
  const stageIntroEl = document.getElementById("stage-intro");
  const elStage = document.getElementById("ui-stage");
  const stageFlash = document.getElementById("stage-flash");
  const killProgBar = document.getElementById("kill-progress-bar");
  const elScore = document.getElementById("ui-score");
  const elHealth = document.getElementById("ui-health");
  const elKills = document.getElementById("ui-kills");
  const overlay = document.getElementById("overlay");
  // stage-flash ref set above
  // lettersWrap removed — using letter-canvas instead
  const wordText = document.getElementById("word-text");
  const wordDisplay = document.getElementById("word-display");
  const dmgPreview = document.getElementById("dmg-preview");
  const submitBtn = { disabled: false }; // removed — auto-submit on drag release
  const feedbackEl = document.getElementById("feedback");
  const comboBar = document.getElementById("combo-bar");
  const comboCount = document.getElementById("combo-count");

  // ── Keyboard ──────────────────────────────────────────────────────────────
  const keys = {};
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });

  // ── Joystick ──────────────────────────────────────────────────────────────
  let jDx = 0,
    jDy = 0,
    jActive = false,
    jTouchId = null,
    jOriginX = 0,
    jOriginY = 0;
  const JR = 48;
  const gameWrap = document.getElementById("game-wrap");
  let letterCanvasTouchId = null; // track letter canvas touch so joystick ignores it

  gameWrap.addEventListener(
    "touchstart",
    (e) => {
      if (e.target.tagName === "BUTTON") return;
      e.preventDefault();
      if (jActive) return;
      const t = e.changedTouches[0];
      jTouchId = t.identifier;
      jOriginX = t.clientX;
      jOriginY = t.clientY;
      jActive = true;
    },
    { passive: false },
  );
  window.addEventListener(
    "touchmove",
    (e) => {
      if (!jActive) return;
      for (const t of e.changedTouches) {
        if (t.identifier !== jTouchId) continue;
        if (t.identifier === letterCanvasTouchId) continue; // letter touch — ignore
        e.preventDefault();
        const dx = t.clientX - jOriginX,
          dy = t.clientY - jOriginY;
        const d = Math.hypot(dx, dy),
          cl = Math.min(d, JR),
          a = Math.atan2(dy, dx);
        jDx = Math.cos(a) * (cl / JR);
        jDy = Math.sin(a) * (cl / JR);
      }
    },
    { passive: false },
  );
  function endJ(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === letterCanvasTouchId) continue; // letter touch — ignore
      if (t.identifier === jTouchId) {
        jActive = false;
        jTouchId = null;
        jDx = 0;
        jDy = 0;
      }
    }
  }
  window.addEventListener("touchend", endJ);
  window.addEventListener("touchcancel", endJ);

  // ── Game State ────────────────────────────────────────────────────────────
  let player, enemies, bullets, particles, potions;
  let score, kills, health, shootTimer, spawnTimer;
  let world = 1,
    stage = 1; // current world & stage (e.g. 1-1)
  const STAGES_PER_WORLD = 3;
  // Kills needed doubles every stage: 6 → 12 → 24 → 48 …
  function killsNeeded() {
    const totalStage = (world - 1) * STAGES_PER_WORLD + (stage - 1);
    return Math.round(6 * Math.pow(2, totalStage));
  }
  let stageKills = 0; // kills in current stage
  let stageEnemiesSpawned = 0; // total spawned this stage (capped at killsNeeded)
  let stageClearPending = false;
  let stageBtnVisible = false; // true only when the next-stage button is actually showing
  let playerRunningOut = false; // true while player auto-runs off screen after stage clear
  let playerRunningIn = false;  // true while player runs onto screen before battle starts
  let stageToken = 0; // incremented each stage — stale callbacks check this and bail
  let isSubmitting = false; // prevent double-submit on fast drag release
  let running = false,
    raf = null,
    lastTs = 0,
    paused = false;
  let bgOffset = 0;
  let _spriteIdCounter = 0;

  // ── Word State ────────────────────────────────────────────────────────────
  let currentLetters = [],
    selectedIndices = [],
    feedbackTimer = null;

  // ── Combo State ──
  let combo = 0; // current consecutive valid words
  const COMBO_MAX = 10; // bar fills at this count

  function getDiff() {
    const w = world;
    const s = stage;
    // Max enemies scales by 1.3^(world-1) per world
    const worldMult = Math.pow(1.3, w - 1);

    if (w === 1) {
      return {
        playerSpeed:  135,
        shootInterval: Math.max(0.25, 0.65 - s * 0.1),
        spawnInterval: Math.max(0.7, 1.5 - s * 0.25),
        maxEnemies:   Math.round((2 + s * 2) * worldMult),
        enemySpeed:   24 + s * 6,
        enemyHp:      1 + s,
      };
    }
    const wOffset = w - 2;
    return {
      playerSpeed:  135,
      shootInterval: Math.max(0.2, 0.45 - wOffset * 0.02),
      spawnInterval: Math.max(0.6, 1.2 - wOffset * 0.05),
      maxEnemies:   Math.round((4 + wOffset) * worldMult),
      enemySpeed:   30 + wOffset * 4,
      enemyHp:      2 + wOffset,
    };
  }

  function initGame() {
    if (W === 0) resizeCanvas(); // fallback in case not yet sized
    player = { x: -60, y: H * 0.6, r: 14, angle: 0 };
    playerRunningIn = true;
    isStartBattleMode = false;
    document.getElementById("word-panel").style.opacity = "0.4";
    document.getElementById("word-panel").style.pointerEvents = "none";
    enemies = [];
    bullets = [];
    particles = [];
    potions = [];
    booms.forEach(b => b.el.remove());
    booms = [];
    score = 0;
    kills = 0;
    health = 100;
    world = 1;
    stage = 1;
    stageKills = 0;
    stageEnemiesSpawned = 0;
    stageClearPending = false;
    stageBtnVisible = false;
    playerRunningOut = false;
    stageToken++;
    nextStageBtn.style.display = "none";
    stageIntroEl.style.display = "none";
    shootTimer = 0;
    spawnTimer = 0;
    bgOffset = 0;
    combo = 0;
    refreshCooldown = 0;
    updateRefreshBtn();
    updateHUD();
    updateComboUI();
    showStageFlash("⚔️ Stage " + world + "-" + stage + " — Begin!");
    generateNewLetters();
  }

  function updateStageIndicator() {
    for (let i = 1; i <= STAGES_PER_WORLD; i++) {
      const dot = document.getElementById("sdot-" + i);
      if (!dot) continue;
      dot.className = "stage-dot" + (i < stage ? " done" : i === stage ? " active" : "");
    }
  }

  function updateHUD() {
    document.getElementById("ui-stage").textContent = world + "-" + stage;
    if (killProgBar)
      killProgBar.style.width =
        Math.min(100, (stageKills / killsNeeded()) * 100) + "%";
    elScore.textContent = score;
    elHealth.textContent = Math.max(0, Math.round(health));
    elKills.textContent = kills;
    updateStageIndicator();
  }

  // ── Letter connect canvas ─────────────────────────────────────────────────
  const letterCanvas = document.getElementById("letter-canvas");
  const lctx = letterCanvas.getContext("2d");
  let letterPositions = []; // {x, y} center of each letter circle
  let dragPos = null;
  let isDragging = false;
  let letterCanvasSize = 0; // cached — avoid getBoundingClientRect during game tick
  const LETTER_R = 28;
  const OUTER_R_RATIO = 0.38;

  function resizeLetterCanvas() {
    const wrap = document.getElementById("letter-connect-wrap");
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(rect.width, rect.height);
    letterCanvasSize = size;
    letterCanvas.width = size * dpr;
    letterCanvas.height = size * dpr;
    letterCanvas.style.width = size + "px";
    letterCanvas.style.height = size + "px";
    lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    computeLetterPositions(size);
    renderTiles();
  }

  // ── Word UI ───────────────────────────────────────────────────────────────
  function generateNewLetters() {
    currentLetters = generateLetters().map((c) => ({ char: c, used: false }));
    selectedIndices = [];
    isDragging = false;
    dragPos = null;
    isSubmitting = false;
    // Use cached size — no DOM read during game tick
    if (letterCanvasSize > 0) {
      computeLetterPositions(letterCanvasSize);
    }
    renderTiles();
    updateWordDisplay();
  }

  function computeLetterPositions(size) {
    const cx = size / 2, cy = size / 2;
    const r = size * OUTER_R_RATIO; // letters sit ON the outer circle edge
    const count = currentLetters.length;
    letterPositions = currentLetters.map((_, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
    });
  }

  function renderTiles() {
    const size = letterCanvas.width / (window.devicePixelRatio || 1);
    lctx.clearRect(0, 0, size, size);

    // Draw fixed outer circle
    const cx = size / 2, cy = size / 2;
    const bgR = size * OUTER_R_RATIO;
    lctx.beginPath();
    lctx.arc(cx, cy, bgR, 0, Math.PI * 2);
    lctx.fillStyle = "rgba(0,0,0,0.18)";
    lctx.fill();
    lctx.strokeStyle = "rgba(255,255,255,0.12)";
    lctx.lineWidth = 2.5;
    lctx.stroke();

    // Draw connector lines between selected letters
    if (selectedIndices.length > 1) {
      lctx.beginPath();
      lctx.strokeStyle = "#e8a020";
      lctx.lineWidth = 4;
      lctx.lineCap = "round";
      lctx.lineJoin = "round";
      const p0 = letterPositions[selectedIndices[0]];
      lctx.moveTo(p0.x, p0.y);
      for (let k = 1; k < selectedIndices.length; k++) {
        const p = letterPositions[selectedIndices[k]];
        lctx.lineTo(p.x, p.y);
      }
      lctx.stroke();
    }

    // Draw drag line from last selected to finger
    if (selectedIndices.length > 0 && dragPos) {
      const last = letterPositions[selectedIndices[selectedIndices.length - 1]];
      lctx.beginPath();
      lctx.setLineDash([6, 5]);
      lctx.strokeStyle = "rgba(255,220,60,0.7)";
      lctx.lineWidth = 3;
      lctx.moveTo(last.x, last.y);
      lctx.lineTo(dragPos.x, dragPos.y);
      lctx.stroke();
      lctx.setLineDash([]);
    }

    // Draw each letter circle
    currentLetters.forEach((lt, i) => {
      const { x, y } = letterPositions[i];
      const isSelected = selectedIndices.includes(i);
      const isUsed = lt.used;
      const selOrder = selectedIndices.indexOf(i);

      // Circle shadow
      lctx.beginPath();
      lctx.arc(x, y + 3, LETTER_R, 0, Math.PI * 2);
      lctx.fillStyle = "rgba(0,0,0,0.25)";
      lctx.fill();

      // Circle fill
      lctx.beginPath();
      lctx.arc(x, y, LETTER_R, 0, Math.PI * 2);
      if (isUsed) {
        lctx.fillStyle = "rgba(200,200,200,0.25)";
      } else if (isSelected) {
        lctx.fillStyle = "#e8a020";
      } else {
        lctx.fillStyle = "#fdf6e3";
      }
      lctx.fill();

      // Circle border
      lctx.beginPath();
      lctx.arc(x, y, LETTER_R, 0, Math.PI * 2);
      lctx.strokeStyle = isSelected ? "#6b3a2a" : "#8b5e3c";
      lctx.lineWidth = isSelected ? 3 : 2.5;
      lctx.stroke();

      // Glow for selected
      if (isSelected) {
        lctx.beginPath();
        lctx.arc(x, y, LETTER_R + 4, 0, Math.PI * 2);
        lctx.strokeStyle = "rgba(232,160,32,0.5)";
        lctx.lineWidth = 3;
        lctx.stroke();
      }

      // Letter
      lctx.font = "bold 22px 'Fredoka One', cursive";
      lctx.textAlign = "center";
      lctx.textBaseline = "middle";
      lctx.fillStyle = isUsed ? "rgba(100,80,60,0.3)" : isSelected ? "#3a1a00" : "#6b3a2a";
      lctx.fillText(lt.char, x, y);

      // Score subscript
      lctx.font = "10px 'Patrick Hand', cursive";
      lctx.fillStyle = isSelected ? "#6b3a2a" : "#b08050";
      lctx.fillText(LETTER_SCORE[lt.char] || 1, x + LETTER_R * 0.55, y + LETTER_R * 0.55);

      // Order badge if selected
      if (isSelected && selOrder >= 0) {
        lctx.beginPath();
        lctx.arc(x - LETTER_R * 0.6, y - LETTER_R * 0.6, 9, 0, Math.PI * 2);
        lctx.fillStyle = "#4a7c3f";
        lctx.fill();
        lctx.font = "bold 10px 'Fredoka One', cursive";
        lctx.fillStyle = "#fff";
        lctx.textAlign = "center";
        lctx.textBaseline = "middle";
        lctx.fillText(selOrder + 1, x - LETTER_R * 0.6, y - LETTER_R * 0.6);
      }
    });
  }

  function letterIndexAt(clientX, clientY) {
    const rect = letterCanvas.getBoundingClientRect();
    const scaleX = letterCanvas.width / (window.devicePixelRatio || 1) / rect.width;
    const scaleY = letterCanvas.height / (window.devicePixelRatio || 1) / rect.height;
    const lx = (clientX - rect.left) * scaleX;
    const ly = (clientY - rect.top) * scaleY;
    for (let i = 0; i < letterPositions.length; i++) {
      const { x, y } = letterPositions[i];
      if (Math.hypot(lx - x, ly - y) <= LETTER_R + 6) return i;
    }
    return -1;
  }

  function clientToCanvas(clientX, clientY) {
    const rect = letterCanvas.getBoundingClientRect();
    const scaleX = letterCanvas.width / (window.devicePixelRatio || 1) / rect.width;
    const scaleY = letterCanvas.height / (window.devicePixelRatio || 1) / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  function onTile(i) {
    if (stageClearPending || playerRunningOut) return;
    if (i < 0 || currentLetters[i].used) return;
    const idx = selectedIndices.indexOf(i);
    if (idx !== -1) {
      selectedIndices = selectedIndices.slice(0, idx);
    } else {
      selectedIndices.push(i);
    }
    renderTiles();
    updateWordDisplay();
  }

  letterCanvas.addEventListener("mousedown", (e) => {
    if (stageClearPending || playerRunningOut) return;
    const i = letterIndexAt(e.clientX, e.clientY);
    if (i < 0) return;
    isDragging = true;
    selectedIndices = [];
    selectedIndices.push(i);
    renderTiles();
    updateWordDisplay();
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    dragPos = clientToCanvas(e.clientX, e.clientY);
    const i = letterIndexAt(e.clientX, e.clientY);
    if (i >= 0) {
      const idx = selectedIndices.indexOf(i);
      if (idx !== -1 && idx < selectedIndices.length - 1) {
        // Drag back to a previous letter — trim to that point
        selectedIndices = selectedIndices.slice(0, idx + 1);
        updateWordDisplay();
      } else if (idx === -1 && !currentLetters[i].used) {
        selectedIndices.push(i);
        updateWordDisplay();
      }
    }
    renderTiles();
  });

  function releaseAndSubmit() {
    if (!isDragging) return;
    isDragging = false;
    dragPos = null;
    if (selectedIndices.length >= 3 && !stageClearPending && !playerRunningOut) {
      submitWord();
    } else {
      selectedIndices = [];
      renderTiles();
      updateWordDisplay();
    }
  }

  window.addEventListener("mouseup", releaseAndSubmit);

  letterCanvas.addEventListener("touchstart", (e) => {
    if (stageClearPending || playerRunningOut) return;
    e.preventDefault();
    e.stopPropagation(); // prevent joystick from seeing this touch
    const t = e.changedTouches[0];
    letterCanvasTouchId = t.identifier;
    const i = letterIndexAt(t.clientX, t.clientY);
    if (i < 0) return;
    isDragging = true;
    selectedIndices = [];
    selectedIndices.push(i);
    renderTiles();
    updateWordDisplay();
  }, { passive: false });

  letterCanvas.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    const t = e.changedTouches[0];
    dragPos = clientToCanvas(t.clientX, t.clientY);
    const i = letterIndexAt(t.clientX, t.clientY);
    if (i >= 0) {
      const idx = selectedIndices.indexOf(i);
      if (idx !== -1 && idx < selectedIndices.length - 1) {
        selectedIndices = selectedIndices.slice(0, idx + 1);
        updateWordDisplay();
      } else if (idx === -1 && !currentLetters[i].used) {
        selectedIndices.push(i);
        updateWordDisplay();
      }
    }
    renderTiles();
  }, { passive: false });

  letterCanvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    e.stopPropagation();
    letterCanvasTouchId = null;
    releaseAndSubmit();
  }, { passive: false });

  letterCanvas.addEventListener("touchcancel", (e) => {
    e.stopPropagation();
    letterCanvasTouchId = null;
    isDragging = false;
    dragPos = null;
    selectedIndices = [];
    renderTiles();
    updateWordDisplay();
  }, { passive: false });

  window.addEventListener("resize", resizeLetterCanvas);
  // Initial size after layout settles
  setTimeout(resizeLetterCanvas, 50);

  function updateWordDisplay() {
    const word = selectedIndices.map((i) => currentLetters[i].char).join("");
    wordText.textContent = word;
    wordDisplay.className = "";
    if (word.length >= 3) {
      dmgPreview.textContent = "+" + calcDamage(word) + " 💥";
    } else {
      dmgPreview.textContent = "";
    }
  }

  function showFeedback(msg, type) {
    feedbackEl.textContent = msg;
    feedbackEl.className = type;
    if (feedbackTimer) clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      feedbackEl.textContent = "";
      feedbackEl.className = "";
    }, 2200);
  }

  function updateComboUI() {
    const comboLevel = Math.floor(combo / 3);
    const wordsIntoGroup = combo % 3; // 0, 1, or 2 words into current group
    const pct = (wordsIntoGroup / 3) * 100;
    comboBar.style.width = pct + "%";
    comboBar.className = comboLevel >= 3 ? "hot" : "";
    comboCount.textContent = combo > 0 ? "×" + (1 + comboLevel * 0.2).toFixed(1) : "×1.0";
    comboCount.className = "";
    void comboCount.offsetWidth;
    comboCount.className = comboLevel > 0 ? "popping" : "";
  }

  function breakCombo(reason) {
    if (combo === 0) return;
    combo = 0;
    updateComboUI();
    showFeedback("💔 Combo broken! " + reason, "miss");
  }

  function submitWord() {
    if (stageClearPending || playerRunningOut) return;
    if (isSubmitting) return; // block re-entry during cooldown
    const word = selectedIndices
      .map((i) => currentLetters[i].char)
      .join("")
      .toLowerCase();
    if (word.length < 3) return;
    if (!wordsLoaded) {
      showFeedback("⏳ Loading dictionary...", "miss");
      return;
    }
    isSubmitting = true; // lock until generateNewLetters resets it

    if (VALID_WORDS.has(word)) {
      const dmg = calcDamage(word);
      wordDisplay.classList.add("valid");

      combo++;
      const comboLevel = Math.floor(combo / 3); // level up every 3 words
      const comboMult = 1 + comboLevel * 0.2;   // +20% per combo level
      updateComboUI();
      const multStr = comboLevel > 0 ? " (×" + comboMult.toFixed(1) + ")" : "";

      // Fire a word-powered projectile at every enemy on screen
      if (enemies.length > 0) {
        const shotToken = stageToken;
        enemies.forEach((e, idx) => {
          const a = Math.atan2(e.y - player.y, e.x - player.x);
          const delay = idx * 60;
          const wordDmg = Math.round(dmg * comboMult);
          setTimeout(() => {
            if (!running || stageToken !== shotToken) return; // stale — bail
            if (!player) return;
            player.attacking = true;
            setTimeout(() => {
              if (stageToken !== shotToken) return;
              if (player) player.attacking = false;
            }, 300);
            bullets.push({
              x: player.x,
              y: player.y,
              vx: Math.cos(a) * 520,
              vy: Math.sin(a) * 520,
              angle: a,
              r: 12,
              life: 2.0,
              wordDmg,
              targetId: e.id,
              isWordShot: true,
            });
          }, delay);
        });
        showFeedback(
          "⚡ " + word.toUpperCase() + "! +" + Math.round(dmg * comboMult) + "💥" + multStr,
          "hit",
        );
      } else {
        // No enemies on screen — just score the word directly
        const totalDmg = Math.round(dmg * comboMult);
        score += totalDmg;
        updateHUD();
        spawnDmgPop(player.x + 24, player.y - 24, "+" + totalDmg + "💥" + (combo > 1 ? " 🔥×" + combo : ""));
        showFeedback("⚡ " + word.toUpperCase() + "! +" + totalDmg + multStr, "hit");
      }

      const genToken = stageToken;
      setTimeout(() => {
        if (stageToken !== genToken) return; // stage changed — don't regenerate
        generateNewLetters();
      }, 380);
    } else {
      wordDisplay.classList.add("invalid");
      breakCombo("invalid word");
      isSubmitting = false;
      // Shake the letter canvas to signal wrong word
      letterCanvas.classList.add("shake");
      setTimeout(() => letterCanvas.classList.remove("shake"), 400);
      selectedIndices = [];
      const token = stageToken;
      setTimeout(() => {
        if (stageToken !== token) return;
        renderTiles();
        updateWordDisplay();
      }, 300);
    }
  }

  function spawnDmgPop(x, y, text) {
    const pop = document.createElement("div");
    pop.className = "dmg-pop";
    pop.textContent = text;
    const wr = gameWrap.getBoundingClientRect();
    const ar = document.getElementById("app").getBoundingClientRect();
    pop.style.left = x + wr.left - ar.left - 16 + "px";
    pop.style.top = y + wr.top - ar.top - 10 + "px";
    document.getElementById("app").appendChild(pop);
    setTimeout(() => pop.remove(), 1000);
  }

  const shuffleBtn = document.getElementById("shuffle-btn");
  shuffleBtn.addEventListener("click", () => {
    if (stageClearPending || playerRunningOut) return;
    for (let i = currentLetters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [currentLetters[i], currentLetters[j]] = [currentLetters[j], currentLetters[i]];
    }
    selectedIndices = [];
    if (letterCanvasSize > 0) computeLetterPositions(letterCanvasSize);
    renderTiles();
    updateWordDisplay();
  });

  let refreshCooldown = 0; // seconds remaining on cooldown
  const REFRESH_CD = 10;

  function updateRefreshBtn() {
    const btn = document.getElementById("refresh-btn");
    if (refreshCooldown > 0) {
      btn.textContent = "🔄 " + Math.ceil(refreshCooldown) + "s";
      btn.disabled = true;
      btn.style.opacity = "0.5";
    } else {
      btn.textContent = "🔄 Refresh";
      btn.disabled = false;
      btn.style.opacity = "";
    }
  }

  document.getElementById("refresh-btn").addEventListener("click", () => {
    if (stageClearPending || playerRunningOut || refreshCooldown > 0) return;
    generateNewLetters();
    refreshCooldown = REFRESH_CD;
    updateRefreshBtn();
  });

  // ── Enemy helpers ─────────────────────────────────────────────────────────
  const ETYPES = {
    basic: {
      r: 16,
      spriteR: 25,
      asset: "enemyBasic",
      walkAsset: "enemyBasicWalk",
      idleAsset: "enemyBasicIdle",
      attackAsset: "enemyBasicAttack",
      emoji: "🐺",
      speedMult: 1.0,
      hpBonus: 0,
      points: 10,
      attackDmg: 10,
      attackCooldown: 1.2,
    },
    fast: {
      r: 12,
      spriteR: 18,
      asset: "enemyFast",
      walkAsset: "enemyFastWalk",
      idleAsset: "enemyFastIdle",
      attackAsset: "enemyFastAttack",
      emoji: "🦊",
      speedMult: 1.9,
      hpBonus: 0,
      points: 15,
      attackDmg: 8,
      attackCooldown: 0.8,
    },
    tank: {
      r: 22,
      spriteR: 30,
      asset: "enemyTank",
      walkAsset: "enemyTankWalk",
      idleAsset: "enemyTankIdle",
      attackAsset: "enemyTankAttack",
      emoji: "🐗",
      speedMult: 0.55,
      hpBonus: 3,
      points: 30,
      attackDmg: 18,
      attackCooldown: 2.0,
    },
  };

  function spawnEnemy(diff) {
    // Spawn from right edge only
    const x = W + 30;
    // Spawn only within the ground area (groundY=25% to bottom)
    const groundYSpawn = H * 0.25;
    const y = groundYSpawn + Math.random() * (H - groundYSpawn);
    let type = "basic";
    if (world >= 3 && Math.random() < 0.25) type = "fast";
    else if (world >= 2 && Math.random() < 0.2) type = "tank";
    const t = ETYPES[type];
    const hp = diff.enemyHp + t.hpBonus;
    enemies.push({
      x,
      y,
      r: t.r,
      spriteR: t.spriteR,
      asset: t.asset,
      walkAsset: t.walkAsset,
      idleAsset: t.idleAsset,
      attackAsset: t.attackAsset,
      emoji: t.emoji,
      hp,
      maxHp: hp,
      speed: diff.enemySpeed * t.speedMult,
      type,
      points: t.points,
      attackDmg: t.attackDmg,
      attackCooldown: t.attackCooldown,
      attackTimer: 0,
      state: "walk",   // walk | idle | attack
      attackAnimTimer: 0,
      hitFlash: 0,
      moving: true,
      id: ++_spriteIdCounter,
    });
  }

  function nearestEnemy() {
    let best = null,
      bestD = Infinity;
    for (const e of enemies) {
      if (!e || e.x === undefined) continue;
      const d = Math.hypot(e.x - player.x, e.y - player.y);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2,
        s = 35 + Math.random() * 80;
      particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        r: 3 + Math.random() * 3,
        color,
        life: 1,
      });
    }
  }

  let booms = [];
  let _boomIdCounter = 0;

  function spawnBoom(x, y) {
    const el = document.createElement("img");
    el.src = "assets/player/boom.gif";
    el.style.cssText = "position:absolute;pointer-events:none;transform:translate(-50%,-50%);width:64px;height:64px;";
    el.style.left = ((x / W) * 100).toFixed(2) + "%";
    el.style.top  = ((y / H) * 100).toFixed(2) + "%";
    document.getElementById("sprite-layer").appendChild(el);
    booms.push({ el, life: 0.6 });
  }

  function showStageFlash(text) {
    stageFlash.textContent = text;
    stageFlash.style.opacity = "1";
    setTimeout(() => {
      stageFlash.style.opacity = "0";
    }, 2000);
  }

  // ── Stage progression ────────────────────────────────────────────────────
  function checkStageClear() {
    // Don't trigger until the full enemy pool has been spawned AND killed
    if (stageClearPending) return;
    if (stageEnemiesSpawned < killsNeeded()) return;
    if (stageKills < killsNeeded()) return;
    stageClearPending = true;
    stageToken++; // invalidate all pending setTimeout callbacks from this stage
    enemies = [];
    bullets = []; // clear field — also kills any in-flight word-shots
    potions = [];
    booms.forEach(b => b.el.remove());
    booms = [];

    // Clear selection and gray out the word panel immediately
    selectedIndices = [];
    isDragging = false;
    dragPos = null;
    renderTiles();
    updateWordDisplay();
    document.getElementById("word-panel").style.opacity = "0.4";
    document.getElementById("word-panel").style.pointerEvents = "none";

    // Let player move freely for 1 second, then show the button
    const token = stageToken;
    setTimeout(() => {
      if (stageToken !== token) return;
      // Idle the player and flush inputs before showing button
      player.moving = false;
      player.attacking = false;
      jDx = 0; jDy = 0; jActive = false; jTouchId = null;
      Object.keys(keys).forEach(k => keys[k] = false);
      nextStageBtn.style.display = "block";
      stageBtnVisible = true;
    }, 1000);
  }

  let isStartBattleMode = false; // true when next-stage btn is acting as start-battle

  function onNextStageBtnClick() {
    nextStageBtn.style.display = "none";
    stageBtnVisible = false;
    if (isStartBattleMode) {
      isStartBattleMode = false;
      advanceStage();
    } else {
      playerRunningOut = true;
      player.moving = true;
    }
  }

  function showStageIntro() {
    playerRunningOut = false;
    jDx = 0; jDy = 0; jActive = false; jTouchId = null;
    Object.keys(keys).forEach(k => keys[k] = false);

    // Advance world/stage counters
    if (stage >= STAGES_PER_WORLD) {
      world++;
      stage = 1;
    } else {
      stage++;
    }

    // Hide any leftover overlays
    stageIntroEl.style.display = "none";

    // Place player off-screen left and run them in
    player.x = -player.r * 2;
    player.y = H * 0.6;
    player.moving = true;
    player.attacking = false;
    playerRunningIn = true;
  }

  function advanceStage() {
    nextStageBtn.style.display = "none";
    nextStageBtn.textContent = "➡️ Next Stage"; // reset label
    stageClearPending = false;
    stageBtnVisible = false;
    playerRunningIn = false; // player is already in position
    isStartBattleMode = false;
    stageKills = 0;
    stageEnemiesSpawned = 0;
    stageToken++;

    // Player stays at their current position (already ran in)
    player.moving = false;
    player.attacking = false;
    jDx = 0; jDy = 0; jActive = false; jTouchId = null;
    Object.keys(keys).forEach(k => keys[k] = false);

    enemies = [];
    bullets = [];
    potions = [];
    booms.forEach(b => b.el.remove());
    booms = [];
    isDragging = false;
    dragPos = null;
    selectedIndices = [];
    document.getElementById("word-panel").style.opacity = "";
    document.getElementById("word-panel").style.pointerEvents = "";
    isSubmitting = false;

    updateHUD();
    updateComboUI();
    showStageFlash("⚔️ Stage " + world + "-" + stage);
    generateNewLetters();
  }

  // ── Update ────────────────────────────────────────────────────────────────
  function update(dt) {
    if (!player) return; // safety — player not initialized yet
    const diff = getDiff();

    // Tick refresh cooldown
    if (refreshCooldown > 0) {
      refreshCooldown = Math.max(0, refreshCooldown - dt);
      updateRefreshBtn();
    }

    // Player run-off animation after stage clear button clicked
    if (playerRunningOut) {
      // Force flush inputs so nothing interferes
      jDx = 0; jDy = 0;
      player.moving = true;
      player.attacking = false;
      player.x += 260 * dt; // run rightward
      if (player.x > W + player.r * 2) {
        showStageIntro(); // player exited screen — show intro
      }
      return; // skip all other update logic during run-off
    }

    // Player run-in animation before battle starts
    if (playerRunningIn) {
      player.moving = true;
      player.attacking = false;
      player.x += 220 * dt; // run rightward onto screen
      // Once player reaches ~25% of screen, stop and show start button
      if (player.x >= W * 0.25) {
        player.x = W * 0.25;
        player.moving = false;
        playerRunningIn = false;
        isStartBattleMode = true;
        nextStageBtn.textContent = "⚔️ Start Battle!";
        nextStageBtn.style.display = "block";
        stageBtnVisible = true;
      }
      return;
    }

    if ((stageClearPending && stageBtnVisible) || isStartBattleMode) return; // paused — waiting for button click

    // Player movement — left half
    let mx = jDx,
      my = jDy;
    if (keys["a"] || keys["A"] || keys["ArrowLeft"]) mx -= 1;
    if (keys["d"] || keys["D"] || keys["ArrowRight"]) mx += 1;
    if (keys["w"] || keys["W"] || keys["ArrowUp"]) my -= 1;
    if (keys["s"] || keys["S"] || keys["ArrowDown"]) my += 1;
    const ml = Math.hypot(mx, my) || 1;
    player.moving = mx !== 0 || my !== 0; // track for walk animation
    if (mx || my) {
      mx /= ml;
      my /= ml;
    }
    player.x = Math.max(player.r, Math.min(W - player.r, player.x + mx * diff.playerSpeed * dt));
    player.y = Math.max(H * 0.2 + player.r, Math.min(H - player.r, player.y + my * diff.playerSpeed * dt));

    // Auto-shoot and spawn only when stage is active
    if (!stageClearPending && !playerRunningIn) {
      // Auto-shoot knife toward nearest enemy
      const ATTACK_RANGE = W * 0.8;
      const target = nearestEnemy();
      const targetInRange =
        target &&
        Math.hypot(target.x - player.x, target.y - player.y) <= ATTACK_RANGE;
      player.attacking = !!targetInRange;
      shootTimer -= dt;
      if (shootTimer <= 0) {
        if (targetInRange) {
          const a = Math.atan2(target.y - player.y, target.x - player.x);
          player.angle = a;
          bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(a) * 420,
            vy: Math.sin(a) * 420,
            angle: a,
            spin: 0,
            r: 10,
            life: 1.4,
          });
        }
        shootTimer = diff.shootInterval;
      }

      // Spawn — only up to the fixed pool for this stage
      spawnTimer -= dt;
      const remaining = killsNeeded() - stageKills;
      const canSpawn = stageEnemiesSpawned < killsNeeded() && enemies.length < remaining;
      if (spawnTimer <= 0 && canSpawn && enemies.length < diff.maxEnemies) {
        spawnEnemy(diff);
        stageEnemiesSpawned++;
        spawnTimer = diff.spawnInterval;
      }
    }

    // Bullets (knives)
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      if (!b || b.x === undefined) { bullets.splice(i, 1); continue; }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.spin !== undefined) b.spin += dt * 12; // ~2 full rotations per second
      if (b.life <= 0 || b.x > W + 20 || b.y < -20 || b.y > H + 20) {
        bullets.splice(i, 1);
        continue;
      }
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (!e || e.x === undefined) continue;
        // Word-shots home toward their target enemy; regular shots hit any enemy
        if (b.isWordShot && b.targetId !== e.id) continue;
        if (Math.hypot(b.x - e.x, b.y - e.y) < b.r + e.r) {
          const dmgAmt = b.isWordShot ? b.wordDmg : 1;
          e.hp -= dmgAmt;
          e.hitFlash = 0.25;
          spawnBoom(b.x, b.y);
          bullets.splice(i, 1);
          if (b.isWordShot) {
            spawnDmgPop(e.x, e.y - e.r, "+" + dmgAmt + "💥");
          }
          if (e.hp <= 0) {
            burst(e.x, e.y, "#ff9900", 14);
            _removeGifEl("enemy-" + e.id);
            const pts = (e.points || 10) * world;
            // 30% chance to drop a potion
            if (Math.random() < 0.05) {
              potions.push({ x: e.x, y: e.y, r: 10, life: 12 }); // despawn after 12s
            }
            enemies.splice(j, 1);
            score += pts;
            stageKills = Math.min(stageKills + 1, killsNeeded());
            kills++;
            updateHUD();
            checkStageClear();
            if (b.isWordShot) {
              showFeedback("🎉 Enemy down! +" + pts + " pts", "hit");
            }
          }
          break;
        }
      }
    }

    // Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (!e || e.x === undefined) continue;

      const distToPlayer = Math.hypot(e.x - player.x, e.y - player.y);
      const ATTACK_REACH = e.r + player.r + 2;

      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (e.attackTimer > 0) e.attackTimer -= dt;

      if (e.state === "walk") {
        if (distToPlayer > ATTACK_REACH) {
          const a = Math.atan2(player.y - e.y, player.x - e.x);
          e.x += Math.cos(a) * e.speed * dt;
          e.y += Math.sin(a) * e.speed * dt;
          e.moving = true;
        } else if (e.attackTimer <= 0) {
          // In range and ready — attack immediately, no idle pause
          e.state = "attack";
          e.attackAnimTimer = 0.5;
          e.moving = false;
        }

      } else if (e.state === "attack") {
        e.moving = false;
        e.attackAnimTimer -= dt;
        if (e.attackAnimTimer <= 0) {
          // Deal damage if still in reach
          if (distToPlayer < ATTACK_REACH + 12) {
            health -= e.attackDmg;
            burst(player.x, player.y, "#c0392b", 6);
            if (health <= 0) {
              health = 0;
              updateHUD();
              endGame();
              return;
            }
            updateHUD();
          }
          e.attackTimer = e.attackCooldown;
          // Back to walk — will re-enter attack immediately if still in range
          e.state = "walk";
        }
      }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.86;
      p.vy *= 0.86;
      p.life -= dt * 2;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Potions — despawn over time, collect on player contact
    for (let i = potions.length - 1; i >= 0; i--) {
      const pot = potions[i];
      pot.life -= dt;
      if (pot.life <= 0) { potions.splice(i, 1); continue; }
      if (Math.hypot(pot.x - player.x, pot.y - player.y) < pot.r + player.r + 8) {
        health = Math.min(100, health + 25);
        updateHUD();
        showFeedback("❤️ +25 HP!", "hit");
        burst(pot.x, pot.y, "#ff4466", 10);
        potions.splice(i, 1);
      }
    }
    // Booms (impact animations)
    for (let i = booms.length - 1; i >= 0; i--) {
      booms[i].life -= dt;
      if (booms[i].life <= 0) {
        booms[i].el.remove();
        booms.splice(i, 1);
      }
    }
    // Background is static — no scroll update
  }

  // ── Draw helpers ──────────────────────────────────────────────────────────
  // ── Sprite overlay system ────────────────────────────────────────────────
  // Each sprite gets its OWN <img> element keyed by a unique spriteKey
  // (e.g. "player", "enemy-3"). Multiple enemies with the same GIF src each
  // get their own element so they animate independently and don't clobber each other.
  // Elements are created on first use and reused every frame — src never changes.
  const spriteLayer = document.getElementById("sprite-layer");
  const _gifEls = {}; // spriteKey → <img> element
  const _activeKeys = new Set(); // which spriteKeys are visible this frame

  function _getGifEl(spriteKey, src) {
    if (!_gifEls[spriteKey]) {
      const el = document.createElement("img");
      el.src = src;
      el.style.cssText =
        "position:absolute;pointer-events:none;transform:translate(-50%,-50%);display:none;";
      spriteLayer.appendChild(el);
      _gifEls[spriteKey] = el;
    }
    // If src changed (walk ↔ idle swap), only update if different to avoid GIF reset
    if (_gifEls[spriteKey].src !== src) {
      _gifEls[spriteKey].src = src;
    }
    return _gifEls[spriteKey];
  }

  function _removeGifEl(spriteKey) {
    if (_gifEls[spriteKey]) {
      _gifEls[spriteKey].remove();
      delete _gifEls[spriteKey];
    }
  }

  function _beginSprites() {
    _activeKeys.clear();
  }

  function _endSprites() {
    for (const key in _gifEls) {
      if (!_activeKeys.has(key)) _gifEls[key].style.display = "none";
    }
  }

  // spriteKey: unique string identifying this sprite instance (e.g. 'player', 'enemy-3')
  function drawSprite(
    idleAssetKey,
    emoji,
    x,
    y,
    size,
    alpha,
    walkAssetKey,
    isMoving,
    spriteKey,
    attackAssetKey,
    isAttacking,
  ) {
    const walkAsset   = walkAssetKey   ? ASSETS[walkAssetKey]   : null;
    const attackAsset = attackAssetKey ? ASSETS[attackAssetKey] : null;
    const idleAsset   = ASSETS[idleAssetKey];

    let chosen;
    if (isAttacking && attackAsset && attackAsset.src && attackAsset.src !== window.location.href) {
      chosen = attackAsset;
    } else if (isMoving && walkAsset && walkAsset.src && walkAsset.src !== window.location.href) {
      chosen = walkAsset;
    } else {
      chosen = idleAsset;
    }
    const isGif =
      chosen && chosen.src && chosen.src.toLowerCase().includes(".gif");

    if (isGif && spriteKey) {
      const el = _getGifEl(spriteKey, chosen.src);
      el.style.display = "block";
      el.style.left = ((x / W) * 100).toFixed(2) + "%";
      el.style.top = ((y / H) * 100).toFixed(2) + "%";
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.opacity = alpha !== undefined ? alpha : 1;
      _activeKeys.add(spriteKey);
    } else if (chosen && chosen.complete && chosen.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = alpha !== undefined ? alpha : 1;
      ctx.drawImage(chosen, x - size / 2, y - size / 2, size, size);
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = alpha !== undefined ? alpha : 1;
      ctx.font = size + "px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(emoji, x, y);
      ctx.restore();
    }
  }

  function drawHPBar(x, y, r, hp, maxHp) {
    const bw = r * 2 + 8,
      bh = 4,
      bx = x - bw / 2,
      by = y - r - 12;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(bx, by, bw, bh);
    const pct = hp / maxHp;
    ctx.fillStyle = pct > 0.5 ? "#4aaa44" : pct > 0.25 ? "#e8a020" : "#c0392b";
    ctx.fillRect(bx, by, bw * pct, bh);
  }

  // ── Draw ──────────────────────────────────────────────────────────────────
  function drawShadow(x, y, r) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.6, r * 0.85, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    _beginSprites(); // reset sprite overlay pool

    // ── Background — seasonal, loops every world ──
    const seasons = [ASSETS.bgSpring, ASSETS.bgSummer, ASSETS.bgAutumn, ASSETS.bgWinter];
    const bgImg = seasons[(world - 1) % 4];
    if (bgImg && bgImg.complete && bgImg.naturalWidth) {
      // Scale to cover full canvas height, center horizontally
      const scale = H / bgImg.naturalHeight;
      const dw = bgImg.naturalWidth * scale;
      const dh = H;
      const x = (W - dw) / 2;
      ctx.drawImage(bgImg, x, 0, dw, dh);
    }

    // Joystick visual
    if (jActive) {
      const wr = gameWrap.getBoundingClientRect();
      const jvx = jOriginX - wr.left,
        jvy = jOriginY - wr.top;
      ctx.beginPath();
      ctx.arc(jvx, jvy, JR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(139,94,60,0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(jvx + jDx * JR, jvy + jDy * JR, 18, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(139,94,60,0.4)";
      ctx.fill();
    }

    // Animation priority: moving+inRange = runAtk, still+inRange = standingAtk, moving = walk, else idle
    const playerAnimKey = (player.moving && player.attacking)
      ? "playerRunAtk"
      : (!player.moving && player.attacking)
        ? "playerAttack"
        : player.moving
          ? "playerWalk"
          : null;
    const playerAnimAsset = playerAnimKey ? ASSETS[playerAnimKey] : null;
    const playerAnimIsGif =
      playerAnimAsset &&
      playerAnimAsset.src &&
      playerAnimAsset.src.toLowerCase().includes(".gif");
    drawShadow(player.x, player.y, 30);
    if (playerAnimIsGif) {
      drawSprite(
        "player",
        PLAYER_EMOJI,
        player.x,
        player.y,
        72,
        1,
        playerAnimKey,
        true,
        "player",
      );
    } else {
      drawSprite(
        "player",
        PLAYER_EMOJI,
        player.x,
        player.y,
        72,
        1,
        "playerWalk",
        player.moving,
        "player",
      );
    }
    drawHPBar(player.x, player.y, 30, health, 100);

    // Bullets — LINE 444: ASSETS.knife image or fallback emoji
    const knifeSrc = ASSETS.knife;
    for (const b of bullets) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, b.life);
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle + Math.PI / 4 + (b.spin || 0));
      if (b.isWordShot) {
        // Word-powered projectile: glowing golden star burst
        const s = 14 + (b.wordDmg / 10);
        ctx.shadowColor = "#ffcc00";
        ctx.shadowBlur = 12;
        ctx.font = s + "px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⭐", 0, 0);
      } else if (knifeSrc && knifeSrc.complete && knifeSrc.naturalWidth > 0) {
        // IMAGE PATH: draw knife image centered, rotated toward target, keeping aspect ratio
        const kW = knifeSrc.naturalWidth;
        const kH = knifeSrc.naturalHeight;
        const kScale = 18 / Math.max(kW, kH);
        const dW = kW * kScale;
        const dH = kH * kScale;
        ctx.drawImage(knifeSrc, -dW / 2, -dH / 2, dW, dH);
      } else {
        ctx.font = "18px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(KNIFE_EMOJI, 0, 0);
      }
      ctx.restore();
    }

    // Enemies
    for (const e of enemies) {
      ctx.save();
      if (e.hitFlash > 0) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(e.hitFlash * 40);
      }
      drawShadow(e.x, e.y, e.spriteR);
      drawSprite(
        e.asset,
        e.emoji,
        e.x,
        e.y,
        e.spriteR * 2.4,
        1,
        e.walkAsset,
        e.state === "walk",
        "enemy-" + e.id,
        e.attackAsset,
        e.state === "attack",
      );
      ctx.restore();
      drawHPBar(e.x, e.y, e.spriteR, e.hp, e.maxHp);
    }

    // Particles (leaf / star bursts)
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.life * 0.85;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Potions
    for (const pot of potions) {
      const pulse = 1 + 0.12 * Math.sin(Date.now() / 200);
      const alpha = Math.min(1, pot.life); // fade out in last second
      ctx.save();
      ctx.globalAlpha = alpha * 0.92;
      ctx.shadowColor = "#ff88aa";
      ctx.shadowBlur = 10;
      const potImg = ASSETS.potion;
      const size = Math.round(32 * pulse);
      if (potImg && potImg.complete && potImg.naturalWidth > 0) {
        ctx.drawImage(potImg, pot.x - size / 2, pot.y - size / 2, size, size);
      } else {
        ctx.font = `${size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🧪", pot.x, pot.y);
      }
      ctx.restore();
    }

    _endSprites(); // hide unused overlay elements
  }

  // helper: CSS var to hex value (just hardcoded since we know the value)
  function var_to_hex(v) {
    return v;
  }

  // ── Screen manager ────────────────────────────────────────────────────────
  const SCREENS = ['screen-loading', 'screen-landing', 'screen-options', 'screen-game'];

  function showScreen(id) {
    SCREENS.forEach(s => {
      const el = document.getElementById(s);
      if (el) el.style.display = s === id ? 'flex' : 'none';
    });
  }

  function showLanding() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    overlay.style.display = 'none';
    showScreen('screen-landing');
  }

  // Play button
  document.getElementById('play-btn').addEventListener('click', () => {
    const landing = document.getElementById('screen-landing');
    const game    = document.getElementById('screen-game');
    // Fade out landing
    landing.style.transition = 'opacity 0.35s';
    landing.style.opacity = '0';
    setTimeout(() => {
      landing.style.display = 'none';
      landing.style.opacity = '';
      landing.style.transition = '';
      // Show game screen and resize before starting
      game.style.opacity = '0';
      game.style.display = 'flex';
      game.style.transition = 'opacity 0.35s';
      // Force reflow so getBoundingClientRect has real dims
      game.getBoundingClientRect();
      resizeCanvas();
      resizeLetterCanvas();
      window.__start();
      // Fade in game screen
      requestAnimationFrame(() => { game.style.opacity = '1'; });
      setTimeout(() => { game.style.transition = ''; }, 400);
    }, 350);
  });

  // Options button
  document.getElementById('options-btn').addEventListener('click', () => showScreen('screen-options'));

  // Back from options
  document.getElementById('options-back-btn').addEventListener('click', () => showScreen('screen-landing'));

  // ── Pause ─────────────────────────────────────────────────────────────────
  const pauseOverlay = document.getElementById('pause-overlay');

  function pauseGame() {
    if (!running || paused) return;
    paused = true;
    pauseOverlay.style.display = 'flex';
    // Flush inputs so player doesn't drift on resume
    jDx = 0; jDy = 0; jActive = false; jTouchId = null;
    Object.keys(keys).forEach(k => keys[k] = false);
  }

  function resumeGame() {
    if (!paused) return;
    paused = false;
    pauseOverlay.style.display = 'none';
    lastTs = performance.now(); // reset timestamp so dt doesn't spike
    raf = requestAnimationFrame(loop);
  }

  document.getElementById('pause-btn').addEventListener('click', pauseGame);
  document.getElementById('resume-btn').addEventListener('click', resumeGame);
  document.getElementById('pause-mainmenu-btn').addEventListener('click', () => {
    paused = false;
    pauseOverlay.style.display = 'none';
    showLanding();
  });

  // Also pause on Escape key
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') paused ? resumeGame() : pauseGame();
  });

  // ── Loop ──────────────────────────────────────────────────────────────────
  function loop(ts) {
    if (!running || paused) return;
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  function endGame() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    overlay.innerHTML =
      '<div style="font-family:\'Fredoka One\',cursive;font-size:32px;color:#e8a020;text-align:center;line-height:1.2;text-shadow:0 3px 0 rgba(0,0,0,0.4)">🐄 Game Over! 🌾</div>' +
      '<p class="stat">Stage → ' + world + '-' + stage +
      '<br>Score → ' + score +
      '<br>Kills → ' + kills + '</p>' +
      '<button class="tap-btn" onclick="window.__start()" style="margin-top:8px">🌱 Try Again!</button>' +
      '<button class="tap-btn" onclick="window.__mainMenu()" style="margin-top:4px;background:#7a5030;border-color:#5a3010">🏠 Main Menu</button>';
    overlay.style.display = 'flex';
  }

  window.__start = function () {
    paused = false;
    if (pauseOverlay) pauseOverlay.style.display = 'none';
    overlay.style.display = 'none';
    initGame();
    running = true;
    lastTs = performance.now();
    raf = requestAnimationFrame(loop);
  };

  window.__mainMenu = function () {
    showLanding();
  };

  nextStageBtn.addEventListener('click', onNextStageBtnClick);
  document.getElementById('stage-start-btn').addEventListener('click', advanceStage);
})();