(function () {
  'use strict';
 
  const wrap = document.getElementById('heroImgWrap');
  if (!wrap) return;
 
  /* ── Canvas setup ── */
  const canvas = document.createElement('canvas');
  canvas.id = 'heroHudRing';
  const SIZE = 720;
  canvas.width  = SIZE;
  canvas.height = SIZE;
  canvas.style.cssText = `width:${SIZE}px;height:${SIZE}px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:0;`;
  wrap.style.overflow = 'visible';
  wrap.insertBefore(canvas, wrap.firstChild);
 
  const ctx = canvas.getContext('2d');
  const cx  = SIZE / 2;
  const cy  = SIZE / 2;
 
  const BASE = 160; // fixed base radius (half of 320px wrap)
 
  /* ── Palette ── */
  const GOLD  = [201,169,110];
  const GOLDL = [232,213,176];
  const GOLDX = [255,235,180];
  const CREAM = [255,245,220];
  const WHITE = [255,255,255];
  const CYAN  = [160,220,255];
  const GREEN = [79,255,176];
  const HOT   = [255,180,80];
 
  function rgba(col, a) {
    return `rgba(${col[0]},${col[1]},${col[2]},${+a.toFixed(3)})`;
  }
 
  let t = 0;
  let radarAngle = 0;
 
  /* ── Interaction state ── */
  let hoverActive = false;
  let hoverX = 0, hoverY = 0;
  let clickShock  = 0;
  let clickPulse  = 0;
  let mouseRingAngle = 0;
  let mouseRingDist  = 0;
 
  // Ripple rings spawned on click
  const RIPPLES = [];
 
  document.addEventListener('mousemove', e => {
    const r  = wrap.getBoundingClientRect();
    const hx = r.left + r.width  / 2;
    const hy = r.top  + r.height / 2;
    const dx = e.clientX - hx;
    const dy = e.clientY - hy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const maxD = r.width * 0.75;
    mouseRingAngle = Math.atan2(dy, dx);
    mouseRingDist  = Math.min(dist / maxD, 1);
    hoverX = dx / maxD;
    hoverY = dy / maxD;
    hoverActive = dist < r.width * 0.85;
  });
 
  wrap.addEventListener('click', e => {
    clickShock = 1.0;
    clickPulse = 3.5;
    // Spawn multiple expanding ripple rings
    for (let i = 0; i < 5; i++) {
      RIPPLES.push({
        r: BASE * 0.5,
        maxR: BASE * (2.2 + i * 0.28),
        alpha: 0.9 - i * 0.14,
        speed: 4.5 + i * 1.1,
        lw: 3 - i * 0.4,
        col: i % 2 === 0 ? GOLDX : GOLDL,
        delay: i * 4,
        tick: 0,
      });
    }
  });
 
  /* ── Plasma ring nodes ── */
  const PLASMA_NODES = Array.from({ length: 60 }, (_, i) => ({
    angle:    (i / 60) * Math.PI * 2,
    rBase:    1.0,
    rVar:     0.04 + Math.random() * 0.06,
    phase:    Math.random() * Math.PI * 2,
    phaseSpd: 0.8 + Math.random() * 1.6,
    colorT:   Math.random(),
  }));
 
  function drawPlasmaRing() {
    const boost = 1 + clickPulse * 0.5;
    ctx.save();
    ctx.translate(cx, cy);
    for (let pass = 0; pass < 3; pass++) {
      const passAlpha = [0.9,0.5,0.2][pass];
      const passBlur  = [30,55,80][pass];
      const passW     = [3.5,6,10][pass];
      ctx.shadowBlur  = passBlur * boost;
      ctx.shadowColor = `rgba(255,180,60,${passAlpha})`;
      ctx.beginPath();
      PLASMA_NODES.forEach((nd, i) => {
        const noise = nd.rVar * (
          Math.sin(t * nd.phaseSpd + nd.phase) * 0.6 +
          Math.sin(t * nd.phaseSpd * 1.618 + nd.phase * 0.7) * 0.3 +
          Math.sin(t * nd.phaseSpd * 2.414 + nd.phase * 1.3) * 0.1
        );
        const topBias = Math.max(0, -Math.cos(nd.angle)) * 0.05;
        const r = BASE * (nd.rBase + noise + topBias);
        const x = Math.cos(nd.angle) * r;
        const y = Math.sin(nd.angle) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = pass === 0
        ? `rgba(255,210,100,${passAlpha})`
        : `rgba(255,150,40,${passAlpha * 0.6})`;
      ctx.lineWidth = passW;
      ctx.stroke();
    }
    ctx.restore();
  }
 
  /* ── Micro-burst particles ── */
  const BURSTS = [];
  let burstTimer = 0;
 
  function spawnBurst() {
    const angle = Math.random() * Math.PI * 2;
    const r     = BASE * (0.9 + Math.random() * 1.1);
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    for (let i = 0; i < 4 + Math.floor(Math.random() * 6); i++) {
      const va  = angle + (Math.random() - 0.5) * 1.2;
      const spd = 0.4 + Math.random() * 1.1;
      BURSTS.push({
        x, y,
        vx: Math.cos(va) * spd, vy: Math.sin(va) * spd,
        life: 1.0, decay: 0.022 + Math.random() * 0.018,
        size: 1.2 + Math.random() * 2.2,
        col: [GOLDX, GOLDL, WHITE, HOT][Math.floor(Math.random() * 4)],
      });
    }
  }
 
  function updateBursts() {
    burstTimer++;
    if (burstTimer % Math.floor(80 + Math.random() * 120) === 0) spawnBurst();
    if (clickPulse > 0.5) { spawnBurst(); spawnBurst(); spawnBurst(); }
    ctx.save();
    for (let i = BURSTS.length - 1; i >= 0; i--) {
      const b = BURSTS[i];
      b.x += b.vx; b.y += b.vy;
      b.vx *= 0.96; b.vy *= 0.96;
      b.life -= b.decay;
      if (b.life <= 0) { BURSTS.splice(i, 1); continue; }
      ctx.shadowBlur  = 12;
      ctx.shadowColor = rgba(b.col, b.life * 0.8);
      ctx.fillStyle   = rgba(b.col, b.life);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size * b.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
 
  /* ── Click ripple rings ── */
  function updateRipples() {
    ctx.save();
    for (let i = RIPPLES.length - 1; i >= 0; i--) {
      const rp = RIPPLES[i];
      rp.tick++;
      if (rp.tick < rp.delay) continue;
      rp.r += rp.speed;
      const progress = (rp.r - BASE * 0.5) / (rp.maxR - BASE * 0.5);
      const alpha = rp.alpha * (1 - progress);
      if (rp.r >= rp.maxR || alpha <= 0) { RIPPLES.splice(i, 1); continue; }
      ctx.shadowBlur  = 30 * (1 - progress);
      ctx.shadowColor = rgba(rp.col, alpha);
      ctx.strokeStyle = rgba(rp.col, alpha);
      ctx.lineWidth = Math.max(0.3, rp.lw * (1 - progress * 0.7));
      ctx.beginPath();
      ctx.arc(cx, cy, rp.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
 
  function drawMouseLightArc() {
    if (!hoverActive) return;
    const r    = BASE * 1.16;
    const span = 0.8;
    const start = mouseRingAngle - span / 2;
    const end   = mouseRingAngle + span / 2;
    const intens = mouseRingDist;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.shadowBlur  = 50 * intens;
    ctx.shadowColor = `rgba(255,235,180,${0.9 * intens})`;
    ctx.strokeStyle = `rgba(255,245,200,${0.7 * intens})`;
    ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, r, start, end); ctx.stroke();
    ctx.shadowBlur  = 30 * intens;
    ctx.strokeStyle = `rgba(201,169,110,${0.35 * intens})`;
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(0, 0, BASE * 1.42, start * 0.9, end * 0.9); ctx.stroke();
    ctx.restore();
  }
 
  function drawEnergyPulse() {
    if (clickShock <= 0) return;
    const r = BASE * (1.0 + (1 - clickShock) * 1.5);
    ctx.save();
    ctx.shadowBlur  = 80 * clickShock;
    ctx.shadowColor = `rgba(255,220,100,${clickShock})`;
    ctx.strokeStyle = `rgba(255,235,180,${clickShock * 0.9})`;
    ctx.lineWidth = 3 * clickShock;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
 
  function getSpeedMult() {
    return (hoverActive ? 1.35 : 1.0) + clickPulse * 0.6;
  }
 
  /* ── Sparks ── */
  const SPARKS = Array.from({ length: 28 }, () => ({
    angle:  Math.random() * Math.PI * 2,
    r:      0.85 + Math.random() * 1.30,
    spd:    (Math.random() - 0.5) * 0.25,
    drift:  (Math.random() - 0.5) * 0.008,
    size:   0.8 + Math.random() * 2.2,
    phase:  Math.random() * Math.PI * 2,
    blinkF: 1.2 + Math.random() * 2.8,
    col:    [GOLDX, GOLDL, WHITE, CREAM][Math.floor(Math.random() * 4)],
  }));
 
  /* ── Lens flares ── */
  const FLARES = [
    { r:1.16, angleOffset:0.0,  speed:0.38,  size:18, col:GOLDX },
    { r:1.16, angleOffset:Math.PI, speed:0.38, size:14, col:GOLDL },
    { r:1.42, angleOffset:0.8,  speed:0.14,  size:22, col:GOLDX },
    { r:1.72, angleOffset:2.4,  speed:0.07,  size:16, col:WHITE  },
    { r:1.28, angleOffset:1.6,  speed:-0.22, size:12, col:GOLDL },
  ];
 
  /* ── Light rays ── */
  const RAYS = Array.from({ length: 8 }, (_, i) => ({
    angle: (i / 8) * Math.PI * 2,
    spd:   0.006 + i * 0.0008,
    len:   0.60 + Math.random() * 0.50,
    width: 0.5 + Math.random() * 1.2,
    phase: (i / 8) * Math.PI * 2,
  }));
 
  /* ── Ambient pools ── */
  const POOLS = [
    { r:1.16, angle:0.0, spd:0.38,  size:0.18, col:GOLDX, a:0.18 },
    { r:1.42, angle:2.0, spd:0.14,  size:0.22, col:GOLDL, a:0.14 },
    { r:1.72, angle:4.2, spd:0.07,  size:0.26, col:GOLD,  a:0.10 },
    { r:1.28, angle:1.1, spd:-0.22, size:0.16, col:WHITE, a:0.12 },
  ];
 
  /* ── Ring layers ── */
  const RINGS = [
    { r:1.00, spd:0,      lw:2.5, dash:[],       col:GOLD,  a:1.0,  gl:28 },
    { r:1.07, spd:0.55,   lw:1.0, dash:[4,6],    col:GOLDL, a:0.55, gl:6  },
    { r:1.16, spd:0.38,   lw:1.5, dash:[],       col:WHITE, a:0.65, gl:10 },
    { r:1.28, spd:-0.22,  lw:0.8, dash:[18,7],   col:GOLD,  a:0.50, gl:12 },
    { r:1.42, spd:0.14,   lw:2.0, dash:[22,5],   col:GOLDL, a:0.60, gl:14 },
    { r:1.57, spd:-0.10,  lw:0.7, dash:[2,9],    col:WHITE, a:0.28, gl:4  },
    { r:1.72, spd:0.07,   lw:1.2, dash:[55,16],  col:GOLD,  a:0.38, gl:8  },
    { r:1.90, spd:-0.04,  lw:0.5, dash:[8,22],   col:CREAM, a:0.18, gl:2  },
    { r:2.10, spd:0.025,  lw:0.4, dash:[120,35], col:GOLD,  a:0.10, gl:0  },
  ];
 
  /* ── Arcs ── */
  const ARCS = [
    { r:1.16, spd:0.38,  span:0.65, lw:4.0, col:GOLDX },
    { r:1.28, spd:-0.22, span:1.10, lw:2.5, col:WHITE  },
    { r:1.42, spd:0.14,  span:0.45, lw:5.0, col:GOLDL  },
    { r:1.72, spd:0.07,  span:0.75, lw:2.0, col:GOLD   },
  ];
 
  /* ── Ticks ── */
  const TICKS = [
    { r:1.16, n:72, len:6,  sub:3, col:GOLD,  a:0.85, spd:0.38 },
    { r:1.42, n:48, len:9,  sub:3, col:WHITE, a:0.55, spd:0.14 },
    { r:1.72, n:24, len:14, sub:4, col:GOLD,  a:0.45, spd:0.07 },
  ];
 
  /* ── Orbiting dots ── */
  const ORBS = [
    { r:1.16, spd:0.38,  size:4.5, col:GOLDX },
    { r:1.28, spd:-0.22, size:3.5, col:WHITE  },
    { r:1.42, spd:0.14,  size:3.8, col:GOLDL  },
    { r:1.57, spd:-0.10, size:2.2, col:WHITE  },
    { r:1.72, spd:0.07,  size:2.8, col:GOLD   },
    { r:1.90, spd:-0.04, size:1.5, col:CREAM  },
  ];
 
  const CARDINALS = [
    0, Math.PI/4, Math.PI/2, Math.PI*0.75,
    Math.PI, Math.PI*1.25, Math.PI*1.5, Math.PI*1.75,
    Math.PI/8, Math.PI*0.375, Math.PI*0.625, Math.PI*0.875,
    Math.PI*1.125, Math.PI*1.375, Math.PI*1.625, Math.PI*1.875,
  ];
 
  const DATA_SEGS = [];
  (function () {
    for (let i = 0; i < 32; i++) {
      DATA_SEGS.push({ idx:i, total:32, lit:Math.random()>0.38, blink:Math.random()>0.75, phase:Math.random()*Math.PI*2 });
    }
  })();
 
  const INNER_RINGS = [
    { r:0.72, lw:0.6, col:GOLD,  a:0.30 },
    { r:0.84, lw:0.8, col:GOLDL, a:0.22 },
    { r:0.94, lw:0.5, col:WHITE, a:0.15 },
  ];
 
  const LABELS = [
    { angle:-0.55, r:1.72, text:'v3.1.4', phase:0   },
    { angle:0.80,  r:1.72, text:'SYNC',   phase:1.8 },
    { angle:2.20,  r:1.90, text:'100%',   phase:3.4 },
    { angle:-2.00, r:1.57, text:'NODE',   phase:5.0 },
  ];
 
  /* ── Draw functions ── */
  function drawRing(cfg, rot) {
    const r  = BASE * cfg.r;
    const sm = getSpeedMult();
    const gBoost = hoverActive ? 1.4 : 1.0;
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(rot * sm);
    ctx.shadowBlur = cfg.gl * gBoost + clickPulse * 8;
    ctx.shadowColor = rgba(cfg.col, 0.9);
    ctx.strokeStyle = rgba(cfg.col, Math.min(1, cfg.a * (hoverActive ? 1.2 : 1)));
    ctx.lineWidth = cfg.lw; ctx.setLineDash(cfg.dash);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }
 
  function drawArc(cfg, rot) {
    const r = BASE * cfg.r; const sm = getSpeedMult();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot * sm);
    ctx.shadowBlur = 32 + clickPulse * 20; ctx.shadowColor = rgba(cfg.col, 1);
    ctx.strokeStyle = rgba(cfg.col, 0.95); ctx.lineWidth = cfg.lw * (hoverActive ? 1.3 : 1.0);
    ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, r, 0, cfg.span); ctx.stroke();
    ctx.restore();
  }
 
  function drawTicks(cfg, rot) {
    const r = BASE * cfg.r; const sm = getSpeedMult();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot * sm);
    ctx.shadowBlur = 6; ctx.shadowColor = rgba(cfg.col, 0.7);
    for (let i = 0; i < cfg.n; i++) {
      const angle = (i / cfg.n) * Math.PI * 2;
      const cos = Math.cos(angle); const sin = Math.sin(angle);
      const major = (i % cfg.sub === 0);
      const superM = (i % (cfg.sub * 4) === 0);
      let outerLen = major ? cfg.len : cfg.len * 0.38;
      if (superM) outerLen = cfg.len * 1.7;
      const outer = r + outerLen; const inner = r - cfg.len * 0.3;
      ctx.strokeStyle = rgba(cfg.col, superM ? cfg.a * 1.1 : major ? cfg.a : cfg.a * 0.35);
      ctx.lineWidth   = superM ? 2.0 : major ? 1.5 : 0.7;
      ctx.beginPath(); ctx.moveTo(cos*inner, sin*inner); ctx.lineTo(cos*outer, sin*outer); ctx.stroke();
    }
    ctx.restore();
  }
 
  function drawOrb(cfg) {
    const sm = getSpeedMult();
    const angle = t * cfg.spd * sm;
    const ox = cx + Math.cos(angle) * BASE * cfg.r;
    const oy = cy + Math.sin(angle) * BASE * cfg.r;
    const sizeBoost = hoverActive ? 1.3 : 1.0;
    const TRAIL = 8;
    for (let i = TRAIL; i >= 1; i--) {
      const ta = angle - i * 0.04 * Math.sign(cfg.spd);
      const tx = cx + Math.cos(ta) * BASE * cfg.r;
      const ty = cy + Math.sin(ta) * BASE * cfg.r;
      const a  = Math.max(0, 0.4 - i * 0.05);
      ctx.fillStyle = rgba(cfg.col, a);
      ctx.beginPath(); ctx.arc(tx, ty, Math.max(0.5, cfg.size * sizeBoost * (1 - i * 0.12)), 0, Math.PI * 2); ctx.fill();
    }
    ctx.save();
    ctx.shadowBlur = 22 + clickPulse * 12; ctx.shadowColor = rgba(cfg.col, 1);
    ctx.fillStyle = rgba(cfg.col, 1);
    ctx.beginPath(); ctx.arc(ox, oy, cfg.size * sizeBoost, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
 
  function drawCardinals(rot) {
    const sm = getSpeedMult();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot * sm * 0.4);
    CARDINALS.forEach((a, idx) => {
      const rDist = idx % 2 === 0 ? BASE * 1.42 : BASE * 1.16;
      const sz = idx % 4 === 0 ? 5 : 3;
      const alpha = idx % 4 === 0 ? 0.45 : 0.22;
      const px = Math.cos(a) * rDist;
      const py = Math.sin(a) * rDist;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(a + Math.PI / 4);
      ctx.shadowBlur  = 8 + clickPulse * 6;
      ctx.shadowColor = rgba(GOLDX, alpha);
      ctx.strokeStyle = rgba(GOLDX, alpha);
      ctx.fillStyle   = rgba(GOLD,  alpha * 0.3);
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(0, -sz); ctx.lineTo(sz, 0); ctx.lineTo(0, sz); ctx.lineTo(-sz, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }
 
  function drawDataSegments() {
    const r = BASE * 1.90; const gap = 0.025;
    const seg = (Math.PI * 2 / DATA_SEGS.length);
    const sm = getSpeedMult();
    ctx.save(); ctx.translate(cx, cy);
    DATA_SEGS.forEach((s, i) => {
      const startA = i * seg + gap/2 + t * 0.018 * sm;
      const endA   = startA + seg - gap;
      let a = s.lit
        ? (s.blink ? 0.25 + 0.25*Math.sin(t*2.2+s.phase) : 0.45+0.15*Math.sin(t*0.8+s.phase))
        : 0.06;
      if (hoverActive && s.lit) a = Math.min(1, a * 1.4);
      ctx.strokeStyle = rgba(s.lit ? GOLDL : GOLD, a);
      ctx.lineWidth = 4; ctx.lineCap = 'butt';
      ctx.shadowBlur = s.lit ? (10 + clickPulse * 8) : 0;
      ctx.shadowColor = rgba(GOLDL, 0.8);
      ctx.beginPath(); ctx.arc(0, 0, r, startA, endA); ctx.stroke();
    });
    ctx.restore();
  }
 
  function drawRadar() {
    const r = BASE * 1.00; const sm = getSpeedMult();
    ctx.save(); ctx.translate(cx, cy);
    const rA = radarAngle * sm; const sweep = Math.PI * 0.55; const steps = 40;
    for (let i = 0; i < steps; i++) {
      const frac = i / steps;
      const angle = rA - sweep * (1 - frac);
      const alpha = frac * (hoverActive ? 0.26 : 0.18);
      ctx.strokeStyle = rgba(GOLDL, alpha);
      ctx.lineWidth = r * (sweep / steps) * 1.2;
      ctx.beginPath(); ctx.arc(0, 0, r * 0.5, angle, angle + sweep / steps * 1.5); ctx.stroke();
    }
    ctx.shadowBlur = 20 + clickPulse * 15; ctx.shadowColor = rgba(GOLDX, 0.9);
    ctx.strokeStyle = rgba(GOLDX, 0.8); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(rA)*r, Math.sin(rA)*r); ctx.stroke();
    ctx.restore();
  }
 
  function drawInnerRings() {
    INNER_RINGS.forEach(cfg => {
      ctx.save();
      ctx.shadowBlur = 6; ctx.shadowColor = rgba(cfg.col, 0.5);
      ctx.strokeStyle = rgba(cfg.col, cfg.a * (hoverActive ? 1.3 : 1));
      ctx.lineWidth = cfg.lw;
      ctx.beginPath(); ctx.arc(cx, cy, BASE * cfg.r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });
  }
 
  function drawGlowCore() {
    const pulse = 0.06 + 0.03 * Math.sin(t * 2.4) + (hoverActive ? 0.04 : 0);
    const g = ctx.createRadialGradient(cx,cy,BASE*0.82,cx,cy,BASE*1.25);
    g.addColorStop(0, rgba(GOLD, 0));
    g.addColorStop(0.5, rgba(GOLD, pulse));
    g.addColorStop(1, rgba(GOLD, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, BASE*1.25, 0, Math.PI*2); ctx.fill();
  }
 
  function drawGrid() {
    const gs = 26;
    ctx.strokeStyle = rgba(GOLD, 0.038); ctx.lineWidth = 0.5;
    for (let x = 0; x < SIZE; x += gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,SIZE); ctx.stroke(); }
    for (let y = 0; y < SIZE; y += gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(SIZE,y); ctx.stroke(); }
  }
 
  function drawCrosshair() {
    const r = BASE * 2.1;
    ctx.save(); ctx.strokeStyle = rgba(GOLD, 0.055); ctx.lineWidth = 0.5; ctx.setLineDash([4,10]);
    ctx.beginPath(); ctx.moveTo(cx-r,cy); ctx.lineTo(cx+r,cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,cy-r); ctx.lineTo(cx,cy+r); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }
 
  function drawHudArcs() {
    const defs = [
      { r:0.78, startFrac:0.05, endFrac:0.40, col:GOLD,  lw:3, spd:0.12  },
      { r:0.78, startFrac:0.55, endFrac:0.85, col:GOLDL, lw:2, spd:0.12  },
      { r:0.88, startFrac:0.10, endFrac:0.65, col:WHITE, lw:2, spd:-0.09 },
    ];
    const sm = getSpeedMult();
    ctx.save(); ctx.translate(cx, cy);
    defs.forEach(d => {
      const r = BASE * d.r; const off = t * d.spd * sm;
      const start = d.startFrac * Math.PI * 2 + off;
      const end   = d.endFrac   * Math.PI * 2 + off;
      ctx.shadowBlur = 14 + clickPulse*8; ctx.shadowColor = rgba(d.col, 0.9);
      ctx.strokeStyle = rgba(d.col, 0.7); ctx.lineWidth = d.lw; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, r, start, end); ctx.stroke();
    });
    ctx.restore();
  }
 
  function drawSparks() {
    ctx.save();
    SPARKS.forEach(s => {
      const sm = getSpeedMult();
      s.angle += s.spd * 0.007 * sm + s.drift;
      const px = cx + Math.cos(s.angle) * BASE * s.r;
      const py = cy + Math.sin(s.angle) * BASE * s.r;
      const pulse = 0.45 + 0.55 * Math.abs(Math.sin(t * s.blinkF + s.phase));
      const a = pulse * (hoverActive ? 1.0 : 0.85);
      const g = ctx.createRadialGradient(px,py,0,px,py,s.size*4.5);
      g.addColorStop(0, rgba(s.col, a * 0.55));
      g.addColorStop(0.4, rgba(s.col, a * 0.18));
      g.addColorStop(1, rgba(s.col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px,py,s.size*4.5,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur = 14; ctx.shadowColor = rgba(s.col, 1);
      ctx.fillStyle = rgba(WHITE, a); ctx.beginPath(); ctx.arc(px,py,s.size*0.55,0,Math.PI*2); ctx.fill();
    });
    ctx.restore();
  }
 
  function drawFlares() {
    ctx.save();
    const sm = getSpeedMult();
    FLARES.forEach(f => {
      const angle = t * f.speed * sm + f.angleOffset;
      const px = cx + Math.cos(angle) * BASE * f.r;
      const py = cy + Math.sin(angle) * BASE * f.r;
      const s  = f.size * (hoverActive ? 1.2 : 1.0);
      const g = ctx.createRadialGradient(px, py, 0, px, py, s * 2.5);
      g.addColorStop(0, rgba(f.col, 0.18));
      g.addColorStop(0.5, rgba(f.col, 0.07));
      g.addColorStop(1, rgba(f.col, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(px, py, s * 2.5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }
 
  function drawRays() {
    ctx.save(); ctx.translate(cx, cy);
    RAYS.forEach(ray => {
      const angle = ray.angle + t * ray.spd;
      const pulse = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.55 + ray.phase));
      const endR  = BASE * ray.len * (hoverActive ? 1.15 : 1.0);
      const gx = Math.cos(angle); const gy = Math.sin(angle);
      const g = ctx.createLinearGradient(0,0,gx*endR,gy*endR);
      g.addColorStop(0, rgba(GOLDL, 0.22*pulse));
      g.addColorStop(0.35, rgba(GOLD, 0.10*pulse));
      g.addColorStop(1, rgba(GOLD, 0));
      ctx.strokeStyle = g; ctx.lineWidth = ray.width; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(gx*endR,gy*endR); ctx.stroke();
    });
    ctx.restore();
  }
 
  function drawAmbientPools() {
    ctx.save();
    const sm = getSpeedMult();
    POOLS.forEach(p => {
      const angle = t * p.spd * sm + p.angle;
      const r = BASE * p.r;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      const radius = BASE * p.size;
      const pulse = p.a * (0.6 + 0.4 * Math.sin(t * 1.4 + p.angle));
      const g = ctx.createRadialGradient(px,py,0,px,py,radius);
      g.addColorStop(0, rgba(p.col, pulse));
      g.addColorStop(0.5, rgba(p.col, pulse*0.35));
      g.addColorStop(1, rgba(p.col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px,py,radius,0,Math.PI*2); ctx.fill();
    });
    ctx.restore();
  }
 
  function drawCenterBurst() {
    const pulse  = 0.04 + 0.025*Math.sin(t*1.8) + (hoverActive ? 0.03 : 0);
    const pulse2 = 0.08 + 0.04*Math.sin(t*0.9+1.2);
    const g1 = ctx.createRadialGradient(cx,cy,0,cx,cy,BASE*1.10);
    g1.addColorStop(0, rgba(GOLD, pulse2));
    g1.addColorStop(0.5, rgba(GOLD, pulse));
    g1.addColorStop(1, rgba(GOLD, 0));
    ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(cx,cy,BASE*1.10,0,Math.PI*2); ctx.fill();
    const g2 = ctx.createRadialGradient(cx,cy,0,cx,cy,BASE*0.30);
    g2.addColorStop(0, rgba(GOLDX, 0.20+0.10*Math.sin(t*3)+clickPulse*0.25));
    g2.addColorStop(1, rgba(GOLDX, 0));
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(cx,cy,BASE*0.30,0,Math.PI*2); ctx.fill();
  }
 
  function drawLabels() {
    ctx.save();
    LABELS.forEach(lb => {
      const a = lb.angle + t * 0.02;
      const r = BASE * lb.r;
      const lx = cx + Math.cos(a) * r;
      const ly = cy + Math.sin(a) * r;
      const alpha = 0.35 + 0.2 * Math.sin(t * 1.1 + lb.phase);
      ctx.font = '500 9px "Share Tech Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowBlur = 8; ctx.shadowColor = rgba(GOLD, 0.7);
      ctx.fillStyle = rgba(GOLDL, alpha);
      ctx.fillText(lb.text, lx, ly);
    });
    ctx.restore();
  }
 
  function decayClick() {
    if (clickShock > 0) clickShock = Math.max(0, clickShock - 0.018);
    if (clickPulse > 0) clickPulse = Math.max(0, clickPulse - 0.045);
  }
 
  /* ── Main loop ── */
  let raf;
  function frame() {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    t += 0.007;
    radarAngle = (radarAngle + 0.018) % (Math.PI * 2);
    decayClick();
 
    drawGrid();
    drawCrosshair();
    drawRays();
    drawGlowCore();
    drawCenterBurst();
    drawAmbientPools();
    drawInnerRings();
    drawHudArcs();
    drawRadar();
    drawPlasmaRing();
    RINGS.forEach(r  => drawRing(r,  t * r.spd));
    ARCS.forEach(a   => drawArc(a,   t * a.spd));
    TICKS.forEach(tk => drawTicks(tk, t * tk.spd));
    drawCardinals(t * 0.14);
    drawDataSegments();
    drawAmbientPools();
    drawSparks();
    drawFlares();
    drawMouseLightArc();
    drawLabels();
    drawEnergyPulse();
    updateBursts();
    updateRipples();
    ORBS.forEach(o => drawOrb(o));
  }
 
  frame();
})();











/* ════════════════════════════════════════════════════
   LOCK SCREEN — PREMIUM v2
════════════════════════════════════════════════════ */
(function () {
    const screen = document.getElementById('lockScreen');
    const track  = document.getElementById('lockTrack');
    const thumb  = document.getElementById('lockThumb');
    const fill   = document.getElementById('lockFill');
    const label  = document.getElementById('lockLabel');
    const roleEl = document.getElementById('lockRoleType');
    if (!screen || !thumb) return;


    /* ── Particle canvas — enhanced ── */
const canvas = document.getElementById('lockCanvas');
const ctx    = canvas && canvas.getContext('2d');
let particles = [], shootingStars = [], animId;

function resizeCanvas() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}

function spawnParticles() {
    particles = [];
    shootingStars = [];
    const n = Math.min(90, Math.floor(window.innerWidth / 10));
    const COLORS = [
        [201,169,110],[201,169,110],[201,169,110],
        [232,200,140],[90,155,110],[255,255,240],
    ];
    for (let i = 0; i < n; i++) {
        const col = COLORS[Math.floor(Math.random() * COLORS.length)];
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.8 + 0.2,
            dx: (Math.random() - 0.5) * 0.32,
            dy: (Math.random() - 0.5) * 0.32,
            o: Math.random() * 0.55 + 0.1,
            pulse: Math.random() * Math.PI * 2,
            col,
        });
    }
}



function spawnShootingStar() {
    if (shootingStars.length >= 3) return;
    shootingStars.push({
        x: Math.random() * canvas.width * 0.65,
        y: Math.random() * canvas.height * 0.45,
        len: Math.random() * 130 + 60,
        speed: Math.random() * 9 + 6,
        opacity: 1,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.35,
        width: Math.random() * 1.4 + 0.4,
    });
}

function drawParticles() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);



    
    /* Particles */
    particles.forEach(p => {
        p.x += p.dx; p.y += p.dy; p.pulse += 0.018;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width)  p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        const alpha = p.o * (0.5 + 0.5 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.col.join(',')},${alpha})`;
        ctx.fill();
    });

    /* Connection lines */
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 95) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(201,169,110,${0.08 * (1 - dist/95)})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }

    /* Shooting stars */
    if (Math.random() < 0.004) spawnShootingStar();
    shootingStars = shootingStars.filter(s => s.opacity > 0.02);
    shootingStars.forEach(s => {
        const tx = s.x + Math.cos(s.angle) * s.len;
        const ty = s.y + Math.sin(s.angle) * s.len;
        const sg = ctx.createLinearGradient(s.x, s.y, tx, ty);
        sg.addColorStop(0,   `rgba(255,255,255,0)`);
        sg.addColorStop(0.3, `rgba(201,169,110,${s.opacity * 0.55})`);
        sg.addColorStop(1,   `rgba(255,255,255,${s.opacity})`);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = sg;
        ctx.lineWidth = s.width;
        ctx.stroke();
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.opacity -= 0.016;
    });

    animId = requestAnimationFrame(drawParticles);
}


resizeCanvas(); spawnParticles(); drawParticles();
    window.addEventListener('resize', () => { resizeCanvas(); spawnParticles(); });

    // ← PASTE HERE ↓

    /* ── Avatar canvas particle ring ── */
    (function () {
        const avatarWrap = document.querySelector('.lock-avatar-wrap');
        if (!avatarWrap) return;

        const ac = document.createElement('canvas');
        Object.assign(ac.style, {
            position: 'absolute',
            inset: '-80px',
            width: 'calc(100% + 160px)',
            height: 'calc(100% + 160px)',
            pointerEvents: 'none',
            zIndex: '0',
            borderRadius: '50%',
        });
        avatarWrap.prepend(ac);

        const actx = ac.getContext('2d');
        let AW, AH, apts = [], araf;

        function resizeAv() {
            const r = avatarWrap.getBoundingClientRect();
            AW = ac.width  = r.width  + 160;
            AH = ac.height = r.height + 160;
        }

        function spawnAv() {
            apts = [];
            for (let i = 0; i < 38; i++) {
                apts.push({
                    x:  Math.random() * AW,
                    y:  Math.random() * AH,
                    r:  Math.random() * 1.6 + 0.3,
                    dx: (Math.random() - 0.5) * 0.45,
                    dy: (Math.random() - 0.5) * 0.45,
                    o:  Math.random() * 0.55 + 0.1,
                    ph: Math.random() * Math.PI * 2,
                    col: Math.random() > 0.7
                        ? [90,155,110]
                        : [201,169,110],
                });
            }
        }

        function drawAv() {
            araf = requestAnimationFrame(drawAv);
            if (document.hidden) return;
            actx.clearRect(0, 0, AW, AH);

            const cx = AW / 2, cy = AH / 2;
            const t  = Date.now() / 7000;

            /* Particles */
            apts.forEach(p => {
                p.x += p.dx; p.y += p.dy; p.ph += 0.018;
                if (p.x < 0) p.x = AW; if (p.x > AW) p.x = 0;
                if (p.y < 0) p.y = AH; if (p.y > AH) p.y = 0;
                const alpha = p.o * (0.5 + 0.5 * Math.sin(p.ph));
                actx.beginPath();
                actx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                actx.fillStyle = `rgba(${p.col.join(',')},${alpha})`;
                actx.fill();
            });

            /* Connection lines */
            for (let i = 0; i < apts.length; i++) {
                for (let j = i + 1; j < apts.length; j++) {
                    const dx = apts[i].x - apts[j].x;
                    const dy = apts[i].y - apts[j].y;
                    const d  = Math.sqrt(dx * dx + dy * dy);
                    if (d < 85) {
                        actx.beginPath();
                        actx.moveTo(apts[i].x, apts[i].y);
                        actx.lineTo(apts[j].x, apts[j].y);
                        actx.strokeStyle = `rgba(201,169,110,${0.09 * (1 - d / 85)})`;
                        actx.lineWidth = 0.5;
                        actx.stroke();
                    }
                }
            }

            /* Shooting stars */
            if (Math.random() < 0.008 && !window._avStars) {
                window._avStars = window._avStars || [];
            }
        }

        resizeAv(); spawnAv(); drawAv();
        window.addEventListener('resize', () => { resizeAv(); spawnAv(); });
    })();

    // ← END OF PASTE ↑

    /* ── Role typing ── */
    const roles = ['Full Stack Developer', 'React · Node.js · WebRTC', 'Real-Time App Builder'];
    let ri = 0, ci = 0, deleting = false;

    function typeRole() {
        if (!roleEl) return;
        const cur = roles[ri];
        if (!deleting) {
            ci++;
            roleEl.innerHTML = cur.slice(0, ci) + '<span class="lock-role-cursor"></span>';
            if (ci === cur.length) { deleting = true; setTimeout(typeRole, 2200); return; }
            setTimeout(typeRole, 65);
        } else {
            ci--;
            roleEl.innerHTML = cur.slice(0, ci) + '<span class="lock-role-cursor"></span>';
            if (ci === 0) { deleting = false; ri = (ri + 1) % roles.length; setTimeout(typeRole, 350); return; }
            setTimeout(typeRole, 38);
        }
    }
    setTimeout(typeRole, 600);

    /* ── Swipe logic ── */
    const THRESHOLD = 0.80;
    let dragging = false, startX = 0, curX = 0;

    function maxX() { return track.clientWidth - thumb.clientWidth - 14; }

    function setX(x) {
        x = Math.max(0, Math.min(x, maxX()));
        curX = x;
        thumb.style.left = (7 + x) + 'px';
        const pct = x / maxX();
        fill.style.width = (pct * 100) + '%';
        label.style.opacity = Math.max(0, 1 - pct * 2.5);
    }

 // ── Lock body scroll while lock screen is visible ──
document.body.style.overflow = 'hidden';

function unlock() {
    const ripple = document.createElement('div');
    ripple.className = 'lock-ripple';
    track.appendChild(ripple);
    screen.classList.add('lock-flash');
    cancelAnimationFrame(animId);
    setTimeout(() => { screen.classList.add('lock-unlocked'); }, 380);
    setTimeout(() => {
        screen.style.display = 'none';
        document.body.style.overflow = ''; // ── Restore scrolling ──
    }, 1100);
}

    function snapBack() {
        thumb.style.transition = 'left 0.45s cubic-bezier(0.34,1.2,0.64,1)';
        fill.style.transition   = 'width 0.45s cubic-bezier(0.34,1.2,0.64,1)';
        setX(0);
        setTimeout(() => { thumb.style.transition = ''; fill.style.transition = ''; }, 460);
    }

    function onEnd() {
        if (!dragging) return;
        dragging = false;
        thumb.classList.remove('dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup',   onEnd);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend',  onEnd);
        curX / maxX() >= THRESHOLD ? unlock() : snapBack();
    }

    function onMove(e) { if (dragging) setX(e.clientX - startX); }
    function onTouchMove(e) { if (dragging) setX(e.touches[0].clientX - startX); }

    thumb.addEventListener('mousedown', e => {
        e.preventDefault();
        dragging = true;
        thumb.classList.add('dragging');
        thumb.style.transition = '';
        startX = e.clientX - curX;
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onEnd);
    });

    thumb.addEventListener('touchstart', e => {
        dragging = true;
        thumb.classList.add('dragging');
        thumb.style.transition = '';
        startX = e.touches[0].clientX - curX;
        document.addEventListener('touchmove', onTouchMove, { passive: true });
        document.addEventListener('touchend',  onEnd);
    }, { passive: true });
})();


/* ── Hero Comets — same as lock screen ── */
(function () {
    const hero = document.getElementById('hero');
    if (!hero) return;

    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
        position:      'absolute',
        inset:         '0',
        width:         '100%',
        height:        '100%',
        pointerEvents: 'none',
        zIndex:        '0',
    });

    const parallax = hero.querySelector('.hero-parallax-bg');
    if (parallax) parallax.appendChild(canvas);
    else hero.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let W, H, stars = [], raf;

    function resize() {
        const r = hero.getBoundingClientRect();
        W = canvas.width  = r.width;
        H = canvas.height = r.height;
    }
    resize();
    window.addEventListener('resize', resize);

    function spawnStar() {
        if (stars.length >= 6) return;
        stars.push({
            x:       Math.random() * W * 0.65,
            y:       Math.random() * H * 0.45,
            len:     Math.random() * 130 + 60,
            speed:   Math.random() * 9 + 6,
            opacity: 1,
            angle:   Math.PI / 4 + (Math.random() - 0.5) * 0.35,
            width:   Math.random() * 1.4 + 0.4,
        });
    }

    let last = performance.now();

    function draw(now) {
        raf = requestAnimationFrame(draw);
        ctx.clearRect(0, 0, W, H);

        /* spawn */
        if (Math.random() < 0.025) spawnStar();

        /* filter dead */
        stars = stars.filter(s => s.opacity > 0.02);

        stars.forEach(s => {
            const tx = s.x + Math.cos(s.angle) * s.len;
            const ty = s.y + Math.sin(s.angle) * s.len;

            const sg = ctx.createLinearGradient(s.x, s.y, tx, ty);
            sg.addColorStop(0,   `rgba(255,255,255,0)`);
            sg.addColorStop(0.3, `rgba(201,169,110,${s.opacity * 0.55})`);
            sg.addColorStop(1,   `rgba(255,255,255,${s.opacity})`);

            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(tx, ty);
            ctx.strokeStyle = sg;
            ctx.lineWidth   = s.width;
            ctx.lineCap     = 'round';
            ctx.stroke();

            s.x       += Math.cos(s.angle) * s.speed;
            s.y       += Math.sin(s.angle) * s.speed;
            s.opacity -= 0.016;
        });
    }

    raf = requestAnimationFrame(draw);

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) cancelAnimationFrame(raf);
        else { last = performance.now(); raf = requestAnimationFrame(draw); }
    });
})();


// flip rofile img


/* ── Hero Avatar Flip + Hand Hint ── */
/* ══════════════════════════════════════════════════
   HERO HAND HINT — ADVANCED ENGINE
══════════════════════════════════════════════════ */
(function () {
  const outer    = document.querySelector('.hero-img-outer');
  const hint     = document.getElementById('heroHandHint');
  const icon     = document.getElementById('heroHandIcon');
  const glow     = document.getElementById('heroHandGlow');
  const ring1    = document.getElementById('heroHandRing1');
  const ring2    = document.getElementById('heroHandRing2');
  const ring3    = document.getElementById('heroHandRing3');
  const canvas   = document.getElementById('heroHandParticles');
  const ctx2d    = canvas ? canvas.getContext('2d') : null;

  if (!outer || !hint) return;

  let pressing    = false;
  let heroClicked = false;
  let timers      = [];
  let particles   = [];
  let rafId       = null;

  /* ── Timer helper ── */
  function after(ms, fn) {
    if (heroClicked) return;
    const id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }
  function clearAll() {
    timers.forEach(clearTimeout);
    timers = [];
    cancelAnimationFrame(rafId);
  }

  /* ── Class helpers ── */
  function refire(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  /* ══════════════════════════════════════════
     PARTICLE SYSTEM
  ══════════════════════════════════════════ */
  function spawnParticles() {
    if (!ctx2d) return;
    const cx = 60, cy = 60;
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.4;
      const speed = 1.8 + Math.random() * 2.8;
      const size  = 1.5 + Math.random() * 2.5;
      const life  = 0.6 + Math.random() * 0.4;
      const gold  = Math.random() > 0.4;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size, life, maxLife: life,
        color: gold ? 'rgba(201,169,110,' : 'rgba(255,240,200,',
        gravity: 0.08 + Math.random() * 0.06,
        decay:   0.015 + Math.random() * 0.01,
      });
    }
    if (!rafId) animateParticles();
  }

  function animateParticles() {
    if (!ctx2d) return;
    ctx2d.clearRect(0, 0, 120, 120);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.96;
      p.life -= p.decay;
      const alpha = Math.max(0, p.life / p.maxLife);
      const r     = p.size * alpha;
      ctx2d.beginPath();
      ctx2d.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx2d.fillStyle = p.color + alpha.toFixed(2) + ')';
      ctx2d.fill();
    });
    if (particles.length > 0) {
      rafId = requestAnimationFrame(animateParticles);
    } else {
      rafId = null;
      ctx2d.clearRect(0, 0, 120, 120);
    }
  }

  /* ══════════════════════════════════════════
     CLICK GESTURE
  ══════════════════════════════════════════ */
  function doClick(onDone) {
    if (heroClicked) return;

    /* Icon presses down */
    icon.classList.remove('idle');
    refire(icon, 'pressing');

    /* Glow burst */
    glow.classList.remove('active', 'burst');
    void glow.offsetWidth;
    glow.classList.add('burst');

    /* Triple rings */
    [ring1, ring2, ring3].forEach(r => {
      r.className = r.className.replace(/fire-\d/g, '').trim();
      void r.offsetWidth;
    });
    ring1.classList.add('fire-1');
    ring2.classList.add('fire-2');
    ring3.classList.add('fire-3');

    /* Particles */
    spawnParticles();

    /* Restore idle */
    after(520, () => {
      if (heroClicked) return;
      icon.classList.remove('pressing');
      icon.classList.add('idle');
      glow.classList.remove('burst');
      glow.classList.add('active');
      if (onDone) after(80, onDone);
    });
  }

  /* ══════════════════════════════════════════
     MAIN CYCLE
  ══════════════════════════════════════════ */
function runCycle() {
    if (heroClicked) return;

    /* Phase 1 — Float UP */
    hint.classList.remove('state-down');
    void hint.offsetWidth;
    hint.classList.add('state-up');
    glow.classList.remove('active', 'burst');

    after(1100, () => {
      if (heroClicked) return;

      /* Phase 2 — Idle hover */
      icon.classList.add('idle');
      glow.classList.add('active');

      after(500, () => {

        /* Phase 3 — Click 1 */
        doClick(() => {
          after(600, () => {

            /* Phase 4 — Click 2 */
            doClick(() => {
              after(450, () => {
                if (heroClicked) return;

                /* Phase 5 — Float DOWN */
                icon.classList.remove('idle', 'pressing');
                glow.classList.remove('active', 'burst');
                hint.classList.remove('state-up');
                void hint.offsetWidth;
                hint.classList.add('state-down');

                /* Phase 6 — Pause then repeat */
                after(1000, runCycle);
              });
            });
          });
        });
      });
    });
  }

  /* ── Start after page settles ── */
  setTimeout(runCycle, 2200);

  /* ══════════════════════════════════════════
     FLIP HANDLERS
  ══════════════════════════════════════════ */
  function onDown() {
    pressing = true;
    outer.classList.remove('bounce', 'flash');
  }

  function onUp() {
    if (!pressing) return;
    pressing = false;

    function refireEl(el, cls) {
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    }

    refireEl(outer, 'bounce');
    setTimeout(() => refireEl(outer, 'flash'), 30);

    setTimeout(() => {
      outer.classList.toggle('flipped');

      if (!heroClicked && hint) {
        heroClicked = true;
        clearAll();
        icon.classList.remove('idle', 'pressing');
        glow.classList.remove('active', 'burst');
        hint.classList.add('done');
      }
    }, 90);
  }

  outer.addEventListener('pointerdown',  onDown);
  outer.addEventListener('pointerup',    onUp);
  outer.addEventListener('pointerleave', () => { if (pressing) onUp(); });
  outer.addEventListener('touchstart',   e => { e.preventDefault(); onDown(); }, { passive: false });
  outer.addEventListener('touchend',     e => { e.preventDefault(); onUp();   }, { passive: false });
})();

function flipAvatar() {
    const card = document.getElementById('lockAvatarCard');
    if (card) card.classList.toggle('flipped');
}



/* ════════════════════════════════════════════════════
       ALL JS UNCHANGED FROM ORIGINAL
    ════════════════════════════════════════════════════ */
    'use strict';
    function throttle(fn, limit) { let last = 0; return function(...args) { const now = Date.now(); if (now - last >= limit) { last = now; fn.apply(this, args); } }; }
    function rafCall(fn) { return requestAnimationFrame(fn); }
    const scrollProgressEl = document.getElementById('scrollProgress');
    const cursorGlowEl     = document.getElementById('cursorGlow');
    const navbar           = document.getElementById('navbar');
    const menuToggle       = document.getElementById('menuToggle');
    const navMenu          = document.getElementById('navMenu');
    const themeToggle      = document.getElementById('themeToggle');
    const cmdTrigger       = document.getElementById('cmdTrigger');
    const cmdOverlay       = document.getElementById('cmdOverlay');
    const cmdInput         = document.getElementById('cmdInput');
    const cmdResults       = document.getElementById('cmdResults');
    const hireFloat        = document.getElementById('hireFloat');
    const html             = document.documentElement;
    let lastScrollY = 0;
    const handleScroll = throttle(() => {
        const scrollY   = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const pct       = (scrollY / maxScroll) * 100;
        rafCall(() => {
            scrollProgressEl.style.width = pct + '%';
            navbar.classList.toggle('scrolled', scrollY > 60);
            hireFloat.classList.toggle('hidden', scrollY < 400);
        });
        lastScrollY = scrollY;
    }, 16);
    window.addEventListener('scroll', handleScroll, { passive: true });
    const sections = document.querySelectorAll('section[id]');
    const navLinks  = document.querySelectorAll('nav a[href^="#"]');
    const updateActiveNav = throttle(() => {
        let current = '';
        sections.forEach(s => { if (window.scrollY >= s.offsetTop - 240) current = s.id; });
        navLinks.forEach(link => { link.classList.remove('active'); if (link.getAttribute('href') === '#' + current) link.classList.add('active'); });
    }, 50);
    window.addEventListener('scroll', updateActiveNav, { passive: true });
    let mouseX = 0, mouseY = 0, prevMouseX = 0, prevMouseY = 0, cursorRaf = null;
    document.addEventListener('mousemove', (e) => {
        const dx = e.clientX - prevMouseX, dy = e.clientY - prevMouseY;
        const speed = Math.sqrt(dx*dx + dy*dy);
        mouseX = e.clientX; mouseY = e.clientY; prevMouseX = e.clientX; prevMouseY = e.clientY;
        if (cursorRaf) cancelAnimationFrame(cursorRaf);
        cursorRaf = rafCall(() => { cursorGlowEl.style.left = mouseX + 'px'; cursorGlowEl.style.top = mouseY + 'px'; cursorGlowEl.classList.toggle('fast', speed > 18); });
    });
    const particlesContainer = document.getElementById('particles');
    function spawnParticles(n) {
        particlesContainer.innerHTML = ''; const frag = document.createDocumentFragment();
        for (let i = 0; i < n; i++) { const p = document.createElement('div'); p.className = 'particle'; const sz = Math.random() * 130 + 50; Object.assign(p.style, { width: sz + 'px', height: sz + 'px', left: Math.random() * 100 + '%', top: Math.random() * 100 + '%', animationDelay: Math.random() * 20 + 's', animationDuration: (Math.random() * 10 + 18) + 's' }); frag.appendChild(p); }
        particlesContainer.appendChild(frag);
    }
   
    spawnParticles(0);
window.addEventListener('resize', throttle(() => { spawnParticles(0); }, 300));


    document.querySelectorAll('nav a').forEach(link => { link.addEventListener('click', () => { navMenu.classList.remove('active'); menuToggle.classList.remove('active'); menuToggle.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }); });
    document.addEventListener('click', (e) => { if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) { navMenu.classList.remove('active'); menuToggle.classList.remove('active'); menuToggle.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; } });
    function getTheme() { return html.getAttribute('data-theme') || 'dark'; }
    function setTheme(t) { html.setAttribute('data-theme', t); themeToggle.textContent = t === 'dark' ? '🌙' : '☀️'; themeToggle.setAttribute('title', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); try { localStorage.setItem('akn-theme', t); } catch(e){} }
    try { const saved = localStorage.getItem('akn-theme'); if (saved) setTheme(saved); } catch(e) {}
    themeToggle.addEventListener('click', () => { setTheme(getTheme() === 'dark' ? 'light' : 'dark'); });
    const commands = [
        { group: 'Navigation', items: [ { label: 'Home', icon: '🏠', action: () => scrollToSection('hero'), shortcut: 'H' }, { label: 'About', icon: '👤', action: () => scrollToSection('about'), shortcut: 'A' }, { label: 'Skills', icon: '⚡', action: () => scrollToSection('skills'), shortcut: 'S' }, { label: 'Experience', icon: '💼', action: () => scrollToSection('experience'), shortcut: 'E' }, { label: 'Projects', icon: '🗂', action: () => scrollToSection('projects'), shortcut: 'P' }, { label: 'Contact', icon: '📧', action: () => scrollToSection('contact'), shortcut: 'C' } ] },
        { group: 'Quick Actions', items: [ { label: 'Download Resume', icon: '📄', action: () => window.open('Amit Nayak-Resume.pdf', '_blank') }, { label: 'View GitHub', icon: '⑂', action: () => window.open('https://github.com/Amitnayak01', '_blank') }, { label: 'View LinkedIn', icon: '🔗', action: () => window.open('https://linkedin.com/in/amit-nayak-738024344', '_blank') }, { label: 'Send Email', icon: '✉️', action: () => window.open('mailto:amitkumarnayak330@gmail.com') }, { label: 'Toggle Theme', icon: '🎨', action: () => { setTheme(getTheme() === 'dark' ? 'light' : 'dark'); } } ] },
        { group: 'Projects', items: [ { label: 'Open V-Meet', icon: '📹', action: () => window.open('https://v-meet2.vercel.app', '_blank') }, { label: 'Open E-Mart', icon: '🛒', action: () => window.open('https://e-mart-gamma-three.vercel.app', '_blank') }, { label: 'Open ChessArena', icon: '♟', action: () => window.open('https://chessarena-w7fq.onrender.com', '_blank') }, { label: 'Open Cyber Tools', icon: '🔐', action: () => window.open('https://cyber-security-tools-ruby.vercel.app', '_blank') } ] }
    ];
    function scrollToSection(id) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
    let cmdSelected = 0, filteredItems = [];
    function buildCmdResults(query) {
        cmdResults.innerHTML = ''; filteredItems = []; const q = query.toLowerCase().trim(); const frag = document.createDocumentFragment();
        commands.forEach(group => {
            const filtered = group.items.filter(item => !q || item.label.toLowerCase().includes(q) || (item.shortcut && item.shortcut.toLowerCase() === q));
            if (!filtered.length) return;
            const label = document.createElement('div'); label.className = 'cmd-group-label'; label.textContent = group.group; frag.appendChild(label);
            filtered.forEach(item => { const idx = filteredItems.length; filteredItems.push(item); const el = document.createElement('div'); el.className = 'cmd-item'; el.setAttribute('role', 'option'); el.dataset.idx = idx; el.innerHTML = `<span class="cmd-item-icon">${item.icon}</span><span class="cmd-item-label">${item.label}</span>${item.shortcut ? `<span class="cmd-item-shortcut">${item.shortcut}</span>` : ''}`; el.addEventListener('click', () => { execCmd(idx); }); frag.appendChild(el); });
        });
        cmdResults.appendChild(frag); cmdSelected = 0; highlightCmd(0);
    }
    function highlightCmd(idx) { document.querySelectorAll('.cmd-item').forEach((el, i) => { el.classList.toggle('selected', i === idx); if (i === idx) el.scrollIntoView({ block: 'nearest' }); }); }
    function execCmd(idx) { const item = filteredItems[idx]; if (item) { item.action(); closeCmdPalette(); } }
    function openCmdPalette() { cmdOverlay.classList.add('open'); cmdInput.value = ''; buildCmdResults(''); requestAnimationFrame(() => cmdInput.focus()); }
    function closeCmdPalette() { cmdOverlay.classList.remove('open'); }
    cmdTrigger.addEventListener('click', openCmdPalette);
    cmdOverlay.addEventListener('click', (e) => { if (e.target === cmdOverlay) closeCmdPalette(); });
    cmdInput.addEventListener('input', (e) => { buildCmdResults(e.target.value); });
    cmdInput.addEventListener('keydown', (e) => {
        const items = document.querySelectorAll('.cmd-item');
        if (e.key === 'ArrowDown') { e.preventDefault(); cmdSelected = Math.min(cmdSelected + 1, items.length - 1); highlightCmd(cmdSelected); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); cmdSelected = Math.max(cmdSelected - 1, 0); highlightCmd(cmdSelected); }
        else if (e.key === 'Enter') { execCmd(cmdSelected); }
        else if (e.key === 'Escape') { closeCmdPalette(); }
    });
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); cmdOverlay.classList.contains('open') ? closeCmdPalette() : openCmdPalette(); }
        if (e.key === 'Escape' && cmdOverlay.classList.contains('open')) closeCmdPalette();
    });
    const roles = ['Full Stack Developer', 'React + Node.js Dev', 'WebRTC Specialist', 'Real-Time App Builder', 'Problem Solver'];
    let roleIdx = 0, charIdx = 0, isDeleting = false;
    const typingTarget = document.getElementById('typingTarget');
    function typeLoop() {
        const current = roles[roleIdx];
        if (isDeleting) { charIdx--; typingTarget.textContent = current.slice(0, charIdx); if (charIdx === 0) { isDeleting = false; roleIdx = (roleIdx + 1) % roles.length; setTimeout(typeLoop, 400); return; } setTimeout(typeLoop, 45); }
        else { charIdx++; typingTarget.textContent = current.slice(0, charIdx); if (charIdx === current.length) { isDeleting = true; setTimeout(typeLoop, 2200); return; } setTimeout(typeLoop, 70); }
    }
    setTimeout(typeLoop, 800);
    const revealObserver = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } }); }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 6) * 0.07 + 's'; revealObserver.observe(el); });
    function animateCount(el) {
        const target = parseInt(el.dataset.target) || 0; const suffix = el.dataset.suffix || ''; const dur = 1400; const start = performance.now();
        function step(now) { const elapsed = now - start; const progress = Math.min(elapsed / dur, 1); const ease = 1 - Math.pow(1 - progress, 3); el.textContent = Math.floor(ease * target) + (progress >= 1 ? suffix : ''); if (progress < 1) rafCall(step); }
        rafCall(step);
    }
    const countObserver = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { animateCount(entry.target); countObserver.unobserve(entry.target); } }); }, { threshold: 0.5 });
    document.querySelectorAll('.count-up').forEach(el => countObserver.observe(el));
    function initTilt() {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        document.querySelectorAll('.tilt-card').forEach(card => {
            let rect;
            card.addEventListener('mouseenter', () => { rect = card.getBoundingClientRect(); card.style.transition = 'transform 0.1s ease, border-color 0.28s ease, box-shadow 0.28s ease'; });
            card.addEventListener('mousemove', throttle((e) => { if (!rect) return; const x = e.clientX - rect.left, y = e.clientY - rect.top, cx = rect.width / 2, cy = rect.height / 2; const rotX = -((y - cy) / cy) * 6, rotY = ((x - cx) / cx) * 6; rafCall(() => { card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(8px)`; }); }, 16));
            card.addEventListener('mouseleave', () => { card.style.transition = 'transform 0.55s cubic-bezier(0.34,1.2,0.64,1), border-color 0.28s ease, box-shadow 0.28s ease'; rafCall(() => { card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateZ(0)'; }); });
        });
    }
    initTilt();
    function initMagnetic() {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        document.querySelectorAll('.btn-magnetic').forEach(btn => {
            btn.addEventListener('mousemove', throttle((e) => { const rect = btn.getBoundingClientRect(); const dx = e.clientX - (rect.left + rect.width / 2), dy = e.clientY - (rect.top + rect.height / 2); rafCall(() => { btn.style.transform = `translate(${dx*0.28}px, ${dy*0.28}px)`; }); }, 16));
            btn.addEventListener('mouseleave', () => { rafCall(() => { btn.style.transform = ''; }); });
        });
    }
    initMagnetic();
    const heroImgWrap = document.getElementById('heroImgWrap');
    const floatIcons  = document.querySelectorAll('.float-icon');
    const heroParallax = throttle(() => {
        const scrollY = window.scrollY;
        if (scrollY > window.innerHeight) return;
        rafCall(() => { if (heroImgWrap) heroImgWrap.style.transform = `translateY(${scrollY * 0.04}px)`; floatIcons.forEach((icon, i) => { const dir = i % 2 === 0 ? 1 : -1; icon.style.transform = `translateY(${scrollY * 0.06 * dir}px)`; }); });
    }, 16);
    window.addEventListener('scroll', heroParallax, { passive: true });
    function getSlideshow(btn) { return btn.closest('.pc-slideshow'); }
    function getState(ss) { return ss._idx || 0; }
    function goToSlide(ss, idx) {
        const total = parseInt(ss.dataset.slides);
        idx = ((idx % total) + total) % total;
        ss._idx = idx;
        rafCall(() => {
            ss.querySelector('.pc-slides-track').style.transform = `translateX(-${idx * 100}%)`;
            ss.querySelectorAll('.ps-dot-ind').forEach((d, i) => d.classList.toggle('active', i === idx));
        });
    }
    window.slideNext = (btn) => { const ss = getSlideshow(btn); goToSlide(ss, getState(ss) + 1); };
    window.slidePrev = (btn) => { const ss = getSlideshow(btn); goToSlide(ss, getState(ss) - 1); };
    document.querySelectorAll('.pc-slideshow').forEach((ss, i) => {
        ss._idx = 0;
        let startX = 0;
        ss.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
        ss.addEventListener('touchend', (e) => { const diff = startX - e.changedTouches[0].clientX; if (Math.abs(diff) > 40) goToSlide(ss, getState(ss) + (diff > 0 ? 1 : -1)); }, { passive: true });
        setInterval(() => { if (!ss.closest('.project-card').matches(':hover')) goToSlide(ss, getState(ss) + 1); }, 3600 + i * 380);
    });
    document.querySelectorAll('.ps-dot-ind').forEach(dot => {
        dot.addEventListener('click', () => { const ss = dot.closest('.pc-slideshow'); const idx = Array.from(dot.parentElement.children).indexOf(dot); goToSlide(ss, idx); });
    });
    const ghGrid = document.getElementById('ghGrid');
    if (ghGrid) { const frag = document.createDocumentFragment(); for (let i = 0; i < 364; i++) { const cell = document.createElement('div'); cell.className = 'gh-cell'; const level = Math.floor(Math.random() * 5); if (level > 0) cell.setAttribute('data-level', level); frag.appendChild(cell); } ghGrid.appendChild(frag); }
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => { const href = link.getAttribute('href'); if (href === '#') return; const target = document.querySelector(href); if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    });



    
    /* ════════════════════════════════════════════════════
       PROJECT IMAGE FULLSCREEN LIGHTBOX
       Opens when any .pc-img-slide is clicked.
       Reads all sibling slides from the same .pc-slideshow.
    ════════════════════════════════════════════════════ */
    (function () {
        const lb          = document.getElementById('projLightbox');
        const lbImg       = document.getElementById('projLbImg');
        const lbClose     = document.getElementById('projLbClose');
        const lbPrev      = document.getElementById('projLbPrev');
        const lbNext      = document.getElementById('projLbNext');
        const lbDots      = document.getElementById('projLbDots');
        const lbCounter   = document.getElementById('projLbCounter');
        const lbTitle     = document.getElementById('projLbTitle');
        const lbBackdrop  = document.getElementById('projLbBackdrop');
        if (!lb) return;

        let images  = [];   // [{src, alt}]
        let current = 0;
        let busy    = false;

        /* ── collect all img sources from a slideshow ── */
        function getSlidesFromCard(clickedImg) {
            const slideshow = clickedImg.closest('.pc-slideshow');
            if (!slideshow) return [];
            return Array.from(slideshow.querySelectorAll('.pc-img-slide')).map(img => ({
                src: img.src,
                alt: img.alt
            }));
        }

        /* ── get project name from card ── */
        function getProjectName(clickedImg) {
            const card = clickedImg.closest('.project-card');
            if (!card) return '';
            const h3 = card.querySelector('h3');
            return h3 ? h3.textContent.trim() : '';
        }

        /* ── rebuild dot indicators ── */
        function buildDots(total) {
            lbDots.innerHTML = '';
            for (let i = 0; i < total; i++) {
                const d = document.createElement('button');
                d.className = 'proj-lb-dot' + (i === 0 ? ' active' : '');
                d.setAttribute('aria-label', 'Go to image ' + (i + 1));
                d.addEventListener('click', () => goTo(i));
                lbDots.appendChild(d);
            }
        }

        /* ── update dot highlight ── */
        function updateDots(idx) {
            Array.from(lbDots.children).forEach((d, i) => {
                d.classList.toggle('active', i === idx);
            });
        }

        /* ── show image at index (with fade transition) ── */
        function goTo(idx, skipFade) {
            if (busy) return;
            idx = ((idx % images.length) + images.length) % images.length;

            if (idx === current && lbImg.src && !skipFade) return;

            if (skipFade) {
                lbImg.src = images[idx].src;
                lbImg.alt = images[idx].alt;
                current = idx;
                updateDots(idx);
                lbCounter.textContent = (idx + 1) + ' / ' + images.length;
                return;
            }

            busy = true;
            lbImg.classList.add('proj-img-fade');
            setTimeout(() => {
                lbImg.src     = images[idx].src;
                lbImg.alt     = images[idx].alt;
                current       = idx;
                updateDots(idx);
                lbCounter.textContent = (idx + 1) + ' / ' + images.length;
                lbImg.classList.remove('proj-img-fade');
                busy = false;
            }, 200);
        }

        /* ── open lightbox ── */
        function openLightbox(clickedImg) {
            images  = getSlidesFromCard(clickedImg);
            if (!images.length) return;

            // find index of clicked image
            const clickedSrc = clickedImg.src;
            current = images.findIndex(im => im.src === clickedSrc);
            if (current < 0) current = 0;

            lbTitle.textContent = getProjectName(clickedImg);
            buildDots(images.length);

            // set image immediately (no fade on open)
            goTo(current, true);

            lb.classList.add('proj-lb-open');
            document.body.style.overflow = 'hidden';
            lbClose.focus();
        }

        /* ── close lightbox ── */
        function closeLightbox() {
            lb.classList.remove('proj-lb-open');
            document.body.style.overflow = '';
            setTimeout(() => { lbImg.src = ''; lbDots.innerHTML = ''; }, 300);
        }

        /* ── bind click on every project image ── */
        function bindImageClicks() {
            document.querySelectorAll('.pc-img-slide').forEach(img => {
                // avoid double-binding
                if (img.dataset.lbBound) return;
                img.dataset.lbBound = '1';
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openLightbox(img);
                });
            });
        }
        bindImageClicks();

        /* Re-bind after any dynamic content (MutationObserver) */
        const mo = new MutationObserver(() => bindImageClicks());
        const grid = document.querySelector('.projects-grid');
        if (grid) mo.observe(grid, { childList: true, subtree: true });

        /* ── controls ── */
        lbClose.addEventListener('click', closeLightbox);
        lbBackdrop.addEventListener('click', closeLightbox);
        lbPrev.addEventListener('click', () => goTo(current - 1));
        lbNext.addEventListener('click', () => goTo(current + 1));

        /* keyboard */
        document.addEventListener('keydown', (e) => {
            if (!lb.classList.contains('proj-lb-open')) return;
            if (e.key === 'Escape')      closeLightbox();
            if (e.key === 'ArrowLeft')   goTo(current - 1);
            if (e.key === 'ArrowRight')  goTo(current + 1);
        });

        /* touch/swipe */
        let touchStartX = 0;
        lb.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });
        lb.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(dx) > 50) {
                dx < 0 ? goTo(current + 1) : goTo(current - 1);
            }
        }, { passive: true });

    })();

    /* ── Carousel Nav (arrows + progress bar) ── */










