// =============================================
// JEFTER TOKOMERE – PORTFOLIO SCRIPT
// Powered by Three.js + Vanilla JS
// =============================================

/* ── CUSTOM TECH BACKGROUND ───────────────── */
(function () {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  window.__customTechBgActive = true;

  const state = {
    w: 0,
    h: 0,
    dpr: 1,
    t: 0,
    frame: 0,
    nodes: [],
    edges: [],
    pulses: []
  };

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function buildNetwork() {
    const area = state.w * state.h;
    const count = clamp(Math.floor(area / 17000), 70, 160);
    const clusterCount = clamp(Math.floor(count / 24), 3, 7);

    const clusters = Array.from({ length: clusterCount }, () => ({
      x: rand(state.w * 0.15, state.w * 0.85),
      y: rand(state.h * 0.18, state.h * 0.82),
      spread: rand(120, 260)
    }));

    state.nodes = Array.from({ length: count }, (_, i) => {
      const c = clusters[i % clusters.length];
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.pow(Math.random(), 0.65) * c.spread;
      const x = clamp(c.x + Math.cos(angle) * radius, 10, state.w - 10);
      const y = clamp(c.y + Math.sin(angle) * radius, 10, state.h - 10);
      const layer = Math.random() < 0.2 ? 1.3 : Math.random() < 0.65 ? 1 : 0.75;
      return {
        x,
        y,
        vx: rand(-0.16, 0.16) * layer,
        vy: rand(-0.16, 0.16) * layer,
        r: rand(1.1, 2.2) * layer,
        phase: Math.random() * Math.PI * 2,
        layer
      };
    });

    rebuildEdges();
    state.pulses = [];
  }

  function rebuildEdges() {
    const nodes = state.nodes;
    const maxDist = Math.min(190, Math.max(130, state.w * 0.14));
    const maxDistSq = maxDist * maxDist;
    const maxLinksPerNode = 5;
    const edgeSet = new Set();
    const links = new Array(nodes.length).fill(0);
    const edges = [];

    for (let i = 0; i < nodes.length; i++) {
      const candidates = [];
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= maxDistSq) candidates.push({ j, d2 });
      }

      candidates.sort((a, b) => a.d2 - b.d2);
      for (let k = 0; k < candidates.length && links[i] < maxLinksPerNode; k++) {
        const j = candidates[k].j;
        if (links[j] >= maxLinksPerNode) continue;
        const a = i < j ? i : j;
        const b = i < j ? j : i;
        const key = `${a}-${b}`;
        if (edgeSet.has(key)) continue;
        edgeSet.add(key);
        links[i]++;
        links[j]++;
        edges.push({
          a,
          b,
          pulseLane: Math.random() < 0.6 ? 1 : 0,
          pulseSeed: Math.random() * Math.PI * 2
        });
      }
    }

    state.edges = edges;
  }

  function makeNodes() {
    buildNetwork();
  }

  function resize() {
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.w = window.innerWidth;
    state.h = window.innerHeight;

    canvas.width = Math.floor(state.w * state.dpr);
    canvas.height = Math.floor(state.h * state.dpr);
    canvas.style.width = state.w + 'px';
    canvas.style.height = state.h + 'px';

    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    makeNodes();
  }

  function drawBackdrop() {
    const bg = ctx.createRadialGradient(
      state.w * 0.5,
      state.h * 0.45,
      state.h * 0.08,
      state.w * 0.5,
      state.h * 0.5,
      state.h * 0.9
    );
    bg.addColorStop(0, 'rgba(0, 80, 30, 0.2)');
    bg.addColorStop(0.45, 'rgba(0, 30, 12, 0.08)');
    bg.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, state.w, state.h);
  }

  function updateNodes() {
    const nodes = state.nodes;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 8 || n.x > state.w - 8) n.vx *= -1;
      if (n.y < 8 || n.y > state.h - 8) n.vy *= -1;

      n.x = clamp(n.x, 8, state.w - 8);
      n.y = clamp(n.y, 8, state.h - 8);
    }
  }

  function drawEdges() {
    const nodes = state.nodes;
    for (let i = 0; i < state.edges.length; i++) {
      const e = state.edges[i];
      const a = nodes[e.a];
      const b = nodes[e.b];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const strength = clamp(1 - dist / 210, 0, 1);
      if (strength <= 0) continue;

      ctx.strokeStyle = `rgba(60, 255, 140, ${0.05 + strength * 0.16})`;
      ctx.lineWidth = 0.7 + strength * 0.75;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  function spawnPulse() {
    if (!state.edges.length) return;
    const edgeIdx = Math.floor(Math.random() * state.edges.length);
    const edge = state.edges[edgeIdx];
    if (!edge || edge.pulseLane <= 0) return;
    const reverse = Math.random() < 0.5;
    state.pulses.push({
      edgeIdx,
      progress: reverse ? 1 : 0,
      speed: rand(0.004, 0.012),
      dir: reverse ? -1 : 1,
      life: rand(0.7, 1.2)
    });
  }

  function updateAndDrawPulses() {
    const nodes = state.nodes;
    for (let i = state.pulses.length - 1; i >= 0; i--) {
      const p = state.pulses[i];
      const edge = state.edges[p.edgeIdx];
      if (!edge) {
        state.pulses.splice(i, 1);
        continue;
      }

      p.progress += p.speed * p.dir;
      p.life -= 0.004;
      if (p.progress < 0 || p.progress > 1 || p.life <= 0) {
        state.pulses.splice(i, 1);
        continue;
      }

      const a = nodes[edge.a];
      const b = nodes[edge.b];
      const x = a.x + (b.x - a.x) * p.progress;
      const y = a.y + (b.y - a.y) * p.progress;

      const alpha = clamp(p.life, 0, 1) * 0.95;
      ctx.beginPath();
      ctx.fillStyle = `rgba(170, 255, 210, ${alpha})`;
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = `rgba(60, 255, 140, ${alpha * 0.35})`;
      ctx.arc(x, y, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawNodes() {
    for (let i = 0; i < state.nodes.length; i++) {
      const n = state.nodes[i];
      const flicker = 0.7 + Math.sin(state.t * 2.6 + n.phase) * 0.3;

      ctx.beginPath();
      ctx.fillStyle = `rgba(170, 255, 210, ${0.35 * flicker})`;
      ctx.arc(n.x, n.y, n.r * 3.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = `rgba(170, 255, 210, ${0.9 * flicker})`;
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawVignette() {
    const g = ctx.createRadialGradient(
      state.w * 0.5,
      state.h * 0.5,
      state.h * 0.25,
      state.w * 0.5,
      state.h * 0.5,
      state.h * 0.9
    );
    g.addColorStop(0, 'rgba(0, 0, 0, 0)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.w, state.h);
  }

  function frame() {
    state.t += 0.016;
    state.frame++;
    ctx.clearRect(0, 0, state.w, state.h);

    updateNodes();
    if (state.frame % 120 === 0) rebuildEdges();
    if (Math.random() < 0.22) spawnPulse();

    drawBackdrop();
    drawEdges();
    updateAndDrawPulses();
    drawNodes();
    drawVignette();

    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  frame();
})();

/* ── LETTER GLITCH (ported from React) ───── */
(function () {
  if (window.__customTechBgActive) return;
  const canvas = document.getElementById('letter-glitch-canvas');
  if (!canvas) return;

  // ── Config — matches: <LetterGlitch glitchSpeed={50} centerVignette={true} outerVignette={false} smooth={true} />
  const glitchColors   = ['#1a4d2e', '#00c853', '#00ff41'];
  const glitchSpeed    = 50;
  const smooth         = true;
  const outerVignette  = false;
  const centerVignette = true;
  const characters     = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789';

  const fontSize   = 16;
  const charWidth  = 10;
  const charHeight = 20;

  const syms = characters.split('');

  let ctx, letters = [], gridCols = 0;
  let animId, lastGlitchTime = Date.now();

  const rndChar  = () => syms[Math.floor(Math.random() * syms.length)];
  const rndColor = () => glitchColors[Math.floor(Math.random() * glitchColors.length)];

  // ── Robust hex → rgb (handles 3-char and 6-char, ignores rgb() strings) ──
  function hexToRgb(hex) {
    if (!hex || !hex.startsWith('#')) return null;
    hex = hex.replace(/^#([a-f\d])([a-f\d])([a-f\d])$/i, (_, r, g, b) => '#' + r+r+g+g+b+b);
    const res = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return res ? { r: parseInt(res[1],16), g: parseInt(res[2],16), b: parseInt(res[3],16) } : null;
  }

  function lerpColor(a, b, t) {
    return `rgb(${Math.round(a.r+(b.r-a.r)*t)},${Math.round(a.g+(b.g-a.g)*t)},${Math.round(a.b+(b.b-a.b)*t)})`;
  }

  // ── Init ──────────────────────────────────────
  function initLetters(cols, rows) {
    gridCols = cols;
    letters = Array.from({ length: cols * rows }, () => {
      const c = rndColor();
      return { char: rndChar(), color: c, startColor: c, targetColor: rndColor(), colorProgress: 1 };
    });
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth, h = window.innerHeight;
    canvas.width  = w * dpr;  canvas.height = h * dpr;
    canvas.style.width  = w + 'px'; canvas.style.height = h + 'px';
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initLetters(Math.ceil(w / charWidth), Math.ceil(h / charHeight));
    drawLetters();
  }

  // ── Draw ──────────────────────────────────────
  function drawLetters() {
    if (!ctx || !letters.length) return;
    const w = window.innerWidth, h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';
    letters.forEach((lt, i) => {
      ctx.fillStyle = lt.color;
      ctx.fillText(lt.char, (i % gridCols) * charWidth, Math.floor(i / gridCols) * charHeight);
    });
    if (outerVignette) {
      const g = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h) / 2);
      g.addColorStop(0.55, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
  }

  // ── Update ────────────────────────────────────
  function updateLetters() {
    const count = Math.max(1, Math.floor(letters.length * 0.05));
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * letters.length);
      const lt  = letters[idx];
      if (!lt) continue;
      lt.char        = rndChar();
      lt.startColor  = lt.color.startsWith('#') ? lt.color : lt.targetColor; // always use a valid hex as start
      lt.targetColor = rndColor();
      lt.colorProgress = smooth ? 0 : 1;
      if (!smooth) lt.color = lt.targetColor;
    }
  }

  // ── Smooth transitions (bug-fixed: uses startColor + targetColor, both always hex) ──
  function handleSmooth() {
    let dirty = false;
    letters.forEach(lt => {
      if (lt.colorProgress >= 1) return;
      lt.colorProgress = Math.min(1, lt.colorProgress + 0.05);
      const s = hexToRgb(lt.startColor);
      const e = hexToRgb(lt.targetColor);
      if (s && e) {
        lt.color = lerpColor(s, e, lt.colorProgress);
        if (lt.colorProgress >= 1) lt.color = lt.targetColor; // snap back to hex when done
        dirty = true;
      }
    });
    if (dirty) drawLetters();
  }

  // ── Loop ──────────────────────────────────────
  function animate() {
    const now = Date.now();
    if (now - lastGlitchTime >= glitchSpeed) {
      updateLetters();
      drawLetters();
      lastGlitchTime = now;
    }
    if (smooth) handleSmooth();
    animId = requestAnimationFrame(animate);
  }

  resizeCanvas();
  animate();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { cancelAnimationFrame(animId); resizeCanvas(); animate(); }, 100);
  });
})();



(function () {
  if (window.__customTechBgActive) return;
  const canvas = document.getElementById('lang-rain-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // ── All programming languages in the world ──
  const LANGS = [
    'Python','JavaScript','TypeScript','Java','C','C++','C#','Go','Rust',
    'Swift','Kotlin','PHP','Ruby','Scala','Haskell','Erlang','Elixir',
    'Clojure','F#','Dart','Lua','Perl','R','MATLAB','Julia','Fortran',
    'COBOL','Pascal','Ada','Assembly','BASIC','VB.NET','Bash','PowerShell',
    'SQL','PL/SQL','T-SQL','NoSQL','HTML','CSS','CSS3','XML','JSON','YAML',
    'TOML','Markdown','Solidity','Move','Vyper','Prolog','Lisp','Scheme',
    'OCaml','ML','Racket','Smalltalk','Objective-C','ActionScript',
    'CoffeeScript','Elm','PureScript','ReasonML','Nim','Zig','Crystal',
    'D','Groovy','Hack','HCL','Terraform','GraphQL','Apex','ABAP','RPG',
    'Forth','Factor','Tcl','Rexx','AWK','Sed','Verilog','VHDL',
    'SystemVerilog','CUDA','OpenCL','WebAssembly','Mojo','Carbon',
    'Chapel','Raku','Ballerina','V','Janet','Wren','Io','BrainF*ck',
    'Whitespace','Befunge','Malbolge','INTERCAL','Piet','Lolcode',
    'Arduino','Processing','Ring','Hy','Fennel','Janet','Cython','Jython',
    'MicroPython','CircuitPython','Scratch','Alice','Logo','PostScript',
    'Wolfram','Mathematica','LabVIEW','SAS','SPSS','Stata','Octave',
    'Simulink','VBSCRIPT','JScript','LiveScript','ClojureScript',
    'PureBasic','FreeBASIC','AutoHotKey','AutoIT','GDScript','Squirrel',
    'Awk','Tcsh','Fish','Zsh','Nix','Dhall','Starlark','Jsonnet',
    'HaxE','Fantom','Gosu','Frege','Idris','Agda','Coq','Isabelle',
    'Mercury','Curry','Clean','CAML','StandardML','SML','MetaLua',
    'MoonScript','Terra','Pliant','Seed7','REXX','MUMPS','M','SNOBOL',
    'Icon','Unicon','Oz','Mozart','Alice ML','SASL','APL','J','K','Q',
    'AMPL','GAMS','GPSS','NetLogo','StarLogo','Urbi','Harbinger',
    'Ioke','Phix','Boo','Nemerle','Oxygene','Delphi','Eiffel','Sather',
  ];

  let W, H, cols, drops, fontSize;

  function init() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    fontSize = 12;
    cols = Math.floor(W / 90); // one column per ~90px
    drops = Array.from({ length: cols }, () => ({
      y: Math.random() * -H,         // start above screen at random y
      speed: Math.random() * 1.1 + 0.4,
      wordIndex: Math.floor(Math.random() * LANGS.length),
      bright: Math.random()           // 0..1, leading word brightness
    }));
  }

  init();
  window.addEventListener('resize', init);

  const colWidth = () => W / cols;

  function draw() {
    // Faint fade trail
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(0, 0, W, H);

    ctx.font = `600 ${fontSize}px 'JetBrains Mono', monospace`;

    drops.forEach((drop, i) => {
      const x = i * colWidth();

      // Pick current language name
      const word = LANGS[drop.wordIndex % LANGS.length];

      // Leading word — bright white/cyan glow
      const glitch = Math.random() < 0.015; // occasional glitch flash
      if (glitch) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00ff41';
        ctx.shadowBlur  = 16;
      } else {
        ctx.fillStyle = '#00ff41';
        ctx.shadowColor = '#00ff41';
        ctx.shadowBlur  = 10;
      }
      ctx.fillText(word, x, drop.y);

      // Trail word (above) — dimmer green
      const prevWord = LANGS[(drop.wordIndex - 1 + LANGS.length) % LANGS.length];
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0, 200, 83, 0.55)';
      ctx.fillText(prevWord, x, drop.y - fontSize * 1.8);

      // Second trail — even dimmer
      const prev2Word = LANGS[(drop.wordIndex - 2 + LANGS.length) % LANGS.length];
      ctx.fillStyle = 'rgba(0, 120, 50, 0.28)';
      ctx.fillText(prev2Word, x, drop.y - fontSize * 3.6);

      // Move drop down
      drop.y += drop.speed * fontSize * 1.8;

      // When drop exits screen, reset at top with new random settings
      if (drop.y > H + fontSize * 10) {
        drop.y = Math.random() * -200;
        drop.speed = Math.random() * 1.1 + 0.4;
        drop.wordIndex = Math.floor(Math.random() * LANGS.length);
      }

      // Cycle through languages as drop falls
      drop.wordIndex += 0.04;
    });

    ctx.shadowBlur = 0;
  }

  (function loop() { draw(); requestAnimationFrame(loop); })();
})();


function startParticlesFallback(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let particles = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = Math.max(60, Math.floor((w * h) / 18000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 1.8 + 0.6
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);

    // Draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(0, 255, 65, 0.85)';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 140 * 140) {
          const alpha = 1 - Math.sqrt(d2) / 140;
          ctx.strokeStyle = `rgba(0, 200, 83, ${alpha * 0.18})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener('resize', resize);
  tick();
}

(function () {
  if (window.__customTechBgActive) return;
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  if (typeof THREE === 'undefined') {
    startParticlesFallback(canvas);
    return;
  }

  let renderer;
  try {
    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (err) {
    startParticlesFallback(canvas);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  // Scene & Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 28);

  // Mouse tracking for camera tilt
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('mousemove', e => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ── 1. FLOATING PARTICLE FIELD ───────────
  const particleCount = 220;
  const positions = new Float32Array(particleCount * 3);
  const velocities = [];
  const colors = new Float32Array(particleCount * 3);

  const cyan  = new THREE.Color(0x00ff41);
  const blue  = new THREE.Color(0x00c853);
  const purp  = new THREE.Color(0x39ff14);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 60;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    velocities.push({
      x: (Math.random() - 0.5) * 0.018,
      y: (Math.random() - 0.5) * 0.018,
      z: (Math.random() - 0.5) * 0.006
    });
    const pick = Math.random();
    const col  = pick < 0.5 ? cyan : pick < 0.85 ? blue : purp;
    colors[i * 3]     = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

  const pMat = new THREE.PointsMaterial({
    size: 0.25,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // ── 2. WIREFRAME ICOSAHEDRON (hero accent) ─
  const icoGeo = new THREE.IcosahedronGeometry(5.5, 1);
  const icoMat = new THREE.MeshBasicMaterial({
    color: 0x00c853,
    wireframe: true,
    transparent: true,
    opacity: 0.2
  });
  const ico = new THREE.Mesh(icoGeo, icoMat);
  ico.position.set(14, 2, -6);
  scene.add(ico);

  // ── 3. SMALL ORBITING TORUS ───────────────
  const torGeo = new THREE.TorusGeometry(2.2, 0.06, 12, 60);
  const torMat = new THREE.MeshBasicMaterial({
    color: 0x00ff41,
    transparent: true,
    opacity: 0.22
  });
  const torus = new THREE.Mesh(torGeo, torMat);
  torus.position.set(-14, -3, -4);
  torus.rotation.x = Math.PI / 4;
  scene.add(torus);

  // ── 4. FLOATING TETRAHEDRON ───────────────
  const tetGeo = new THREE.TetrahedronGeometry(2.4);
  const tetMat = new THREE.MeshBasicMaterial({
    color: 0x39ff14,
    wireframe: true,
    transparent: true,
    opacity: 0.28
  });
  const tet = new THREE.Mesh(tetGeo, tetMat);
  tet.position.set(-16, 8, -8);
  scene.add(tet);

  // ── 5. CONNECTING LINES between nearby particles ─
  const linePositions = [];
  for (let i = 0; i < particleCount; i++) {
    for (let j = i + 1; j < particleCount; j++) {
      const dx = positions[i*3]   - positions[j*3];
      const dy = positions[i*3+1] - positions[j*3+1];
      const dz = positions[i*3+2] - positions[j*3+2];
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (dist < 9) {
        linePositions.push(
          positions[i*3], positions[i*3+1], positions[i*3+2],
          positions[j*3], positions[j*3+1], positions[j*3+2]
        );
      }
    }
  }
  const lGeo = new THREE.BufferGeometry();
  lGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));
  const lMat = new THREE.LineBasicMaterial({
    color: 0x00c853,
    transparent: true,
    opacity: 0.07,
    blending: THREE.AdditiveBlending
  });
  scene.add(new THREE.LineSegments(lGeo, lMat));

  // ── RESIZE ────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── ANIMATE LOOP ──────────────────────────
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.012;

    // Smooth camera mouse parallax
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    camera.position.x = mouse.x * 2.5;
    camera.position.y = mouse.y * 1.5;
    camera.lookAt(scene.position);

    // Animate particles
    const pos = pGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      pos[i*3]     += velocities[i].x;
      pos[i*3 + 1] += velocities[i].y;
      pos[i*3 + 2] += velocities[i].z;
      // Wrap around bounds
      if (pos[i*3]     >  30) pos[i*3]     = -30;
      if (pos[i*3]     < -30) pos[i*3]     =  30;
      if (pos[i*3 + 1] >  30) pos[i*3 + 1] = -30;
      if (pos[i*3 + 1] < -30) pos[i*3 + 1] =  30;
    }
    pGeo.attributes.position.needsUpdate = true;

    // Rotate shapes
    ico.rotation.x = t * 0.18;
    ico.rotation.y = t * 0.28;
    ico.position.y = 2 + Math.sin(t * 0.6) * 1.2;

    torus.rotation.z = t * 0.22;
    torus.rotation.y = t * 0.14;
    torus.position.y = -3 + Math.cos(t * 0.5) * 1.5;

    tet.rotation.x = t * 0.3;
    tet.rotation.y = t * 0.4;
    tet.position.y = 8 + Math.sin(t * 0.7) * 1.8;

    points.rotation.y = t * 0.008;

    renderer.render(scene, camera);
  }
  animate();
})();

/* ── NAVBAR SCROLL ──────────────────────── */
const navbar = document.getElementById('navbar');
const scrollTopBtn = document.getElementById('scroll-top');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) navbar.classList.add('scrolled');
  else navbar.classList.remove('scrolled');

  if (window.scrollY > 400) scrollTopBtn.classList.add('visible');
  else scrollTopBtn.classList.remove('visible');
});

scrollTopBtn && scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ── MOBILE MENU ────────────────────────── */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
const mobileClose = document.getElementById('mobile-close');

hamburger && hamburger.addEventListener('click', () => mobileMenu.classList.add('open'));
mobileClose && mobileClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
mobileMenu && mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

/* ── TYPED TEXT ─────────────────────────── */
(function () {
  const el = document.getElementById('typed');
  if (!el) return;
  const phrases = [
    'Software Engineer',
    'Full Stack Developer',
    'React Developer',
    'Next.js Developer',
    'IoT Innovator',
    'Flutter Developer',
    'Three.js Developer',
    'ESP32 Specialist'
  ];
  let pi = 0, ci = 0, deleting = false;
  function tick() {
    const phrase = phrases[pi];
    if (!deleting) {
      el.textContent = phrase.slice(0, ci + 1);
      ci++;
      if (ci === phrase.length) { deleting = true; setTimeout(tick, 1800); return; }
    } else {
      el.textContent = phrase.slice(0, ci - 1);
      ci--;
      if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; }
    }
    setTimeout(tick, deleting ? 55 : 90);
  }
  tick();
})();

/* ── COUNTER ANIMATION ──────────────────── */
function animateCounter(el, target, duration = 1500) {
  let start = 0;
  const step = target / (duration / 16);
  function update() {
    start += step;
    if (start >= target) { el.textContent = target + (el.dataset.suffix || ''); return; }
    el.textContent = Math.floor(start) + (el.dataset.suffix || '');
    requestAnimationFrame(update);
  }
  update();
}

/* ── SCROLL REVEAL ──────────────────────── */
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      entry.target.querySelectorAll && entry.target.querySelectorAll('[data-count]').forEach(el => {
        animateCounter(el, parseInt(el.dataset.count));
      });
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => io.observe(el));

document.querySelectorAll('.highlight-item').forEach(el => {
  io.observe(el);
});

/* ── CONTACT FORM ───────────────────────── */
const form = document.getElementById('contact-form');
form && form.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = form.querySelector('.form-submit');
  btn.textContent = 'Sending...';
  btn.disabled = true;
  setTimeout(() => {
    form.style.display = 'none';
    document.getElementById('form-success').style.display = 'block';
  }, 1500);
});

/* ── ACTIVE NAV LINK ────────────────────── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    const top = sec.offsetTop - 120;
    if (window.scrollY >= top) current = sec.getAttribute('id');
  });
  navLinks.forEach(a => {
    a.style.color = '';
    if (a.getAttribute('href') === '#' + current) {
      a.style.color = 'var(--accent-cyan)';
    }
  });
});

/* ── STAGGERED REVEAL ───────────────────── */
document.querySelectorAll('.skills-grid .skill-card, .projects-grid .project-card, .tools-grid .tool-item, .experience-grid .exp-card, .certificates-grid .cert-card').forEach((el, i) => {
  el.style.transitionDelay = (i * 0.05) + 's';
  el.classList.add('reveal');
  io.observe(el);
});
