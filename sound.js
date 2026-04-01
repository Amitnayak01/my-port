


/* ════════════════════════════════════════════════════
   SOUND SYSTEM v3 — MECHANICAL AUDIO ENGINE
   Amit Kumar Nayak Portfolio 2026
════════════════════════════════════════════════════ */
'use strict';

/* ── Audio context singleton ── */
let audioCtx     = null;
let soundEnabled = true;
var _ctxUnlocked = false;

function getCtx() {
    if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return null; }
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(function(){});
    }
    return audioCtx;
}

/* ══════════════════════════════════════════════════
   AUDIO UNLOCK
   touchstart  → trusted on ALL mobile browsers (fires
                 before scroll moves, unlocks instantly)
   wheel       → trusted in Chrome desktop
   mousedown   → fallback for Safari/Firefox desktop
══════════════════════════════════════════════════ */
var _ctxUnlocked = false;

function _playBootChime() {
    setTimeout(function() { try { playPageLoad(); } catch(e) {} }, 100);
}

function _removeUnlockListeners() {
    ['touchstart', 'wheel', 'mousedown', 'pointerdown', 'click', 'keydown'].forEach(function(ev) {
        document.removeEventListener(ev, _tryUnlock, true);
    });
}

function _tryUnlock() {
    if (_ctxUnlocked) return;
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        audioCtx.resume().then(function() {
            if (audioCtx.state === 'running') {
                _ctxUnlocked = true;
                _removeUnlockListeners();
                _playBootChime();
            }
        }).catch(function() {});
    } catch(e) {}
}

['touchstart', 'wheel', 'mousedown', 'pointerdown', 'click', 'keydown'].forEach(function(ev) {
    document.addEventListener(ev, _tryUnlock, { capture: true, passive: true });
});


/* One-time listeners — removed immediately after first fire */
function _bindAutoUnlock() {
    var events = ['scroll', 'touchstart', 'mousedown', 'keydown', 'wheel'];

    function onFirstGesture() {
        events.forEach(function (ev) {
            window.removeEventListener(ev, onFirstGesture, { capture: true });
        });
        unlockAndEnter();
    }

    events.forEach(function (ev) {
        window.addEventListener(ev, onFirstGesture, { capture: true, passive: true });
    });
}

document.addEventListener('DOMContentLoaded', _bindAutoUnlock);



/* Bind splash interactions as early as possible */
document.addEventListener('DOMContentLoaded', function() {
    var splash = document.getElementById('audioSplash');
    if (!splash) return;

    function onSplashInteract(e) {
        e.preventDefault();
        unlockAndEnter();
    }

    splash.addEventListener('click',    onSplashInteract);
    splash.addEventListener('touchend', onSplashInteract, { passive: false });
    splash.addEventListener('keydown',  function(e) {
        if (e.key === 'Enter' || e.key === ' ') unlockAndEnter();
    });
});

/* ══════════════════════════════════════════════════
   SHARED HELPERS
══════════════════════════════════════════════════ */
function makeNoise(ctx, duration, exponent) {
    exponent = exponent || 12;
    const size = Math.floor(ctx.sampleRate * duration);
    const buf  = ctx.createBuffer(1, size, ctx.sampleRate);
    const d    = buf.getChannelData(0);
    for (let i = 0; i < size; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / size, exponent);
    return buf;
}

/* ════════════════════════════════════════════════════
   SOUND 1 — Card Change
════════════════════════════════════════════════════ */
function playCardChange() {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;

        const bufSize = Math.floor(ctx.sampleRate * 0.045);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++)
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 14);
        const snap = ctx.createBufferSource();
        snap.buffer = buf;
        const snapGain = ctx.createGain();
        snapGain.gain.setValueAtTime(0.32, now);
        snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
        const bpf = ctx.createBiquadFilter();
        bpf.type = 'bandpass'; bpf.frequency.value = 2800; bpf.Q.value = 1.2;
        snap.connect(bpf); bpf.connect(snapGain); snapGain.connect(ctx.destination);
        snap.start(now); snap.stop(now + 0.045);

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.07);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.22, now);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        osc.connect(oscGain); oscGain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.08);

        const tick = ctx.createOscillator();
        tick.type = 'square'; tick.frequency.value = 1600;
        const tickGain = ctx.createGain();
        tickGain.gain.setValueAtTime(0.07, now);
        tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);
        const hpf = ctx.createBiquadFilter();
        hpf.type = 'highpass'; hpf.frequency.value = 1000;
        tick.connect(hpf); hpf.connect(tickGain); tickGain.connect(ctx.destination);
        tick.start(now); tick.stop(now + 0.022);
    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND 2 — Button Click
════════════════════════════════════════════════════ */
function playButtonClick() {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;

        const bufSize = Math.floor(ctx.sampleRate * 0.025);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++)
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 10);
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.18, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 3500; f.Q.value = 1.5;
        noise.connect(f); f.connect(g); g.connect(ctx.destination);
        noise.start(now); noise.stop(now + 0.025);

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
   SOUND 3 — Slideshow Click
