/* ════════════════════════════════════════════════════
   SOUND SYSTEM — MECHANICAL AUDIO ENGINE
   Amit Kumar Nayak Portfolio 2026
════════════════════════════════════════════════════ */
'use strict';

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let soundEnabled = true;

function getCtx() {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

/* ── Unlock on first gesture ── */
document.addEventListener('click', function unlock() {
    getCtx();
    document.removeEventListener('click', unlock);
}, { once: true });

/* ════════════════════════════════════════════════════
   SOUND 1 — Card Change (fan/roll carousel advance)
   Heavy mechanical ratchet click
════════════════════════════════════════════════════ */
function playCardChange() {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx();
        const now = ctx.currentTime;

        /* Layer 1 — sharp transient snap */
        const bufSize = Math.floor(ctx.sampleRate * 0.045);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 14);
        }
        const snap = ctx.createBufferSource();
        snap.buffer = buf;

        const snapGain = ctx.createGain();
        snapGain.gain.setValueAtTime(0.32, now);
        snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

        const bpf = ctx.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.value = 2800;
        bpf.Q.value = 1.2;

        snap.connect(bpf); bpf.connect(snapGain); snapGain.connect(ctx.destination);
        snap.start(now); snap.stop(now + 0.045);

        /* Layer 2 — body thud */
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.07);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.22, now);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        osc.connect(oscGain); oscGain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.08);

        /* Layer 3 — metallic spring ping */
        const tick = ctx.createOscillator();
        tick.type = 'square';
        tick.frequency.value = 1600;

        const tickGain = ctx.createGain();
        tickGain.gain.setValueAtTime(0.07, now);
        tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

        const hpf = ctx.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = 1000;

        tick.connect(hpf); hpf.connect(tickGain); tickGain.connect(ctx.destination);
        tick.start(now); tick.stop(now + 0.022);

    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND 2 — Dot / Arrow Button Click
   Light mechanical button press
════════════════════════════════════════════════════ */
function playButtonClick() {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx();
        const now = ctx.currentTime;

        /* Noise burst */
        const bufSize = Math.floor(ctx.sampleRate * 0.025);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 10);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buf;

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.18, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 3500;
        f.Q.value = 1.5;

        noise.connect(f); f.connect(g); g.connect(ctx.destination);
        noise.start(now); noise.stop(now + 0.025);

        /* Tone */
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(280, now);
        o.frequency.exponentialRampToValueAtTime(120, now + 0.04);

        const og = ctx.createGain();
        og.gain.setValueAtTime(0.1, now);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

        o.connect(og); og.connect(ctx.destination);
        o.start(now); o.stop(now + 0.04);

    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND 3 — Image Slideshow Next/Prev
   Soft film advance mechanical click
════════════════════════════════════════════════════ */
function playSlideshowClick() {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx();
        const now = ctx.currentTime;

        /* Soft tap */
        const bufSize = Math.floor(ctx.sampleRate * 0.03);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 16);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buf;

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

        const f = ctx.createBiquadFilter();
        f.type = 'highpass';
        f.frequency.value = 4000;

        noise.connect(f); f.connect(g); g.connect(ctx.destination);
        noise.start(now); noise.stop(now + 0.03);

        /* Very subtle low pop */
        const pop = ctx.createOscillator();
        pop.type = 'sine';
        pop.frequency.setValueAtTime(200, now);
        pop.frequency.exponentialRampToValueAtTime(80, now + 0.03);

        const pg = ctx.createGain();
        pg.gain.setValueAtTime(0.06, now);
        pg.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

        pop.connect(pg); pg.connect(ctx.destination);
        pop.start(now); pop.stop(now + 0.03);

    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND 4 — Lightbox Open
   Satisfying mechanical shutter open
════════════════════════════════════════════════════ */
function playLightboxOpen() {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx();
        const now = ctx.currentTime;

        /* Swoosh up */
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.12);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.18, now + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

        osc.connect(g); g.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.15);

        /* Click at end */
        const bufSize = Math.floor(ctx.sampleRate * 0.02);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 12);
        }
        const n = ctx.createBufferSource();
        n.buffer = buf;

        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.22, now + 0.1);
        ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

        n.connect(ng); ng.connect(ctx.destination);
        n.start(now + 0.1); n.stop(now + 0.14);

    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND 5 — Lightbox Close
   Mechanical shutter close (downward swoosh)
════════════════════════════════════════════════════ */
function playLightboxClose() {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

        osc.connect(g); g.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.13);

        /* Thud at end */
        const thud = ctx.createOscillator();
        thud.type = 'sine';
        thud.frequency.setValueAtTime(100, now + 0.09);
        thud.frequency.exponentialRampToValueAtTime(40, now + 0.16);

        const tg = ctx.createGain();
        tg.gain.setValueAtTime(0.2, now + 0.09);
        tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);

        thud.connect(tg); tg.connect(ctx.destination);
        thud.start(now + 0.09); thud.stop(now + 0.18);

    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND 6 — Auto-advance (softer version of card change)
   Quiet automatic ratchet