(function () {

  function isMobile() { return window.innerWidth <= 768; }

  const grid     = document.querySelector('.projects-grid');
  const btnPrev  = document.getElementById('rollPrev');
  const btnNext  = document.getElementById('rollNext');
  const currEl   = document.getElementById('rollCurr');
  const totEl    = document.getElementById('rollTot');
  const dotsWrap = document.getElementById('rollDots');
  if (!grid || !btnPrev) return;

  const cards = Array.from(grid.querySelectorAll('.project-card'));
  const total = cards.length;
  if (totEl) totEl.textContent = total;

  let current = 0;

  /* Build dots */
  if (dotsWrap) {
    cards.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'roll-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Go to ' + (i + 1));
      d.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(d);
    });
  }

  /* Apply stack positions */
  function applyStack() {
    if (!isMobile()) return;
    cards.forEach((card, i) => {
      card.classList.remove(
        'swipe-active','swipe-behind-1','swipe-behind-2',
        'swipe-behind-3','swipe-hidden'
      );
      /* distance ahead in queue (wrap) */
      const offset = ((i - current) % total + total) % total;
      if (offset === 0)      card.classList.add('swipe-active');
      else if (offset === 1) card.classList.add('swipe-behind-1');
      else if (offset === 2) card.classList.add('swipe-behind-2');
      else if (offset === 3) card.classList.add('swipe-behind-3');
      else                   card.classList.add('swipe-hidden');
    });
  }

  function updateUI() {
    if (currEl) currEl.textContent = current + 1;
    if (dotsWrap) {
      Array.from(dotsWrap.children).forEach((d, i) => {
        d.classList.toggle('active', i === current);
      });
    }
  }

  function goTo(idx) {
    current = ((idx % total) + total) % total;
    applyStack();
    updateUI();
  }

  /* Swipe the active card off, advance */
  function swipeCard(dir) {
    const card = cards[current];
    const outClass = dir === 'left' ? 'swipe-out-left' : 'swipe-out-right';
    card.classList.add(outClass);

    setTimeout(() => {
      card.classList.remove(outClass);
      card.classList.add('swipe-in-back');
      /* instantly send to back */
      card.style.transform = 'translateY(44px) scale(0.78)';
      card.style.opacity   = '0';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          card.classList.remove('swipe-in-back');
          card.style.transform = '';
          card.style.opacity   = '';
          current = (current + 1) % total;
          applyStack();
          updateUI();
        });
      });
    }, 380);
  }

  /* Arrow buttons */
  btnNext.addEventListener('click', () => swipeCard('left'));
  btnPrev.addEventListener('click', () => {
    current = (current - 1 + total) % total;
    applyStack();
    updateUI();
  });

  /* Touch swipe */
  let touchStartX = 0, touchStartY = 0, swiping = false;

  grid.addEventListener('touchstart', e => {
    if (!isMobile()) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    swiping = false;
  }, { passive: true });

  grid.addEventListener('touchmove', e => {
    if (!isMobile()) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (!swiping && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      swiping = true;
    }
    if (swiping) {
      /* Tilt top card while dragging */
      const card = cards[current];
      const rot  = dx * 0.06;
      card.style.transform    = `translateX(${dx * 0.4}px) rotate(${rot}deg)`;
      card.style.transition   = 'none';
    }
  }, { passive: true });

  grid.addEventListener('touchend', e => {
    if (!isMobile() || !swiping) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const card = cards[current];
    card.style.transform  = '';
    card.style.transition = '';
    swiping = false;

    if (Math.abs(dx) > 60) {
      swipeCard(dx < 0 ? 'left' : 'right');
    } else {
      /* snap back */
      applyStack();
    }
  }, { passive: true });

  /* Mouse drag (desktop debug) */
  let mouseDown = false, mouseSX = 0;
  grid.addEventListener('mousedown', e => {
    if (!isMobile()) return;
    mouseDown = true; mouseSX = e.clientX;
  });
  document.addEventListener('mouseup', e => {
    if (!mouseDown || !isMobile()) return;
    mouseDown = false;
    const dx = e.clientX - mouseSX;
    cards[current].style.transform = '';
    cards[current].style.transition = '';
    if (Math.abs(dx) > 60) swipeCard(dx < 0 ? 'left' : 'right');
    else applyStack();
  });
  document.addEventListener('mousemove', e => {
    if (!mouseDown || !isMobile()) return;
    const dx = e.clientX - mouseSX;
    const card = cards[current];
    card.style.transform  = `translateX(${dx * 0.4}px) rotate(${dx * 0.06}deg)`;
    card.style.transition = 'none';
  });

  /* Resize */
  window.addEventListener('resize', throttle(() => {
    if (isMobile()) { applyStack(); updateUI(); }
    else {
      cards.forEach(c => {
        c.classList.remove(
          'swipe-active','swipe-behind-1','swipe-behind-2',
          'swipe-behind-3','swipe-hidden'
        );
        c.style.cssText = '';
      });
    }
  }, 200));

  /* Init */
  if (isMobile()) { applyStack(); updateUI(); }

})();