════════════════════════════════════════════════════ */
function playSlideshowClick() {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;

        const bufSize = Math.floor(ctx.sampleRate * 0.03);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++)
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 16);
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
        const f = ctx.createBiquadFilter();
        f.type = 'highpass'; f.frequency.value = 4000;
        noise.connect(f); f.connect(g); g.connect(ctx.destination);
        noise.start(now); noise.stop(now + 0.03);

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
════════════════════════════════════════════════════ */
function playLightboxOpen() {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;

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

        const bufSize = Math.floor(ctx.sampleRate * 0.02);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++)
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 12);
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
════════════════════════════════════════════════════ */
function playLightboxClose() {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx(); if (!ctx) return;
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
   SOUND 6 — Auto-advance
════════════════════════════════════════════════════ */
function playAutoAdvance() {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;

        const bufSize = Math.floor(ctx.sampleRate * 0.03);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++)
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 12);
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.08, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 1.4;
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
   SOUND 7 — Key Press
════════════════════════════════════════════════════ */
function playKeyPress() {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;

        const bufSize = Math.floor(ctx.sampleRate * 0.018);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++)
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 18);
        const k = ctx.createBufferSource();
        k.buffer = buf;
        const kg = ctx.createGain();
        kg.gain.setValueAtTime(0.25, now);
        kg.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
        const kf = ctx.createBiquadFilter();
        kf.type = 'bandpass'; kf.frequency.value = 4200; kf.Q.value = 2;
        k.connect(kf); kf.connect(kg); kg.connect(ctx.destination);
        k.start(now); k.stop(now + 0.018);

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
   SOUND 8 — Drag Start
════════════════════════════════════════════════════ */
function playDragStart() {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx(); if (!ctx) return;
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
        f.type = 'lowpass'; f.frequency.value = 600;
        o.connect(f); f.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.07);
    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND 9 — Camera Click
════════════════════════════════════════════════════ */
function playCameraClick() {
    if (!soundEnabled) return;
    try {
        const ctx = getCtx(); if (!ctx) return;
        const now = ctx.currentTime;

        [0, 0.05].forEach(function(offset, idx) {
            const bufSize = Math.floor(ctx.sampleRate * 0.015);
            const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < bufSize; i++)
                d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 14);
            const n = ctx.createBufferSource();
            n.buffer = buf;
            const g = ctx.createGain();
            var vol = idx === 0 ? 0.28 : 0.18;
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
   SOUND 10 — KIT-KIT Mechanical Scroll
   Alternating sharp plastic ratchet ticks.
   Mobile-friendly throttle built in.
════════════════════════════════════════════════════ */
var _scrollSoundLast = 0;
var _scrollTickCount = 0;



function playScroll(direction) {
    if (!soundEnabled) return;
    var now = Date.now();
    var isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (now - _scrollSoundLast < (isMobile ? 110 : 35)) return;
    _scrollSoundLast = now;

    try {
        var ctx = getCtx(); if (!ctx) return;
        var t   = ctx.currentTime;

        _scrollTickCount = (_scrollTickCount + 1) % 2;

        /* ── KIT snap impulse ── */
        var kitSize = Math.floor(ctx.sampleRate * 0.006);
        var kitBuf  = ctx.createBuffer(1, kitSize, ctx.sampleRate);
        var kd      = kitBuf.getChannelData(0);
        for (var i = 0; i < kitSize; i++) {
            var p = i / kitSize;
            kd[i] = Math.sin(p * Math.PI * 14)
                  * Math.pow(1 - p, 28)
                  * (Math.random() * 0.15 + 0.85);
        }
        var kit  = ctx.createBufferSource();
        kit.buffer = kitBuf;

        var kBpf1 = ctx.createBiquadFilter();
        kBpf1.type = 'bandpass';
        kBpf1.frequency.value = (_scrollTickCount === 0 ? 3400 : 3900)
                              * (_scrollTickCount === 0 ? 1.0  : 1.18);
        kBpf1.Q.value = 1.2;

        var kBpf2 = ctx.createBiquadFilter();
        kBpf2.type = 'peaking';
        kBpf2.frequency.value = 6500;
        kBpf2.gain.value = 8;
        kBpf2.Q.value = 1.8;

        var kGain = ctx.createGain();
        kGain.gain.setValueAtTime(0.72, t);
        kGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.006);

        kit.connect(kBpf1); kBpf1.connect(kBpf2); kBpf2.connect(kGain); kGain.connect(ctx.destination);
        kit.start(t); kit.stop(t + 0.008);

        /* ── "IT" tone body ── */
        var kitTone = ctx.createOscillator();
        kitTone.type = 'square';
        kitTone.frequency.setValueAtTime(_scrollTickCount === 0 ? 2800 : 3200, t);
        kitTone.frequency.exponentialRampToValueAtTime(_scrollTickCount === 0 ? 1100 : 1300, t + 0.009);

        var ktHpf = ctx.createBiquadFilter();
        ktHpf.type = 'highpass';
        ktHpf.frequency.value = 1800;

        var ktGain = ctx.createGain();
        ktGain.gain.setValueAtTime(0.0001, t);
        ktGain.gain.linearRampToValueAtTime(0.06, t + 0.001);
        ktGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.009);

        kitTone.connect(ktHpf); ktHpf.connect(ktGain); ktGain.connect(ctx.destination);
        kitTone.start(t); kitTone.stop(t + 0.01);

        /* ── Air puff ── */
        var airSize = Math.floor(ctx.sampleRate * 0.005);
        var airBuf  = ctx.createBuffer(1, airSize, ctx.sampleRate);
        var ad      = airBuf.getChannelData(0);
        for (var j = 0; j < airSize; j++) {
            var ap = j / airSize;
            ad[j] = (Math.random() * 2 - 1) * Math.pow(1 - ap, 6);
        }
        var airSrc = ctx.createBufferSource();
        airSrc.buffer = airBuf;

        var airHpf = ctx.createBiquadFilter();
        airHpf.type = 'highpass';
        airHpf.frequency.value = 5500;

        var airGain = ctx.createGain();
        airGain.gain.setValueAtTime(0.18, t);
        airGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.005);

        airSrc.connect(airHpf); airHpf.connect(airGain); airGain.connect(ctx.destination);
        airSrc.start(t); airSrc.stop(t + 0.006);

        /* ── Every 2nd tick — index notch ── */
        if (_scrollTickCount === 0) {
            var notchSize = Math.floor(ctx.sampleRate * 0.007);
            var notchBuf  = ctx.createBuffer(1, notchSize, ctx.sampleRate);
            var nd        = notchBuf.getChannelData(0);
            for (var n = 0; n < notchSize; n++) {
                var np = n / notchSize;
                nd[n] = Math.sin(np * Math.PI * 10)
                      * Math.pow(1 - np, 20)
                      * (Math.random() * 0.1 + 0.9);
            }
            var notch = ctx.createBufferSource();
            notch.buffer = notchBuf;

            var nBpf = ctx.createBiquadFilter();
            nBpf.type = 'bandpass';
            nBpf.frequency.value = 1600;
            nBpf.Q.value = 0.7;

            var nGain = ctx.createGain();
            nGain.gain.setValueAtTime(0.28, t + 0.002);
            nGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);

            notch.connect(nBpf); nBpf.connect(nGain); nGain.connect(ctx.destination);
            notch.start(t + 0.002); notch.stop(t + 0.02);
        }

    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND 11 — Card Swipe
