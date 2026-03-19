/* ═══════════════════════════════════════════════════════════════
   CYLINDER 3D CAROUSEL — v2 (stable + better UI)
   ───────────────────────────────────────────────────────────────
   USAGE
     Option A (cleanest) — add after script.js in your HTML:
       <script src="carousel-cylinder.js" defer></script>

     Option B — paste the entire file at the VERY END of script.js,
       replacing the three old carousel sections:
         "Carousel Nav (arrows + progress bar)"
         "3D ROLL CAROUSEL — MOBILE ONLY"
         "3D FAN CAROUSEL — DESKTOP"

   WHAT'S FIXED vs v1
     • tilt-card transforms removed — no more transform conflicts
     • Exponential moving average drag velocity → smoother throws
     • Soft spring-snap to nearest face when momentum dies
     • Per-card scale via JS (not CSS) → stable with backface culling
     • Gold reflection element injected once per card
     • Single rAF loop — no duplicate animation frames
     • Correct shortest-arc snap for infinite rotation
     • Touch direction lock prevents accidental horizontal swipes
       hijacking vertical page scroll
═══════════════════════════════════════════════════════════════ */
;(function () {
    'use strict';

    /* ─── guard & find elements ─────────────────────────── */
    const grid  = document.querySelector('.projects-grid');
    const wrap  = document.querySelector('.projects-scroll-wrap');
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

    /* Card dimensions (match what CSS renders) */
    function cardW() { return IS_MOB() ? 272 : 330; }
    function cardH() { return IS_MOB() ? 460 : 490; }

    /* Gap between adjacent card edges on the cylinder */
    function gap()   { return IS_MOB() ?  24 :  40; }

    /* Degrees between adjacent faces */
    const FACE = 360 / N;

    /* Cylinder radius from chord-length formula */
    function radius() {
        const chord = cardW() + gap();
        return Math.round(chord / (2 * Math.sin(Math.PI / N)));
    }

    /* ─── physics constants ───────────────────────────────── */
    const FRICTION  = 0.910;   // velocity multiplier per frame
    const MAX_VEL   = 14;     // deg / frame cap
    const SNAP_VEL  = 1.0;   // start spring-snap below this speed
    const SNAP_K    = 0.14;  // spring strength (0–1; higher = snappier)
    const STOP_EPS  = 0.04;  // stop threshold in degrees

    /* EMA smoothing for drag velocity sampling */
    const EMA_ALPHA = 0.28;  // lower = smoother, higher = more reactive

    /* ─── state ───────────────────────────────────────────── */
    let angle      = 0;     // current cylinder Y rotation (degrees)
    let vel        = 0;     // deg / frame
    let snapTarget = null;  // null while spinning freely
    let dragging   = false;
    let dragX      = 0;
    let emaVel     = 0;     // smoothed drag velocity (px / ms)
    let lastT      = 0;
    let isHoriz    = null;  // touch direction lock
    let tsX = 0, tsY = 0;  // touch-start coords
    let raf        = null;  // requestAnimationFrame handle

    /* ────────────────────────────────────────────────────────
       GEOMETRY SETUP
       Sizes the grid, sets perspective on the wrapper, places
       each card at its correct face of the cylinder.
    ──────────────────────────────────────────────────────── */
    function setup() {
        const W = cardW(), H = cardH(), R = radius();

        /* Perspective — placed on the wrapper (parent of rotating grid) */
        wrap.style.perspective       = (R * 3.0) + 'px';
        wrap.style.perspectiveOrigin = '50% 44%';
        wrap.style.overflow          = 'visible';

        /* The cylinder itself */
        Object.assign(grid.style, {
            display:        'block',
            overflow:       'visible',
            position:       'relative',
            width:          W + 'px',
            height:         H + 'px',
            margin:         '2rem auto 0',
            padding:        '0',
            transformStyle: 'preserve-3d',
        });

        /* Place each card permanently on its cylinder face.
           JS overwrites ONLY the scale part each frame via
           render() — the rotateY / translateZ never change. */
        cards.forEach((card, i) => {
            const faceY = i * FACE;                 // degrees on cylinder

            Object.assign(card.style, {
                position:             'absolute',
                left:                 '0',
                top:                  '0',
                width:                W + 'px',
                height:               H + 'px',
                flex:                 'none',
                margin:               '0',
                backfaceVisibility:   'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transformStyle:       'preserve-3d',
            });

            /* Store the fixed face angle so render() can read it */
            card._faceY = faceY;
        });
    }

    /* ────────────────────────────────────────────────────────
       ACTIVE INDEX
       Returns the index of the card angularly closest to the
       front (viewer's 12-o'clock position).
    ──────────────────────────────────────────────────────── */
    function activeIndex() {
        let best = 0, bestAbs = 999;
        for (let i = 0; i < N; i++) {
            /* How many degrees is this face from the front? */
            let d = ((card_angle(i)) % 360 + 360) % 360;
            if (d > 180) d -= 360;
            const a = Math.abs(d);
            if (a < bestAbs) { bestAbs = a; best = i; }
        }
        return best;
    }

    /* Effective world angle of card i's face */
    function card_angle(i) {
        return cards[i]._faceY + angle;
    }

    /* ────────────────────────────────────────────────────────
       TARGET ANGLE
       The cylinder rotation needed to bring card i to front,
       via the shortest arc (handles infinite wrap correctly).
    ──────────────────────────────────────────────────────── */
    function targetAngle(i) {
        const ideal = -(i * FACE);      // angle when card i faces viewer
        let diff    = ideal - angle;
        /* Normalise to [-180, +180] */
        diff = ((diff % 360) + 360) % 360;
        if (diff > 180) diff -= 360;
        return angle + diff;
    }

    /* ────────────────────────────────────────────────────────
       RENDER
       Updates the grid's Y rotation and each card's visual
       properties every animation frame.
    ──────────────────────────────────────────────────────── */
    function render() {
        /* Rotate the whole cylinder */
        grid.style.transform = `rotateY(${angle}deg)`;

        const R   = radius();
        const idx = activeIndex();

        cards.forEach((card, i) => {
            const faceY = card._faceY;

            /* Angular distance from front (signed, wrapped) */
            let d = ((faceY + angle) % 360 + 360) % 360;
            if (d > 180) d -= 360;
            const absD   = Math.abs(d);
            const isFront = (i === idx);

            /* Hide cards facing away from viewer */
            if (absD > 95) {
                card.style.visibility    = 'hidden';
                card.style.pointerEvents = 'none';
                card.classList.remove('cyl-active', 'fan-active', 'roll-active');
                return;
            }

            card.style.visibility = 'visible';

            /* t = 1 at front, 0 at 95° */
            const t = 1 - absD / 95;

            /* --- transform: face position + per-card scale ---
               Scale makes the active card pop forward while
               siblings recede naturally into the 3D field. */
            const sc = isFront ? 1.0 : (0.78 + 0.22 * t * t);
            card.style.transform =
                `rotateY(${faceY}deg) translateZ(${R}px) scale(${sc.toFixed(4)})`;

            /* --- opacity --- */
            const op = isFront ? 1 : Math.max(0.12, 0.14 + 0.86 * t * 0.82);
            card.style.opacity   = op.toFixed(3);

            /* --- brightness / saturation --- */
            const br = isFront ? 1.0  : (0.32 + 0.68 * t);
            const sa = isFront ? 1.08 : (0.30 + 0.70 * t);
            card.style.filter    = `brightness(${br.toFixed(2)}) saturate(${sa.toFixed(2)})`;

            /* --- z-index (stacking for clicks) --- */
            card.style.zIndex    = isFront ? '20' : String(Math.max(0, Math.round(19 - absD * 0.2)));

            /* --- box-shadow --- */
            if (isFront) {
                card.style.boxShadow =
                    '0 36px 72px rgba(0,0,0,.68),' +
                    '0 0 0 1.5px rgba(201,169,110,.32),' +
                    '0 0 55px rgba(201,169,110,.13)';
            } else {
                const sh = Math.round(6 + 16 * t);
                card.style.boxShadow = `0 ${sh}px ${sh * 2}px rgba(0,0,0,.42)`;
            }

            /* --- pointer events ---
               Non-active cards have a ::before overlay (CSS) that
               catches the click. The card itself stays pointer-auto
               so that click event bubbles up for our handler below. */
            card.style.pointerEvents = 'auto';

            /* --- state classes --- */
            card.classList.toggle('cyl-active',  isFront);
            card.classList.toggle('fan-active',  isFront);
            card.classList.toggle('roll-active', isFront);
        });

        updateUI(idx);
    }

    /* ────────────────────────────────────────────────────────
       ANIMATION LOOP
       Physics: friction decay → spring snap → stop
    ──────────────────────────────────────────────────────── */
    function loop() {
        if (!dragging) {
            if (snapTarget !== null) {
                /* Spring toward snap target */
                const diff = snapTarget - angle;
                if (Math.abs(diff) < STOP_EPS) {
                    angle      = snapTarget;
                    snapTarget = null;
                    vel        = 0;
                    render();
                    raf = null;
                    return;
                }
                const step = diff * SNAP_K;
                angle += step;
                vel    = step; // keep vel in sync for debug
            } else {
                /* Momentum decay */
                vel   *= FRICTION;
                angle += vel;

                /* Transition to spring-snap when slow enough */
                if (Math.abs(vel) < SNAP_VEL) {
                    snapTarget = targetAngle(activeIndex());
                    vel        = 0;
                }
                /* Safety stop (shouldn't be needed with spring, but belt-and-braces) */
                if (Math.abs(vel) < STOP_EPS && snapTarget === null) {
                    vel = 0;
                    render();
                    raf = null;
                    return;
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
       Maps horizontal pixels → degrees of cylinder rotation.
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

        /* Rotate cylinder directly with the drag */
        angle += pxToDeg(dx);

        /* Exponential moving average for velocity (px / ms) */
        const instVel = dx / dt;
        emaVel = EMA_ALPHA * instVel + (1 - EMA_ALPHA) * emaVel;

        dragX = x;
        lastT = now;
    }

    function onDragEnd() {
        if (!dragging) return;
        dragging = false;
        grid.style.cursor = 'grab';

        /* Convert EMA px/ms → deg/frame (≈ 16 ms per frame at 60 fps) */
        const rawVel = pxToDeg(emaVel * 16);
        vel = Math.max(-MAX_VEL, Math.min(MAX_VEL, rawVel));

        startLoop();
    }

    /* ────────────────────────────────────────────────────────
       MOUSE EVENTS
    ──────────────────────────────────────────────────────── */
    /* Selector of interactive descendants that should NOT initiate drag */
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

    document.addEventListener('mouseup', () => onDragEnd());

    /* Prevent stray drag-select on the page */
    grid.addEventListener('dragstart', e => e.preventDefault());

    /* ────────────────────────────────────────────────────────
       TOUCH EVENTS
    ──────────────────────────────────────────────────────── */
    grid.addEventListener('touchstart', e => {
        if (e.touches.length !== 1) return;
        tsX      = e.touches[0].clientX;
        tsY      = e.touches[0].clientY;
        isHoriz  = null;
        onDragStart(tsX);
    }, { passive: true });

    grid.addEventListener('touchmove', e => {
        if (!dragging || e.touches.length !== 1) return;

        const dx = e.touches[0].clientX - tsX;
        const dy = e.touches[0].clientY - tsY;

        /* Lock direction on first meaningful move */
        if (isHoriz === null && (Math.abs(dx) > 7 || Math.abs(dy) > 7)) {
            isHoriz = Math.abs(dx) > Math.abs(dy);
        }

        /* Vertical swipe → release the drag and let the page scroll */
        if (isHoriz === false) {
            onDragEnd();
            return;
        }

        if (!isHoriz) return; // still deciding

        e.preventDefault();   // only block scroll once we're sure it's horizontal
        onDragMove(e.touches[0].clientX);
    }, { passive: false });

    grid.addEventListener('touchend',    () => onDragEnd(), { passive: true });
    grid.addEventListener('touchcancel', () => onDragEnd(), { passive: true });

    /* ────────────────────────────────────────────────────────
       CLICK SIDE CARDS — impulse toward clicked card
    ──────────────────────────────────────────────────────── */
    cards.forEach((card, i) => {
        card.addEventListener('click', e => {
            /* Only fire if the click landed on the ::before overlay
               (i.e. the card itself, not an interactive child) */
            if (e.target !== card &&
                !e.target.classList.contains('cyl-reflection') &&
                card.classList.contains('cyl-active')) return;

            if (card.classList.contains('cyl-active')) return;
            if (dragging || Math.abs(vel) > 1.5) return;

            /* Shortest-arc impulse */
            const act  = activeIndex();
            let diff   = i - act;
            if (diff >  N / 2) diff -= N;
            if (diff < -N / 2) diff += N;

            /* Target angle for the clicked card then let spring handle it */
            snapTarget = targetAngle(i);
            vel        = 0;
            startLoop();
        });
    });

    /* ────────────────────────────────────────────────────────
       ARROW BUTTONS — impulse (momentum-based, no hard jump)
    ──────────────────────────────────────────────────────── */
    function goToAdjacentCard(dir) {
        /* dir: -1 = previous, +1 = next */
        const act     = activeIndex();
        const target  = ((act + dir) % N + N) % N;
        snapTarget    = targetAngle(target);
        vel           = 0;
        startLoop();
    }

    /* Wire all three sets of nav buttons */
    ['fanPrev', 'rollPrev', 'carouselPrev'].forEach(id => {
        const b = document.getElementById(id);
        if (!b) return;
        b.onclick = null;
        b.addEventListener('click', () => goToAdjacentCard(-1));
    });
    ['fanNext', 'rollNext', 'carouselNext'].forEach(id => {
        const b = document.getElementById(id);
        if (!b) return;
        b.onclick = null;
        b.addEventListener('click', () => goToAdjacentCard(1));
    });

    /* ────────────────────────────────────────────────────────
       KEYBOARD  ← →
    ──────────────────────────────────────────────────────── */
    document.addEventListener('keydown', e => {
        if (e.target.matches('input,textarea,[contenteditable]')) return;
        if (e.key === 'ArrowLeft')  goToAdjacentCard(-1);
        if (e.key === 'ArrowRight') goToAdjacentCard(1);
    });

    /* ────────────────────────────────────────────────────────
       DOT INDICATORS — rebuild both containers
    ──────────────────────────────────────────────────────── */
    function buildDots(containerId, dotClass) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < N; i++) {
            const d = document.createElement('button');
            d.className = dotClass + (i === 0 ? ' active' : '');
            d.setAttribute('aria-label', 'Go to project ' + (i + 1));
            d.addEventListener('click', () => {
                snapTarget = targetAngle(i);
                vel        = 0;
                startLoop();
            });
            container.appendChild(d);
        }
    }

    buildDots('fanDots',  'fan-dot');
    buildDots('rollDots', 'roll-dot');

    /* ────────────────────────────────────────────────────────
       UI UPDATE — counters, dots, progress fill
    ──────────────────────────────────────────────────────── */
    function updateUI(idx) {
        /* Counters */
        ['fanCurr', 'rollCurr', 'carouselCurrent'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = idx + 1;
        });
        /* Totals */
        ['fanTot', 'rollTot', 'carouselTotal'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = N;
        });
        /* Dot highlights */
        ['fanDots', 'rollDots'].forEach(wid => {
            const w = document.getElementById(wid);
            if (!w) return;
            Array.from(w.children).forEach((d, i) =>
                d.classList.toggle('active', i === idx)
            );
        });
        /* Flat progress bar */
        const fill = document.getElementById('carouselFill');
        if (fill) fill.style.width = ((idx + 1) / N * 100) + '%';
    }

    /* ────────────────────────────────────────────────────────
       RESIZE — rebuild geometry on viewport change
    ──────────────────────────────────────────────────────── */
    const onResize = (typeof throttle === 'function')
        ? throttle(() => { setup(); render(); }, 250)
        : (() => {
            let t;
            return () => { clearTimeout(t); t = setTimeout(() => { setup(); render(); }, 250); };
          })();

    window.addEventListener('resize', onResize);

    /* ────────────────────────────────────────────────────────
       INIT
    ──────────────────────────────────────────────────────── */
    setup();
    render();

})();