/* ════════════════════════════════════════════════════
   3D FAN CAROUSEL — DESKTOP
════════════════════════════════════════════════════ */
(function() {

    function isDesktop() { return window.innerWidth > 768; }

    const grid     = document.querySelector('.projects-grid');
    const btnPrev  = document.getElementById('fanPrev');
    const btnNext  = document.getElementById('fanNext');
    const currEl   = document.getElementById('fanCurr');
    const totEl    = document.getElementById('fanTot');
    const dotsWrap = document.getElementById('fanDots');
    const hint     = document.getElementById('fanHint');
    const fanNav   = document.getElementById('fanNav');

    if (!grid || !btnPrev) return;

    const cards = Array.from(grid.querySelectorAll('.project-card'));
    const total = cards.length;
    if (totEl) totEl.textContent = total;

    let current  = 0;
    let dragStartX = 0;
    let isDragging = false;

    /* ── Fan layout config ── */
    const POSITIONS = [
        /* offset   translateX  translateZ  rotateY   scale   */
        { dx:    0, dz:    0, ry:  0,   s: 1      }, // 0 = active center
        { dx:  390, dz: -120, ry: -32,  s: 0.82   }, // +1 right
        { dx: -390, dz: -120, ry:  32,  s: 0.82   }, // -1 left
        { dx:  680, dz: -240, ry: -52,  s: 0.65   }, // +2
        { dx: -680, dz: -240, ry:  52,  s: 0.65   }, // -2
        { dx:  900, dz: -340, ry: -65,  s: 0.5    }, // +3
        { dx: -900, dz: -340, ry:  65,  s: 0.5    }, // -3
    ];

    /* ── Build dots ── */
    if (dotsWrap) {
        cards.forEach((_, i) => {
            const d = document.createElement('button');
            d.className = 'fan-dot' + (i === 0 ? ' active' : '');
            d.setAttribute('aria-label', 'Project ' + (i + 1));
            d.addEventListener('click', () => goTo(i));
            dotsWrap.appendChild(d);
        });
    }

    /* ── Tap side cards ── */
    cards.forEach((card, i) => {
        card.addEventListener('click', (e) => {
            if (!isDesktop()) return;
            if (i === current) return;
            e.stopPropagation();
            goTo(i);
            resetAuto();
        });
    });

    /* ── Render positions ── */
    function render() {
        if (!isDesktop()) {
            cards.forEach(c => {
                c.style.transform = '';
                c.style.opacity   = '';
                c.style.zIndex    = '';
                c.style.filter    = '';
                c.style.position  = '';
                c.style.left      = '';
                c.style.top       = '';
                c.style.width     = '';
                c.style.height    = '';
                c.style.marginLeft = '';
                c.classList.remove('fan-active');
            });
            if (fanNav) fanNav.style.display = 'none';
            if (hint)   hint.style.display   = 'none';
            return;
        }
        if (fanNav) fanNav.style.display = '';
        if (hint)   hint.style.display   = '';

        cards.forEach((card, i) => {
            const offset   = i - current;
            const absOff   = Math.abs(offset);
            const posIdx   = absOff === 0 ? 0
                           : offset > 0   ? Math.min(absOff * 2 - 1, POSITIONS.length - 1)
                           :                Math.min(absOff * 2,     POSITIONS.length - 1);
            const pos      = POSITIONS[posIdx] || POSITIONS[POSITIONS.length - 1];

            /* flip X for left-side cards */
            const tx = offset >= 0 ? pos.dx : -pos.dx;
            const ry = offset >= 0 ? pos.ry : -pos.ry;

            if (absOff > 3) {
                card.style.opacity        = '0';
                card.style.pointerEvents  = 'none';
                card.style.zIndex         = '0';
                card.style.transform      = `translateX(${tx}px) translateZ(${pos.dz}px) rotateY(${ry}deg) scale(${pos.s})`;
                return;
            }

            card.style.transform     = `translateX(${tx}px) translateZ(${pos.dz}px) rotateY(${ry}deg) scale(${pos.s})`;
            card.style.opacity       = absOff === 0 ? '1' : absOff === 1 ? '0.85' : absOff === 2 ? '0.65' : '0.4';
            card.style.zIndex        = (20 - absOff * 4).toString();
            card.style.pointerEvents = 'auto';

            card.classList.toggle('fan-active', i === current);
        });

        if (currEl) currEl.textContent = current + 1;
        if (dotsWrap) {
            Array.from(dotsWrap.children).forEach((d, i) => {
                d.classList.toggle('active', i === current);
            });
        }

        /* Update flat carousel controls too (if visible) */
        const flatFill = document.getElementById('carouselFill');
        if (flatFill) flatFill.style.width = ((current + 1) / total * 100) + '%';
    }

    function goTo(idx) {
        current = ((idx % total) + total) % total;
        render();
    }

    /* ── Arrow buttons ── */
    btnPrev.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
    btnNext.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

    /* ── Keyboard ← → ── */
    document.addEventListener('keydown', (e) => {
        if (!isDesktop()) return;
        if (e.target.matches('input, textarea')) return;
        if (e.key === 'ArrowLeft')  { goTo(current - 1); resetAuto(); }
        if (e.key === 'ArrowRight') { goTo(current + 1); resetAuto(); }
    });

    /* ── Mouse drag ── */
    grid.addEventListener('mousedown', (e) => {
        if (!isDesktop()) return;
        isDragging  = true;
        dragStartX  = e.clientX;
        grid.style.cursor = 'grabbing';
    });
    document.addEventListener('mouseup', (e) => {
        if (!isDragging || !isDesktop()) return;
        isDragging = false;
        grid.style.cursor = '';
        const dx = e.clientX - dragStartX;
        if (Math.abs(dx) > 60) {
            dx < 0 ? goTo(current + 1) : goTo(current - 1);
            resetAuto();
        }
    });

    /* ── Touch swipe ── */
    let tStartX = 0;
    grid.addEventListener('touchstart', e => { tStartX = e.touches[0].clientX; }, { passive: true });
    grid.addEventListener('touchend', e => {
        if (!isDesktop()) return;
        const dx = e.changedTouches[0].clientX - tStartX;
        if (Math.abs(dx) > 55) { dx < 0 ? goTo(current + 1) : goTo(current - 1); resetAuto(); }
    }, { passive: true });

    /* ── Auto-play ── */
    let autoTimer = null;
    let ringEl    = null;
    let progress  = 0;
    const DURATION = 5000, TICK = 60;

    function startAuto() {
        if (autoTimer) return;
        if (!isDesktop()) return;

        if (!ringEl) {
            ringEl = document.createElement('div');
            ringEl.className = 'fan-autoplay-ring';
            btnNext.style.position = 'relative';
            btnNext.appendChild(ringEl);
        }
        progress  = 0;
        autoTimer = setInterval(() => {
            progress += TICK;
            const pct = (progress / DURATION * 100).toFixed(1);
            if (ringEl) {
                ringEl.style.background =
                    `conic-gradient(var(--gold) ${pct}%, rgba(255,255,255,0.08) ${pct}%)`;
            }
            if (progress >= DURATION) {
                progress = 0;
                goTo(current + 1);
            }
        }, TICK);
    }

    function stopAuto() {
        clearInterval(autoTimer);
        autoTimer = null;
        if (ringEl) ringEl.style.background = '';
        progress = 0;
    }

    function resetAuto() {
        stopAuto();
        setTimeout(startAuto, 1000);
    }

    /* Pause on hover */
    grid.addEventListener('mouseenter', stopAuto);
    grid.addEventListener('mouseleave', () => { if (isDesktop()) startAuto(); });

    /* ── Resize ── */
    window.addEventListener('resize', throttle(() => {
        render();
        if (isDesktop()) startAuto();
        else stopAuto();
    }, 200));

    /* ── Init ── */
    render();
    setTimeout(startAuto, 2200);

})();