════════════════════════════════════════════════════ */
function playSwipe(direction) {
    if (!soundEnabled) return;
    try {
        var ctx  = getCtx(); if (!ctx) return;
        var t    = ctx.currentTime;
        var left = (direction === 'left' || direction < 0);

        var osc = ctx.createOscillator();
        osc.type = 'sine';
        if (left) {
            osc.frequency.setValueAtTime(310, t);
            osc.frequency.exponentialRampToValueAtTime(130, t + 0.14);
        } else {
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(330, t + 0.14);
        }
        var og = ctx.createGain();
        og.gain.setValueAtTime(0.0001, t);
        og.gain.linearRampToValueAtTime(0.15, t + 0.028);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        var bpf = ctx.createBiquadFilter();
        bpf.type = 'bandpass'; bpf.frequency.value = 580; bpf.Q.value = 0.6;
        osc.connect(bpf); bpf.connect(og); og.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.16);

        var wBufSize = Math.floor(ctx.sampleRate * 0.13);
        var wBuf = ctx.createBuffer(1, wBufSize, ctx.sampleRate);
        var wd   = wBuf.getChannelData(0);
        for (var i = 0; i < wBufSize; i++)
            wd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / wBufSize, 2.2);
        var wn = ctx.createBufferSource();
        wn.buffer = wBuf;
        var wf = ctx.createBiquadFilter();
        wf.type = 'bandpass';
        wf.frequency.value = left ? 1700 : 2100;
        wf.Q.value = 0.8;
        var wg = ctx.createGain();
        wg.gain.setValueAtTime(0.0001, t);
        wg.gain.linearRampToValueAtTime(0.09, t + 0.04);
        wg.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
        wn.connect(wf); wf.connect(wg); wg.connect(ctx.destination);
        wn.start(t); wn.stop(t + 0.14);

        var sBufSize = Math.floor(ctx.sampleRate * 0.017);
        var sBuf = ctx.createBuffer(1, sBufSize, ctx.sampleRate);
        var sd   = sBuf.getChannelData(0);
        for (var j = 0; j < sBufSize; j++)
            sd[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / sBufSize, 16);
        var snap = ctx.createBufferSource();
        snap.buffer = sBuf;
        var sf = ctx.createBiquadFilter();
        sf.type = 'bandpass'; sf.frequency.value = 3100; sf.Q.value = 1.4;
        var sg = ctx.createGain();
        sg.gain.setValueAtTime(0.17, t + 0.13);
        sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.155);
        snap.connect(sf); sf.connect(sg); sg.connect(ctx.destination);
        snap.start(t + 0.13); snap.stop(t + 0.16);
    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND 12 — Hover Whisper
