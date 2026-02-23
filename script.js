(function () {
  // ── Word list ─────────────────────────────────────────────────────────────
  // VALID_WORDS loaded from CDN — starts as empty Set, filled on fetch
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
      console.log("Word list loaded:", VALID_WORDS.size, "words");
    } catch (e) {
      console.error("Failed to load word list:", e);
      wordsLoaded = true; // allow play with empty set rather than blocking
    }
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
    // Creates a plain Image for static assets (png/jpg)
    const el = new Image();
    el.src = src;
    return el;
  }
  function makeGif(src) {
    // Creates a real DOM <img> for GIFs — browser animates it natively,
    // and we position it via CSS overlay instead of drawing to canvas
    const el = document.createElement("img");
    el.src = src;
    el.style.display = "none"; // hidden until placed by positionSprite
    document.getElementById("gif-cache").appendChild(el);
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

    // ── Projectile ──
    knife: null,

    // ── Enemies ──
    enemyBasic:     makeImg("assets/enemy1_running.gif"),
    enemyBasicWalk: makeImg("assets/enemy1_running.gif"),
    enemyFast:      makeImg("assets/enemy2_running.gif"),
    enemyFastWalk:  makeImg("assets/enemy2_running.gif"),
    enemyTank:      makeImg("assets/enemy3_running.gif"),
    enemyTankWalk:  makeImg("assets/enemy3_running.gif"),

    // ── Background — seasonal, loops every 4 stages ──
    bgWinter: makeImg("assets/bg/winter.png"),
    bgAutumn: makeImg("assets/bg/autumn.png"),
    bgSpring: makeImg("assets/bg/spring.png"),
    bgSummer: makeImg("assets/bg/summer.png"),
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
  let W, H;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = rect.width;
    H = rect.height;
  }
  resizeCanvas();
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
  const lettersWrap = document.getElementById("letters-wrap");
  const wordText = document.getElementById("word-text");
  const wordDisplay = document.getElementById("word-display");
  const dmgPreview = document.getElementById("dmg-preview");
  const submitBtn = document.getElementById("submit-btn");
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
  gameWrap.addEventListener(
    "touchstart",
    (e) => {
      if (e.target.tagName === "BUTTON") return; // let button touches through
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
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier !== jTouchId) continue;
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
    for (const t of e.changedTouches)
      if (t.identifier === jTouchId) {
        jActive = false;
        jTouchId = null;
        jDx = 0;
        jDy = 0;
      }
  }
  window.addEventListener("touchend", endJ);
  window.addEventListener("touchcancel", endJ);

  // ── Game State ────────────────────────────────────────────────────────────
  let player, enemies, bullets, particles;
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
  let playerRunningOut = false; // true while player auto-runs off screen after stage clear
  let running = false,
    raf = null,
    lastTs = 0;
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
    return {
      playerSpeed: 135,
      shootInterval: Math.max(0.18, 0.65 - w * 0.04),
      spawnInterval: Math.max(0.25, 1.1 - w * 0.08),
      maxEnemies: 6 + w * 4,
      enemySpeed: 28 + w * 9,
      enemyHp: Math.round((1 + Math.floor(w / 2)) * 1.5),
    };
  }

  function initGame() {
    resizeCanvas();
    player = { x: W * 0.2, y: H * 0.6, r: 30, angle: 0 }; // start mid-ground
    enemies = [];
    bullets = [];
    particles = [];
    score = 0;
    kills = 0;
    health = 100;
    world = 1;
    stage = 1;
    stageKills = 0;
    stageEnemiesSpawned = 0;
    stageClearPending = false;
    playerRunningOut = false;
    nextStageBtn.style.display = "none";
    stageIntroEl.style.display = "none";
    shootTimer = 0;
    spawnTimer = 0;
    bgOffset = 0;
    combo = 0;
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

  // ── Word UI ───────────────────────────────────────────────────────────────
  function generateNewLetters() {
    currentLetters = generateLetters().map((c) => ({ char: c, used: false }));
    selectedIndices = [];
    renderTiles();
    updateWordDisplay();
  }

  function renderTiles() {
    lettersWrap.innerHTML = "";
    currentLetters.forEach((lt, i) => {
      const tile = document.createElement("div");
      tile.className =
        "tile" +
        (lt.used ? " used" : "") +
        (selectedIndices.includes(i) ? " selected" : "");
      tile.innerHTML = `<span>${lt.char}</span><span class="tile-score">${LETTER_SCORE[lt.char] || 1}</span>`;
      tile.addEventListener("click", () => onTile(i));
      tile.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          onTile(i);
        },
        { passive: false },
      );
      lettersWrap.appendChild(tile);
    });
  }

  function onTile(i) {
    if (stageClearPending || playerRunningOut) return;
    if (currentLetters[i].used) return;
    const idx = selectedIndices.indexOf(i);
    if (idx !== -1) {
      if (idx === selectedIndices.length - 1) selectedIndices.pop();
    } else {
      selectedIndices.push(i);
    }
    renderTiles();
    updateWordDisplay();
  }

  function updateWordDisplay() {
    const word = selectedIndices.map((i) => currentLetters[i].char).join("");
    wordText.textContent = word;
    wordDisplay.className = "";
    if (word.length >= 3) {
      dmgPreview.textContent = "+" + calcDamage(word) + " 💥";
      submitBtn.disabled = false;
    } else {
      dmgPreview.textContent = "";
      submitBtn.disabled = true;
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
    if (submitBtn.disabled) return; // block re-entry during cooldown
    const word = selectedIndices
      .map((i) => currentLetters[i].char)
      .join("")
      .toLowerCase();
    if (word.length < 3) return;
    if (!wordsLoaded) {
      showFeedback("⏳ Loading dictionary...", "miss");
      return;
    }
    submitBtn.disabled = true; // lock immediately — re-enabled by generateNewLetters/renderTiles

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
        enemies.forEach((e, idx) => {
          const a = Math.atan2(e.y - player.y, e.x - player.x);
          // Stagger each projectile slightly so they fan out visually
          const delay = idx * 60; // ms between each launch
          const wordDmg = Math.round(dmg * comboMult);
          setTimeout(() => {
            if (!running) return;
            player.attacking = true;
            setTimeout(() => { player.attacking = false; }, 300);
            bullets.push({
              x: player.x,
              y: player.y,
              vx: Math.cos(a) * 520,
              vy: Math.sin(a) * 520,
              angle: a,
              r: 12,
              life: 2.0,
              wordDmg,          // carry the word damage payload
              targetId: e.id,   // aimed at this specific enemy
              isWordShot: true, // flag so collision uses wordDmg
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

      setTimeout(generateNewLetters, 380);
    } else {
      wordDisplay.classList.add("invalid");
      breakCombo("invalid word");
      selectedIndices = [];
      setTimeout(() => {
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

  submitBtn.addEventListener("click", submitWord);
  document.getElementById("clear-btn").addEventListener("click", () => {
    if (stageClearPending || playerRunningOut) return;
    selectedIndices = [];
    renderTiles();
    updateWordDisplay();
  });
  document.getElementById("refresh-btn").addEventListener("click", () => {
    if (stageClearPending || playerRunningOut) return;
    breakCombo("letters refreshed");
    generateNewLetters();
  });

  // ── Enemy helpers ─────────────────────────────────────────────────────────
  const ETYPES = {
    basic: {
      r: 25,
      asset: "enemyBasic",
      walkAsset: "enemyBasicWalk",
      emoji: "🐺",
      speedMult: 1.0,
      hpBonus: 0,
      points: 10,
    },
    fast: {
      r: 18,
      asset: "enemyFast",
      walkAsset: "enemyFastWalk",
      emoji: "🦊",
      speedMult: 1.9,
      hpBonus: 0,
      points: 15,
    },
    tank: {
      r: 30,
      asset: "enemyTank",
      walkAsset: "enemyTankWalk",
      emoji: "🐗",
      speedMult: 0.55,
      hpBonus: 3,
      points: 30,
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
      asset: t.asset,
      walkAsset: t.walkAsset,
      emoji: t.emoji,
      hp,
      maxHp: hp,
      speed: diff.enemySpeed * t.speedMult,
      type,
      points: t.points,
      hitFlash: 0,
      moving: true,
      id: ++_spriteIdCounter,
    }); // unique ID for GIF overlay element
  }

  function nearestEnemy() {
    let best = null,
      bestD = Infinity;
    for (const e of enemies) {
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
    enemies = [];
    bullets = []; // clear field — also kills any in-flight word-shots

    // Idle the player while waiting
    player.moving = false;
    player.attacking = false;

    // Clear selection and gray out the word panel
    selectedIndices = [];
    renderTiles();
    updateWordDisplay();
    document.getElementById("word-panel").style.opacity = "0.4";
    document.getElementById("word-panel").style.pointerEvents = "none";

    // Show the next-stage button on the canvas
    nextStageBtn.style.display = "block";
  }

  function onNextStageBtnClick() {
    nextStageBtn.style.display = "none";
    playerRunningOut = true;
    player.moving = true;
    // The update loop will auto-run the player right; once off-screen, showStageIntro() fires
  }

  function showStageIntro() {
    playerRunningOut = false;

    // Advance world/stage counters
    if (stage >= STAGES_PER_WORLD) {
      world++;
      stage = 1;
    } else {
      stage++;
    }

    const isWorldStart = stage === 1;
    const titleEl = document.getElementById("stage-intro-title");
    const subEl = document.getElementById("stage-intro-sub");
    titleEl.textContent = isWorldStart
      ? "🌍 World " + world + " — Stage " + world + "-" + stage
      : "⚔️ Stage " + world + "-" + stage;
    subEl.textContent = "Kills needed: " + Math.round(6 * Math.pow(2, (world - 1) * STAGES_PER_WORLD + (stage - 1)));
    stageIntroEl.style.display = "flex";
  }

  function advanceStage() {
    stageIntroEl.style.display = "none";
    stageClearPending = false;
    stageKills = 0;
    stageEnemiesSpawned = 0;

    // Reset player to left side
    player.x = W * 0.2;
    player.y = H * 0.6;
    player.moving = false;
    player.attacking = false;

    enemies = [];
    bullets = []; // clear any in-flight word-shots from previous stage
    document.getElementById("word-panel").style.opacity = "";
    document.getElementById("word-panel").style.pointerEvents = "";
    updateHUD();
    updateComboUI();
    showStageFlash("⚔️ Stage " + world + "-" + stage);
    generateNewLetters();
  }

  // ── Update ────────────────────────────────────────────────────────────────
  function update(dt) {
    const diff = getDiff();

    // Player run-off animation after stage clear button clicked
    if (playerRunningOut) {
      player.moving = true;
      player.x += 260 * dt; // run rightward
      if (player.x > W + player.r * 2) {
        showStageIntro(); // player exited screen — show intro
      }
      return; // skip all other update logic during run-off
    }

    if (stageClearPending) return; // pause update during clear screen (waiting for button click)

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
    // Right boundary reduced to 30% of canvas (left 30% of screen)
    player.x = Math.max(
      player.r,
      Math.min(W * 0.5 - player.r, player.x + mx * diff.playerSpeed * dt),
    );
    // Clamp Y so player never goes below ground level (75% of canvas height)
    // Keep player inside the ground area (groundY=25% to bottom)
    const groundTop = H * 0.25 + player.r;
    const groundBottom = H - player.r;
    player.y = Math.max(
      groundTop,
      Math.min(groundBottom, player.y + my * diff.playerSpeed * dt),
    );

    // Auto-shoot knife toward nearest enemy
    const ATTACK_RANGE = W * 0.8; // only attack enemies within 20% of canvas width
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

    // Bullets (knives)
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.x > W + 20 || b.y < -20 || b.y > H + 20) {
        bullets.splice(i, 1);
        continue;
      }
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        // Word-shots home toward their target enemy; regular shots hit any enemy
        if (b.isWordShot && b.targetId !== e.id) continue;
        if (Math.hypot(b.x - e.x, b.y - e.y) < b.r + e.r) {
          const dmgAmt = b.isWordShot ? b.wordDmg : 1;
          e.hp -= dmgAmt;
          e.hitFlash = 0.25;
          burst(b.x, b.y, "#e8a020", b.isWordShot ? 10 : 4);
          bullets.splice(i, 1);
          if (b.isWordShot) {
            spawnDmgPop(e.x, e.y - e.r, "+" + dmgAmt + "💥");
          }
          if (e.hp <= 0) {
            burst(e.x, e.y, "#ff9900", 14);
            _removeGifEl("enemy-" + e.id);
            const pts = (e.points || 10) * world;
            enemies.splice(j, 1);
            score += pts;
            stageKills = Math.min(stageKills + 1, killsNeeded()); // clamp — stray shots can't over-count
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
      const a = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(a) * e.speed * dt;
      e.y += Math.sin(a) * e.speed * dt;
      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (Math.hypot(e.x - player.x, e.y - player.y) < e.r + player.r) {
        health -= 10;
        burst(player.x, player.y, "#c0392b", 8);
        _removeGifEl("enemy-" + e.id);
        enemies.splice(i, 1);
        stageKills = Math.min(stageKills + 1, killsNeeded()); // enemy consumed — count it
        kills++;
        if (health <= 0) {
          health = 0;
          updateHUD();
          endGame();
          return;
        }
        updateHUD();
        checkStageClear();
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
  ) {
    const walkAsset = walkAssetKey ? ASSETS[walkAssetKey] : null;
    const idleAsset = ASSETS[idleAssetKey];

    const useWalk =
      isMoving &&
      walkAsset &&
      walkAsset.src &&
      walkAsset.src !== window.location.href;
    const chosen = useWalk ? walkAsset : idleAsset;
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
    drawShadow(player.x, player.y, player.r);
    if (playerAnimIsGif) {
      drawSprite(
        "player",
        PLAYER_EMOJI,
        player.x,
        player.y,
        player.r * 2.4,
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
        player.r * 2.4,
        1,
        "playerWalk",
        player.moving,
        "player",
      );
    }
    drawHPBar(player.x, player.y, player.r, health, 100);

    // Bullets — LINE 444: ASSETS.knife image or fallback emoji
    const knifeSrc = ASSETS.knife;
    for (const b of bullets) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, b.life);
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle + Math.PI / 4);
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
        // IMAGE PATH: draw knife image centered, rotated toward target (~18x18px)
        ctx.drawImage(knifeSrc, -9, -9, 18, 18);
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
      drawShadow(e.x, e.y, e.r);
      // Enemy idle: ASSETS.enemyBasic/Fast/Tank (LINES 545/547/549) | walk GIF: LINES 546/548/550
      drawSprite(
        e.asset,
        e.emoji,
        e.x,
        e.y,
        e.r * 2.4,
        1,
        e.walkAsset,
        e.moving,
        "enemy-" + e.id,
      );
      ctx.restore();
      drawHPBar(e.x, e.y, e.r, e.hp, e.maxHp);
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

    _endSprites(); // hide unused overlay elements
  }

  // helper: CSS var to hex value (just hardcoded since we know the value)
  function var_to_hex(v) {
    return v;
  }

  // ── Loop ──────────────────────────────────────────────────────────────────
  function loop(ts) {
    if (!running) return;
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
      "<h1>🐄 Game Over! 🌾</h1>" +
      '<p class="stat">Stage → ' +
      world +
      "-" +
      stage +
      "<br>Score → " +
      score +
      "<br>Kills → " +
      kills +
      "</p>" +
      '<button class="tap-btn" onclick="window.__start()">🌱 Try Again!</button>';
    overlay.style.display = "flex";
  }

  window.__start = function () {
    overlay.style.display = "none";
    initGame();
    running = true;
    lastTs = performance.now();
    raf = requestAnimationFrame(loop);
  };

  document
    .getElementById("start-btn")
    .addEventListener("click", window.__start);
  nextStageBtn.addEventListener("click", onNextStageBtnClick);
  document.getElementById("stage-start-btn").addEventListener("click", advanceStage);
})();