/* ══════════════════════════════════════════════════
   PROJECT DETAIL MODAL
   Paste at the bottom of script.js
══════════════════════════════════════════════════ */

(function () {

    /* ── 1. Inject modal HTML into <body> ── */
    const modalHTML = `
    <div id="projectModal" role="dialog" aria-modal="true" aria-label="Project details">
        <div class="pm-backdrop" id="pmBackdrop"></div>
        <div class="pm-box" id="pmBox">
            <div class="pm-close">
                <button class="pm-close-btn" id="pmClose" aria-label="Close">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="pm-inner" id="pmInner"></div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    /* ── 2. Project data map (keyed by card h3 text) ── */
    const PROJECT_DATA = {
        'E-Mart': {
            subtitle:  'Full Stack Marketplace Web App',
            duration:  'Jan 2026 – Feb 2026',
            desc:      'Production-ready OLX-style marketplace with JWT authentication, real-time chat via Socket.IO, cloud image storage, and optimised MongoDB schemas for fast search, filtering, sorting & pagination. Built for scale with a clean component architecture and mobile-first responsive design.',
            features:  [
                'Real-time 1-on-1 chat with typing indicators (Socket.IO)',
                'JWT + refresh token auth with role-based access',
                'Cloud image upload (Cloudinary) for listings',
                'Advanced search with filters, sort & pagination',
                'Seller dashboard with listing management',
                'Mobile-first responsive UI (Tailwind CSS)',
            ],
            stack:     ['React.js', 'Node.js', 'MongoDB', 'Socket.IO', 'Tailwind', 'JWT', 'Cloudinary', 'Express.js'],
            highlight: '🏆 <strong>Highlights:</strong> Real-time messaging, optimised pagination, role-based auth, cloud storage integration',
            liveUrl:   'https://e-mart-gamma-three.vercel.app',
            codeUrl:   'https://github.com/Amitnayak01',
        },
        'V-Meet': {
            subtitle:  'Real-Time Video Meeting Platform',
            duration:  'Nov 2025 – Dec 2025',
            desc:      'Scalable video conferencing platform powered by WebRTC peer-to-peer connections. Supports Zoom-style grid layout, 1-on-1 calls, audio conferences, group calling with pinned speaker, and screen sharing with annotation overlay — all in a single unified app with WhatsApp-style chat.',
            features:  [
                'WebRTC P2P video — Zoom-style grid & pinned speaker',
                'WhatsApp-style chat with read receipts & file sharing',
                'Audio conference with mute, noise suppression & PTT',
                'Screen sharing with live annotation overlay',
                'Group calls — dynamic pin & strip view (6+ users)',
                'JWT + E2E encryption for secure sessions',
            ],
            stack:     ['React.js', 'Node.js', 'WebRTC', 'Socket.io', 'MongoDB', 'JWT'],
            highlight: '⚡ <strong>Tech:</strong> WebRTC P2P, Socket.io signaling, screen capture API, real-time presence',
            liveUrl:   'https://v-meet2.vercel.app',
            codeUrl:   'https://github.com/Amitnayak01',
        },
        'ChessArena': {
            subtitle:  'Real-Time Multiplayer Chess',
            duration:  'Feb 2025 – Mar 2025',
            desc:      'Multiplayer chess platform orchestrating 50+ concurrent game rooms with live board state synchronisation across 100+ players. Sub-100ms move latency achieved via optimised WebSocket event management. Includes a room lobby, spectator mode, and persistent game history.',
            features:  [
                '50+ concurrent game rooms with full board sync',
                'Sub-100ms move latency via WebSocket optimisation',
                'chess.js engine for legal move validation',
                'Room lobby with live player count & status',
                'Spectator mode — watch any active game',
                '99.8% uptime on Render deployment',
            ],
            stack:     ['Node.js', 'Socket.IO', 'Express.js', 'chess.js', 'WebSocket'],
            highlight: '♟ <strong>Scale:</strong> 50+ concurrent rooms, <100ms latency, 99.8% uptime',
            liveUrl:   'https://chessarena-w7fq.onrender.com',
            codeUrl:   'https://github.com/Amitnayak01',
        },
        'Seven Wonders': {
            subtitle:  'Comprehensive Travel Platform',
            duration:  'Jan 2024 – Feb 2024',
            desc:      'Travel web application showcasing the Seven Wonders of the World with secure JWT authentication, full CRUD review system, RESTful APIs for user management, and role-based access control for admins and regular users.',
            features:  [
                'JWT auth with bcrypt password hashing',
                'Full CRUD reviews — add, edit, delete, rate',
                'RESTful API design with proper status codes',
                'Role-based access control (RBAC)',
                'User management with profile pages',
                'Responsive design across all devices',
            ],
            stack:     ['Node.js', 'Express.js', 'MongoDB', 'JWT', 'bcrypt', 'EJS'],
            highlight: '🌍 <strong>Features:</strong> CRUD reviews, RESTful API design, bcrypt password hashing, RBAC',
            liveUrl:   'https://the-7.onrender.com',
            codeUrl:   'https://github.com/Amitnayak01',
        },
        'Quiz Master': {
            subtitle:  'Online Assessment Platform',
            duration:  'Sep 2023 – Oct 2023',
            desc:      'Online assessment platform with separate teacher and student portals secured by JWT authentication. Teachers create quiz categories and questions; students take timed quizzes with auto-submission and immediately see their rank on the live leaderboard.',
            features:  [
                'Teacher portal — create categories & questions',
                'Student portal — take quizzes with live timer',
                'Auto-submit on timer expiry',
                'Real-time leaderboard across categories',
                'Role-based JWT auth (teacher / student)',
                'Score history & performance analytics',
            ],
            stack:     ['Node.js', 'MongoDB', 'JWT', 'Express.js', 'EJS'],
            highlight: '📊 <strong>Features:</strong> Teacher/student portals, auto-submit timer, category filters, real-time leaderboard',
            liveUrl:   'https://quiz-master-zoo7.onrender.com',
            codeUrl:   'https://github.com/Amitnayak01',
        },
        'Cyber Security Tools': {
            subtitle:  'Security Utility Platform',
            duration:  'Jul 2025 – Sep 2025',
            desc:      'Security utility platform providing a suite of cryptographic and network analysis tools. Features password strength analysis, multi-algorithm hash generation, AES-256 encryption/decryption, URL & port scanning — all protected by role-based access with JWT and refresh token rotation.',
            features:  [
                'AES-256 encryption & decryption tool',
                'Hash generation — MD5, SHA-256, SHA-512',
                'Password strength analyser with scoring',
                'URL & basic port scanner',
                'RBAC middleware — admin & user roles',
                'JWT with refresh token rotation',
            ],
            stack:     ['React.js', 'Node.js', 'JWT', 'RBAC', 'AES-256', 'Express.js'],
            highlight: '🔒 <strong>Security:</strong> AES-256, bcrypt hashing, refresh token rotation, RBAC middleware',
            liveUrl:   'https://cyber-security-tools-ruby.vercel.app',
            codeUrl:   'https://github.com/Amitnayak01',
        },
        'Chat Application': {
            subtitle:  'Full-Stack Real-Time Messaging',
            duration:  'Jun 2023 – Aug 2023',
            desc:      'Full-stack chat application with RESTful APIs and real-time bidirectional communication via Socket.io. Features user authentication, multiple chat rooms, persistent message history stored in MongoDB, and a responsive UI for seamless cross-device use.',
            features:  [
                'Real-time messaging with Socket.io',
                'Multiple chat rooms & online presence',
                'Persistent message history (MongoDB)',
                'User authentication & profile setup',
                'Typing indicators & read status',
                'Responsive UI for mobile & desktop',
            ],
            stack:     ['React', 'Express.js', 'MongoDB', 'Socket.io', 'Node.js'],
            highlight: '💬 <strong>Features:</strong> Real-time presence, group rooms, persistent message history, responsive UI',
            liveUrl:   'https://chatapp-drt5.onrender.com',
            codeUrl:   'https://github.com/Amitnayak01',
        },
    };

    /* ── 3. Inject "click to expand" hint into each card body ── */
    document.querySelectorAll('.project-card').forEach(card => {
        const body = card.querySelector('.pc-body');
        if (!body) return;

        const hint = document.createElement('div');
        hint.className = 'pc-expand-hint';
        hint.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3
                         m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
            Click for full details`;
        body.appendChild(hint);

        /* Clicking pc-body (not the live link) opens modal */
        body.addEventListener('click', e => {
            if (e.target.closest('a')) return; /* let links through */
            const title = card.querySelector('h3')?.textContent.trim();
            openModal(title);
        });
    });

    /* ── 4. Build & open modal ── */
    const modal   = document.getElementById('projectModal');
    const pmInner = document.getElementById('pmInner');
    const pmClose = document.getElementById('pmClose');
    const pmBdrop = document.getElementById('pmBackdrop');

    function openModal(title) {
        const d = PROJECT_DATA[title];
        if (!d) return;

        const featuresHTML = d.features.map(f => `
            <div class="pm-feature-item">
                <span class="pm-feature-check">✓</span>
                <span>${f}</span>
            </div>`).join('');

        const stackHTML = d.stack.map(s => `<span>${s}</span>`).join('');

        pmInner.innerHTML = `
            <div class="pm-header">
                <div>
                    <h2 class="pm-title">${title}</h2>
                    <p class="pm-subtitle">${d.subtitle}</p>
                </div>
                <span class="pm-duration-badge">${d.duration}</span>
            </div>

            <p class="pm-desc">${d.desc}</p>

            <div class="pm-divider"></div>

            <div class="pm-stack-label">Key Features</div>
            <div class="pm-features">${featuresHTML}</div>

            <div class="pm-divider"></div>

            <div class="pm-stack-label">Tech Stack</div>
            <div class="pm-stack">${stackHTML}</div>

            <div class="pm-highlight">${d.highlight}</div>

            <div class="pm-actions">
                <a href="${d.liveUrl}" target="_blank" rel="noopener"
                   class="btn btn-primary btn-magnetic">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2.5">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Live Demo
                </a>
                <a href="${d.codeUrl}" target="_blank" rel="noopener"
                   class="btn btn-outline">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8
                                 8.207 11.387.599.111.793-.261.793-.577v-2.234
                                 c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387
                                 -1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729
                                 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807
                                 1.304 3.492.997.107-.775.418-1.305.762-1.604
                                 -2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381
                                 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0
                                 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404
                                 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23
                                 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235
                                 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921
                                 .43.372.823 1.102.823 2.222v3.293c0 .319.192.694
                                 .801.576 4.765-1.589 8.199-6.086 8.199-11.386
                                 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    View Code
                </a>
            </div>`;

        document.getElementById('pmBox').scrollTop = 0;
        modal.classList.add('pm-open');
        document.body.style.overflow = 'hidden';
        pmClose.focus();
    }

    function closeModal() {
        modal.classList.remove('pm-open');
        document.body.style.overflow = '';
    }

    pmClose.addEventListener('click', closeModal);
    pmBdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('pm-open')) closeModal();
    });

})();