════════════════════════════════════════════════════ */
var _hoverLast = 0;
function playHover() {
    if (!soundEnabled) return;
    var now = Date.now();
    if (now - _hoverLast < 120) return;
    _hoverLast = now;
    try {
        var ctx = getCtx(); if (!ctx) return;
        var t   = ctx.currentTime;

        var bufSize = Math.floor(ctx.sampleRate * 0.02);
        var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        var d   = buf.getChannelData(0);
        for (var i = 0; i < bufSize; i++)
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 8);
        var n = ctx.createBufferSource();
        n.buffer = buf;
        var f = ctx.createBiquadFilter();
        f.type = 'highpass'; f.frequency.value = 6200;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.026, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
        n.connect(f); f.connect(g); g.connect(ctx.destination);
        n.start(t); n.stop(t + 0.022);
    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND 13 — Nav Click
════════════════════════════════════════════════════ */
function playNavClick() {
    if (!soundEnabled) return;
    try {
        var ctx = getCtx(); if (!ctx) return;
        var t   = ctx.currentTime;

        var bufSize = Math.floor(ctx.sampleRate * 0.02);
        var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        var d   = buf.getChannelData(0);
        for (var i = 0; i < bufSize; i++)
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 18);
        var n = ctx.createBufferSource();
        n.buffer = buf;
        var f = ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 3800; f.Q.value = 1.8;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.22, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
        n.connect(f); f.connect(g); g.connect(ctx.destination);
        n.start(t); n.stop(t + 0.022);

        var ting = ctx.createOscillator();
        ting.type = 'triangle'; ting.frequency.value = 2100;
        var tg = ctx.createGain();
        tg.gain.setValueAtTime(0.055, t + 0.005);
        tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.095);
        ting.connect(tg); tg.connect(ctx.destination);
        ting.start(t + 0.005); ting.stop(t + 0.1);

        var thud = ctx.createOscillator();
        thud.type = 'sine';
        thud.frequency.setValueAtTime(175, t + 0.003);
        thud.frequency.exponentialRampToValueAtTime(68, t + 0.048);
        var tdg = ctx.createGain();
        tdg.gain.setValueAtTime(0.11, t + 0.003);
        tdg.gain.exponentialRampToValueAtTime(0.0001, t + 0.052);
        thud.connect(tdg); tdg.connect(ctx.destination);
        thud.start(t + 0.003); thud.stop(t + 0.054);
    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND 14 — Modal Open
════════════════════════════════════════════════════ */
function playModalOpen() {
    if (!soundEnabled) return;
    try {
        var ctx = getCtx(); if (!ctx) return;
        var t   = ctx.currentTime;

        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(58, t);
        osc.frequency.exponentialRampToValueAtTime(195, t + 0.18);
        var og = ctx.createGain();
        og.gain.setValueAtTime(0.0001, t);
        og.gain.linearRampToValueAtTime(0.24, t + 0.06);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        osc.connect(og); og.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.23);

        var wBufSize = Math.floor(ctx.sampleRate * 0.18);
        var wBuf = ctx.createBuffer(1, wBufSize, ctx.sampleRate);
        var wd   = wBuf.getChannelData(0);
        for (var i = 0; i < wBufSize; i++)
            wd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / wBufSize, 1.4);
        var wn = ctx.createBufferSource();
        wn.buffer = wBuf;
        var wf = ctx.createBiquadFilter();
        wf.type = 'bandpass'; wf.frequency.value = 1350; wf.Q.value = 0.55;
        var wg = ctx.createGain();
        wg.gain.setValueAtTime(0.0001, t);
        wg.gain.linearRampToValueAtTime(0.075, t + 0.04);
        wg.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
        wn.connect(wf); wf.connect(wg); wg.connect(ctx.destination);
        wn.start(t); wn.stop(t + 0.2);

        var ckSize = Math.floor(ctx.sampleRate * 0.025);
        var ckBuf  = ctx.createBuffer(1, ckSize, ctx.sampleRate);
        var ckd    = ckBuf.getChannelData(0);
        for (var j = 0; j < ckSize; j++)
            ckd[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / ckSize, 14);
        var ck = ctx.createBufferSource();
        ck.buffer = ckBuf;
        var cf = ctx.createBiquadFilter();
        cf.type = 'bandpass'; cf.frequency.value = 2600; cf.Q.value = 1.3;
        var cg = ctx.createGain();
        cg.gain.setValueAtTime(0.30, t + 0.17);
        cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        ck.connect(cf); cf.connect(cg); cg.connect(ctx.destination);
        ck.start(t + 0.17); ck.stop(t + 0.23);

        var ring = ctx.createOscillator();
        ring.type = 'sine'; ring.frequency.value = 510;
        var rg = ctx.createGain();
        rg.gain.setValueAtTime(0.07, t + 0.19);
        rg.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
        ring.connect(rg); rg.connect(ctx.destination);
        ring.start(t + 0.19); ring.stop(t + 0.4);
    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND 15 — Modal Close
════════════════════════════════════════════════════ */
function playModalClose() {
    if (!soundEnabled) return;
    try {
        var ctx = getCtx(); if (!ctx) return;
        var t   = ctx.currentTime;

        var ckSize = Math.floor(ctx.sampleRate * 0.02);
        var ckBuf  = ctx.createBuffer(1, ckSize, ctx.sampleRate);
        var ckd    = ckBuf.getChannelData(0);
        for (var i = 0; i < ckSize; i++)
            ckd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ckSize, 14);
        var ck = ctx.createBufferSource();
        ck.buffer = ckBuf;
        var cf = ctx.createBiquadFilter();
        cf.type = 'bandpass'; cf.frequency.value = 2800; cf.Q.value = 1.2;
        var cg = ctx.createGain();
        cg.gain.setValueAtTime(0.27, t);
        cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
        ck.connect(cf); cf.connect(cg); cg.connect(ctx.destination);
        ck.start(t); ck.stop(t + 0.025);

        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(330, t + 0.01);
        osc.frequency.exponentialRampToValueAtTime(52, t + 0.18);
        var og = ctx.createGain();
        og.gain.setValueAtTime(0.17, t + 0.01);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
        osc.connect(og); og.connect(ctx.destination);
        osc.start(t + 0.01); osc.stop(t + 0.2);

        var thud = ctx.createOscillator();
        thud.type = 'sine';
        thud.frequency.setValueAtTime(78, t + 0.15);
        thud.frequency.exponentialRampToValueAtTime(30, t + 0.26);
        var tg = ctx.createGain();
        tg.gain.setValueAtTime(0.21, t + 0.15);
        tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.27);
        thud.connect(tg); tg.connect(ctx.destination);
        thud.start(t + 0.15); thud.stop(t + 0.28);
    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND 16 — Toggle
════════════════════════════════════════════════════ */
function playToggle(isOn) {
    if (!soundEnabled) return;
    try {
        var ctx = getCtx(); if (!ctx) return;
        var t   = ctx.currentTime;

        var snapSize = Math.floor(ctx.sampleRate * 0.022);
        var snapBuf  = ctx.createBuffer(1, snapSize, ctx.sampleRate);
        var sd       = snapBuf.getChannelData(0);
        for (var i = 0; i < snapSize; i++)
            sd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / snapSize, 16);
        var n = ctx.createBufferSource();
        n.buffer = snapBuf;
        var f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = isOn ? 3200 : 2400;
        f.Q.value = 1.6;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.27, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.022);
        n.connect(f); f.connect(g); g.connect(ctx.destination);
        n.start(t); n.stop(t + 0.025);

        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isOn ? 420 : 215, t + 0.005);
        osc.frequency.exponentialRampToValueAtTime(isOn ? 640 : 105, t + 0.072);
        var og = ctx.createGain();
        og.gain.setValueAtTime(isOn ? 0.088 : 0.125, t + 0.005);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        osc.connect(og); og.connect(ctx.destination);
        osc.start(t + 0.005); osc.stop(t + 0.092);
    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND 17 — Page Load Boot Chime
   Called by unlockAndEnter() right after AudioContext
   is resumed — guaranteed to play every time.