════════════════════════════════════════════════════ */
function playAutoAdvance() {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx();
        const now = ctx.currentTime;

        const bufSize = Math.floor(ctx.sampleRate * 0.03);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 12);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buf;

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.08, now);  /* quieter than manual */
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 2400;
        f.Q.value = 1.4;

        noise.connect(f); f.connect(g); g.connect(ctx.destination);
        noise.start(now); noise.stop(now + 0.03);

        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(120, now);
        o.frequency.exponentialRampToValueAtTime(50, now + 0.05);

        const og = ctx.createGain();
        og.gain.setValueAtTime(0.07, now);
        og.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        o.connect(og); og.connect(ctx.destination);
        o.start(now); o.stop(now + 0.05);

    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND 7 — Keyboard arrow navigation
   Typewriter key press
════════════════════════════════════════════════════ */
function playKeyPress() {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx();
        const now = ctx.currentTime;

        /* Key down click */
        const bufSize = Math.floor(ctx.sampleRate * 0.018);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 18);
        }
        const k = ctx.createBufferSource();
        k.buffer = buf;

        const kg = ctx.createGain();
        kg.gain.setValueAtTime(0.25, now);
        kg.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

        const kf = ctx.createBiquadFilter();
        kf.type = 'bandpass';
        kf.frequency.value = 4200;
        kf.Q.value = 2;

        k.connect(kf); kf.connect(kg); kg.connect(ctx.destination);
        k.start(now); k.stop(now + 0.018);

        /* Key bottom-out thud */
        const thud = ctx.createOscillator();
        thud.type = 'sine';
        thud.frequency.setValueAtTime(220, now + 0.008);
        thud.frequency.exponentialRampToValueAtTime(80, now + 0.035);

        const tg = ctx.createGain();
        tg.gain.setValueAtTime(0.14, now + 0.008);
        tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

        thud.connect(tg); tg.connect(ctx.destination);
        thud.start(now + 0.008); thud.stop(now + 0.04);

    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND 8 — Drag start
   Subtle gear engage
════════════════════════════════════════════════════ */
function playDragStart() {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx();
        const now = ctx.currentTime;

        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(80, now);
        o.frequency.exponentialRampToValueAtTime(140, now + 0.06);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.06, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 600;

        o.connect(f); f.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.07);

    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND 9 — V-Meet mosaic cell click
   Camera shutter click
════════════════════════════════════════════════════ */
function playCameraClick() {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx();
        const now = ctx.currentTime;

        /* Two-stage shutter: curtain open + close */
        [0, 0.05].forEach((offset, idx) => {
            const bufSize = Math.floor(ctx.sampleRate * 0.015);
            const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++) {
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 14);
            }
            const n = ctx.createBufferSource();
            n.buffer = buf;

            const g = ctx.createGain();
            const vol = idx === 0 ? 0.28 : 0.18;
            g.gain.setValueAtTime(vol, now + offset);
            g.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.015);

            const f = ctx.createBiquadFilter();
            f.type = 'bandpass';
            f.frequency.value = idx === 0 ? 3000 : 2200;
            f.Q.value = 1.2;

            n.connect(f); f.connect(g); g.connect(ctx.destination);
            n.start(now + offset); n.stop(now + offset + 0.02);
        });

    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND TOGGLE BUTTON (optional UI control)
════════════════════════════════════════════════════ */
function toggleSound() {
    soundEnabled = !soundEnabled;
    return soundEnabled;
}

