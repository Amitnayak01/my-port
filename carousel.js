/* ═══════════════════════════════════════════════════════════════
   CYLINDER 3D CAROUSEL — PREMIUM v3
   ───────────────────────────────────────────────────────────────
   FEATURES
     • Free-scroll momentum: swipe speed & length drive throw distance
     • Exponential moving average velocity → silky throws
     • Spring-snap to nearest face when momentum dies
     • Hold arrow buttons → continuous scroll with acceleration
     • Single click arrow → step one card
     • Touch direction lock (no accidental page-scroll hijack)
     • Keyboard ← → navigation
     • Velocity indicator bar (optional — id="cylVelFill")
     • Resize-safe geometry rebuild

   USAGE
     Add after your main script:
       <script src="carousel-cylinder.js" defer></script>
═══════════════════════════════════════════════════════════════ */
;(function () {
    'use strict';

    /* ─── guard & find elements ─────────────────────────── */
    const grid = document.querySelector('.projects-grid');
    const wrap = document.querySelector('.projects-scroll-wrap');
    if (!grid || !wrap) return;

    const cards = Array.from(grid.querySelectorAll('.project-card'));
    const N     = cards.length;
    if (!N) return;

    /* ─── strip tilt-card to prevent transform conflicts ── */
    cards.forEach(c => c.classList.remove('tilt-card'));

    /* ─── inject gold reflection line into every card ────── */
    cards.forEach(card => {
        if (!card.querySelector('.cyl-reflection')) {
            const refl = document.createElement('div');
            refl.className = 'cyl-reflection';
            card.appendChild(refl);
        }
    });

    /* ─── responsive helpers ─────────────────────────────── */
    const IS_MOB = () => window.innerWidth <= 768;

    function cardW() { return IS_MOB() ? 272 : 330; }
    function cardH() { return IS_MOB() ? 460 : 490; }
    function gap()   { return IS_MOB() ?  24 :  40; }

    const FACE = 360 / N;

    function radius() {
        const chord = cardW() + gap();
        return Math.round(chord / (2 * Math.sin(Math.PI / N)));
    }

    /* ─── physics constants ───────────────────────────────── */
    const FRICTION  = 0.915;  // velocity decay per frame
    const MAX_VEL   = 22;    // deg/frame cap — allows long fast throws
    const SNAP_VEL  = 1.2;  // begin spring-snap below this speed
    const SNAP_K    = 0.13; // spring stiffness (0–1)
    const STOP_EPS  = 0.03; // stop threshold in degrees

    /* EMA drag-velocity smoothing */
    const EMA_ALPHA = 0.26;

    /* Hold-button continuous scroll */
    const HOLD_DELAY  = 400;  // ms before repeat fires
    const HOLD_REPEAT = 80;   // ms between repeats
    const HOLD_VEL    = 6;    // deg/frame added per repeat tick

    /* ─── state ───────────────────────────────────────────── */
    let angle      = 0;
    let vel        = 0;
    let snapTarget = null;
    let dragging   = false;
    let dragX      = 0;
    let emaVel     = 0;
    let lastT      = 0;
    let isHoriz    = null;
    let tsX = 0, tsY = 0;
    let raf        = null;

    let holdTimeout  = null;
    let holdInterval = null;

    /* ────────────────────────────────────────────────────────
       GEOMETRY SETUP
    ──────────────────────────────────────────────────────── */
    function setup() {
        const W = cardW(), H = cardH(), R = radius();

        wrap.style.perspective       = (R * 3.0) + 'px';
        wrap.style.perspectiveOrigin = '50% 44%';
        wrap.style.overflow          = 'visible';

        Object.assign(grid.style, {
            display:        'block',
            overflow:       'visible',
            scrollSnapType: 'none',
            padding:        '0',
            gap:            '0',
            position:       'relative',
            width:          W + 'px',
            height:         H + 'px',
            margin:         '2rem auto 0',
            transformStyle: 'preserve-3d',
        });

        cards.forEach((card, i) => {
            Object.assign(card.style, {
                position:                 'absolute',
                left:                     '0',
                top:                      '0',
                width:                    W + 'px',
                height:                   H + 'px',
                flex:                     'none',
                margin:                   '0',
                backfaceVisibility:       'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transformStyle:           'preserve-3d',
            });
            card._faceY = i * FACE;
        });
    }

    /* ────────────────────────────────────────────────────────
       ACTIVE INDEX
    ──────────────────────────────────────────────────────── */
    function activeIndex() {
        let best = 0, bestAbs = 999;
        for (let i = 0; i < N; i++) {
            let d = ((cards[i]._faceY + angle) % 360 + 360) % 360;
            if (d > 180) d -= 360;
            const a = Math.abs(d);
            if (a < bestAbs) { bestAbs = a; best = i; }
        }
        return best;
    }

    /* ────────────────────────────────────────────────────────
       TARGET ANGLE — shortest arc
    ──────────────────────────────────────────────────────── */
    function targetAngle(i) {
        const ideal = -(i * FACE);
        let diff    = ideal - angle;
        diff = ((diff % 360) + 360) % 360;
        if (diff > 180) diff -= 360;
        return angle + diff;
    }

    function snapTo(i) {
        snapTarget = targetAngle(i);
        vel        = 0;
        startLoop();
    }

    /* ────────────────────────────────────────────────────────
       RENDER
    ──────────────────────────────────────────────────────── */
    function render() {
        grid.style.transform = `rotateY(${angle}deg)`;

        const R   = radius();
        const idx = activeIndex();

        cards.forEach((card, i) => {
            const faceY = card._faceY;
            let d = ((faceY + angle) % 360 + 360) % 360;
            if (d > 180) d -= 360;
            const absD  = Math.abs(d);
            const front = (i === idx);

            if (absD > 95) {
                card.style.visibility    = 'hidden';
                card.style.pointerEvents = 'none';
                card.classList.remove('cyl-active', 'fan-active', 'roll-active');
                return;
            }

            card.style.visibility = 'visible';

            const t  = 1 - absD / 95;
            const sc = front ? 1.0 : (0.78 + 0.22 * t * t);

            card.style.transform =
                `rotateY(${faceY}deg) translateZ(${R}px) scale(${sc.toFixed(4)})`;

            const op = front ? 1 : Math.max(0.10, 0.12 + 0.88 * t * 0.78);
            card.style.opacity = op.toFixed(3);

            const br = front ? 1.0  : (0.28 + 0.72 * t);
            const sa = front ? 1.10 : (0.25 + 0.75 * t);
            card.style.filter = `brightness(${br.toFixed(2)}) saturate(${sa.toFixed(2)})`;

            card.style.zIndex = front
                ? '20'
                : String(Math.max(0, Math.round(19 - absD * 0.2)));

            if (front) {
                card.style.boxShadow =
                    '0 40px 80px rgba(0,0,0,.72),' +
                    '0 0 0 1.5px rgba(201,169,110,.32),' +
                    '0 0 60px rgba(201,169,110,.14)';
            } else {
                const sh = Math.round(5 + 14 * t);
                card.style.boxShadow = `0 ${sh}px ${sh * 2}px rgba(0,0,0,.42)`;
            }

            card.style.pointerEvents = 'auto';

            card.classList.toggle('cyl-active',  front);
            card.classList.toggle('fan-active',  front);
            card.classList.toggle('roll-active', front);
        });

        updateUI(idx);

        /* Optional velocity bar */
        const vb = document.getElementById('cylVelFill');
        if (vb) vb.style.width = Math.min(100, Math.abs(vel) / MAX_VEL * 100) + '%';
    }

    /* ────────────────────────────────────────────────────────
       ANIMATION LOOP — friction → spring-snap → stop
    ──────────────────────────────────────────────────────── */
    function loop() {
        if (!dragging) {
            if (snapTarget !== null) {
                const diff = snapTarget - angle;
                if (Math.abs(diff) < STOP_EPS) {
                    angle = snapTarget; snapTarget = null; vel = 0;
                    render(); raf = null; return;
                }
                const step = diff * SNAP_K;
                angle += step; vel = step;
            } else {
                vel   *= FRICTION;
                angle += vel;
                if (Math.abs(vel) < SNAP_VEL) {
                    snapTarget = targetAngle(activeIndex());
                    vel        = 0;
                }
                if (Math.abs(vel) < STOP_EPS && snapTarget === null) {
                    vel = 0; render(); raf = null; return;
                }
            }
        }
        render();
        raf = requestAnimationFrame(loop);
    }

    function startLoop() {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
    }

    /* ────────────────────────────────────────────────────────
       COORDINATE CONVERSION
    ──────────────────────────────────────────────────────── */
    function pxToDeg(px) {
        return (px / (2 * Math.PI * radius())) * 360;
    }

    /* ────────────────────────────────────────────────────────
       DRAG HANDLERS
    ──────────────────────────────────────────────────────── */
    function onDragStart(x) {
        dragging   = true;
        dragX      = x;
        emaVel     = 0;
        lastT      = performance.now();
        vel        = 0;
        snapTarget = null;
        grid.style.cursor = 'grabbing';
        startLoop();
    }

    function onDragMove(x) {
        if (!dragging) return;
        const now = performance.now();
        const dt  = Math.max(1, now - lastT);
        const dx  = x - dragX;

        angle += pxToDeg(dx);

        /* Velocity-proportional EMA — fast swipe = high emaVel */
        const inst = dx / dt;
        emaVel = EMA_ALPHA * inst + (1 - EMA_ALPHA) * emaVel;

        dragX = x;
        lastT = now;
    }

    function onDragEnd() {
        if (!dragging) return;
        dragging = false;
        grid.style.cursor = 'grab';

        /* Convert px/ms → deg/frame (16 ms ≈ 60 fps) */
        const rawVel = pxToDeg(emaVel * 16);
        vel = Math.max(-MAX_VEL, Math.min(MAX_VEL, rawVel));

        startLoop();
    }

    /* ────────────────────────────────────────────────────────
       MOUSE EVENTS
    ──────────────────────────────────────────────────────── */
    const INTERACTIVE =
        '.ps-prev,.ps-next,.ps-dot-ind,' +
        '.pc-ext-link,.pc-cta,.btn,' +
        '.vmg-cb,a,button,input,select,textarea';

    grid.addEventListener('mousedown', e => {
        if (e.target.closest(INTERACTIVE)) return;
        e.preventDefault();
        onDragStart(e.clientX);
    });

    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        onDragMove(e.clientX);
    });

    document.addEventListener('mouseup', onDragEnd);
    grid.addEventListener('dragstart', e => e.preventDefault());

    /* ────────────────────────────────────────────────────────
       TOUCH EVENTS
    ──────────────────────────────────────────────────────── */
    grid.addEventListener('touchstart', e => {
        if (e.touches.length !== 1) return;
        tsX     = e.touches[0].clientX;
        tsY     = e.touches[0].clientY;
        isHoriz = null;
        onDragStart(tsX);
    }, { passive: true });

    grid.addEventListener('touchmove', e => {
        if (!dragging || e.touches.length !== 1) return;

        const dx = e.touches[0].clientX - tsX;
        const dy = e.touches[0].clientY - tsY;

        if (isHoriz === null && (Math.abs(dx) > 7 || Math.abs(dy) > 7)) {
            isHoriz = Math.abs(dx) > Math.abs(dy);
        }

        if (isHoriz === false) { onDragEnd(); return; }
        if (!isHoriz) return;

        e.preventDefault();
        onDragMove(e.touches[0].clientX);
    }, { passive: false });

    grid.addEventListener('touchend',    onDragEnd, { passive: true });
    grid.addEventListener('touchcancel', onDragEnd, { passive: true });

    /* ────────────────────────────────────────────────────────
       CLICK SIDE CARDS → spring snap
    ──────────────────────────────────────────────────────── */
    cards.forEach((card, i) => {
        card.addEventListener('click', e => {
            if (card.classList.contains('cyl-active')) return;
            if (dragging || Math.abs(vel) > 1.5) return;
            if (e.target.closest(INTERACTIVE)) return;
            snapTo(i);
        });
    });

    /* ────────────────────────────────────────────────────────
       ARROW BUTTONS — single click + hold to continuous scroll
    ──────────────────────────────────────────────────────── */
    function clearHold() {
        clearTimeout(holdTimeout);
        clearInterval(holdInterval);
        holdTimeout = holdInterval = null;

        /* Remove held state from all nav buttons */
        document.querySelectorAll('.fan-btn,.roll-btn').forEach(b => b.classList.remove('cyl-held'));

        /* If coasting slowly after hold, snap to nearest */
        if (!dragging && Math.abs(vel) < SNAP_VEL) {
            snapTarget = targetAngle(activeIndex());
            vel        = 0;
            startLoop();
        }
    }

    function startHold(dir) {
        /* Highlight held button */
        const ids = dir === -1
            ? ['fanPrev',  'rollPrev',  'carouselPrev']
            : ['fanNext',  'rollNext',  'carouselNext'];
        ids.forEach(id => {
            const b = document.getElementById(id);
            if (b) b.classList.add('cyl-held');
        });

        holdTimeout = setTimeout(() => {
            holdInterval = setInterval(() => {
                /* Accumulate velocity — feels like acceleration */
                vel = Math.max(-MAX_VEL, Math.min(MAX_VEL, vel + dir * HOLD_VEL));
                snapTarget = null;
                startLoop();
            }, HOLD_REPEAT);
        }, HOLD_DELAY);
    }

    function wireArrow(id, dir) {
        const b = document.getElementById(id);
        if (!b) return;

        /* Remove any old onclick set by previous scripts */
        b.onclick = null;

        const onPress = (e) => {
            e.preventDefault();
            /* Single step fires immediately */
            if (!holdInterval) {
                snapTo(((activeIndex() + dir) % N + N) % N);
            }
            startHold(dir);
        };

        b.addEventListener('mousedown',  onPress);
        b.addEventListener('touchstart', onPress, { passive: false });
    }

    wireArrow('fanPrev',       -1);
    wireArrow('rollPrev',      -1);
    wireArrow('carouselPrev',  -1);
    wireArrow('fanNext',        1);
    wireArrow('rollNext',       1);
    wireArrow('carouselNext',   1);

    document.addEventListener('mouseup',   clearHold);
    document.addEventListener('touchend',  clearHold, { passive: true });
    document.addEventListener('touchcancel', clearHold, { passive: true });

    /* ────────────────────────────────────────────────────────
       KEYBOARD  ← →
    ──────────────────────────────────────────────────────── */
    document.addEventListener('keydown', e => {
        if (e.target.matches('input,textarea,[contenteditable]')) return;
        if (e.key === 'ArrowLeft')  snapTo(((activeIndex() - 1) % N + N) % N);
        if (e.key === 'ArrowRight') snapTo((activeIndex() + 1) % N);
    });

    /* ────────────────────────────────────────────────────────
       DOT INDICATORS
    ──────────────────────────────────────────────────────── */
    function buildDots(containerId, dotClass) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < N; i++) {
            const d = document.createElement('button');
            d.className = dotClass + (i === 0 ? ' active' : '');
            d.setAttribute('aria-label', 'Go to project ' + (i + 1));
            d.addEventListener('click', () => snapTo(i));
            container.appendChild(d);
        }
    }

    buildDots('fanDots',  'fan-dot');
    buildDots('rollDots', 'roll-dot');

    /* ────────────────────────────────────────────────────────
       UI UPDATE — counters, dots, progress bar
    ──────────────────────────────────────────────────────── */
    function updateUI(idx) {
        ['fanCurr', 'rollCurr', 'carouselCurrent'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = idx + 1;
        });
        ['fanTot', 'rollTot', 'carouselTotal'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = N;
        });
        ['fanDots', 'rollDots'].forEach(wid => {
            const w = document.getElementById(wid);
            if (!w) return;
            Array.from(w.children).forEach((d, i) =>
                d.classList.toggle('active', i === idx)
            );
        });
        const fill = document.getElementById('carouselFill');
        if (fill) fill.style.width = ((idx + 1) / N * 100) + '%';
    }

    /* ────────────────────────────────────────────────────────
       RESIZE
    ──────────────────────────────────────────────────────── */
    const onResize = (typeof throttle === 'function')
        ? throttle(() => { setup(); render(); }, 250)
        : (() => {
            let t;
            return () => {
                clearTimeout(t);
                t = setTimeout(() => { setup(); render(); }, 250);
            };
          })();

    window.addEventListener('resize', onResize);

    /* ────────────────────────────────────────────────────────
       INIT
    ──────────────────────────────────────────────────────── */
    setup();
    render();

})();