════════════════════════════════════════════════════ */
function playPageLoad() {
    if (!soundEnabled) return;
    try {
        var ctx = getCtx(); if (!ctx) return;
        var t   = ctx.currentTime;

        var notes = [330, 440, 550];
        notes.forEach(function(freq, idx) {
            var delay = idx * 0.11 + 0.05; /* start quickly after unlock */

            var osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            var og = ctx.createGain();
            og.gain.setValueAtTime(0.0001, t + delay);
            og.gain.linearRampToValueAtTime(0.065 - idx * 0.01, t + delay + 0.012);
            og.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.28);
            osc.connect(og); og.connect(ctx.destination);
            osc.start(t + delay); osc.stop(t + delay + 0.3);

            var ovr = ctx.createOscillator();
            ovr.type = 'sine';
            ovr.frequency.value = freq * 2.76;
            var og2 = ctx.createGain();
            og2.gain.setValueAtTime(0.0001, t + delay);
            og2.gain.linearRampToValueAtTime(0.02, t + delay + 0.008);
            og2.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.18);
            ovr.connect(og2); og2.connect(ctx.destination);
            ovr.start(t + delay); ovr.stop(t + delay + 0.2);
        });

        /* Relay click */
        var ckSize = Math.floor(ctx.sampleRate * 0.015);
        var ckBuf  = ctx.createBuffer(1, ckSize, ctx.sampleRate);
        var ckd    = ckBuf.getChannelData(0);
        for (var i = 0; i < ckSize; i++)
            ckd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ckSize, 14);
        var ck = ctx.createBufferSource();
        ck.buffer = ckBuf;
        var cf = ctx.createBiquadFilter();
        cf.type = 'bandpass'; cf.frequency.value = 2900; cf.Q.value = 1.5;
        var cg = ctx.createGain();
        cg.gain.setValueAtTime(0.11, t + 0.02);
        cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        ck.connect(cf); cf.connect(cg); cg.connect(ctx.destination);
        ck.start(t + 0.02); ck.stop(t + 0.06);
    } catch(e) {}
}