/* ════════════════════════════════════════════════════
   BIND ALL SOUNDS TO DOM EVENTS
   Runs after DOM is ready
════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {

    /* ── Fan carousel arrows ── */
    const fanPrev = document.getElementById('fanPrev');
    const fanNext = document.getElementById('fanNext');
    if (fanPrev) fanPrev.addEventListener('click', playCardChange);
    if (fanNext) fanNext.addEventListener('click', playCardChange);

    /* ── Fan dots ── */
    const fanDots = document.getElementById('fanDots');
    if (fanDots) {
        new MutationObserver(() => {
            fanDots.querySelectorAll('.fan-dot').forEach(d => {
                if (!d.dataset.soundBound) {
                    d.dataset.soundBound = '1';
                    d.addEventListener('click', playButtonClick);
                }
            });
        }).observe(fanDots, { childList: true });
    }

    /* ── Roll carousel arrows ── */
    const rollPrev = document.getElementById('rollPrev');
    const rollNext = document.getElementById('rollNext');
    if (rollPrev) rollPrev.addEventListener('click', playCardChange);
    if (rollNext) rollNext.addEventListener('click', playCardChange);

    /* ── Roll dots ── */
    const rollDots = document.getElementById('rollDots');
    if (rollDots) {
        new MutationObserver(() => {
            rollDots.querySelectorAll('.roll-dot').forEach(d => {
                if (!d.dataset.soundBound) {
                    d.dataset.soundBound = '1';
                    d.addEventListener('click', playButtonClick);
                }
            });
        }).observe(rollDots, { childList: true });
    }

    /* ── Flat carousel arrows ── */
    const cPrev = document.getElementById('carouselPrev');
    const cNext = document.getElementById('carouselNext');
    if (cPrev) cPrev.addEventListener('click', playCardChange);
    if (cNext) cNext.addEventListener('click', playCardChange);

    /* ── Image slideshow prev/next ── */
    document.querySelectorAll('.ps-prev, .ps-next').forEach(btn => {
        btn.addEventListener('click', playSlideshowClick);
    });

    /* ── Image slideshow dots ── */
    document.querySelectorAll('.ps-dot-ind').forEach(dot => {
        dot.addEventListener('click', playSlideshowClick);
    });

    /* ── Project image lightbox ── */
    const lbClose  = document.getElementById('projLbClose');
    const lbPrev   = document.getElementById('projLbPrev');
    const lbNext   = document.getElementById('projLbNext');
    const lbBdrop  = document.getElementById('projLbBackdrop');
    const lbDots   = document.getElementById('projLbDots');

    if (lbClose) lbClose.addEventListener('click', playLightboxClose);
    if (lbBdrop) lbBdrop.addEventListener('click', playLightboxClose);
    if (lbPrev)  lbPrev.addEventListener('click',  () => playSlideshowClick());
    if (lbNext)  lbNext.addEventListener('click',  () => playSlideshowClick());

    /* Lightbox open — bind to every .pc-img-slide */
    function bindImgSounds() {
        document.querySelectorAll('.pc-img-slide').forEach(img => {
            if (!img.dataset.sndBound) {
                img.dataset.sndBound = '1';
                img.addEventListener('click', playLightboxOpen);
            }
        });
        if (lbDots) {
            lbDots.querySelectorAll('.proj-lb-dot').forEach(d => {
                if (!d.dataset.sndBound) {
                    d.dataset.sndBound = '1';
                    d.addEventListener('click', playSlideshowClick);
                }
            });
        }
    }
    bindImgSounds();
    const grid = document.querySelector('.projects-grid');
    if (grid) new MutationObserver(bindImgSounds).observe(grid, { childList: true, subtree: true });

    /* ── V-Meet mosaic cells ── */
    const vmGallery = document.getElementById('vmGallery');
    if (vmGallery) {
        vmGallery.querySelectorAll('.vmg-cell').forEach(cell => {
            cell.addEventListener('click', playCameraClick);
        });
        /* Lightbox nav */
        const vmClose = document.getElementById('vmgLbClose');
        const vmPrev  = document.getElementById('vmgLbPrev');
        const vmNext  = document.getElementById('vmgLbNext');
        if (vmClose) vmClose.addEventListener('click', playLightboxClose);
        if (vmPrev)  vmPrev.addEventListener('click',  playSlideshowClick);
        if (vmNext)  vmNext.addEventListener('click',  playSlideshowClick);
        const vmDots = document.getElementById('vmgLbDots');
        if (vmDots) {
            new MutationObserver(() => {
                vmDots.querySelectorAll('.vmg-lb-dot').forEach(d => {
                    if (!d.dataset.sndBound) {
                        d.dataset.sndBound = '1';
                        d.addEventListener('click', playSlideshowClick);
                    }
                });
            }).observe(vmDots, { childList: true });
        }
    }

    /* ── Drag start on grid ── */
    if (grid) grid.addEventListener('mousedown', playDragStart);

    /* ── Keyboard arrows ── */
    document.addEventListener('keydown', (e) => {
        if (e.target.matches('input, textarea')) return;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') playKeyPress();
    });

    /* ── Patch auto-advance sounds into existing carousel IIFEs ── */
    /* We monkey-patch by watching for class changes on cards */
    const cards = document.querySelectorAll('.project-card');
    let lastActive = -1;
    const cardObserver = new MutationObserver(() => {
        cards.forEach((c, i) => {
            if ((c.classList.contains('fan-active') || c.classList.contains('roll-active')) && i !== lastActive) {
                lastActive = i;
                /* If no human interaction in last 200ms → auto-advance sound */
                if (Date.now() - lastHumanInteraction > 200) {
                    playAutoAdvance();
                }
            }
        });
    });
    cards.forEach(c => cardObserver.observe(c, { attributes: true, attributeFilter: ['class'] }));

});

/* Track last human interaction time */
let lastHumanInteraction = 0;
document.addEventListener('click',     () => { lastHumanInteraction = Date.now(); });
document.addEventListener('keydown',   () => { lastHumanInteraction = Date.now(); });
document.addEventListener('touchstart',() => { lastHumanInteraction = Date.now(); }, { passive: true });