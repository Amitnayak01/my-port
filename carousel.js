/* ═══════════════════════════════════════════════════════════════
   CYLINDER 3D CAROUSEL — PREMIUM v4 (MOBILE-OPTIMISED)
   ───────────────────────────────────────────────────────────────
   UPGRADES vs v3
     • Dual physics: desktop vs mobile profiles
     • Direction-lock with 8px threshold (no accidental scroll block)
     • EMA velocity tuned per device class for flick response
     • FREE SCROLL: snap ONLY fires after drag-end, never mid-drag
     • Lighter shadows + filter on mobile (stable 60 FPS)
     • Tap-scale feedback via .cyl-tap class
     • Hold-arrow acceleration ramp
     • Shortest-arc infinite snap (no wrap glitch)
     • Single rAF loop — no duplicates
═══════════════════════════════════════════════════════════════ */
;(function () {
    'use strict';

    /* ─── guard ─────────────────────────────────────────── */
    const grid = document.querySelector('.projects-grid');
    const wrap = document.querySelector('.projects-scroll-wrap');
    if (!grid || !wrap) return;

    const cards = Array.from(grid.querySelectorAll('.project-card'));
    const N     = cards.length;
    if (!N) return;

    cards.forEach(c => c.classList.remove('tilt-card'));

    /* ─── inject reflection once per card ───────────────── */
    cards.forEach(card => {
        if (!card.querySelector('.cyl-reflection')) {
            const r = document.createElement('div');
            r.className = 'cyl-reflection';
            card.appendChild(r);
        }
    });

    /* ─── device detection ──────────────────────────────── */
    const mob = () => window.innerWidth <= 768 ||
        ('ontouchstart' in window && window.innerWidth <= 1024);

    /* ─── geometry ──────────────────────────────────────── */
    const cardW  = () => mob() ? 268 : 330;
    const cardH  = () => mob() ? 450 : 490;
    const gap    = () => mob() ?  22 :  40;
    const FACE   = 360 / N;
    const radius = () => Math.round((cardW() + gap()) / (2 * Math.sin(Math.PI / N)));

    /* ─── physics (dual profile) ────────────────────────── */
    //                        MOBILE    DESKTOP
    const FRICTION  = () => mob() ? 0.900 : 0.915;
    const MAX_VEL   = () => mob() ? 28    : 22;
    const SNAP_VEL  = () => mob() ? 1.5   : 1.2;
    const SNAP_K    = () => mob() ? 0.18  : 0.13;
    const STOP_EPS  = 0.03;
    const EMA_A     = () => mob() ? 0.30  : 0.26;
    const DRAG_MULT = () => mob() ? 1.35  : 1.0;  // compensates for shorter finger travel

    /* ─── hold-button ───────────────────────────────────── */
    const HOLD_DELAY  = 380;
    const HOLD_REPEAT = 72;
    const HOLD_VEL    = () => mob() ? 5 : 6;

    /* ─── direction-lock threshold ──────────────────────── */
    const LOCK_PX = 8;

    /* ─── state ─────────────────────────────────────────── */
    let angle      = 0;
    let vel        = 0;
    let snapTarget = null;
    let dragging   = false;
    let dragX      = 0;
    let emaVel     = 0;
    let lastT      = 0;
    let isHoriz    = null;   // null=undecided  true=horiz  false=vertical
    let tsX = 0, tsY = 0;
    let raf        = null;
    let holdTimeout  = null;
    let holdInterval = null;

    /* ═══════════════════════════════════════════════════════
       SETUP — geometry applied to DOM
    ═══════════════════════════════════════════════════════ */
    function setup() {
        const W = cardW(), H = cardH(), R = radius();

        wrap.style.perspective       = (R * 3.2) + 'px';
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
                willChange:               'transform, opacity, filter',
                backfaceVisibility:       'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transformStyle:           'preserve-3d',
            });
            card._faceY = i * FACE;
        });
    }

    /* ═══════════════════════════════════════════════════════
       HELPERS
    ═══════════════════════════════════════════════════════ */
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

    function pxToDeg(px) {
        return (px / (2 * Math.PI * radius())) * 360 * DRAG_MULT();
    }

    /* ═══════════════════════════════════════════════════════
       RENDER — called each rAF tick
    ═══════════════════════════════════════════════════════ */
    function render() {
        grid.style.transform = `rotateY(${angle}deg)`;

        const R   = radius();
        const idx = activeIndex();
        const m   = mob();

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

            // Mobile: slightly larger front, gentler side shrink
            const sc = front
                ? (m ? 1.02 : 1.0)
                : (m ? 0.82 + 0.18 * t * t : 0.78 + 0.22 * t * t);

            card.style.transform =
                `rotateY(${faceY}deg) translateZ(${R}px) scale(${sc.toFixed(4)})`;

            const op = front ? 1 : Math.max(0.10, 0.12 + 0.88 * t * 0.78);
            card.style.opacity = op.toFixed(3);

            // Mobile: lighter filter → fewer GPU compositing layers
            const br = front ? 1.0  : (m ? 0.35 + 0.65 * t : 0.28 + 0.72 * t);
            const sa = front ? 1.08 : (m ? 0.30 + 0.70 * t : 0.25 + 0.75 * t);
            card.style.filter = `brightness(${br.toFixed(2)}) saturate(${sa.toFixed(2)})`;

            card.style.zIndex = front
                ? '20'
                : String(Math.max(0, Math.round(19 - absD * 0.2)));

            // Mobile: single-layer shadow (cheaper paint)
            if (front) {
                card.style.boxShadow = m
                    ? '0 24px 48px rgba(0,0,0,.65), 0 0 0 1.5px rgba(201,169,110,.30)'
                    : '0 40px 80px rgba(0,0,0,.72), 0 0 0 1.5px rgba(201,169,110,.32), 0 0 60px rgba(201,169,110,.14)';
            } else {
                const sh = Math.round(5 + 14 * t);
                card.style.boxShadow = m
                    ? `0 ${sh}px ${Math.round(sh * 1.5)}px rgba(0,0,0,.38)`
                    : `0 ${sh}px ${sh * 2}px rgba(0,0,0,.42)`;
            }

            card.style.pointerEvents = 'auto';
            card.classList.toggle('cyl-active',  front);
            card.classList.toggle('fan-active',  front);
            card.classList.toggle('roll-active', front);
        });

        updateUI(idx);

        const vb = document.getElementById('cylVelFill');
        if (vb) vb.style.width = Math.min(100, Math.abs(vel) / MAX_VEL() * 100) + '%';
    }

    /* ═══════════════════════════════════════════════════════
       ANIMATION LOOP
    ═══════════════════════════════════════════════════════ */
    function loop() {
        if (!dragging) {
            if (snapTarget !== null) {
                const diff = snapTarget - angle;
                if (Math.abs(diff) < STOP_EPS) {
                    angle = snapTarget; snapTarget = null; vel = 0;
                    render(); raf = null; return;
                }
                const step = diff * SNAP_K();
                angle += step; vel = step;
            } else {
                vel   *= FRICTION();
                angle += vel;
                if (Math.abs(vel) < SNAP_VEL()) {
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

    /* ═══════════════════════════════════════════════════════
       DRAG CORE (shared by mouse and touch)
    ═══════════════════════════════════════════════════════ */
    function onDragStart(x) {
        dragging   = true;
        dragX      = x;
        emaVel     = 0;
        lastT      = performance.now();
        vel        = 0;
        snapTarget = null;   // ← KEY: no snapping during free drag
        grid.style.cursor = 'grabbing';
        startLoop();
    }

    function onDragMove(x) {
        if (!dragging) return;
        const now = performance.now();
        const dt  = Math.max(1, now - lastT);
        const dx  = x - dragX;

        angle += pxToDeg(dx);

        // EMA: mobile alpha slightly higher = faster flick response
        const inst = dx / dt;
        emaVel = EMA_A() * inst + (1 - EMA_A()) * emaVel;

        dragX = x;
        lastT = now;
    }

    function onDragEnd() {
        if (!dragging) return;
        dragging = false;
        grid.style.cursor = 'grab';

        // Convert smoothed px/ms velocity → deg/frame (16ms @ 60fps)
        const rawVel = pxToDeg(emaVel * 16);
        vel = Math.max(-MAX_VEL(), Math.min(MAX_VEL(), rawVel));

        // Snap fires HERE — after drag, not during
        startLoop();
    }

    /* ═══════════════════════════════════════════════════════
       MOUSE EVENTS
    ═══════════════════════════════════════════════════════ */
    const INTERACTIVE =
        '.ps-prev,.ps-next,.ps-dot-ind,' +
        '.pc-ext-link,.pc-cta,.btn,.vmg-cb,' +
        'a,button,input,select,textarea';

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
    grid.addEventListener('dragstart',   e => e.preventDefault());

    /* ═══════════════════════════════════════════════════════
       TOUCH EVENTS — direction-lock state machine
       ──────────────────────────────────────────────────────
       isHoriz = null   → undecided (< LOCK_PX moved)
       isHoriz = true   → horizontal confirmed → rotate
       isHoriz = false  → vertical confirmed   → abort, scroll page
    ═══════════════════════════════════════════════════════ */
    grid.addEventListener('touchstart', e => {
        if (e.touches.length !== 1) return;
        tsX     = e.touches[0].clientX;
        tsY     = e.touches[0].clientY;
        isHoriz = null;
        onDragStart(tsX);
    }, { passive: true });        // passive on start — no preventDefault needed

    grid.addEventListener('touchmove', e => {
        if (!dragging || e.touches.length !== 1) return;

        const cx = e.touches[0].clientX;
        const cy = e.touches[0].clientY;
        const dx = cx - tsX;
        const dy = cy - tsY;

        // Wait until finger has moved past threshold before committing
        if (isHoriz === null) {
            if (Math.abs(dx) < LOCK_PX && Math.abs(dy) < LOCK_PX) return;
            isHoriz = Math.abs(dx) >= Math.abs(dy);
        }

        if (!isHoriz) {
            // Vertical: abort carousel, restore scroll
            onDragEnd();
            return;
        }

        // Horizontal: block page scroll, rotate carousel
        e.preventDefault();
        onDragMove(cx);

    }, { passive: false });       // non-passive required for preventDefault

    grid.addEventListener('touchend', () => {
        onDragEnd(); isHoriz = null;
    }, { passive: true });

    grid.addEventListener('touchcancel', () => {
        onDragEnd(); isHoriz = null;
    }, { passive: true });

    /* ═══════════════════════════════════════════════════════
       TAP FEEDBACK — compress active card on touch
    ═══════════════════════════════════════════════════════ */
    cards.forEach((card, i) => {
        card.addEventListener('touchstart', () => {
            if (card.classList.contains('cyl-active'))
                card.classList.add('cyl-tap');
        }, { passive: true });

        card.addEventListener('touchend', () => {
            card.classList.remove('cyl-tap');
        }, { passive: true });

        // Click non-active card → snap to it
        card.addEventListener('click', e => {
            if (card.classList.contains('cyl-active')) return;
            if (dragging || Math.abs(vel) > 2) return;
            if (e.target.closest(INTERACTIVE)) return;
            snapTo(i);
        });
    });

    /* ═══════════════════════════════════════════════════════
       HOLD ARROWS — step once on press, accelerate on hold
    ═══════════════════════════════════════════════════════ */
    function clearHold() {
        clearTimeout(holdTimeout);
        clearInterval(holdInterval);
        holdTimeout = holdInterval = null;

        document.querySelectorAll('.fan-btn,.roll-btn,.cyl-nav-btn')
            .forEach(b => b.classList.remove('cyl-held'));

        if (!dragging && Math.abs(vel) < SNAP_VEL()) {
            snapTarget = targetAngle(activeIndex());
            vel        = 0;
            startLoop();
        }
    }

    function startHold(dir) {
        holdTimeout = setTimeout(() => {
            holdInterval = setInterval(() => {
                vel = Math.max(-MAX_VEL(), Math.min(MAX_VEL(), vel + dir * HOLD_VEL()));
                snapTarget = null;
                startLoop();
            }, HOLD_REPEAT);
        }, HOLD_DELAY);
    }

    function wireArrow(id, dir) {
        const b = document.getElementById(id);
        if (!b) return;
        b.onclick = null;

        const onPress = e => {
            e.preventDefault();
            b.classList.add('cyl-held');
            if (!holdInterval) snapTo(((activeIndex() + dir) % N + N) % N);
            startHold(dir);
        };

        b.addEventListener('mousedown',  onPress);
        b.addEventListener('touchstart', onPress, { passive: false });
    }

    ['fanPrev','rollPrev','carouselPrev'].forEach(id => wireArrow(id, -1));
    ['fanNext','rollNext','carouselNext'].forEach(id => wireArrow(id,  1));

    document.addEventListener('mouseup',     clearHold);
    document.addEventListener('touchend',    clearHold, { passive: true });
    document.addEventListener('touchcancel', clearHold, { passive: true });

    /* ═══════════════════════════════════════════════════════
       KEYBOARD
    ═══════════════════════════════════════════════════════ */
    document.addEventListener('keydown', e => {
        if (e.target.matches('input,textarea,[contenteditable]')) return;
        if (e.key === 'ArrowLeft')  snapTo(((activeIndex() - 1) % N + N) % N);
        if (e.key === 'ArrowRight') snapTo((activeIndex() + 1) % N);
    });

    /* ═══════════════════════════════════════════════════════
       DOT INDICATORS
    ═══════════════════════════════════════════════════════ */
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

    /* ═══════════════════════════════════════════════════════
       UI UPDATE
    ═══════════════════════════════════════════════════════ */
    function updateUI(idx) {
        ['fanCurr','rollCurr','carouselCurrent'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = idx + 1;
        });
        ['fanTot','rollTot','carouselTotal'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = N;
        });
        ['fanDots','rollDots'].forEach(wid => {
            const w = document.getElementById(wid);
            if (!w) return;
            Array.from(w.children).forEach((d, i) =>
                d.classList.toggle('active', i === idx)
            );
        });
        const fill = document.getElementById('carouselFill');
        if (fill) fill.style.width = ((idx + 1) / N * 100) + '%';
    }

    /* ═══════════════════════════════════════════════════════
       RESIZE
    ═══════════════════════════════════════════════════════ */
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { setup(); render(); }, 200);
    });

    /* ═══════════════════════════════════════════════════════
       INIT
    ═══════════════════════════════════════════════════════ */
    setup();
    render();

})();