/* ════════════════════════════════════════════════════
   SOUND 18 — UI Click
════════════════════════════════════════════════════ */
function playUIClick() {
    if (!soundEnabled) return;
    try {
        var ctx = getCtx(); if (!ctx) return;
        var t   = ctx.currentTime;

        var bufSize = Math.floor(ctx.sampleRate * 0.016);
        var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        var d   = buf.getChannelData(0);
        for (var i = 0; i < bufSize; i++)
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 20);
        var n = ctx.createBufferSource();
        n.buffer = buf;
        var f = ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 3900; f.Q.value = 2.2;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.19, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.016);
        n.connect(f); f.connect(g); g.connect(ctx.destination);
        n.start(t); n.stop(t + 0.018);

        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(290, t + 0.003);
        osc.frequency.exponentialRampToValueAtTime(125, t + 0.052);
        var og = ctx.createGain();
        og.gain.setValueAtTime(0.085, t + 0.003);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
        osc.connect(og); og.connect(ctx.destination);
        osc.start(t + 0.003); osc.stop(t + 0.057);
    } catch(e) {}
}


/* ════════════════════════════════════════════════════
   SOUND 19 — Avatar Flip
════════════════════════════════════════════════════ */
function playFlip() {
    if (!soundEnabled) return;
    try {
        var ctx = getCtx(); if (!ctx) return;
        var t   = ctx.currentTime;

        /* Whoosh sweep */
        var osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, t);
        osc.frequency.exponentialRampToValueAtTime(520, t + 0.08);
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.18);
        var og = ctx.createGain();
        og.gain.setValueAtTime(0.0001, t);
        og.gain.linearRampToValueAtTime(0.18, t + 0.04);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        osc.connect(og); og.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.24);

        /* Air whoosh noise */
        var wSize = Math.floor(ctx.sampleRate * 0.18);
        var wBuf  = ctx.createBuffer(1, wSize, ctx.sampleRate);
        var wd    = wBuf.getChannelData(0);
        for (var i = 0; i < wSize; i++)
            wd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / wSize, 1.8);
        var wn = ctx.createBufferSource();
        wn.buffer = wBuf;
        var wf = ctx.createBiquadFilter();
        wf.type = 'bandpass'; wf.frequency.value = 1800; wf.Q.value = 0.7;
        var wg = ctx.createGain();
        wg.gain.setValueAtTime(0.0001, t);
        wg.gain.linearRampToValueAtTime(0.09, t + 0.05);
        wg.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        wn.connect(wf); wf.connect(wg); wg.connect(ctx.destination);
        wn.start(t); wn.stop(t + 0.2);

        /* Snap on land */
        var sSize = Math.floor(ctx.sampleRate * 0.018);
        var sBuf  = ctx.createBuffer(1, sSize, ctx.sampleRate);
        var sd    = sBuf.getChannelData(0);
        for (var j = 0; j < sSize; j++)
            sd[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / sSize, 14);
        var snap = ctx.createBufferSource();
        snap.buffer = sBuf;
        var sf = ctx.createBiquadFilter();
        sf.type = 'bandpass'; sf.frequency.value = 2600; sf.Q.value = 1.4;
        var sg = ctx.createGain();
        sg.gain.setValueAtTime(0.24, t + 0.17);
        sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        snap.connect(sf); sf.connect(sg); sg.connect(ctx.destination);
        snap.start(t + 0.17); snap.stop(t + 0.22);

        /* Soft thud on settle */
        var thud = ctx.createOscillator();
        thud.type = 'sine';
        thud.frequency.setValueAtTime(120, t + 0.18);
        thud.frequency.exponentialRampToValueAtTime(45, t + 0.28);
        var tg = ctx.createGain();
        tg.gain.setValueAtTime(0.16, t + 0.18);
        tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        thud.connect(tg); tg.connect(ctx.destination);
        thud.start(t + 0.18); thud.stop(t + 0.32);
    } catch(e) {}
}


/* ════════════════════════════════════════════════════
   SOUND TOGGLE
════════════════════════════════════════════════════ */
function toggleSound() {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
        try { getCtx(); playToggle(true); } catch(e) {}
    }
    return soundEnabled;
}