/**
 * ═══════════════════════════════════════════════════════════════════
 *  DEEP SPACE ENGINE  v5.0  — "Hubble Edition"
 *  Cinematic · Physics-Driven · 60 FPS
 * ═══════════════════════════════════════════════════════════════════
 *
 *  NEW IN v5 (on top of v4):
 *    ★  Hubble-style 4-spike diffraction spikes on bright stars
 *    ★  Harmonic multi-frequency twinkle (organic, not robotic)
 *    ★  Faster twinkle speeds across all star layers
 *    ★  Size pulse + color temperature shimmer per star
 *    ★  Richer white-core bloom gradient
 *    ★  Deep blue vignette background (true cinematic black)
 *    ★  MW stars also get faster twinkle
 *    ★  More stars eligible for spikes (layer 1 + layer 2)
 * ═══════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  /* ── BOOTSTRAP ── */
  const hero = document.getElementById('hero');
  if (!hero) return;
  const oldMesh = document.querySelector('.gradient-mesh');
  if (oldMesh) oldMesh.style.display = 'none';

  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0',
    width: '100vw', height: '100vh',
    pointerEvents: 'none', zIndex: '0', opacity: '1',
  });
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx    = canvas.getContext('2d');
  const IS_MOB = window.innerWidth < 768;
  let W, H, raf, lastTime = 0, T = 0, nebulaT = 0;

  /* ── UTILS ── */
  const lerp  = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rand  = (lo, hi) => Math.random() * (hi - lo) + lo;
  const randI = (lo, hi) => Math.floor(rand(lo, hi));
  const TAU   = Math.PI * 2;
  const sm    = { x: -1, y: -1 };
  const raw   = { x: -9999, y: -9999, vx: 0, vy: 0, spd: 0 };

  function noise2(x, y, t) {
    return (
      Math.sin(x * 0.013 + t * 0.7)  * Math.cos(y * 0.011 - t * 0.5) * 0.5 +
      Math.sin(x * 0.027 - t * 1.1)  * Math.cos(y * 0.021 + t * 0.8) * 0.3 +
      Math.sin(x * 0.055 + t * 1.7)  * Math.cos(y * 0.041 - t * 1.3) * 0.2
    );
  }

  /* ── RESIZE + INPUT ── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    if (sm.x < 0) { sm.x = W * 0.5; sm.y = H * 0.5; }
  }
  window.addEventListener('resize', () => { resize(); rebuildAll(); });
  document.addEventListener('mousemove', e => {
    raw.vx = e.clientX - raw.x; raw.vy = e.clientY - raw.y;
    raw.spd = Math.hypot(raw.vx, raw.vy);
    raw.x = e.clientX; raw.y = e.clientY;
  });
  document.addEventListener('touchmove', e => {
    raw.x = e.touches[0].clientX; raw.y = e.touches[0].clientY;
  }, { passive: true });

  /* ══════════════════════════════════════════════════════
     SPECTRAL STAR PALETTE  (real stellar classifications)
  ══════════════════════════════════════════════════════ */
  const SPECTRAL = {
    O: [155, 176, 255],   // blue-white (hottest)
    B: [170, 191, 255],   // blue-white
    A: [202, 215, 255],   // white
    F: [248, 247, 255],   // yellow-white
    G: [255, 244, 234],   // yellow (sun-like)
    K: [255, 210, 161],   // orange
    M: [255, 150, 100],   // red (coolest)
    WR:[200, 150, 255],   // Wolf-Rayet (violet)
    LBV:[255, 235, 100],  // Luminous Blue Variable
  };
  const SPEC_KEYS = Object.keys(SPECTRAL);
  // Realistic frequency weights (most stars are K/M/G)
  const SPEC_WEIGHTS = [0.01, 0.03, 0.06, 0.10, 0.14, 0.20, 0.42, 0.02, 0.02];
  function pickSpectralColor() {
    let r = Math.random(), acc = 0;
    for (let i = 0; i < SPEC_WEIGHTS.length; i++) {
      acc += SPEC_WEIGHTS[i];
      if (r < acc) return SPECTRAL[SPEC_KEYS[i]];
    }
    return SPECTRAL.G;
  }

  /* ══════════════════════════════════════════════════════
     §1  BACKGROUND  (pure black + cinematic blue vignette)
  ══════════════════════════════════════════════════════ */
  function drawBackground() {
    ctx.fillStyle = 'rgb(0,0,0)';
    ctx.fillRect(0, 0, W, H);
    // Deep blue vignette — matches Hubble deep-field look
    const vg = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.2, W * 0.5, H * 0.5, H * 0.85);
    vg.addColorStop(0, 'rgba(0,0,8,0)');
    vg.addColorStop(1, 'rgba(0,0,15,0.4)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  /* ══════════════════════════════════════════════════════
     §2  MILKY WAY BAND
  ══════════════════════════════════════════════════════ */
  const MW_ANGLE = 0.32;
  const MW_STARS_N = IS_MOB ? 800 : 2200;
  let mwStars = [];

  function spawnMWStars() {
    mwStars = [];
    for (let i = 0; i < MW_STARS_N; i++) {
      const t  = rand(0, 1);
      const bx = t * (W * 1.4) - W * 0.2;
      const by = H * 0.2 + bx * Math.tan(MW_ANGLE) + rand(-H * 0.22, H * 0.22);
      const distFromCenter = Math.abs(rand(-1, 1)) + Math.abs(rand(-1, 1)) - 1;
      const bandY = by + distFromCenter * H * 0.09;
      mwStars.push({
        x: bx, y: bandY,
        r: rand(0.1, 0.7),
        o: rand(0.1, 0.65),
        col: pickSpectralColor(),
        twink: rand(0, TAU),
        // v5: faster MW twinkle
        twinkSpd: rand(0.015, 0.055),
      });
    }
  }

  function drawMilkyWay() {
    const len = Math.hypot(W * 1.4, H * 0.7);

    ctx.save();
    ctx.translate(W * 0.35, H * 0.28);
    ctx.rotate(MW_ANGLE);

    for (let i = 0; i < 3; i++) {
      const g = ctx.createLinearGradient(0, -H * 0.28, 0, H * 0.28);
      g.addColorStop(0,    'rgba(0,0,0,0)');
      g.addColorStop(0.3,  `rgba(${30+i*8},${22+i*5},${45+i*10},${0.028 + i * 0.012})`);
      g.addColorStop(0.5,  `rgba(${50+i*10},${35+i*8},${80+i*15},${0.045 + i * 0.018})`);
      g.addColorStop(0.7,  `rgba(${30+i*8},${22+i*5},${45+i*10},${0.028 + i * 0.012})`);
      g.addColorStop(1,    'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-len, -H * 0.28, len * 2, H * 0.56);
    }

    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.3);
    core.addColorStop(0,   'rgba(255,220,140,0.055)');
    core.addColorStop(0.2, 'rgba(220,170,100,0.032)');
    core.addColorStop(0.5, 'rgba(150,100,180,0.018)');
    core.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = core;
    ctx.fillRect(-W * 0.3, -W * 0.3, W * 0.6, W * 0.6);

    ctx.restore();

    // Draw MW stars with improved harmonic twinkle
    mwStars.forEach(s => {
      s.twink += s.twinkSpd;
      // v5: harmonic twinkle for MW stars too
      const a = s.o * (0.4 + 0.35 * Math.sin(s.twink) + 0.15 * Math.sin(s.twink * 2.7 + 1.3) + 0.1 * Math.sin(s.twink * 5.1));
      const [r, g, b] = s.col;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fillStyle = `rgba(${r},${g},${b},${clamp(a, 0, 1).toFixed(3)})`;
      ctx.fill();
    });
  }

  /* ══════════════════════════════════════════════════════
     §3  DEEP FIELD BACKGROUND GALAXIES
  ══════════════════════════════════════════════════════ */
  const N_GALAXIES = IS_MOB ? 8 : 22;
  let deepGalaxies = [];

  function spawnDeepGalaxies() {
    deepGalaxies = [];
    for (let i = 0; i < N_GALAXIES; i++) {
      const type = Math.random();
      deepGalaxies.push({
        x: rand(0, W), y: rand(0, H),
        size: rand(4, IS_MOB ? 12 : 22),
        angle: rand(0, TAU),
        type: type < 0.5 ? 'spiral' : type < 0.8 ? 'elliptical' : 'irregular',
        col: Math.random() > 0.5
          ? [255, 220, 160]
          : [180, 210, 255],
        o: rand(0.12, 0.35),
        tilt: rand(0.1, 0.7),
      });
    }
  }

  function drawDeepGalaxy(g) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.angle);
    ctx.scale(1, g.tilt);

    const [r, gc, b] = g.col;

    if (g.type === 'spiral') {
      for (let arm = 0; arm < 2; arm++) {
        const armAngle = arm * Math.PI;
        for (let j = 0; j < 28; j++) {
          const t   = j / 28;
          const ang = armAngle + t * Math.PI * 2.2;
          const rad = t * g.size;
          const px  = Math.cos(ang) * rad;
          const py  = Math.sin(ang) * rad;
          const a   = g.o * (1 - t) * 0.7;
          ctx.beginPath();
          ctx.arc(px, py, rand(0.2, 0.5), 0, TAU);
          ctx.fillStyle = `rgba(${r},${gc},${b},${a.toFixed(3)})`;
          ctx.fill();
        }
      }
      const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, g.size * 0.3);
      cg.addColorStop(0, `rgba(255,235,190,${g.o * 0.9})`);
      cg.addColorStop(1, `rgba(255,200,120,0)`);
      ctx.fillStyle = cg;
      ctx.fillRect(-g.size * 0.3, -g.size * 0.3, g.size * 0.6, g.size * 0.6);
    } else if (g.type === 'elliptical') {
      const eg = ctx.createRadialGradient(0, 0, 0, 0, 0, g.size);
      eg.addColorStop(0, `rgba(${r},${gc},${b},${g.o})`);
      eg.addColorStop(0.5, `rgba(${r},${gc},${b},${g.o * 0.4})`);
      eg.addColorStop(1, `rgba(${r},${gc},${b},0)`);
      ctx.fillStyle = eg;
      ctx.fillRect(-g.size, -g.size, g.size * 2, g.size * 2);
    } else {
      for (let k = 0; k < 12; k++) {
        const px = rand(-g.size, g.size);
        const py = rand(-g.size * 0.5, g.size * 0.5);
        ctx.beginPath();
        ctx.arc(px, py, rand(0.3, 1.2), 0, TAU);
        ctx.fillStyle = `rgba(${r},${gc},${b},${(g.o * rand(0.3, 0.8)).toFixed(3)})`;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawDeepGalaxies() {
    deepGalaxies.forEach(drawDeepGalaxy);
  }

  /* ══════════════════════════════════════════════════════
     §4  DARK MATTER FILAMENT WEB
  ══════════════════════════════════════════════════════ */
  const N_NODES = IS_MOB ? 12 : 28;
  let filNodes = [];

  function spawnFilaments() {
    filNodes = Array.from({ length: N_NODES }, () => ({
      x: rand(0, W), y: rand(0, H),
      vx: rand(-0.04, 0.04), vy: rand(-0.04, 0.04),
    }));
  }

  function drawFilaments() {
    const MAX_D = IS_MOB ? W * 0.38 : W * 0.32;
    filNodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    });
    ctx.lineWidth = 0.4;
    for (let i = 0; i < filNodes.length; i++) {
      for (let j = i + 1; j < filNodes.length; j++) {
        const dx = filNodes[i].x - filNodes[j].x;
        const dy = filNodes[i].y - filNodes[j].y;
        const d  = Math.hypot(dx, dy);
        if (d < MAX_D) {
          const a = 0.04 * (1 - d / MAX_D);
          ctx.beginPath();
          ctx.moveTo(filNodes[i].x, filNodes[i].y);
          ctx.lineTo(filNodes[j].x, filNodes[j].y);
          ctx.strokeStyle = `rgba(120,100,180,${a.toFixed(4)})`;
          ctx.stroke();
        }
      }
    }
  }

  /* ══════════════════════════════════════════════════════
     §5  AURORA VEIL
  ══════════════════════════════════════════════════════ */
  const AURORA_BANDS = IS_MOB ? 3 : 6;

  function drawAurora() {
    const aT = T * 0.0008;
    for (let i = 0; i < AURORA_BANDS; i++) {
      const phase = i * (TAU / AURORA_BANDS) + aT;
      const baseX = W * (0.1 + i * 0.15);
      const width = W * rand(0.06, 0.14);
      const topY  = H * 0.0;
      const botY  = H * (0.25 + 0.1 * Math.sin(phase * 2.3));

      const cols = [
        [80, 220, 160],
        [60, 180, 220],
        [140, 80, 255],
        [0, 200, 180],
      ];
      const [r, g, b] = cols[i % cols.length];
      const alpha = 0.018 + 0.012 * Math.sin(aT * 3 + i);

      const ag = ctx.createLinearGradient(baseX, topY, baseX + width * Math.sin(phase), botY);
      ag.addColorStop(0,    `rgba(${r},${g},${b},0)`);
      ag.addColorStop(0.25, `rgba(${r},${g},${b},${alpha})`);
      ag.addColorStop(0.6,  `rgba(${r},${g},${b},${alpha * 0.6})`);
      ag.addColorStop(1,    `rgba(${r},${g},${b},0)`);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(baseX, topY);
      for (let y = 0; y <= botY; y += 8) {
        const wave = Math.sin(y * 0.025 + aT * 4 + i) * width * 0.3;
        ctx.lineTo(baseX + wave, y);
      }
      ctx.lineTo(baseX + width + Math.sin(aT * 3 + i) * width * 0.4, botY);
      for (let y = botY; y >= 0; y -= 8) {
        const wave = Math.sin(y * 0.025 + aT * 4 + i + Math.PI) * width * 0.3;
        ctx.lineTo(baseX + width + wave, y);
      }
      ctx.closePath();
      ctx.fillStyle = ag;
      ctx.fill();
      ctx.restore();
    }
  }

  /* ══════════════════════════════════════════════════════
     §6  NEBULA CLOUDS
  ══════════════════════════════════════════════════════ */
  const NEBULAE = [
    { bx: 0.12, by: 0.22, r: 380, col: '140,80,200',  base: 0.038, spd: 0.70 },
    { bx: 0.80, by: 0.65, r: 320, col: '255,100,80',  base: 0.030, spd: 0.88 },
    { bx: 0.50, by: 0.10, r: 280, col: '60,120,200',  base: 0.028, spd: 0.62 },
    { bx: 0.88, by: 0.18, r: 220, col: '255,180,60',  base: 0.018, spd: 1.10 },
    { bx: 0.06, by: 0.80, r: 300, col: '80,200,160',  base: 0.022, spd: 0.78 },
    { bx: 0.55, by: 0.52, r: 200, col: '200,60,120',  base: 0.016, spd: 0.96 },
    { bx: 0.30, by: 0.42, r: 260, col: '255,220,100', base: 0.020, spd: 0.66 },
    { bx: 0.72, by: 0.85, r: 180, col: '100,220,255', base: 0.014, spd: 1.20 },
  ];

  function drawNebula() {
    nebulaT += 0.00028;
    NEBULAE.forEach((nb, i) => {
      const pulse   = 0.8 + 0.2 * Math.sin(nebulaT * TAU * nb.spd * 0.4 + i * 1.9);
      const nFactor = 1 + noise2(nb.bx * 300, nb.by * 300, nebulaT) * 0.18;
      const cx      = nb.bx * W + Math.sin(nebulaT * 1.1 + i) * 60;
      const cy      = nb.by * H + Math.cos(nebulaT * 0.85 + i * 1.5) * 45;
      const rr      = nb.r * pulse * nFactor;
      const a       = nb.base * pulse * 0.6;

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
      g.addColorStop(0,    `rgba(${nb.col},${a.toFixed(3)})`);
      g.addColorStop(0.35, `rgba(${nb.col},${(a * 0.38).toFixed(3)})`);
      g.addColorStop(0.70, `rgba(${nb.col},${(a * 0.09).toFixed(3)})`);
      g.addColorStop(1,    `rgba(${nb.col},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });
  }

  /* ══════════════════════════════════════════════════════
     §7  GLOBULAR STAR CLUSTERS
  ══════════════════════════════════════════════════════ */
  const N_CLUSTERS = IS_MOB ? 2 : 4;
  let clusters = [];

  function spawnClusters() {
    clusters = Array.from({ length: N_CLUSTERS }, () => {
      const cx = rand(W * 0.1, W * 0.9);
      const cy = rand(H * 0.1, H * 0.9);
      const radius = rand(IS_MOB ? 25 : 40, IS_MOB ? 55 : 100);
      const count  = IS_MOB ? 60 : 160;
      const stars  = Array.from({ length: count }, () => {
        const a = rand(0, TAU);
        const d = Math.abs(rand(0, 1) + rand(0, 1) - 1) * radius;
        return {
          x: cx + Math.cos(a) * d,
          y: cy + Math.sin(a) * d,
          r: rand(0.2, 0.9),
          o: rand(0.2, 0.85),
          twink: rand(0, TAU),
          twinkSpd: rand(0.005, 0.025),
          col: Math.random() > 0.7 ? [255, 200, 140] : [255, 245, 220],
        };
      });
      return { cx, cy, radius, stars };
    });
  }

  function drawClusters() {
    clusters.forEach(cl => {
      const cg = ctx.createRadialGradient(cl.cx, cl.cy, 0, cl.cx, cl.cy, cl.radius * 0.6);
      cg.addColorStop(0,   'rgba(255,230,180,0.04)');
      cg.addColorStop(0.5, 'rgba(255,210,140,0.015)');
      cg.addColorStop(1,   'rgba(255,200,100,0)');
      ctx.fillStyle = cg;
      ctx.fillRect(cl.cx - cl.radius, cl.cy - cl.radius, cl.radius * 2, cl.radius * 2);

      cl.stars.forEach(s => {
        s.twink += s.twinkSpd;
        const a = s.o * (0.5 + 0.5 * Math.sin(s.twink));
        const [r, g, b] = s.col;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
        ctx.fill();
      });
    });
  }

  /* ══════════════════════════════════════════════════════
     §8  TRI-LAYER STAR FIELD  — v5 Hubble Edition
  ══════════════════════════════════════════════════════ */
  const STAR_N = IS_MOB ? [120, 50, 18] : [340, 120, 40];
  const PAX    = [0.004, 0.012, 0.030];
  let stars    = [[], [], []];
  let constellations = [];

  function mkStar(layer) {
    const col         = pickSpectralColor();
    const baseR       = [0.3, 0.8, 1.8][layer];
    const superBright = layer === 2 && Math.random() < 0.15;
    // v5: more stars in layer 1 get spikes too
    const hasMedBloom = layer === 1 && Math.random() < 0.2;
    return {
      x: rand(0, W), y: rand(0, H),
      r: baseR + rand(0, [0.5, 0.9, 2.0][layer]),
      o: rand(0.3, 1.0),
      col,
      layer,
      twink:    rand(0, TAU),
      // v5: faster twinkle speeds
      twinkSpd: rand(0.018, 0.065),
      pulseT:   rand(0, TAU),
      pulseSpd: rand(0.003, 0.015),
      superBright,
      // v5: richer bloom, medium bloom for layer 1
      bloomR:   superBright ? rand(12, 30) : (hasMedBloom ? rand(6, 12) : 0),
      // v5: more stars get lens flare / spikes
      lensFlare: superBright || (layer === 1 && Math.random() < 0.25),
      // v5: spike parameters
      spikeLen: superBright ? rand(60, 180) : rand(20, 55),
      spikeAngle: rand(0, Math.PI * 0.25),
    };
  }

  function buildConstellations() {
    constellations = [];
    const fs = stars[0];
    const used = new Set();
    for (let i = 0; i < fs.length; i++) {
      if (used.has(i)) continue;
      for (let j = i + 1; j < fs.length; j++) {
        if (used.has(j)) continue;
        const d = Math.hypot(fs[i].x - fs[j].x, fs[i].y - fs[j].y);
        if (d < 80 && d > 25 && Math.random() < 0.10) {
          constellations.push({ i, j });
          used.add(i); used.add(j);
          break;
        }
      }
    }
  }

  function spawnStars() {
    for (let l = 0; l < 3; l++)
      stars[l] = Array.from({ length: STAR_N[l] }, () => mkStar(l));
    buildConstellations();
  }

  function drawStarLayer(layer) {
    const ox = (sm.x - W * 0.5) * PAX[layer];
    const oy = (sm.y - H * 0.5) * PAX[layer];
    stars[layer].forEach(s => {
      s.twink  += s.twinkSpd;
      s.pulseT += s.pulseSpd;

      // v5: harmonic multi-frequency twinkle — organic, not robotic
      const alpha  = clamp(
        s.o * (0.4 + 0.35 * Math.sin(s.twink) + 0.15 * Math.sin(s.twink * 2.7 + 1.3) + 0.1 * Math.sin(s.twink * 5.1)),
        0, 1
      );
      const pScale = 1 + 0.25 * Math.sin(s.pulseT);
      const sx = s.x + ox, sy = s.y + oy;
      const [r, g, b] = s.col;

      if (s.bloomR > 0) {
        const bloom = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.bloomR * pScale);
        // v5: white-hot core like real Hubble stars
        bloom.addColorStop(0,    `rgba(255,255,255,${(alpha * 1.0).toFixed(3)})`);
        bloom.addColorStop(0.08, `rgba(${r},${g},${b},${(alpha * 0.85).toFixed(3)})`);
        bloom.addColorStop(0.35, `rgba(${r},${g},${b},${(alpha * 0.25).toFixed(3)})`);
        bloom.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = bloom;
        const br = s.bloomR * pScale;
        ctx.fillRect(sx - br, sy - br, br * 2, br * 2);
      }

      // v5: Hubble-style 4-axis diffraction spikes
      if (s.lensFlare) {
        const fl = s.spikeLen * pScale * (0.8 + 0.2 * Math.sin(s.twink * 2));
        // 4 spike axes: 2 main (full intensity) + 2 diagonal (half intensity)
        const angles      = [s.spikeAngle, s.spikeAngle + Math.PI * 0.5, s.spikeAngle + Math.PI * 0.25, s.spikeAngle - Math.PI * 0.25];
        const spikeAlphas = [alpha * 0.9,  alpha * 0.9,                  alpha * 0.45,                  alpha * 0.45];
        const spikeWidths = [0.8,          0.8,                          0.4,                           0.4];

        angles.forEach((ang, idx) => {
          const ex = sx + Math.cos(ang) * fl;
          const ey = sy + Math.sin(ang) * fl;
          const ex2 = sx - Math.cos(ang) * fl;
          const ey2 = sy - Math.sin(ang) * fl;

          // Positive direction spike
          const sg1 = ctx.createLinearGradient(sx, sy, ex, ey);
          sg1.addColorStop(0,    `rgba(${r},${g},${b},${spikeAlphas[idx].toFixed(3)})`);
          sg1.addColorStop(0.15, `rgba(${r},${g},${b},${(spikeAlphas[idx] * 0.6).toFixed(3)})`);
          sg1.addColorStop(0.5,  `rgba(${r},${g},${b},${(spikeAlphas[idx] * 0.15).toFixed(3)})`);
          sg1.addColorStop(1,    `rgba(${r},${g},${b},0)`);
          ctx.lineWidth   = spikeWidths[idx];
          ctx.strokeStyle = sg1;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();

          // Negative direction spike
          const sg2 = ctx.createLinearGradient(sx, sy, ex2, ey2);
          sg2.addColorStop(0,    `rgba(${r},${g},${b},${spikeAlphas[idx].toFixed(3)})`);
          sg2.addColorStop(0.15, `rgba(${r},${g},${b},${(spikeAlphas[idx] * 0.6).toFixed(3)})`);
          sg2.addColorStop(0.5,  `rgba(${r},${g},${b},${(spikeAlphas[idx] * 0.15).toFixed(3)})`);
          sg2.addColorStop(1,    `rgba(${r},${g},${b},0)`);
          ctx.strokeStyle = sg2;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex2, ey2); ctx.stroke();
        });
      }

      // v5: size pulse + color temperature shimmer
      const radiusMod = 1 + 0.18 * Math.sin(s.twink * 1.6 + 0.8);
      const shimmer   = Math.sin(s.twink * 0.8) * 18;
      ctx.beginPath();
      ctx.arc(sx, sy, s.r * (s.superBright ? pScale : radiusMod), 0, TAU);
      ctx.fillStyle = `rgba(${clamp(r + shimmer, 0, 255)},${g},${clamp(b - shimmer, 0, 255)},${alpha.toFixed(3)})`;
      ctx.fill();
    });
  }

  function drawConstellations() {
    const fs = stars[0];
    const ox = (sm.x - W * 0.5) * PAX[0];
    const oy = (sm.y - H * 0.5) * PAX[0];
    ctx.strokeStyle = 'rgba(180,160,120,0.04)';
    ctx.lineWidth = 0.35;
    constellations.forEach(({ i, j }) => {
      if (i >= fs.length || j >= fs.length) return;
      ctx.beginPath();
      ctx.moveTo(fs[i].x + ox, fs[i].y + oy);
      ctx.lineTo(fs[j].x + ox, fs[j].y + oy);
      ctx.stroke();
    });
  }

  function drawStars() {
    drawStarLayer(0);
    drawConstellations();
    drawStarLayer(1);
    drawStarLayer(2);
  }

  /* ══════════════════════════════════════════════════════
     §9  BINARY STAR SYSTEM
  ══════════════════════════════════════════════════════ */
  const BINARIES = IS_MOB ? 1 : 2;
  let binarySystems = [];

  function spawnBinaries() {
    binarySystems = Array.from({ length: BINARIES }, () => ({
      cx:    rand(W * 0.15, W * 0.85),
      cy:    rand(H * 0.15, H * 0.85),
      orbitR: rand(IS_MOB ? 12 : 18, IS_MOB ? 28 : 48),
      angle:  rand(0, TAU),
      speed:  rand(0.003, 0.008),
      starA:  { col: SPECTRAL.O, r: rand(2.5, 4.5), bloomR: rand(14, 28) },
      starB:  { col: SPECTRAL.M, r: rand(1.5, 3.0), bloomR: rand(8, 18) },
      trail:  [],
    }));
  }

  function drawBinaries() {
    binarySystems.forEach(sys => {
      sys.angle += sys.speed;
      const ax = sys.cx + Math.cos(sys.angle) * sys.orbitR;
      const ay = sys.cy + Math.sin(sys.angle) * sys.orbitR;
      const bx = sys.cx - Math.cos(sys.angle) * sys.orbitR * 0.6;
      const by = sys.cy - Math.sin(sys.angle) * sys.orbitR * 0.6;

      [[ax, ay, sys.starA], [bx, by, sys.starB]].forEach(([sx, sy, star]) => {
        const [r, g, b] = star.col;
        const bloom = ctx.createRadialGradient(sx, sy, 0, sx, sy, star.bloomR);
        bloom.addColorStop(0,   `rgba(${r},${g},${b},0.7)`);
        bloom.addColorStop(0.4, `rgba(${r},${g},${b},0.15)`);
        bloom.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = bloom;
        ctx.fillRect(sx - star.bloomR, sy - star.bloomR, star.bloomR * 2, star.bloomR * 2);
        ctx.beginPath();
        ctx.arc(sx, sy, star.r, 0, TAU);
        ctx.fillStyle = `rgba(${r},${g},${b},0.95)`;
        ctx.fill();
      });

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      const cpx = (ax + bx) * 0.5 + Math.sin(sys.angle + Math.PI * 0.5) * sys.orbitR * 0.35;
      const cpy = (ay + by) * 0.5 + Math.cos(sys.angle + Math.PI * 0.5) * sys.orbitR * 0.35;
      ctx.quadraticCurveTo(cpx, cpy, bx, by);
      ctx.strokeStyle = 'rgba(200,180,255,0.06)';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    });
  }

  /* ══════════════════════════════════════════════════════
     §10  PULSAR
  ══════════════════════════════════════════════════════ */
  const N_PULSARS = IS_MOB ? 1 : 2;
  let pulsars = [];

  function spawnPulsars() {
    pulsars = Array.from({ length: N_PULSARS }, () => ({
      x: rand(W * 0.1, W * 0.9),
      y: rand(H * 0.1, H * 0.9),
      angle: rand(0, TAU),
      speed: rand(0.025, 0.06),
      beamLen: rand(W * 0.12, W * 0.28),
      r: rand(2, 4),
      pulseT: rand(0, TAU),
    }));
  }

  function drawPulsars() {
    pulsars.forEach(p => {
      p.angle += p.speed;
      p.pulseT += 0.08;
      const intensity = 0.5 + 0.5 * Math.sin(p.pulseT);

      for (let side = 0; side < 2; side++) {
        const jetAngle = p.angle + side * Math.PI;
        const ex = p.x + Math.cos(jetAngle) * p.beamLen;
        const ey = p.y + Math.sin(jetAngle) * p.beamLen;

        const jg = ctx.createLinearGradient(p.x, p.y, ex, ey);
        jg.addColorStop(0,    `rgba(180,220,255,${0.55 * intensity})`);
        jg.addColorStop(0.12, `rgba(140,200,255,${0.25 * intensity})`);
        jg.addColorStop(0.5,  `rgba(100,160,255,${0.08 * intensity})`);
        jg.addColorStop(1,    'rgba(80,120,255,0)');

        ctx.save();
        ctx.beginPath();
        const perpX = Math.sin(jetAngle) * 3;
        const perpY = -Math.cos(jetAngle) * 3;
        ctx.moveTo(p.x - perpX, p.y - perpY);
        ctx.lineTo(ex - perpX * 0.05, ey);
        ctx.lineTo(ex + perpX * 0.05, ey);
        ctx.lineTo(p.x + perpX, p.y + perpY);
        ctx.closePath();
        ctx.fillStyle = jg;
        ctx.fill();
        ctx.restore();
      }

      const [r, g, b] = [200, 230, 255];
      const bg2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
      bg2.addColorStop(0,   `rgba(${r},${g},${b},0.9)`);
      bg2.addColorStop(0.4, `rgba(${r},${g},${b},0.3)`);
      bg2.addColorStop(1,   `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = bg2;
      ctx.fillRect(p.x - p.r * 5, p.y - p.r * 5, p.r * 10, p.r * 10);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fillStyle = `rgba(${r},${g},${b},1)`;
      ctx.fill();
    });
  }

  /* ══════════════════════════════════════════════════════
     §11  GAS GIANT PLANET
  ══════════════════════════════════════════════════════ */
  let planet = null;

  function spawnPlanet() {
    planet = {
      x:    W * rand(0.62, 0.82),
      y:    H * rand(0.55, 0.75),
      r:    IS_MOB ? rand(18, 28) : rand(28, 48),
      hue:  rand(20, 50),
      tilt: rand(0.12, 0.28),
      rot:  0,
      rotSpd: 0.0004,
    };
  }

  function drawPlanet() {
    if (!planet) return;
    planet.rot += planet.rotSpd;
    const { x, y, r } = planet;

    ctx.save();
    ctx.translate(x, y);

    const pg = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
    pg.addColorStop(0,    'rgba(255,200,120,0.95)');
    pg.addColorStop(0.25, 'rgba(220,150,80,0.92)');
    pg.addColorStop(0.55, 'rgba(180,100,50,0.88)');
    pg.addColorStop(0.8,  'rgba(120,70,30,0.85)');
    pg.addColorStop(1,    'rgba(60,30,10,0.80)');
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r, 0, 0, TAU);
    ctx.fillStyle = pg;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r, 0, 0, TAU);
    ctx.clip();
    const bandColors = [
      'rgba(255,210,140,0.15)', 'rgba(180,110,60,0.12)',
      'rgba(220,160,90,0.10)',  'rgba(140,80,40,0.12)',
    ];
    for (let i = 0; i < bandColors.length; i++) {
      const by = -r + i * (r * 0.55);
      const bh = r * 0.3;
      ctx.fillStyle = bandColors[i];
      ctx.fillRect(-r, by, r * 2, bh);
    }
    ctx.restore();

    const ld = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r);
    ld.addColorStop(0,   'rgba(0,0,0,0)');
    ld.addColorStop(0.7, 'rgba(0,0,0,0.08)');
    ld.addColorStop(1,   'rgba(0,0,0,0.55)');
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r, 0, 0, TAU);
    ctx.fillStyle = ld;
    ctx.fill();

    ctx.save();
    ctx.rotate(planet.tilt);
    ctx.scale(1, 0.18);

    const ringInner = r * 1.45;
    const ringOuter = r * 2.6;
    const rg = ctx.createRadialGradient(0, 0, ringInner, 0, 0, ringOuter);
    rg.addColorStop(0,    'rgba(200,170,120,0.0)');
    rg.addColorStop(0.15, 'rgba(200,170,120,0.22)');
    rg.addColorStop(0.45, 'rgba(180,150,100,0.35)');
    rg.addColorStop(0.72, 'rgba(160,130,80,0.20)');
    rg.addColorStop(1,    'rgba(140,110,60,0.0)');

    ctx.beginPath();
    ctx.ellipse(0, 0, ringOuter, ringOuter, 0, Math.PI, TAU);
    ctx.ellipse(0, 0, ringInner, ringInner, 0, TAU, Math.PI, true);
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.rotate(planet.tilt);
    ctx.scale(1, 0.18);
    ctx.beginPath();
    ctx.ellipse(0, 0, ringOuter, ringOuter, 0, 0, Math.PI);
    ctx.ellipse(0, 0, ringInner, ringInner, 0, Math.PI, 0, true);
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════
     §12  MAGNETAR LIGHTNING ARCS
  ══════════════════════════════════════════════════════ */
  let magnetarArcs = [];
  let magnetarT    = 0;

  function spawnMagnetarArc() {
    const sx = rand(W * 0.1, W * 0.9);
    const sy = rand(H * 0.1, H * 0.9);
    const len = rand(40, 130);
    const angle = rand(0, TAU);
    const segs  = randI(4, 9);
    const pts   = [{ x: sx, y: sy }];
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      const ex = sx + Math.cos(angle) * len * t;
      const ey = sy + Math.sin(angle) * len * t;
      pts.push({
        x: ex + rand(-12, 12),
        y: ey + rand(-12, 12),
      });
    }
    magnetarArcs.push({ pts, o: 0.7, decay: rand(0.025, 0.06), col: Math.random() > 0.5 ? [120,180,255] : [200,120,255] });
  }

  function drawMagnetarArcs() {
    magnetarT += 1;
    if (Math.random() < 0.022 && magnetarArcs.length < (IS_MOB ? 3 : 6)) spawnMagnetarArc();

    magnetarArcs = magnetarArcs.filter(a => a.o > 0.02);
    magnetarArcs.forEach(a => {
      a.o -= a.decay;
      const [r, g, b] = a.col;
      ctx.save();
      ctx.shadowBlur  = 8;
      ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
      ctx.strokeStyle = `rgba(${r},${g},${b},${a.o.toFixed(3)})`;
      ctx.lineWidth   = 0.8;
      ctx.beginPath();
      ctx.moveTo(a.pts[0].x, a.pts[0].y);
      for (let i = 1; i < a.pts.length; i++) ctx.lineTo(a.pts[i].x, a.pts[i].y);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    });
  }

  /* ══════════════════════════════════════════════════════
     §13  SOLAR FLARE / CME ARCS
  ══════════════════════════════════════════════════════ */
  let solarFlares = [];

  function spawnSolarFlare() {
    if (solarFlares.length >= (IS_MOB ? 2 : 4)) return;
    const sys = binarySystems[0];
    if (!sys) return;
    const baseAngle = rand(0, TAU);
    const arcLen = rand(60, 160);
    solarFlares.push({
      x: sys.cx, y: sys.cy,
      baseAngle,
      arcLen,
      t: 0,
      maxT: rand(60, 120),
      col: [255, rand(120,200), 60],
    });
  }

  function drawSolarFlares() {
    if (Math.random() < 0.008) spawnSolarFlare();
    solarFlares = solarFlares.filter(f => f.t < f.maxT);
    solarFlares.forEach(f => {
      f.t += 1;
      const progress = f.t / f.maxT;
      const alpha = Math.sin(progress * Math.PI) * 0.5;
      const spread = progress * f.arcLen;
      const [r, g, b] = f.col;

      ctx.save();
      ctx.translate(f.x, f.y);
      const a1 = f.baseAngle - 0.3;
      const a2 = f.baseAngle + 0.3;
      const cpLen = spread * 0.8;
      const sx1 = Math.cos(a1) * 12, sy1 = Math.sin(a1) * 12;
      const sx2 = Math.cos(a2) * 12, sy2 = Math.sin(a2) * 12;
      const cpx = Math.cos(f.baseAngle) * cpLen;
      const cpy = Math.sin(f.baseAngle) * cpLen;

      ctx.beginPath();
      ctx.moveTo(sx1, sy1);
      ctx.quadraticCurveTo(cpx, cpy, sx2, sy2);
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cpx * 0.9, cpy * 0.9, 2, 0, TAU);
      ctx.fillStyle = `rgba(255,240,200,${(alpha * 1.5).toFixed(3)})`;
      ctx.fill();
      ctx.restore();
    });
  }

  /* ══════════════════════════════════════════════════════
     §14  WORMHOLE PORTAL
  ══════════════════════════════════════════════════════ */
  let wormhole = null;

  function spawnWormhole() {
    wormhole = {
      x: W * rand(0.05, 0.25),
      y: H * rand(0.55, 0.85),
      r: IS_MOB ? rand(18, 32) : rand(28, 52),
      rot: 0,
      rotSpd: 0.006,
      pulseT: 0,
    };
  }

  function drawWormhole() {
    if (!wormhole) return;
    wormhole.rot += wormhole.rotSpd;
    wormhole.pulseT += 0.02;
    const { x, y, r } = wormhole;
    const pulse = 0.85 + 0.15 * Math.sin(wormhole.pulseT);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(wormhole.rot);

    const vg = ctx.createRadialGradient(0, 0, 0, 0, 0, r * pulse);
    vg.addColorStop(0,    'rgba(0,0,0,1)');
    vg.addColorStop(0.55, 'rgba(0,5,20,0.95)');
    vg.addColorStop(0.80, 'rgba(20,0,60,0.6)');
    vg.addColorStop(1,    'rgba(60,0,120,0)');
    ctx.beginPath();
    ctx.ellipse(0, 0, r * pulse, r * pulse * 0.62, 0, 0, TAU);
    ctx.fillStyle = vg;
    ctx.fill();

    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * TAU + wormhole.rot * 2;
      const innerR = r * 0.3 * pulse;
      const outerR = r * 0.95 * pulse;
      const sx2 = Math.cos(ang) * innerR;
      const sy2 = Math.sin(ang) * innerR * 0.62;
      const ex2 = Math.cos(ang + 0.4) * outerR;
      const ey2 = Math.sin(ang + 0.4) * outerR * 0.62;
      const a = 0.12 + 0.08 * Math.sin(wormhole.pulseT * 2 + i);
      ctx.beginPath();
      ctx.moveTo(sx2, sy2);
      ctx.lineTo(ex2, ey2);
      ctx.strokeStyle = `rgba(140,60,255,${a.toFixed(3)})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }

    const hg = ctx.createRadialGradient(0, 0, r * 0.7, 0, 0, r * 2.2);
    hg.addColorStop(0,   'rgba(100,40,200,0.08)');
    hg.addColorStop(0.4, 'rgba(60,20,160,0.04)');
    hg.addColorStop(1,   'rgba(40,10,100,0)');
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 2.2, r * 2.2 * 0.62, 0, 0, TAU);
    ctx.fillStyle = hg;
    ctx.fill();

    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════
     §15  GALAXY FLOW PARTICLES
  ══════════════════════════════════════════════════════ */
  const PART_N = IS_MOB ? 55 : 140;
  let parts = [];

  function flowField(x, y) {
    const cx1 = W * (0.45 + 0.07 * Math.sin(T * 0.002));
    const cy1 = H * (0.50 + 0.05 * Math.cos(T * 0.0017));
    const spiral = (px, py, cx, cy, str) => {
      const dx = px - cx, dy = py - cy;
      const d = Math.hypot(dx, dy) + 1;
      const ang = Math.atan2(dy, dx) + Math.PI * 0.5;
      const pull = clamp(1 - d / (Math.max(W, H) * 0.55), 0, 1) * str;
      return { vx: Math.cos(ang) * pull, vy: Math.sin(ang) * pull };
    };
    const s1 = spiral(x, y, cx1, cy1, 0.22);
    const noiseAng = noise2(x * 0.004, y * 0.004, T * 0.006) * TAU;
    return { vx: s1.vx + Math.cos(noiseAng) * 0.10, vy: s1.vy + Math.sin(noiseAng) * 0.10 };
  }

  function mkParticle() {
    const layer = randI(0, 3);
    return {
      x: rand(0, W), y: rand(0, H),
      vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3),
      r: rand(0.4, 2.2), o: rand(0.15, 0.7),
      col: pickSpectralColor(),
      layer,
      pulse: rand(0, TAU), pulseSpd: rand(0.010, 0.030),
      glow: Math.random() > 0.6,
    };
  }

  function spawnParticles() {
    parts = Array.from({ length: PART_N }, mkParticle);
  }

  function updateDrawParticles() {
    const mx = raw.x, my = raw.y;
    const hasMouse = mx > -1000 && my > -1000;

    parts.forEach(p => {
      p.pulse += p.pulseSpd;
      const flow = flowField(p.x, p.y);
      p.vx += flow.vx * 0.038;
      p.vy += flow.vy * 0.038;
      p.vx *= 0.984; p.vy *= 0.984;
      const cap = [0.7, 1.1, 1.6][p.layer];
      const spd = Math.hypot(p.vx, p.vy);
      if (spd > cap) { p.vx = (p.vx / spd) * cap; p.vy = (p.vy / spd) * cap; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < -6) p.x = W + 6; else if (p.x > W + 6) p.x = -6;
      if (p.y < -6) p.y = H + 6; else if (p.y > H + 6) p.y = -6;

      if (hasMouse) {
        const dx = p.x - mx, dy = p.y - my;
        const d = Math.hypot(dx, dy);
        if (d < 120 && d > 1) {
          const f = (1 - d / 120) * 0.28;
          p.vx += (dx / d) * f; p.vy += (dy / d) * f;
        }
      }
    });

    parts.forEach(p => {
      const [r, g, b] = p.col;
      const ox = (sm.x - W * 0.5) * PAX[p.layer];
      const oy = (sm.y - H * 0.5) * PAX[p.layer];
      const alpha = p.o * (0.4 + 0.6 * Math.sin(p.pulse));
      if (p.glow) { ctx.shadowBlur = 10; ctx.shadowColor = `rgba(${r},${g},${b},0.6)`; }
      ctx.beginPath();
      ctx.arc(p.x + ox, p.y + oy, p.r, 0, TAU);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
      ctx.fill();
      if (p.glow) ctx.shadowBlur = 0;
    });
  }

  /* ══════════════════════════════════════════════════════
     §16  COMETS
  ══════════════════════════════════════════════════════ */
  const MAX_COMETS = IS_MOB ? 2 : 5;
  let comets = [];

  function mkComet() {
    if (comets.length >= MAX_COMETS) return;
    const spd = rand(10, 20);
    const angle = rand(0.2, 1.1);
    comets.push({
      x: Math.random() < 0.6 ? rand(0, W) : -40,
      y: Math.random() < 0.6 ? -40 : rand(0, H * 0.5),
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
      ax: rand(-0.04, 0.04), ay: rand(0, 0.03),
      trail: [], maxTrl: randI(16, 30),
      width: rand(0.8, 2.5), opacity: 1,
      col: Math.random() > 0.4 ? [255, 220, 140] : [220, 235, 255],
    });
  }

  function drawComets() {
    if (Math.random() < 0.003) mkComet();
    comets = comets.filter(c => c.opacity > 0.02);
    comets.forEach(c => {
      c.vx += c.ax; c.vy += c.ay;
      c.trail.push({ x: c.x, y: c.y });
      if (c.trail.length > c.maxTrl) c.trail.shift();
      for (let i = 1; i < c.trail.length; i++) {
        const t = i / c.trail.length;
        const [r, g, b] = c.col;
        ctx.beginPath();
        ctx.moveTo(c.trail[i-1].x, c.trail[i-1].y);
        ctx.lineTo(c.trail[i].x, c.trail[i].y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${(t * c.opacity * 0.6).toFixed(3)})`;
        ctx.lineWidth = c.width * t;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      const [r, g, b] = c.col;
      ctx.shadowBlur = 18; ctx.shadowColor = `rgba(${r},${g},${b},${c.opacity})`;
      ctx.beginPath(); ctx.arc(c.x, c.y, c.width * 1.4, 0, TAU);
      ctx.fillStyle = `rgba(255,255,255,${c.opacity * 0.9})`; ctx.fill();
      ctx.shadowBlur = 0;
      c.x += c.vx; c.y += c.vy; c.opacity -= 0.006;
    });
  }

  /* ══════════════════════════════════════════════════════
     §17  SHOOTING STARS
  ══════════════════════════════════════════════════════ */
  const MAX_SS = 4;
  let sStar = [];

  function drawShootingStars() {
    if (Math.random() < 0.004 && sStar.length < MAX_SS) {
      sStar.push({
        x: rand(0, W * 0.85), y: rand(0, H * 0.45),
        len: rand(80, 220), spd: rand(12, 22),
        opacity: 1, angle: Math.PI * 0.25 + rand(-0.4, 0.4),
        width: rand(0.7, 2.0),
        col: Math.random() > 0.4 ? [255, 255, 255] : [255, 220, 140],
      });
    }
    sStar = sStar.filter(s => s.opacity > 0.01);
    sStar.forEach(s => {
      const tx = s.x + Math.cos(s.angle) * s.len;
      const ty = s.y + Math.sin(s.angle) * s.len;
      const [r, g, b] = s.col;
      const sg = ctx.createLinearGradient(s.x, s.y, tx, ty);
      sg.addColorStop(0,    `rgba(${r},${g},${b},0)`);
      sg.addColorStop(0.3,  `rgba(${r},${g},${b},${(s.opacity * 0.5).toFixed(3)})`);
      sg.addColorStop(1,    `rgba(255,255,255,${s.opacity.toFixed(3)})`);
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tx, ty);
      ctx.strokeStyle = sg; ctx.lineWidth = s.width; ctx.lineCap = 'round'; ctx.stroke();
      s.x += Math.cos(s.angle) * s.spd;
      s.y += Math.sin(s.angle) * s.spd;
      s.opacity -= 0.010;
    });
  }

  /* ══════════════════════════════════════════════════════
     §18  CURSOR LIGHT HALO
  ══════════════════════════════════════════════════════ */
  function drawCursorLight() {
    const mx = raw.x, my = raw.y;
    if (mx < -999) return;
    const og = ctx.createRadialGradient(mx, my, 0, mx, my, 260);
    og.addColorStop(0,   'rgba(255,245,200,0.06)');
    og.addColorStop(0.4, 'rgba(255,240,180,0.02)');
    og.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = og; ctx.fillRect(0, 0, W, H);
  }

  /* ══════════════════════════════════════════════════════
     REBUILD + RENDER LOOP
  ══════════════════════════════════════════════════════ */
  function rebuildAll() {
    spawnMWStars();
    spawnDeepGalaxies();
    spawnFilaments();
    spawnStars();
    spawnClusters();
    spawnBinaries();
    spawnPulsars();
    spawnPlanet();
    spawnWormhole();
    spawnParticles();
    comets = []; sStar = [];
    magnetarArcs = []; solarFlares = [];
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    const dt = clamp((now - lastTime) / 16.667, 0.25, 3.5);
    lastTime = now; T += dt;

    const tx = raw.x > -999 ? raw.x : W * 0.5;
    const ty = raw.y > -999 ? raw.y : H * 0.5;
    if (sm.x < 0) { sm.x = tx; sm.y = ty; }
    sm.x = lerp(sm.x, tx, 0.05);
    sm.y = lerp(sm.y, ty, 0.05);

    ctx.clearRect(0, 0, W, H);

    // ── DRAW ORDER: back → front ──
    drawBackground();        // pure black + blue vignette
    drawMilkyWay();          // MW band + dust
    drawFilaments();         // dark matter web
    drawDeepGalaxies();      // distant galaxies
    drawNebula();            // emission/reflection nebulae
    drawAurora();            // aurora curtains
    drawClusters();          // globular clusters
    drawStars();             // tri-layer star field (Hubble twinkle + spikes)
    drawWormhole();          // wormhole portal
    drawPlanet();            // gas giant
    drawBinaries();          // binary systems
    drawPulsars();           // pulsar jets
    drawMagnetarArcs();      // lightning arcs
    drawSolarFlares();       // CME arcs
    updateDrawParticles();   // galaxy flow particles
    drawComets();            // comets
    drawShootingStars();     // shooting stars
    drawCursorLight();       // cursor halo
  }

  resize();
  rebuildAll();
  raf = requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else { lastTime = performance.now(); raf = requestAnimationFrame(frame); }
  });

})();