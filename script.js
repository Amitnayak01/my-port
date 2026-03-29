/* ══════════════════════════════════════════════════════════════════
   HUD RING CANVAS  —  Arc Reactor Edition  v6.0  (COMPRESSED + 3D)
   ✦ Rings pulled TIGHT — no sprawl, maximum density
   ✦ 3× faster rotation + energy flow
   ✦ Dramatic perspective tilt (CSS 3D, 500px POV)
   ✦ 3D depth illusion: rings drawn as perspective ellipses on tilt
   ✦ All original logic preserved and extended
══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const wrap = document.getElementById('heroImgWrap');
  if (!wrap) return;

  /* ─────────────────────── Canvas ─────────────────────── */
  const canvas = document.createElement('canvas');
  canvas.id = 'heroHudRing';
  const SIZE = 720;
  canvas.width  = SIZE;
  canvas.height = SIZE;
  canvas.style.cssText = [
    `width:${SIZE}px`,
    `height:${SIZE}px`,
    'position:absolute',
    'top:50%',
    'left:50%',
    'transform:translate(-50%,-50%)',
    'pointer-events:none',
    'z-index:0',
  ].join(';');
  wrap.style.overflow = 'visible';
  /* give the wrap a 3-D stage so CSS perspective works on the canvas */
  wrap.style.perspective      = '700px';
  wrap.style.transformStyle   = 'preserve-3d';
  wrap.insertBefore(canvas, wrap.firstChild);

  const ctx = canvas.getContext('2d');
  const cx  = SIZE / 2;
  const cy  = SIZE / 2;

  function getBase() {
    const r = wrap.getBoundingClientRect();
    return Math.min(r.width, r.height) / 2;
  }
  let BASE = getBase();
  window.addEventListener('resize', () => { BASE = getBase(); });

  /* ─────────────────────── Palette ─────────────────────── */
  const GOLD  = [201, 169, 110];
  const GOLDL = [232, 213, 176];
  const GOLDX = [255, 235, 180];
  const CREAM = [255, 245, 220];
  const WHITE = [255, 255, 255];
  const CYAN  = [180, 240, 255];
  const CYANX = [210, 248, 255];
  const HOT   = [255, 180,  80];

  function rgba(col, a) {
    return `rgba(${col[0]},${col[1]},${col[2]},${+a.toFixed(3)})`;
  }

  /* ─────────────────────── State ─────────────────────── */
  let t             = 0;
  let radarAngle    = 0;
  let hoverActive   = false;
  let hoverX        = 0;
  let hoverY        = 0;
  let mouseRingAngle = 0;
  let mouseRingDist  = 0;
  let targetTiltX   = 0;
  let targetTiltY   = 0;
  let tiltX         = 0;
  let tiltY         = 0;

  /* click state */
  let clickShock    = 0;
  let clickPulse    = 0;
  let clickFlash    = 0;
  let clickX        = cx;
  let clickY        = cy;
  let shockRipples  = [];

  /* energy-flow */
  let energyFlow    = 0;

  /* ─────────────────────── Mouse ─────────────────────── */
  document.addEventListener('mousemove', e => {
    const r  = wrap.getBoundingClientRect();
    const hx = r.left + r.width  / 2;
    const hy = r.top  + r.height / 2;
    const dx = e.clientX - hx;
    const dy = e.clientY - hy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxD = r.width * 0.75;
    mouseRingAngle = Math.atan2(dy, dx);
    mouseRingDist  = Math.min(dist / maxD, 1);
    hoverX         = dx / maxD;
    hoverY         = dy / maxD;
    /* ↑ 22° tilt range for a dramatic 3-D lean */
    targetTiltX    = -hoverY * 22;
    targetTiltY    =  hoverX * 22;
    hoverActive    = dist < r.width * 0.82;
  });

  document.addEventListener('click', e => {
    const r   = wrap.getBoundingClientRect();
    const dx  = e.clientX - (r.left + r.width  / 2);
    const dy  = e.clientY - (r.top  + r.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > r.width * 0.82) return;

    clickX     = cx + dx;
    clickY     = cy + dy;
    clickShock = 1.0;
    clickPulse = 4.0;
    clickFlash = 1.0;

    for (let i = 0; i < 3; i++) {
      shockRipples.push({ r: BASE * 0.05, maxR: BASE * (2.0 + i * 0.35), alpha: 1, delay: i * 5 });
    }
    spawnClickBurst(cx + dx, cy + dy, 60);
  });

  /* ─────────────────────── Helpers ─────────────────────── */
  function getSpeedMult() {
    return (hoverActive ? 1.4 : 1.0) + clickPulse * 0.5;
  }

  function distFromMouse(px, py) {
    const mxCanvas = cx + hoverX * BASE * 0.75;
    const myCanvas = cy + hoverY * BASE * 0.75;
    return Math.sqrt((px - mxCanvas) ** 2 + (py - myCanvas) ** 2);
  }

  /* ─────────────────────── 3-D ring helper ─────────────────
     Draws a ring (or arc) as a perspective ellipse based on current tilt,
     creating the illusion of a flat disc tilted in 3-D space.
  ────────────────────────────────────────────────────────── */
  function drawRing3D(radius, startAngle, endAngle, full) {
    /* tilt in radians (small-angle — visually driven) */
    const tiltXRad = tiltX * (Math.PI / 180) * 0.55;
    const tiltYRad = tiltY * (Math.PI / 180) * 0.55;

    /* the ring lives in XZ plane; tilt collapses Y by cos of pitch */
    const cosPitch = Math.cos(tiltXRad);
    const sinPitch = Math.sin(tiltXRad);
    const cosYaw   = Math.cos(tiltYRad);
    const sinYaw   = Math.sin(tiltYRad);

    /* step through the ring and project each point */
    const STEPS = full ? 80 : Math.max(24, Math.round((endAngle - startAngle) / (Math.PI * 2) * 80));
    ctx.beginPath();
    for (let i = 0; i <= STEPS; i++) {
      const a = full
        ? (i / STEPS) * Math.PI * 2
        : startAngle + (i / STEPS) * (endAngle - startAngle);
      /* ring in XZ */
      const rx = Math.cos(a) * radius;
      const rz = Math.sin(a) * radius;
      /* apply pitch (tiltX) around X-axis  => rz becomes y-offset */
      const projX = rx * cosYaw + rz * sinYaw;
      const projY = -(rx * sinYaw * sinPitch) + rz * cosPitch;
      if (i === 0) ctx.moveTo(cx + projX, cy + projY);
      else         ctx.lineTo(cx + projX, cy + projY);
    }
    if (full) ctx.closePath();
  }

  /* ══════════════════════════════════════════════════════
     ①  ARC REACTOR PANEL LIGHTS  (radii compressed)
  ══════════════════════════════════════════════════════ */
  /* r values: scale factor applied → new_r = 1 + (old_r − 1) × 0.62 */
  const REACTOR_RINGS = [
    { r:0.62, count: 6, segW:5,  segH:12, col:[220,248,255], a:0.85, spd: 1.54, phaseSpd:2.8, energyFrac:0.06 },
    { r:1.00, count:10, segW:6,  segH:16, col:[255,255,255], a:1.00, spd: 0.00, phaseSpd:2.2, energyFrac:0.10 },
    { r:1.10, count:14, segW:6,  segH:20, col:[255,252,240], a:0.98, spd: 1.06, phaseSpd:2.0, energyFrac:0.12 },
    { r:1.17, count:10, segW:5,  segH:15, col:[255,248,220], a:0.80, spd:-0.62, phaseSpd:2.5, energyFrac:0.09 },
    { r:1.26, count:10, segW:8,  segH:26, col:[255,255,255], a:1.00, spd: 0.39, phaseSpd:1.8, energyFrac:0.08 },
    { r:1.35, count:16, segW:4,  segH:12, col:[210,242,255], a:0.65, spd:-0.28, phaseSpd:3.0, energyFrac:0.07 },
    { r:1.45, count:18, segW:5,  segH:14, col:[255,255,255], a:0.78, spd: 0.20, phaseSpd:2.6, energyFrac:0.06 },
    { r:1.56, count:24, segW:3,  segH: 9, col:[230,245,255], a:0.55, spd:-0.11, phaseSpd:3.2, energyFrac:0.05 },
  ];

  const REACTOR_SEEDS = REACTOR_RINGS.map(ring =>
    Array.from({ length: ring.count }, () => ({
      flickerPhase:  Math.random() * Math.PI * 2,
      flickerSpeed:  3.5 + Math.random() * 5.0,
      flickerDepth:  0.06 + Math.random() * 0.10,
      pulsePhase:    Math.random() * Math.PI * 2,
      energyOffset:  Math.random() * 0.25,
      microRotSeed:  (Math.random() - 0.5) * 0.4,
    }))
  );

  function drawArcReactorLights() {
    const sm = getSpeedMult();
    ctx.save();
    ctx.translate(cx, cy);

    REACTOR_RINGS.forEach((ring, ri) => {
      const r   = BASE * ring.r;
      const rot = t * ring.spd * 0.032 * sm;
      const seeds = REACTOR_SEEDS[ri];
      const [R, G, B] = ring.col;

      for (let i = 0; i < ring.count; i++) {
        const sd    = seeds[i];
        const angle = (i / ring.count) * Math.PI * 2 + rot;

        const panelFrac  = i / ring.count;
        const flowDelta  = ((panelFrac - energyFlow % 1 + 1) % 1);
        const flowWindow = ring.energyFrac;
        const flowBoost  = flowDelta < flowWindow
          ? Math.sin((flowDelta / flowWindow) * Math.PI) * 1.8
          : 0;

        const pulse   = 0.55 + 0.45 * Math.sin(t * ring.phaseSpd + sd.pulsePhase);
        const flicker = 1 - sd.flickerDepth * Math.abs(Math.sin(t * sd.flickerSpeed + sd.flickerPhase));

        const px0 = Math.cos(angle) * r;
        const py0 = Math.sin(angle) * r;
        const worldDist = distFromMouse(cx + px0, cy + py0);
        const proxBoost = hoverActive ? Math.max(0, 1 - worldDist / (BASE * 0.5)) * 0.9 : 0;
        const clickBoost = clickPulse * 0.35;
        const alpha = Math.min(1, ring.a * pulse * flicker * (1 + proxBoost + flowBoost) + clickBoost);

        const hw = ring.segW / 2;
        const hh = ring.segH / 2;
        const microRot = sd.microRotSeed * Math.sin(energyFlow * Math.PI * 2 + sd.pulsePhase) * 0.18;

        ctx.save();
        ctx.translate(px0, py0);
        ctx.rotate(angle + Math.PI / 2 + microRot);

        const bloomR = hh * (3.0 + proxBoost * 1.5 + flowBoost * 0.8);
        const bloom  = ctx.createRadialGradient(0, 0, 0, 0, 0, bloomR);
        bloom.addColorStop(0,    `rgba(${R},${G},${B},${alpha * 0.28})`);
        bloom.addColorStop(0.35, `rgba(${R},${G},${B},${alpha * 0.10})`);
        bloom.addColorStop(1,    `rgba(${R},${G},${B},0)`);
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(0, 0, bloomR, 0, Math.PI * 2);
        ctx.fill();

        const glowAmt = 16 + 22 * pulse * flicker + proxBoost * 30 + flowBoost * 20 + clickPulse * 18;
        ctx.shadowBlur  = glowAmt;
        ctx.shadowColor = `rgba(${R},${G},${B},${alpha * 0.95})`;

        const face = ctx.createLinearGradient(0, -hh, 0, hh);
        face.addColorStop(0,    `rgba(${R},${G},${B},${alpha * 0.28})`);
        face.addColorStop(0.20, `rgba(${R},${G},${B},${alpha})`);
        face.addColorStop(0.80, `rgba(${R},${G},${B},${alpha})`);
        face.addColorStop(1,    `rgba(${R},${G},${B},${alpha * 0.35})`);
        ctx.fillStyle = face;

        ctx.beginPath();
        ctx.moveTo(-hw, -hh);
        ctx.lineTo( hw, -hh);
        ctx.lineTo( hw,  hh - 2.5);
        ctx.quadraticCurveTo( hw,  hh,  hw - 2,  hh);
        ctx.lineTo(-hw + 2,  hh);
        ctx.quadraticCurveTo(-hw,  hh, -hw,  hh - 2.5);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = `rgba(${R},${G},${B},${alpha * 0.5})`;
        ctx.lineWidth   = 0.5;
        ctx.stroke();

        ctx.shadowBlur  = 5 + proxBoost * 8;
        ctx.shadowColor = `rgba(255,255,255,${alpha})`;
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.90})`;
        ctx.lineWidth   = 0.85;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -hh + 4);
        ctx.lineTo(0,  hh - 4);
        ctx.stroke();

        ctx.shadowBlur  = 10;
        ctx.shadowColor = `rgba(255,255,255,${alpha})`;
        ctx.fillStyle   = `rgba(255,255,255,${alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(0, hh - 2.5, 1.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    });

    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════
     ②  WHITE-HOT CENTER CORE
  ══════════════════════════════════════════════════════ */
  function drawCoreReactor() {
    const pulse   = 0.7 + 0.3 * Math.sin(t * 2.8);
    const flutter = 0.92 + 0.08 * Math.sin(t * 7.1) * Math.sin(t * 11.3 + 0.5);
    const flicker = pulse * flutter * (1 + clickPulse * 0.4);
    const coreR   = BASE * 0.13 * flicker;

    const g0 = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    g0.addColorStop(0,   `rgba(255,255,255,${0.95 * flicker})`);
    g0.addColorStop(0.3, `rgba(210,248,255,${0.75 * flicker})`);
    g0.addColorStop(0.7, `rgba(160,230,255,${0.35 * flicker})`);
    g0.addColorStop(1,   `rgba(100,200,255,0)`);
    ctx.save();
    ctx.shadowBlur  = 40 * flicker + clickPulse * 30;
    ctx.shadowColor = `rgba(200,240,255,${0.9 * flicker})`;
    ctx.fillStyle   = g0;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, BASE * 0.30 * flicker);
    g1.addColorStop(0,   `rgba(180,240,255,${0.20 * flicker})`);
    g1.addColorStop(0.5, `rgba(120,210,255,${0.10 * flicker})`);
    g1.addColorStop(1,   `rgba(80,180,255,0)`);
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.arc(cx, cy, BASE * 0.30 * flicker, 0, Math.PI * 2);
    ctx.fill();

    const pulse2 = 0.06 + 0.035 * Math.sin(t * 1.8) + (hoverActive ? 0.04 : 0);
    const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, BASE * 1.10);
    g2.addColorStop(0,   rgba(GOLD, 0.10 + 0.04 * Math.sin(t * 0.9)));
    g2.addColorStop(0.5, rgba(GOLD, pulse2));
    g2.addColorStop(1,   rgba(GOLD, 0));
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(cx, cy, BASE * 1.10, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ══════════════════════════════════════════════════════
     ③  CLICK SHOCKWAVE + RIPPLE RINGS
  ══════════════════════════════════════════════════════ */
  function updateShockwave() {
    if (clickShock <= 0 && shockRipples.length === 0) return;

    if (clickFlash > 0) {
      const flashR = BASE * 2.2;
      const gf = ctx.createRadialGradient(clickX, clickY, 0, clickX, clickY, flashR);
      gf.addColorStop(0,   `rgba(255,255,255,${clickFlash * 0.45})`);
      gf.addColorStop(0.2, `rgba(220,248,255,${clickFlash * 0.18})`);
      gf.addColorStop(1,   `rgba(255,255,255,0)`);
      ctx.fillStyle = gf;
      ctx.beginPath();
      ctx.arc(clickX, clickY, flashR, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = shockRipples.length - 1; i >= 0; i--) {
      const rp = shockRipples[i];
      if (rp.delay > 0) { rp.delay--; continue; }
      rp.r   += (rp.maxR - rp.r) * 0.065 + 3.0;
      rp.alpha = Math.max(0, rp.alpha - 0.028);
      if (rp.alpha <= 0 || rp.r >= rp.maxR) { shockRipples.splice(i, 1); continue; }

      ctx.save();
      const prog = rp.r / rp.maxR;
      ctx.shadowBlur  = 28 * (1 - prog);
      ctx.shadowColor = `rgba(255,255,255,${rp.alpha * 0.8})`;
      ctx.strokeStyle = `rgba(255,255,255,${rp.alpha * (1 - prog * 0.7)})`;
      ctx.lineWidth   = 2.5 * (1 - prog * 0.6);
      ctx.beginPath();
      ctx.arc(clickX, clickY, rp.r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.shadowColor = rgba(GOLDX, rp.alpha * 0.5);
      ctx.strokeStyle = rgba(GOLDX, rp.alpha * 0.5 * (1 - prog * 0.8));
      ctx.lineWidth   = 1.2 * (1 - prog * 0.5);
      ctx.beginPath();
      ctx.arc(clickX, clickY, rp.r * 0.88, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ══════════════════════════════════════════════════════
     ④  CLICK PARTICLE BURST
  ══════════════════════════════════════════════════════ */
  const PARTICLES = [];

  function spawnClickBurst(ox, oy, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 5.5;
      const isWhite = Math.random() > 0.4;
      PARTICLES.push({
        x: ox, y: oy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.016 + Math.random() * 0.020,
        size:  0.8 + Math.random() * 2.8,
        col:   isWhite
          ? (Math.random() > 0.5 ? [255,255,255] : CYANX)
          : (Math.random() > 0.5 ? GOLDX : HOT),
        trail: [],
      });
    }
  }

  const BURSTS = [];
  let burstTimer = 0;

  function spawnBurst() {
    const angle = Math.random() * Math.PI * 2;
    const r = BASE * (0.88 + Math.random() * 0.80);  /* stays within compressed rings */
    const ox = cx + Math.cos(angle) * r;
    const oy = cy + Math.sin(angle) * r;
    for (let i = 0; i < 4 + Math.floor(Math.random() * 6); i++) {
      const va  = angle + (Math.random() - 0.5) * 1.2;
      const spd = 0.4 + Math.random() * 1.1;
      BURSTS.push({
        x: ox, y: oy,
        vx: Math.cos(va) * spd, vy: Math.sin(va) * spd,
        life: 1.0, decay: 0.022 + Math.random() * 0.018,
        size: 1.2 + Math.random() * 2.2,
        col: [GOLDX, GOLDL, WHITE, HOT][Math.floor(Math.random() * 4)],
      });
    }
  }

  function updateParticles() {
    ctx.save();
    for (let i = PARTICLES.length - 1; i >= 0; i--) {
      const p = PARTICLES[i];
      p.trail.push({ x: p.x, y: p.y, a: p.life });
      if (p.trail.length > 6) p.trail.shift();

      p.x  += p.vx; p.y += p.vy;
      p.vx *= 0.93; p.vy *= 0.93;
      p.vy += 0.05;
      p.life -= p.decay;
      if (p.life <= 0) { PARTICLES.splice(i, 1); continue; }

      for (let j = 0; j < p.trail.length - 1; j++) {
        const tf = j / p.trail.length;
        ctx.strokeStyle = rgba(p.col, p.trail[j].a * tf * 0.5);
        ctx.lineWidth   = p.size * tf * 0.6;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(p.trail[j].x,     p.trail[j].y);
        ctx.lineTo(p.trail[j + 1].x, p.trail[j + 1].y);
        ctx.stroke();
      }
      ctx.shadowBlur  = 14;
      ctx.shadowColor = rgba(p.col, p.life);
      ctx.fillStyle   = rgba(p.col, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    burstTimer++;
    if (burstTimer % Math.floor(60 + Math.random() * 90) === 0) spawnBurst();
    if (clickPulse > 0.5) { spawnBurst(); spawnBurst(); }
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

  /* ══════════════════════════════════════════════════════
     ⑤  PLASMA RING  (original, tighter radius)
  ══════════════════════════════════════════════════════ */
  const PLASMA_NODES = Array.from({ length: 60 }, (_, i) => ({
    angle:    (i / 60) * Math.PI * 2,
    rBase:    1.0,
    rVar:     0.04 + Math.random() * 0.06,
    phase:    Math.random() * Math.PI * 2,
    phaseSpd: 0.8  + Math.random() * 1.6,
  }));

  function drawPlasmaRing() {
    const boost = 1 + clickPulse * 0.5;
    ctx.save();
    ctx.translate(cx, cy);
    for (let pass = 0; pass < 3; pass++) {
      const passAlpha = [0.9, 0.5, 0.2][pass];
      const passBlur  = [30, 55, 80][pass];
      const passW     = [3.5, 6, 10][pass];
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

  /* ══════════════════════════════════════════════════════
     ⑥  HOVER MAGNETIC ARC
  ══════════════════════════════════════════════════════ */
  function drawMouseLightArc() {
    if (!hoverActive) return;
    const intens = mouseRingDist;
    const span   = 0.8 + intens * 0.4;
    const start  = mouseRingAngle - span / 2;
    const end    = mouseRingAngle + span / 2;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.shadowBlur  = 60 * intens;
    ctx.shadowColor = `rgba(255,255,255,${0.8 * intens})`;
    ctx.strokeStyle = `rgba(255,255,255,${0.65 * intens})`;
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, BASE * 1.10, start, end);
    ctx.stroke();

    ctx.shadowBlur  = 40 * intens;
    ctx.shadowColor = `rgba(180,240,255,${0.6 * intens})`;
    ctx.strokeStyle = `rgba(180,240,255,${0.45 * intens})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, BASE * 1.10, start - 0.06, end + 0.06);
    ctx.stroke();

    ctx.shadowBlur  = 25 * intens;
    ctx.shadowColor = rgba(GOLDX, 0.5 * intens);
    ctx.strokeStyle = rgba(GOLDX, 0.30 * intens);
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, BASE * 1.35, start * 0.92, end * 0.92);
    ctx.stroke();

    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════
     ⑦  CINEMATIC LENS STREAK FLARES  (radii compressed)
  ══════════════════════════════════════════════════════ */
  const STREAK_FLARES = [
    { r:1.10, ao:0.0,      spd: 1.06, len:110, w:1.5, col:[255,255,255], a:0.22 },
    { r:1.10, ao:Math.PI,  spd: 1.06, len: 90, w:1.2, col:CYANX,        a:0.18 },
    { r:1.35, ao:0.8,      spd: 0.39, len:140, w:1.8, col:[255,255,255], a:0.20 },
    { r:1.45, ao:2.4,      spd: 0.20, len: 80, w:1.0, col:GOLDX,        a:0.16 },
    { r:1.17, ao:1.6,      spd:-0.62, len:100, w:1.3, col:CYANX,        a:0.15 },
  ];

  function drawLensFlares() {
    const sm = getSpeedMult();
    ctx.save();
    STREAK_FLARES.forEach(f => {
      const angle = t * f.spd * sm + f.ao;
      const px = cx + Math.cos(angle) * BASE * f.r;
      const py = cy + Math.sin(angle) * BASE * f.r;
      const [R,G,B] = f.col;

      const blobR = f.len * 0.55;
      const blob  = ctx.createRadialGradient(px, py, 0, px, py, blobR);
      blob.addColorStop(0,   `rgba(${R},${G},${B},${f.a * 0.30})`);
      blob.addColorStop(0.4, `rgba(${R},${G},${B},${f.a * 0.10})`);
      blob.addColorStop(1,   `rgba(${R},${G},${B},0)`);
      ctx.fillStyle = blob;
      ctx.beginPath();
      ctx.arc(px, py, blobR, 0, Math.PI * 2);
      ctx.fill();

      const tx = -Math.sin(angle);
      const ty =  Math.cos(angle);
      const halfLen = f.len / 2;
      const sg = ctx.createLinearGradient(
        px - tx * halfLen, py - ty * halfLen,
        px + tx * halfLen, py + ty * halfLen
      );
      sg.addColorStop(0,   `rgba(${R},${G},${B},0)`);
      sg.addColorStop(0.5, `rgba(${R},${G},${B},${f.a})`);
      sg.addColorStop(1,   `rgba(${R},${G},${B},0)`);
      ctx.shadowBlur  = 18;
      ctx.shadowColor = `rgba(${R},${G},${B},${f.a * 0.6})`;
      ctx.strokeStyle = sg;
      ctx.lineWidth   = f.w;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(px - tx * halfLen, py - ty * halfLen);
      ctx.lineTo(px + tx * halfLen, py + ty * halfLen);
      ctx.stroke();

      ctx.shadowBlur  = 12;
      ctx.shadowColor = `rgba(255,255,255,${f.a})`;
      ctx.fillStyle   = `rgba(255,255,255,${f.a * 0.85})`;
      ctx.beginPath();
      ctx.arc(px, py, f.w * 1.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════
     ⑧  LIGHT RAYS FROM CENTRE
  ══════════════════════════════════════════════════════ */
  const RAYS = Array.from({ length: 12 }, (_, i) => ({
    angle: (i / 12) * Math.PI * 2,
    spd:   0.004 + i * 0.0005,
    len:   0.50 + Math.random() * 0.45,
    width: 0.4  + Math.random() * 1.0,
    phase: (i / 12) * Math.PI * 2,
    isWhite: i % 3 === 0,
  }));

  function drawLightRays() {
    ctx.save();
    ctx.translate(cx, cy);
    RAYS.forEach(ray => {
      const angle = ray.angle + t * ray.spd;
      const pulse = 0.25 + 0.75 * Math.abs(Math.sin(t * 0.5 + ray.phase));
      const endR  = BASE * ray.len * (hoverActive ? 1.18 : 1.0);
      const gx = Math.cos(angle); const gy = Math.sin(angle);
      const col = ray.isWhite ? [255,255,255] : GOLDL;
      const g = ctx.createLinearGradient(0, 0, gx * endR, gy * endR);
      g.addColorStop(0,    rgba(col, 0.28 * pulse));
      g.addColorStop(0.3,  rgba(col, 0.12 * pulse));
      g.addColorStop(1,    rgba(col, 0));
      ctx.strokeStyle = g;
      ctx.lineWidth   = ray.width;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(gx * endR, gy * endR);
      ctx.stroke();
    });
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════
     ⑨  RING SYSTEM  (all radii compressed, speeds ×2.8)
  ══════════════════════════════════════════════════════ */
  const RINGS = [
    { r:1.00, spd:0,      lw:2.5, dash:[],        col:GOLD,  a:1.0,  gl:28 },
    { r:1.04, spd: 1.54,  lw:1.0, dash:[4,6],     col:GOLDL, a:0.55, gl:6  },
    { r:1.10, spd: 1.06,  lw:1.5, dash:[],         col:WHITE, a:0.65, gl:10 },
    { r:1.17, spd:-0.62,  lw:0.8, dash:[18,7],    col:GOLD,  a:0.50, gl:12 },
    { r:1.26, spd: 0.39,  lw:2.0, dash:[22,5],    col:GOLDL, a:0.60, gl:14 },
    { r:1.35, spd:-0.28,  lw:0.7, dash:[2,9],     col:WHITE, a:0.28, gl:4  },
    { r:1.45, spd: 0.20,  lw:1.2, dash:[55,16],   col:GOLD,  a:0.38, gl:8  },
    { r:1.56, spd:-0.11,  lw:0.5, dash:[8,22],    col:CREAM, a:0.18, gl:2  },
    { r:1.68, spd: 0.07,  lw:0.4, dash:[120,35],  col:GOLD,  a:0.10, gl:0  },
  ];

  const ARCS = [
    { r:1.10, spd: 1.06,  span:0.65, lw:4.0, col:GOLDX },
    { r:1.17, spd:-0.62,  span:1.10, lw:2.5, col:WHITE  },
    { r:1.26, spd: 0.39,  span:0.45, lw:5.0, col:GOLDL  },
    { r:1.45, spd: 0.20,  span:0.75, lw:2.0, col:GOLD   },
  ];

  const TICKS = [
    { r:1.10, n:72, len:6,  sub:3, col:GOLD,  a:0.85, spd: 1.06 },
    { r:1.26, n:48, len:9,  sub:3, col:WHITE, a:0.55, spd: 0.39 },
    { r:1.45, n:24, len:14, sub:4, col:GOLD,  a:0.45, spd: 0.20 },
  ];

  const ORBS = [
    { r:1.10, spd: 1.06,  size:4.5, col:GOLDX },
    { r:1.17, spd:-0.62,  size:3.5, col:WHITE  },
    { r:1.26, spd: 0.39,  size:3.8, col:GOLDL  },
    { r:1.35, spd:-0.28,  size:2.2, col:WHITE  },
    { r:1.45, spd: 0.20,  size:2.8, col:GOLD   },
    { r:1.56, spd:-0.11,  size:1.5, col:CREAM  },
  ];

  const SPARKS = Array.from({ length: 28 }, () => ({
    angle:  Math.random() * Math.PI * 2,
    r:      0.85 + Math.random() * 0.82,  /* compressed to match ring band */
    spd:    (Math.random() - 0.5) * 0.55, /* faster drift */
    drift:  (Math.random() - 0.5) * 0.012,
    size:   0.8 + Math.random() * 2.2,
    phase:  Math.random() * Math.PI * 2,
    blinkF: 1.2 + Math.random() * 2.8,
    col:    [GOLDX, GOLDL, WHITE, CREAM][Math.floor(Math.random() * 4)],
  }));

  const POOLS = [
    { r:1.10, angle:0.0, spd: 1.06, size:0.16, col:GOLDX, a:0.18 },
    { r:1.26, angle:2.0, spd: 0.39, size:0.18, col:GOLDL, a:0.14 },
    { r:1.45, angle:4.2, spd: 0.20, size:0.20, col:GOLD,  a:0.10 },
    { r:1.17, angle:1.1, spd:-0.62, size:0.14, col:WHITE, a:0.12 },
  ];

  const CARDINALS = [
    0, Math.PI/4, Math.PI/2, Math.PI*0.75,
    Math.PI, Math.PI*1.25, Math.PI*1.5, Math.PI*1.75,
    Math.PI/8, Math.PI*0.375, Math.PI*0.625, Math.PI*0.875,
    Math.PI*1.125, Math.PI*1.375, Math.PI*1.625, Math.PI*1.875,
  ];

  const DATA_SEGS = Array.from({ length: 32 }, () => ({
    lit:   Math.random() > 0.38,
    blink: Math.random() > 0.75,
    phase: Math.random() * Math.PI * 2,
  }));

  const INNER_RINGS = [
    { r:0.72, lw:0.6, col:GOLD,  a:0.30 },
    { r:0.84, lw:0.8, col:GOLDL, a:0.22 },
    { r:0.94, lw:0.5, col:WHITE, a:0.15 },
  ];

  const LABELS = [
    { angle:-0.55, r:1.45, text:'v3.1.4', phase:0   },
    { angle: 0.80, r:1.45, text:'SYNC',   phase:1.8 },
    { angle: 2.20, r:1.56, text:'100%',   phase:3.4 },
    { angle:-2.00, r:1.35, text:'NODE',   phase:5.0 },
  ];

  /* ── draw functions ── */
  function drawRing(cfg, rot) {
    const sm = getSpeedMult();
    const gBoost = hoverActive ? 1.4 : 1.0;
    ctx.save();
    ctx.shadowBlur  = cfg.gl * gBoost + clickPulse * 8;
    ctx.shadowColor = rgba(cfg.col, 0.9);
    ctx.strokeStyle = rgba(cfg.col, Math.min(1, cfg.a * (hoverActive ? 1.2 : 1)));
    ctx.lineWidth = cfg.lw;
    ctx.setLineDash(cfg.dash);
    /* draw as 3-D perspective ellipse */
    drawRing3D(BASE * cfg.r, 0, Math.PI * 2, true);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawArc(cfg, rot) {
    const sm = getSpeedMult();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot * sm);
    ctx.shadowBlur  = 32 + clickPulse * 20; ctx.shadowColor = rgba(cfg.col, 1);
    ctx.strokeStyle = rgba(cfg.col, 0.95);
    ctx.lineWidth   = cfg.lw * (hoverActive ? 1.3 : 1.0);
    ctx.lineCap = 'round'; ctx.beginPath();
    ctx.arc(0, 0, BASE * cfg.r, 0, cfg.span); ctx.stroke();
    ctx.restore();
  }

  function drawTicks(cfg, rot) {
    const sm = getSpeedMult();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot * sm);
    ctx.shadowBlur = 6; ctx.shadowColor = rgba(cfg.col, 0.7);
    for (let i = 0; i < cfg.n; i++) {
      const angle  = (i / cfg.n) * Math.PI * 2;
      const cos    = Math.cos(angle); const sin = Math.sin(angle);
      const major  = i % cfg.sub === 0;
      const superM = i % (cfg.sub * 4) === 0;
      let outerLen = major ? cfg.len : cfg.len * 0.38;
      if (superM) outerLen = cfg.len * 1.7;
      const outer = BASE * cfg.r + outerLen;
      const inner = BASE * cfg.r - cfg.len * 0.3;
      ctx.strokeStyle = rgba(cfg.col, superM ? cfg.a * 1.1 : major ? cfg.a : cfg.a * 0.35);
      ctx.lineWidth   = superM ? 2.0 : major ? 1.5 : 0.7;
      ctx.beginPath();
      ctx.moveTo(cos * inner, sin * inner);
      ctx.lineTo(cos * outer, sin * outer);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawOrb(cfg) {
    const sm = getSpeedMult();
    const angle = t * cfg.spd * sm;
    const ox = cx + Math.cos(angle) * BASE * cfg.r;
    const oy = cy + Math.sin(angle) * BASE * cfg.r;
    const sb = hoverActive ? 1.3 : 1.0;
    const TRAIL = 8;
    for (let i = TRAIL; i >= 1; i--) {
      const ta = angle - i * 0.04 * Math.sign(cfg.spd);
      const tx2 = cx + Math.cos(ta) * BASE * cfg.r;
      const ty2 = cy + Math.sin(ta) * BASE * cfg.r;
      ctx.fillStyle = rgba(cfg.col, Math.max(0, 0.4 - i * 0.05));
      ctx.beginPath();
      ctx.arc(tx2, ty2, Math.max(0.5, cfg.size * sb * (1 - i * 0.12)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    ctx.shadowBlur = 22 + clickPulse * 12; ctx.shadowColor = rgba(cfg.col, 1);
    ctx.fillStyle  = rgba(cfg.col, 1);
    ctx.beginPath(); ctx.arc(ox, oy, cfg.size * sb, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawCardinals(rot) {
    const sm = getSpeedMult();
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot * sm * 0.4);
    CARDINALS.forEach((a, idx) => {
      const rDist = idx % 2 === 0 ? BASE * 1.26 : BASE * 1.10;
      const sz    = idx % 4 === 0 ? 5 : 3;
      const alpha = idx % 4 === 0 ? 0.45 : 0.22;
      const px = Math.cos(a) * rDist; const py = Math.sin(a) * rDist;
      ctx.save(); ctx.translate(px, py); ctx.rotate(a + Math.PI / 4);
      ctx.shadowBlur  = 8 + clickPulse * 6;
      ctx.shadowColor = rgba(GOLDX, alpha);
      ctx.strokeStyle = rgba(GOLDX, alpha);
      ctx.fillStyle   = rgba(GOLD, alpha * 0.3);
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(0, -sz); ctx.lineTo(sz, 0);
      ctx.lineTo(0,  sz); ctx.lineTo(-sz, 0);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  function drawDataSegments() {
    const r   = BASE * 1.56;
    const gap = 0.025;
    const seg = (Math.PI * 2 / DATA_SEGS.length);
    const sm  = getSpeedMult();
    ctx.save(); ctx.translate(cx, cy);
    DATA_SEGS.forEach((s, i) => {
      const startA = i * seg + gap / 2 + t * 0.050 * sm;
      const endA   = startA + seg - gap;
      let a = s.lit
        ? (s.blink ? 0.25 + 0.25 * Math.sin(t * 2.2 + s.phase) : 0.45 + 0.15 * Math.sin(t * 0.8 + s.phase))
        : 0.06;
      if (hoverActive && s.lit) a = Math.min(1, a * 1.4);
      ctx.strokeStyle = rgba(s.lit ? GOLDL : GOLD, a);
      ctx.lineWidth   = 4; ctx.lineCap = 'butt';
      ctx.shadowBlur  = s.lit ? (10 + clickPulse * 8) : 0;
      ctx.shadowColor = rgba(GOLDL, 0.8);
      ctx.beginPath(); ctx.arc(0, 0, r, startA, endA); ctx.stroke();
    });
    ctx.restore();
  }

  function drawRadar() {
    const sm    = getSpeedMult();
    const rA    = radarAngle * sm;
    const sweep = Math.PI * 0.55;
    const steps = 40;
    ctx.save(); ctx.translate(cx, cy);
    for (let i = 0; i < steps; i++) {
      const frac  = i / steps;
      const angle = rA - sweep * (1 - frac);
      ctx.strokeStyle = rgba(GOLDL, frac * (hoverActive ? 0.26 : 0.18));
      ctx.lineWidth = BASE * (sweep / steps) * 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, BASE * 0.5, angle, angle + sweep / steps * 1.5);
      ctx.stroke();
    }
    ctx.shadowBlur = 20 + clickPulse * 15; ctx.shadowColor = rgba(GOLDX, 0.9);
    ctx.strokeStyle = rgba(GOLDX, 0.8); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(rA) * BASE, Math.sin(rA) * BASE);
    ctx.stroke();
    ctx.restore();
  }

  function drawInnerRings() {
    INNER_RINGS.forEach(cfg => {
      ctx.save();
      ctx.shadowBlur  = 6; ctx.shadowColor = rgba(cfg.col, 0.5);
      ctx.strokeStyle = rgba(cfg.col, cfg.a * (hoverActive ? 1.3 : 1));
      ctx.lineWidth   = cfg.lw;
      ctx.beginPath(); ctx.arc(cx, cy, BASE * cfg.r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });
  }

  function drawGlowCore() {
    const pulse = 0.06 + 0.03 * Math.sin(t * 2.4) + (hoverActive ? 0.04 : 0);
    const g = ctx.createRadialGradient(cx, cy, BASE * 0.82, cx, cy, BASE * 1.15);
    g.addColorStop(0,   rgba(GOLD, 0));
    g.addColorStop(0.5, rgba(GOLD, pulse));
    g.addColorStop(1,   rgba(GOLD, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, BASE * 1.15, 0, Math.PI * 2); ctx.fill();
  }

  function drawGrid() {
    const gs = 26;
    ctx.strokeStyle = rgba(GOLD, 0.032); ctx.lineWidth = 0.5;
    for (let x = 0; x < SIZE; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SIZE); ctx.stroke();
    }
    for (let y = 0; y < SIZE; y += gs) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(SIZE, y); ctx.stroke();
    }
  }

  function drawCrosshair() {
    const r = BASE * 1.85;
    ctx.save();
    ctx.strokeStyle = rgba(GOLD, 0.045); ctx.lineWidth = 0.5; ctx.setLineDash([4, 10]);
    ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }

  function drawHudArcs() {
    const defs = [
      { r:0.78, startFrac:0.05, endFrac:0.40, col:GOLD,  lw:3, spd: 0.34 },
      { r:0.78, startFrac:0.55, endFrac:0.85, col:GOLDL, lw:2, spd: 0.34 },
      { r:0.88, startFrac:0.10, endFrac:0.65, col:WHITE, lw:2, spd:-0.25 },
    ];
    const sm = getSpeedMult();
    ctx.save(); ctx.translate(cx, cy);
    defs.forEach(d => {
      const r     = BASE * d.r;
      const off   = t * d.spd * sm;
      const start = d.startFrac * Math.PI * 2 + off;
      const end   = d.endFrac   * Math.PI * 2 + off;
      ctx.shadowBlur  = 14 + clickPulse * 8; ctx.shadowColor = rgba(d.col, 0.9);
      ctx.strokeStyle = rgba(d.col, 0.7); ctx.lineWidth = d.lw; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, r, start, end); ctx.stroke();
    });
    ctx.restore();
  }

  function drawSparks() {
    const sm = getSpeedMult();
    ctx.save();
    SPARKS.forEach(s => {
      s.angle += s.spd * 0.010 * sm + s.drift;
      const px = cx + Math.cos(s.angle) * BASE * s.r;
      const py = cy + Math.sin(s.angle) * BASE * s.r;
      const pulse = 0.45 + 0.55 * Math.abs(Math.sin(t * s.blinkF + s.phase));
      const a = pulse * (hoverActive ? 1.0 : 0.85);
      const g = ctx.createRadialGradient(px, py, 0, px, py, s.size * 4.5);
      g.addColorStop(0,   rgba(s.col, a * 0.55));
      g.addColorStop(0.4, rgba(s.col, a * 0.18));
      g.addColorStop(1,   rgba(s.col, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(px, py, s.size * 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 14; ctx.shadowColor = rgba(s.col, 1);
      ctx.fillStyle  = rgba(WHITE, a);
      ctx.beginPath(); ctx.arc(px, py, s.size * 0.55, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }

  function drawAmbientPools() {
    const sm = getSpeedMult();
    ctx.save();
    POOLS.forEach(p => {
      const angle  = t * p.spd * sm + p.angle;
      const px     = cx + Math.cos(angle) * BASE * p.r;
      const py     = cy + Math.sin(angle) * BASE * p.r;
      const radius = BASE * p.size;
      const pulse  = p.a * (0.6 + 0.4 * Math.sin(t * 1.4 + p.angle));
      const g = ctx.createRadialGradient(px, py, 0, px, py, radius);
      g.addColorStop(0,   rgba(p.col, pulse));
      g.addColorStop(0.5, rgba(p.col, pulse * 0.35));
      g.addColorStop(1,   rgba(p.col, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }

  function drawLabels() {
    ctx.save();
    LABELS.forEach(lb => {
      const a  = lb.angle + t * 0.06;
      const lx = cx + Math.cos(a) * BASE * lb.r;
      const ly = cy + Math.sin(a) * BASE * lb.r;
      const alpha = 0.35 + 0.2 * Math.sin(t * 1.1 + lb.phase);
      ctx.font          = '500 9px "Share Tech Mono", monospace';
      ctx.textAlign     = 'center';
      ctx.textBaseline  = 'middle';
      ctx.shadowBlur    = 8; ctx.shadowColor = rgba(GOLD, 0.7);
      ctx.fillStyle     = rgba(GOLDL, alpha);
      ctx.fillText(lb.text, lx, ly);
    });
    ctx.restore();
  }

  /* ── parallax + perspective 3-D tilt ── */
  function updateTilt() {
    const ease = 0.065;
    tiltX += (targetTiltX - tiltX) * ease;
    tiltY += (targetTiltY - tiltY) * ease;

    /*
      Full CSS 3-D:
        • perspective(500px) — tight vanishing point for dramatic depth
        • rotateX / rotateY — 1.8× multiplier turns 22° input → ~40° visual lean
        • scale(1.06) — slight zoom-in so edges don't clip
    */
    canvas.style.transform = [
      'translate(-50%,-50%)',
      'perspective(500px)',
      `rotateX(${tiltX * 1.8}deg)`,
      `rotateY(${tiltY * 1.8}deg)`,
      `scale(${1.05 + Math.abs(tiltX + tiltY) * 0.001})`,
    ].join(' ');
  }

  function decayClick() {
    if (clickShock > 0) clickShock = Math.max(0, clickShock - 0.018);
    if (clickPulse > 0) clickPulse = Math.max(0, clickPulse - 0.042);
    if (clickFlash > 0) clickFlash = Math.max(0, clickFlash - 0.060);
  }

  /* ══════════════════════════════════════════════════════
     MAIN RENDER LOOP
  ══════════════════════════════════════════════════════ */
  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden) return;

    ctx.clearRect(0, 0, SIZE, SIZE);

    const sm = getSpeedMult();
    /* ↑ 3× base speed vs v5 */
    t           += 0.021 * (1 + clickPulse * 0.15);
    radarAngle   = (radarAngle + 0.052 * sm) % (Math.PI * 2);
    energyFlow  += 0.0056 * sm;

    updateTilt();
    decayClick();

    /* ── LAYER ORDER (back → front) ── */
    drawGrid();
    drawCrosshair();
    drawLightRays();
    drawGlowCore();
    drawAmbientPools();
    drawInnerRings();
    drawHudArcs();
    drawRadar();
    drawPlasmaRing();
    RINGS.forEach(r => drawRing(r, t * r.spd));
    ARCS.forEach(a => drawArc(a, t * a.spd));
    TICKS.forEach(tk => drawTicks(tk, t * tk.spd));
    drawCardinals(t * 0.40);
    drawDataSegments();
    drawArcReactorLights();
    drawAmbientPools();
    drawSparks();
    drawLensFlares();
    drawMouseLightArc();
    updateShockwave();
    drawLabels();
    updateParticles();
    ORBS.forEach(o => drawOrb(o));
    drawCoreReactor();
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


/* Soft nebula glows */
    const t = Date.now() / 9000;
    [
        { bx: 0.18, by: 0.22, r: 280, col: '201,169,110', base: 0.09  },
        { bx: 0.82, by: 0.75, r: 240, col: '90,155,110',  base: 0.07  },
        { bx: 0.50, by: 0.10, r: 200, col: '201,169,110', base: 0.065 },
        { bx: 0.15, by: 0.78, r: 180, col: '110,141,201', base: 0.05  },
        { bx: 0.88, by: 0.20, r: 160, col: '201,155,90',  base: 0.055 },
    ].forEach((nb, i) => {
        const pulse = 0.75 + 0.25 * Math.sin(t * Math.PI * 2 + i * 1.8);
        const cx = nb.bx * canvas.width  + Math.sin(t * 1.1 + i) * 55;
        const cy = nb.by * canvas.height + Math.cos(t * 0.9 + i * 1.4) * 40;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, nb.r * pulse);
        g.addColorStop(0,   `rgba(${nb.col},${nb.base * pulse})`);
        g.addColorStop(0.5, `rgba(${nb.col},${nb.base * pulse * 0.4})`);
        g.addColorStop(1,   `rgba(${nb.col},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    
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

            /* Pulsing nebula glow */
            const pulse = 0.05 + 0.03 * Math.sin(t * Math.PI * 2);
            const g = actx.createRadialGradient(cx, cy, 0, cx, cy, AW * 0.46);
            g.addColorStop(0,   `rgba(201,169,110,${pulse * 2})`);
            g.addColorStop(0.4, `rgba(201,169,110,${pulse})`);
            g.addColorStop(1,   'rgba(201,169,110,0)');
            actx.fillStyle = g;
            actx.fillRect(0, 0, AW, AH);

            /* Second nebula — green tint */
            const g2 = actx.createRadialGradient(cx, cy, 0, cx, cy, AW * 0.38);
            g2.addColorStop(0,   `rgba(90,155,110,${pulse * 1.2})`);
            g2.addColorStop(1,   'rgba(90,155,110,0)');
            actx.fillStyle = g2;
            actx.fillRect(0, 0, AW, AH);

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
    spawnParticles(window.innerWidth < 768 ? 8 : 18);
    window.addEventListener('resize', throttle(() => { spawnParticles(window.innerWidth < 768 ? 8 : 18); }, 300));
    menuToggle.addEventListener('click', () => { const open = navMenu.classList.toggle('active'); menuToggle.classList.toggle('active', open); menuToggle.setAttribute('aria-expanded', open); document.body.style.overflow = open ? 'hidden' : ''; });
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








/* ═══════════════════════════════════════════════════════════════════
   NEXT-GEN CINEMATIC HERO BACKGROUND — v2.0
   Iron Man HUD + Space Nebula + Luxury Portfolio
═══════════════════════════════════════════════════════════════════ */
(function () {
 
    const hero = document.getElementById('hero');
    if (!hero) return;
 
    const canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
        position:      'fixed',
        inset:         '0',
        width:         '100vw',
        height:        '100vh',
        pointerEvents: 'none',
        zIndex:        '0',
        opacity:       '1',
    });
    document.body.insertBefore(canvas, document.body.firstChild);
 
    const ctx = canvas.getContext('2d');
    let W, H, raf, globalT = 0;
 
    /* ── Mouse state ── */
    const mouse       = { x: -9999, y: -9999 };
    let   smoothMouse = { x: -9999, y: -9999 };
    let   magnetMode  = false;
 
    const badge = document.getElementById('mode-badge');
 
    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', () => {
        resize();
        BOKEH.forEach(b => { b.x = Math.random() * W; b.y = Math.random() * H; });
        buildNoiseCache();
    });
 
    document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    document.addEventListener('touchmove', e => {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }, { passive: true });
 
    document.addEventListener('contextmenu', e => {
        e.preventDefault();
        magnetMode = !magnetMode;
        badge.textContent = magnetMode ? '⊕ Attract Mode' : '⊕ Repel Mode';
        badge.className   = magnetMode ? 'attract' : '';
    });
 
    /* ════ COLOR PALETTE ════ */
    const GOLD  = [201, 169, 110];
    const GOLD2 = [232, 213, 176];
    const WHITE = [255, 255, 255];
    const CREAM = [255, 245, 220];
    const WARM  = [255, 200, 120];
    const COLORS = [GOLD, GOLD2, WHITE, CREAM, WARM, WHITE, GOLD];
 
    const NEBULA_TONES = [
        '201,169,110','255,245,220','255,200,120','255,255,255','232,200,140'
    ];
    function lerpColor(a, b, t) {
        const [ar, ag, ab] = a.split(',').map(Number);
        const [br, bg, bb] = b.split(',').map(Number);
        return `${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)}`;
    }
 
    /* ════ PARTICLES ════ */
    const IS_MOBILE      = window.innerWidth < 768;
    const PARTICLE_COUNT = IS_MOBILE ? 55 : 120;
    let particles = [];
 
    function mkParticle() {
        const col   = COLORS[Math.floor(Math.random() * COLORS.length)];
        const layer = Math.random();
        const speed = 0.15 + layer * 0.35;
        return {
            x: Math.random() * W, y: Math.random() * H,
            vx: (Math.random()-0.5)*speed, vy: (Math.random()-0.5)*speed,
            evx: 0, evy: 0, exploding: false,
            r: 0.3 + layer*2.4, o: 0.15 + layer*0.65, col,
            pulse: Math.random()*Math.PI*2, pSpeed: Math.random()*0.018+0.008,
            glow: Math.random()>0.62, layer,
            isNode: Math.random()>0.82,
        };
    }
    function spawnParticles() { particles = Array.from({length:PARTICLE_COUNT}, mkParticle); }
    spawnParticles();
 
    /* ════ NEBULA BLOBS ════ */
    let blobT = 0;
    const BLOBS = [
        { bx:0.15, by:0.25, r:380, base:0.075, ti:0 },
        { bx:0.80, by:0.70, r:320, base:0.055, ti:1 },
        { bx:0.50, by:0.10, r:280, base:0.060, ti:2 },
        { bx:0.90, by:0.20, r:240, base:0.035, ti:3 },
        { bx:0.10, by:0.80, r:300, base:0.050, ti:4 },
        { bx:0.60, by:0.55, r:200, base:0.030, ti:0 },
    ];
 
    function drawNebula() {
        blobT += 0.00035;
        BLOBS.forEach((nb, i) => {
            const toneSpeed = 0.00012;
            const tIdx  = (nb.ti + globalT * toneSpeed) % NEBULA_TONES.length;
            const tFloor= Math.floor(tIdx) % NEBULA_TONES.length;
            const tCeil = (tFloor+1) % NEBULA_TONES.length;
            const col   = lerpColor(NEBULA_TONES[tFloor], NEBULA_TONES[tCeil], tIdx-tFloor);
            const pulse = 0.72 + 0.28*Math.sin(blobT*Math.PI*2*0.7 + i*1.7);
            const cx    = nb.bx*W + Math.sin(blobT*1.1+i)*70;
            const cy    = nb.by*H + Math.cos(blobT*0.85+i*1.4)*55;
            const g     = ctx.createRadialGradient(cx, cy, 0, cx, cy, nb.r*pulse);
            g.addColorStop(0,   `rgba(${col},${(nb.base*pulse).toFixed(3)})`);
            g.addColorStop(0.5, `rgba(${col},${(nb.base*pulse*0.35).toFixed(3)})`);
            g.addColorStop(1,   `rgba(${col},0)`);
            ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
        });
    }
 
    /* ════ GRID ════ */
    function drawGrid() {
        const gs = 48;
        ctx.strokeStyle = 'rgba(201,169,110,0.04)';
        ctx.lineWidth   = 0.5;
        for (let x=0; x<W; x+=gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
        for (let y=0; y<H; y+=gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
    }
 
    /* ════ CONNECTIONS ════ */
    let hotPoints = [];
    function drawConnections() {
        const MAX_DIST = 190; hotPoints = [];
        for (let i=0; i<particles.length; i++) {
            for (let j=i+1; j<particles.length; j++) {
                const dx   = particles[i].x-particles[j].x;
                const dy   = particles[i].y-particles[j].y;
                const dist = Math.sqrt(dx*dx+dy*dy);
                if (dist < MAX_DIST) {
                    const t      = 1 - dist/MAX_DIST;
                    const alpha  = 0.18 * t * t;          // quadratic fade — dim far, bright near
                    const bright = dist < 72;
                    const mid    = dist < 130;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = bright
                        ? `rgba(255,248,225,${alpha*2.2})`
                        : mid
                        ? `rgba(220,190,130,${alpha*1.4})`
                        : `rgba(201,169,110,${alpha})`;
                    ctx.lineWidth = bright ? 1.1 : mid ? 0.65 : 0.4;
                    ctx.stroke();
                    if (bright && hotPoints.length < 40)
                        hotPoints.push({ x:(particles[i].x+particles[j].x)*0.5, y:(particles[i].y+particles[j].y)*0.5, strength:1-dist/72 });
                }
            }
        }
    }
 
    /* ════ LIGHT RAYS ════ */
    const RAYS = [
        { x:0.62, y:-0.05, angle:0.88, len:0.55, w:60, a:0.06 },
        { x:0.35, y:0.0,   angle:0.75, len:0.45, w:40, a:0.04 },
        { x:0.85, y:0.10,  angle:1.05, len:0.40, w:30, a:0.035 },
    ];
    function drawRays() {
        RAYS.forEach(ray => {
            const sx=ray.x*W, sy=ray.y*H;
            const ex=sx+Math.cos(ray.angle)*ray.len*Math.max(W,H);
            const ey=sy+Math.sin(ray.angle)*ray.len*Math.max(W,H);
            const g=ctx.createLinearGradient(sx,sy,ex,ey);
            const p=0.6+0.4*Math.sin(blobT*0.5*Math.PI*2+ray.angle);
            g.addColorStop(0,   `rgba(255,245,200,${ray.a*p*1.5})`);
            g.addColorStop(0.3, `rgba(255,240,180,${ray.a*p})`);
            g.addColorStop(1,   'rgba(255,240,180,0)');
            ctx.save(); ctx.translate(sx,sy);
            const perpX=Math.sin(ray.angle), perpY=-Math.cos(ray.angle);
            ctx.beginPath();
            ctx.moveTo(-perpX*ray.w, -perpY*ray.w);
            ctx.lineTo(ex-sx+perpX*ray.w*0.1, ey-sy+perpY*ray.w*0.1);
            ctx.lineTo(ex-sx-perpX*ray.w*0.1, ey-sy-perpY*ray.w*0.1);
            ctx.lineTo(perpX*ray.w, perpY*ray.w);
            ctx.closePath(); ctx.fillStyle=g; ctx.fill(); ctx.restore();
        });
    }
 
    /* ════ PARTICLES UPDATE ════ */
    function updateParticles() {
        particles.forEach(p => {
            p.x += p.vx+p.evx; p.y += p.vy+p.evy; p.pulse += p.pSpeed;
            if (p.exploding) {
                p.evx *= 0.88; p.evy *= 0.88;
                if (Math.abs(p.evx)<0.05 && Math.abs(p.evy)<0.05) { p.evx=0; p.evy=0; p.exploding=false; }
            }
            if (p.x<-8) p.x=W+8; if (p.x>W+8) p.x=-8;
            if (p.y<-8) p.y=H+8; if (p.y>H+8) p.y=-8;
            const drift = Math.sin(globalT*0.0004+p.layer*3.14)*p.layer*0.3;
            p.x += drift*0.05;
            const dx=p.x-smoothMouse.x, dy=p.y-smoothMouse.y;
            const dst=Math.sqrt(dx*dx+dy*dy);
            if (magnetMode) {
                if (dst<160 && dst>0) { const f=(1-dst/160)*2*p.layer; p.x-=(dx/dst)*f; p.y-=(dy/dst)*f; }
            } else {
                if (dst<130 && dst>0) { const f=(1-dst/130)*3; p.x+=(dx/dst)*f; p.y+=(dy/dst)*f; }
            }
        });
    }
    function drawParticles() {
        particles.forEach(p => {
            const alpha=p.o*(0.45+0.55*Math.sin(p.pulse));
            const [rr,gg,bb]=p.col;
            if (p.glow) { ctx.shadowBlur=12+p.layer*8; ctx.shadowColor=`rgba(${rr},${gg},${bb},0.8)`; }
            ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
            ctx.fillStyle=`rgba(${rr},${gg},${bb},${alpha.toFixed(3)})`; ctx.fill();
            if (p.glow) ctx.shadowBlur=0;
        });
    }
 
    /* ════ SHOOTING STARS ════ */
    let stars = [];
    function spawnStar() {
        if (stars.length>=6) return;
        const isWhite = Math.random()>0.4;
        stars.push({
            x:Math.random()*W*0.8, y:Math.random()*H*0.45,
            len:Math.random()*220+100, speed:Math.random()*12+7,
            opacity:1, angle:Math.PI/4+(Math.random()-0.5)*0.45,
            width:Math.random()*2+0.6, col:isWhite?WHITE:GOLD,
            bloom:Math.random()*20+12, distort:Math.random()*6-3, age:0,
        });
    }
    function drawStars() {
        if (Math.random()<0.006) spawnStar();
        stars = stars.filter(s=>s.opacity>0.02);
        stars.forEach(s => {
            s.age++;
            const wobble=Math.sin(s.age*0.25)*s.distort;
            const perpX=-Math.sin(s.angle), perpY=Math.cos(s.angle);
            const tx=s.x+Math.cos(s.angle)*s.len+perpX*wobble;
            const ty=s.y+Math.sin(s.angle)*s.len+perpY*wobble;
            const [rr,gg,bb]=s.col;
            for (let pass=0; pass<3; pass++) {
                const scale=[1,2.2,4][pass], aMult=[1,0.35,0.12][pass];
                const sg=ctx.createLinearGradient(s.x,s.y,tx,ty);
                sg.addColorStop(0, `rgba(${rr},${gg},${bb},0)`);
                sg.addColorStop(0.25,`rgba(${rr},${gg},${bb},${s.opacity*0.5*aMult})`);
                sg.addColorStop(1,  `rgba(255,255,255,${s.opacity*aMult})`);
                ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(tx,ty);
                ctx.strokeStyle=sg; ctx.lineWidth=s.width*scale; ctx.lineCap='round'; ctx.stroke();
            }
            ctx.shadowBlur=s.bloom; ctx.shadowColor=`rgba(255,255,255,${s.opacity})`;
            ctx.beginPath(); ctx.arc(tx,ty,s.width*1.6,0,Math.PI*2);
            ctx.fillStyle=`rgba(255,255,255,${s.opacity})`; ctx.fill();
            ctx.shadowBlur=0;
            const bg=ctx.createRadialGradient(tx,ty,0,tx,ty,s.bloom*1.5);
            bg.addColorStop(0,`rgba(255,245,200,${s.opacity*0.3})`);
            bg.addColorStop(1,`rgba(255,245,200,0)`);
            ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(tx,ty,s.bloom*1.5,0,Math.PI*2); ctx.fill();
            s.x+=Math.cos(s.angle)*s.speed; s.y+=Math.sin(s.angle)*s.speed; s.opacity-=0.013;
        });
    }
 
    /* ════ BOKEH ════ */
    const BOKEH = Array.from({length:IS_MOBILE?6:14}, ()=>({
        x:Math.random()*window.innerWidth, y:Math.random()*window.innerHeight,
        r:Math.random()*60+20, vx:(Math.random()-0.5)*0.18, vy:(Math.random()-0.5)*0.18,
        o:Math.random()*0.06+0.02, ph:Math.random()*Math.PI*2,
        col:Math.random()>0.5?'255,255,255':'201,169,110',
    }));
    function drawBokeh() {
        BOKEH.forEach(b => {
            b.x+=b.vx; b.y+=b.vy; b.ph+=0.006;
            if (b.x<-b.r) b.x=W+b.r; if (b.x>W+b.r) b.x=-b.r;
            if (b.y<-b.r) b.y=H+b.r; if (b.y>H+b.r) b.y=-b.r;
            const alpha=b.o*(0.5+0.5*Math.sin(b.ph));
            const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);
            g.addColorStop(0, `rgba(${b.col},${alpha.toFixed(3)})`);
            g.addColorStop(0.5,`rgba(${b.col},${(alpha*0.3).toFixed(3)})`);
            g.addColorStop(1, `rgba(${b.col},0)`);
            ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
        });
    }
 
    /* ════ SCAN LINE ════ */
    let scanY = -20;
    function drawScanLine() {
        scanY += 0.5; if (scanY>H+20) scanY=-20;
        const g=ctx.createLinearGradient(0,scanY-15,0,scanY+15);
        g.addColorStop(0,'rgba(255,240,180,0)'); g.addColorStop(0.5,'rgba(255,240,180,0.018)'); g.addColorStop(1,'rgba(255,240,180,0)');
        ctx.fillStyle=g; ctx.fillRect(0,scanY-15,W,30);
    }
 
    /* ════ MOUSE LIGHT ════ */
    function drawMouseLight() {
        if (smoothMouse.x<0) return;
        const mx=smoothMouse.x, my=smoothMouse.y;
        const r=280;
        const g=ctx.createRadialGradient(mx,my,0,mx,my,r);
        g.addColorStop(0,'rgba(255,245,200,0.09)'); g.addColorStop(0.3,'rgba(255,240,180,0.04)'); g.addColorStop(1,'rgba(255,240,180,0)');
        ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
        const g2=ctx.createRadialGradient(mx,my,0,mx,my,60);
        g2.addColorStop(0,'rgba(255,255,255,0.08)'); g2.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=g2; ctx.fillRect(0,0,W,H);
    }
 
    /* ════ ARC REACTOR NODES ════ */
    function drawReactorNodes() {
        hotPoints.forEach(hp => {
            const t=globalT*0.002, pulse=0.5+0.5*Math.sin(t+hp.x*0.01);
            const r=4+pulse*4;
            ctx.beginPath(); ctx.arc(hp.x,hp.y,r,0,Math.PI*2);
            ctx.strokeStyle=`rgba(255,245,220,${0.25*pulse*hp.strength})`; ctx.lineWidth=0.8; ctx.stroke();
            ctx.shadowBlur=14+pulse*12; ctx.shadowColor='rgba(255,255,255,0.9)';
            ctx.beginPath(); ctx.arc(hp.x,hp.y,1.5+pulse,0,Math.PI*2);
            ctx.fillStyle=`rgba(255,250,240,${0.7*hp.strength})`; ctx.fill(); ctx.shadowBlur=0;
            ctx.beginPath(); ctx.arc(hp.x,hp.y,r*1.9,0,Math.PI*2);
            ctx.strokeStyle=`rgba(201,169,110,${0.10*pulse*hp.strength})`; ctx.lineWidth=0.5; ctx.stroke();
        });
        particles.forEach(p => {
            if (!p.isNode) return;
            const pulse=0.5+0.5*Math.sin(p.pulse*0.7), r=3+pulse*3;
            ctx.shadowBlur=10+pulse*10; ctx.shadowColor='rgba(255,255,255,0.7)';
            ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2);
            ctx.strokeStyle=`rgba(255,245,200,${0.35*pulse})`; ctx.lineWidth=0.7; ctx.stroke(); ctx.shadowBlur=0;
        });
    }
 
    /* ════ PULSE WAVES (click-only — cursor rings removed) ════ */
    const pulseWaves = [];
    function spawnPulseWave(x, y, isClick=false) {
        pulseWaves.push({ x, y, r:0, maxR:isClick?260:140, speed:isClick?5.5:2.8, alpha:isClick?0.55:0.28, gold:Math.random()>0.5, isClick });
    }
    function drawPulseWaves() {
        /* No auto-spawn from cursor — only click-triggered waves are drawn */
        for (let i=pulseWaves.length-1; i>=0; i--) {
            const w=pulseWaves[i]; w.r+=w.speed; w.alpha*=0.956;
            if (w.alpha<0.005 || w.r>w.maxR) { pulseWaves.splice(i,1); continue; }
            const col=w.gold?'201,169,110':'255,245,200';
            const fade=w.alpha*(1-w.r/w.maxR);
            ctx.beginPath(); ctx.arc(w.x,w.y,w.r,0,Math.PI*2);
            ctx.strokeStyle=`rgba(${col},${fade.toFixed(3)})`; ctx.lineWidth=w.isClick?2.5:1.2; ctx.stroke();
            if (w.r>8) {
                ctx.beginPath(); ctx.arc(w.x,w.y,w.r*0.62,0,Math.PI*2);
                ctx.strokeStyle=`rgba(255,255,255,${(fade*0.4).toFixed(3)})`; ctx.lineWidth=0.6; ctx.stroke();
            }
        }
    }
 
    /* ════ SHOCKWAVES ════ */
    const shockwaves = [];
    document.addEventListener('click', e => {
        const cx=e.clientX, cy=e.clientY;
        for (let ring=0; ring<3; ring++) {
            shockwaves.push({ x:cx, y:cy, r:ring*18, maxR:320+ring*60, alpha:0.7-ring*0.18, speed:7+ring*1.5, gold:ring===1 });
        }
        spawnPulseWave(cx, cy, true);
        particles.forEach(p => {
            const dx=p.x-cx, dy=p.y-cy, dst=Math.sqrt(dx*dx+dy*dy);
            if (dst<160 && dst>0) {
                const f=((1-dst/160)**1.4)*14; p.evx=(dx/dst)*f; p.evy=(dy/dst)*f; p.exploding=true;
            }
        });
        for (let s=0; s<10; s++) spawnMicroSpark(cx, cy, true);
    });
    function drawShockwaves() {
        for (let i=shockwaves.length-1; i>=0; i--) {
            const sw=shockwaves[i]; sw.r+=sw.speed; sw.alpha*=0.93;
            if (sw.alpha<0.005 || sw.r>sw.maxR) { shockwaves.splice(i,1); continue; }
            const col=sw.gold?'201,169,110':'255,245,220';
            const fade=sw.alpha*(1-sw.r/sw.maxR);
            ctx.shadowBlur=12; ctx.shadowColor=`rgba(${col},${fade})`;
            ctx.beginPath(); ctx.arc(sw.x,sw.y,sw.r,0,Math.PI*2);
            ctx.strokeStyle=`rgba(${col},${fade.toFixed(3)})`; ctx.lineWidth=1.6; ctx.stroke(); ctx.shadowBlur=0;
        }
    }
 
    /* ════ MICRO SPARKS ════ */
    let microSparks = [];
    function spawnMicroSpark(x, y, burst=false) {
        const count=burst?1:( Math.random()<0.055?1:0 );
        for (let i=0; i<count; i++) {
            const angle=Math.random()*Math.PI*2;
            const speed=burst?(Math.random()*5+2):(Math.random()*1.8+0.6);
            microSparks.push({
                x, y, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed,
                r:Math.random()*1.4+0.4, alpha:1,
                col:Math.random()>0.5?'255,255,255':'255,220,140', decay:burst?0.035:0.022,
            });
        }
    }
    function updateMicroSparks() {
        if (!IS_MOBILE) particles.forEach(p => { if (p.isNode||p.glow) spawnMicroSpark(p.x,p.y); });
        for (let i=microSparks.length-1; i>=0; i--) {
            const s=microSparks[i]; s.x+=s.vx; s.y+=s.vy; s.vx*=0.92; s.vy*=0.92; s.alpha-=s.decay;
            if (s.alpha<=0) { microSparks.splice(i,1); continue; }
            ctx.shadowBlur=6; ctx.shadowColor=`rgba(${s.col},${s.alpha})`;
            ctx.beginPath(); ctx.arc(s.x,s.y,s.r*s.alpha,0,Math.PI*2);
            ctx.fillStyle=`rgba(${s.col},${s.alpha.toFixed(3)})`; ctx.fill();
        }
        ctx.shadowBlur=0;
        if (microSparks.length>300) microSparks.splice(0, microSparks.length-300);
    }
 
    /* ════ ROTATING ENERGY RINGS ════ */
    const ENERGY_RINGS = [
        { cx:0.18, cy:0.30, r:140, speed:0.0004,  dashLen:18, gap:10, alpha:0.06, gold:true  },
        { cx:0.82, cy:0.68, r:105, speed:-0.0006, dashLen:12, gap:8,  alpha:0.05, gold:false },
        { cx:0.50, cy:0.15, r: 80, speed:0.0008,  dashLen:8,  gap:6,  alpha:0.04, gold:true  },
        { cx:0.88, cy:0.18, r: 60, speed:-0.0009, dashLen:6,  gap:5,  alpha:0.04, gold:false },
        { cx:0.12, cy:0.78, r: 90, speed:0.0005,  dashLen:10, gap:7,  alpha:0.045,gold:true  },
    ];
    function drawEnergyRings() {
        ENERGY_RINGS.forEach(ring => {
            const cx=ring.cx*W, cy=ring.cy*H;
            const rot=globalT*ring.speed;
            const col=ring.gold?'201,169,110':'255,245,220';
            ctx.save(); ctx.translate(cx,cy); ctx.rotate(rot);
            const circumference=2*Math.PI*ring.r;
            const segCount=Math.floor(circumference/(ring.dashLen+ring.gap));
            const segAngle=(2*Math.PI)/segCount;
            const dashAngle=segAngle*(ring.dashLen/(ring.dashLen+ring.gap));
            for (let seg=0; seg<segCount; seg++) {
                const startA=seg*segAngle, endA=startA+dashAngle;
                const midA=startA+dashAngle*0.5;
                const fade=0.4+0.6*Math.abs(Math.cos(midA));
                ctx.beginPath(); ctx.arc(0,0,ring.r,startA,endA);
                ctx.strokeStyle=`rgba(${col},${ring.alpha*fade})`; ctx.lineWidth=0.7; ctx.stroke();
            }
            for (let q=0; q<4; q++) {
                const a=q*Math.PI*0.5;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a)*(ring.r-5), Math.sin(a)*(ring.r-5));
                ctx.lineTo(Math.cos(a)*(ring.r+5), Math.sin(a)*(ring.r+5));
                ctx.strokeStyle=`rgba(${col},${ring.alpha*2})`; ctx.lineWidth=0.9; ctx.stroke();
            }
            ctx.restore();
        });
    }
 
    /* ════ DIAGONAL SCAN BEAMS ════ */
    const SCAN_BEAMS = [
        { progress:0.10, speed:0.0006, angle:0.52, width:3,   col:'255,245,220', alpha:0.07 },
        { progress:0.55, speed:0.0004, angle:2.09, width:2,   col:'201,169,110', alpha:0.06 },
        { progress:0.80, speed:0.0008, angle:0.87, width:1.5, col:'255,255,255', alpha:0.05 },
    ];
    function drawScanBeams() {
        const diag=Math.sqrt(W*W+H*H);
        SCAN_BEAMS.forEach(beam => {
            beam.progress=(beam.progress+beam.speed)%1;
            const t=beam.progress;
            const ox=W*t, oy=-H*0.2;
            const ex=ox+Math.cos(beam.angle)*diag, ey=oy+Math.sin(beam.angle)*diag;
            const g=ctx.createLinearGradient(ox,oy,ex,ey);
            const ap=beam.alpha*(1-Math.abs(t-0.5)*1.6);
            g.addColorStop(0,   `rgba(${beam.col},0)`);
            g.addColorStop(0.15,`rgba(${beam.col},${ap})`);
            g.addColorStop(0.85,`rgba(${beam.col},${ap})`);
            g.addColorStop(1,   `rgba(${beam.col},0)`);
            ctx.save();
            const perpX=Math.sin(beam.angle)*beam.width, perpY=-Math.cos(beam.angle)*beam.width;
            ctx.beginPath();
            ctx.moveTo(ox-perpX, oy-perpY);
            ctx.lineTo(ex-perpX*0.2, ey-perpY*0.2);
            ctx.lineTo(ex+perpX*0.2, ey+perpY*0.2);
            ctx.lineTo(ox+perpX, oy+perpY);
            ctx.closePath(); ctx.fillStyle=g; ctx.fill(); ctx.restore();
        });
    }
 
    /* ════ NOISE OVERLAY ════ */
    let noiseCanvas=null, noiseOffX=0, noiseOffY=0;
    function buildNoiseCache() {
        const sz=IS_MOBILE?128:256;
        noiseCanvas=document.createElement('canvas'); noiseCanvas.width=noiseCanvas.height=sz;
        const nc=noiseCanvas.getContext('2d');
        const id=nc.createImageData(sz,sz); const buf=id.data;
        for (let i=0; i<buf.length; i+=4) {
            const v=Math.random()*255|0; buf[i]=buf[i+1]=buf[i+2]=v; buf[i+3]=Math.random()*18|0;
        }
        nc.putImageData(id,0,0);
    }
    buildNoiseCache();
    function drawNoiseOverlay() {
        if (!noiseCanvas) return;
        noiseOffX=(noiseOffX+0.12)%noiseCanvas.width; noiseOffY=(noiseOffY+0.07)%noiseCanvas.height;
        ctx.save(); ctx.globalAlpha=0.22; ctx.globalCompositeOperation='screen';
        const pat=ctx.createPattern(noiseCanvas,'repeat');
        if (pat) {
            const m=new DOMMatrix(); m.translateSelf(noiseOffX,noiseOffY); pat.setTransform(m);
            ctx.fillStyle=pat; ctx.fillRect(0,0,W,H);
        }
        ctx.restore();
    }
 
    /* ════ SMOOTH MOUSE ════ */
    function easeMouse() {
        const ease=0.085;
        if (smoothMouse.x<0) { smoothMouse.x=mouse.x; smoothMouse.y=mouse.y; }
        else { smoothMouse.x+=(mouse.x-smoothMouse.x)*ease; smoothMouse.y+=(mouse.y-smoothMouse.y)*ease; }
    }
 
    /* ════ RENDER LOOP ════ */
    let lastTime=0;
    function frame(timestamp) {
        raf=requestAnimationFrame(frame);
        if (document.hidden) return;
        const delta=timestamp-lastTime;
        if (delta>120) { lastTime=timestamp; return; }
        lastTime=timestamp; globalT=timestamp;
 
        ctx.clearRect(0,0,W,H);
 
        drawGrid();
        drawEnergyRings();
        drawNebula();
        drawRays();
        drawScanBeams();
        drawBokeh();
        easeMouse();
        drawMouseLight();
        drawConnections();
        drawReactorNodes();
        updateParticles();
        drawParticles();
        updateMicroSparks();
        drawStars();
        drawScanLine();
        drawPulseWaves();
        drawShockwaves();
        drawNoiseOverlay();
    }
 
    raf=requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) cancelAnimationFrame(raf);
        else { lastTime=performance.now(); raf=requestAnimationFrame(frame); }
    });
 
})();