/* ════════════════════════════════════════════════════
   SCROLL + TOUCH LISTENERS — desktop & mobile
════════════════════════════════════════════════════ */
(function initScrollSound() {

    var lastScrollY  = window.scrollY || 0;
    var lastTouchY   = 0;
    var touchActive  = false;

    /* ── Desktop: wheel scroll ── */
    window.addEventListener('scroll', function() {
        var currentY = window.scrollY || 0;
        var delta    = currentY - lastScrollY;
        if (Math.abs(delta) > 1) {
            playScroll(delta);
            lastScrollY = currentY;
        }
    }, { passive: true });

    /* ── Mobile: touchstart ── */
    document.addEventListener('touchstart', function(e) {
        lastTouchY  = e.touches[0].clientY;
        touchActive = true;
        lastScrollY = window.scrollY || 0;
    }, { passive: true });

    /* ── Mobile: touchmove ── */
    document.addEventListener('touchmove', function(e) {
        if (!touchActive) return;
        var currentTouchY = e.touches[0].clientY;
        var touchDelta    = lastTouchY - currentTouchY;
        if (Math.abs(touchDelta) > 14) {
            playScroll(touchDelta);
            lastTouchY = currentTouchY;
        }
        lastScrollY = window.scrollY || 0;
    }, { passive: true });

    document.addEventListener('touchend',   function() { touchActive = false; }, { passive: true });
    document.addEventListener('touchcancel',function() { touchActive = false; }, { passive: true });

})();

/* ════════════════════════════════════════════════════
   DOM EVENT BINDINGS
════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {

    /* ── Fan carousel arrows ── */
    var fanPrev = document.getElementById('fanPrev');
    var fanNext = document.getElementById('fanNext');
    if (fanPrev) fanPrev.addEventListener('click', playCardChange);
    if (fanNext) fanNext.addEventListener('click', playCardChange);

    /* ── Fan dots ── */
    var fanDots = document.getElementById('fanDots');
    if (fanDots) {
        new MutationObserver(function() {
            fanDots.querySelectorAll('.fan-dot').forEach(function(d) {
                if (!d.dataset.soundBound) {
                    d.dataset.soundBound = '1';
                    d.addEventListener('click', playButtonClick);
                }
            });
        }).observe(fanDots, { childList: true });
    }

    /* ── Roll carousel arrows ── */
    var rollPrev = document.getElementById('rollPrev');
    var rollNext = document.getElementById('rollNext');
    if (rollPrev) rollPrev.addEventListener('click', function() { playCardChange(); playSwipe('right'); });
    if (rollNext) rollNext.addEventListener('click', function() { playCardChange(); playSwipe('left');  });

    /* ── Roll dots ── */
    var rollDots = document.getElementById('rollDots');
    if (rollDots) {
        new MutationObserver(function() {
            rollDots.querySelectorAll('.roll-dot').forEach(function(d) {
                if (!d.dataset.soundBound) {
                    d.dataset.soundBound = '1';
                    d.addEventListener('click', playButtonClick);
                }
            });
        }).observe(rollDots, { childList: true });
    }

    /* ── Flat carousel arrows ── */
    var cPrev = document.getElementById('carouselPrev');
    var cNext = document.getElementById('carouselNext');
    if (cPrev) cPrev.addEventListener('click', playCardChange);
    if (cNext) cNext.addEventListener('click', playCardChange);

    /* ── Slideshow prev/next + dots ── */
    document.querySelectorAll('.ps-prev, .ps-next').forEach(function(btn) {
        btn.addEventListener('click', playSlideshowClick);
    });
    document.querySelectorAll('.ps-dot-ind').forEach(function(dot) {
        dot.addEventListener('click', playSlideshowClick);
    });

    /* ── Project image lightbox ── */
    var lbClose = document.getElementById('projLbClose');
    var lbPrev  = document.getElementById('projLbPrev');
    var lbNext  = document.getElementById('projLbNext');
    var lbBdrop = document.getElementById('projLbBackdrop');
    var lbDots  = document.getElementById('projLbDots');

    if (lbClose) lbClose.addEventListener('click', playLightboxClose);
    if (lbBdrop) lbBdrop.addEventListener('click', playLightboxClose);
    if (lbPrev)  lbPrev.addEventListener('click',  playSlideshowClick);
    if (lbNext)  lbNext.addEventListener('click',  playSlideshowClick);

    function bindImgSounds() {
        document.querySelectorAll('.pc-img-slide').forEach(function(img) {
            if (!img.dataset.sndBound) {
                img.dataset.sndBound = '1';
                img.addEventListener('click', playLightboxOpen);
            }
        });
        if (lbDots) {
            lbDots.querySelectorAll('.proj-lb-dot').forEach(function(d) {
                if (!d.dataset.sndBound) {
                    d.dataset.sndBound = '1';
                    d.addEventListener('click', playSlideshowClick);
                }
            });
        }
    }
    bindImgSounds();
    var grid = document.querySelector('.projects-grid');
    if (grid) new MutationObserver(bindImgSounds).observe(grid, { childList: true, subtree: true });

    /* ── Touch swipe on projects grid ── */
    if (grid) {
        var _swipeSX = 0;
        grid.addEventListener('touchstart', function(e) {
            _swipeSX = e.touches[0].clientX;
        }, { passive: true });
        grid.addEventListener('touchend', function(e) {
            var dx = e.changedTouches[0].clientX - _swipeSX;
            if (Math.abs(dx) > 45) playSwipe(dx < 0 ? 'left' : 'right');
        }, { passive: true });
    }
/* ── Lock screen unlock swipe sound ── */
    var lockScreen = document.getElementById('lockScreen');
    if (lockScreen) {
        var lockWasUnlocked = false;
        new MutationObserver(function() {
            var isUnlocked = lockScreen.classList.contains('lock-unlocked');
            if (isUnlocked && !lockWasUnlocked) {
                lockWasUnlocked = true;
                playSwipe('right');
            }
        }).observe(lockScreen, { attributes: true, attributeFilter: ['class'] });
    }

    /* ── Hero avatar flip ── */
var heroOuter = document.querySelector('.hero-img-outer');
if (heroOuter) {
    heroOuter.addEventListener('pointerup', function() {
        setTimeout(playFlip, 90); /* matches the 90ms flip delay */
    });
}

/* ── Lock screen avatar flip ── */
var lockAvatar = document.getElementById('lockAvatarCard');
if (lockAvatar) {
    lockAvatar.addEventListener('click', function() {
        playFlip();
    });
}


    /* ── V-Meet mosaic ── */
    var vmGallery = document.getElementById('vmGallery');
    if (vmGallery) {
        vmGallery.querySelectorAll('.vmg-cell').forEach(function(cell) {
            cell.addEventListener('click', playCameraClick);
        });
        var vmClose = document.getElementById('vmgLbClose');
        var vmPrev  = document.getElementById('vmgLbPrev');
        var vmNext  = document.getElementById('vmgLbNext');
        if (vmClose) vmClose.addEventListener('click', playLightboxClose);
        if (vmPrev)  vmPrev.addEventListener('click',  playSlideshowClick);
        if (vmNext)  vmNext.addEventListener('click',  playSlideshowClick);
        var vmDots = document.getElementById('vmgLbDots');
        if (vmDots) {
            new MutationObserver(function() {
                vmDots.querySelectorAll('.vmg-lb-dot').forEach(function(d) {
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

    /* ── Nav links ── */
    document.querySelectorAll('nav a[href^="#"]').forEach(function(link) {
        link.addEventListener('click', playNavClick);
    });


    /* ── Project detail modal ── */
    var projectModal = document.getElementById('projectModal');
    if (projectModal) {
        var pmWasOpen = false;
        new MutationObserver(function() {
            var isOpen = projectModal.classList.contains('pm-open');
            if (isOpen && !pmWasOpen) { playModalOpen();  pmWasOpen = true;  }
            if (!isOpen && pmWasOpen) { playModalClose(); pmWasOpen = false; }
        }).observe(projectModal, { attributes: true, attributeFilter: ['class'] });
    }

    /* ── Hire float button ── */
    var hireFloat = document.getElementById('hireFloat');
    if (hireFloat) hireFloat.addEventListener('click', playUIClick);

    /* ── Contact cards ── */
    document.querySelectorAll('.contact-card').forEach(function(card) {
        card.addEventListener('click', playUIClick);
    });

    /* ── Primary / outline buttons ── */
    document.querySelectorAll(
        '.btn-primary, .btn-secondary, .btn-outline, .nav-resume-btn'
    ).forEach(function(btn) {
        if (!btn.dataset.sndBound) {
            btn.dataset.sndBound = '1';
            btn.addEventListener('click', playUIClick);
        }
    });

    /* ── Hover whisper ── */
    document.querySelectorAll(
        '.project-card, .skill-tag, .contact-card, .tl-content, .education-card, .fan-dot, .roll-dot'
    ).forEach(function(el) {
        el.addEventListener('mouseenter', playHover);
    });

    /* ── Keyboard arrows ── */
    document.addEventListener('keydown', function(e) {
        if (e.target.matches('input, textarea')) return;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') playKeyPress();
        if (e.key === 'Escape') playToggle(false);
    });

    /* ── Auto-advance ── */
    var cards = document.querySelectorAll('.project-card');
    var lastActive = -1;
    var cardObserver = new MutationObserver(function() {
        cards.forEach(function(c, i) {
            if (
                (c.classList.contains('fan-active') || c.classList.contains('roll-active'))
                && i !== lastActive
            ) {
                lastActive = i;
                if (Date.now() - lastHumanInteraction > 200) playAutoAdvance();
            }
        });
    });
    cards.forEach(function(c) {
        cardObserver.observe(c, { attributes: true, attributeFilter: ['class'] });
    });

    /* ── Sound toggle button ── */
    var sndToggleBtn = document.getElementById('soundToggle');
    if (sndToggleBtn) {
        sndToggleBtn.addEventListener('click', function() {
            var on = toggleSound();
            sndToggleBtn.textContent = on ? '🔊' : '🔇';
            sndToggleBtn.setAttribute('title', on ? 'Mute sounds' : 'Enable sounds');
        });
    }
});

/* ── Track last human interaction ── */
var lastHumanInteraction = 0;
document.addEventListener('click',      function() { lastHumanInteraction = Date.now(); });
document.addEventListener('keydown',    function() { lastHumanInteraction = Date.now(); });
document.addEventListener('touchstart', function() { lastHumanInteraction = Date.now(); }, { passive: true });