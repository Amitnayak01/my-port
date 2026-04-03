


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
   SOUND 20 — Comet Impact
════════════════════════════════════════════════════ */
function playCometImpact() {
    if (!soundEnabled) return;
    try {
        var ctx = getCtx(); if (!ctx) return;
        var t   = ctx.currentTime;

        /* ══════════════════════════════════════════════════════
           MASTER LIMITER — prevents clipping on any device
        ══════════════════════════════════════════════════════ */
        var masterComp = ctx.createDynamicsCompressor();
        masterComp.threshold.value = -6;
        masterComp.knee.value      = 8;
        masterComp.ratio.value     = 12;
        masterComp.attack.value    = 0.001;
        masterComp.release.value   = 0.4;
        masterComp.connect(ctx.destination);
        var out = masterComp; /* everything routes here */

        /* ── Dynamic variation seed — every hit is different ── */
        var rng  = function() { return Math.random(); };
        var vary = function(base, pct) { return base * (1 + (rng() - 0.5) * pct); };

        /* ── Stereo merge helper ── */
        var merger = ctx.createChannelMerger(2);
        merger.connect(out);

        /* ══════════════════════════════════════════════════════
           PHASE 1 — PRE-IMPACT WHOOSH / AIR TEAR  (0 → 0.32s)
           Doppler-style falling tone + turbulent air rush
        ══════════════════════════════════════════════════════ */
        var whooshDur = vary(0.30, 0.15);

        /* Falling Doppler tone */
        var dop = ctx.createOscillator();
        dop.type = 'sawtooth';
        dop.frequency.setValueAtTime(vary(1600, 0.12), t);
        dop.frequency.exponentialRampToValueAtTime(vary(55, 0.10), t + whooshDur);
        var dopDist = ctx.createWaveShaper();
        (function() {
            var curve = new Float32Array(256);
            for (var i = 0; i < 256; i++) {
                var x = (i * 2) / 256 - 1;
                curve[i] = (Math.PI + 120) * x / (Math.PI + 120 * Math.abs(x));
            }
            dopDist.curve = curve;
        })();
        var dopGain = ctx.createGain();
        dopGain.gain.setValueAtTime(0.0001, t);
        dopGain.gain.linearRampToValueAtTime(0.055, t + whooshDur * 0.25);
        dopGain.gain.linearRampToValueAtTime(0.09,  t + whooshDur * 0.80);
        dopGain.gain.exponentialRampToValueAtTime(0.0001, t + whooshDur);
        var dopLpf = ctx.createBiquadFilter();
        dopLpf.type = 'lowpass'; dopLpf.frequency.value = 900;
        dop.connect(dopDist); dopDist.connect(dopLpf);
        dopLpf.connect(dopGain); dopGain.connect(out);
        dop.start(t); dop.stop(t + whooshDur + 0.02);

        /* Air tear noise — builds intensity */
        var airSize = Math.floor(ctx.sampleRate * (whooshDur + 0.02));
        var airBuf  = ctx.createBuffer(2, airSize, ctx.sampleRate);
        for (var ch = 0; ch < 2; ch++) {
            var acd = airBuf.getChannelData(ch);
            for (var ai = 0; ai < airSize; ai++) {
                var ap = ai / airSize;
                /* slight per-channel phase offset for stereo width */
                acd[ai] = (rng() * 2 - 1)
                        * Math.pow(ap, 1.4)
                        * (1 - ap * 0.25)
                        * (1 + 0.35 * Math.sin(ap * 38 + ch * 1.3));
            }
        }
        var airSrc  = ctx.createBufferSource();
        airSrc.buffer = airBuf;
        var airBpf  = ctx.createBiquadFilter();
        airBpf.type = 'bandpass'; airBpf.frequency.value = vary(620, 0.12); airBpf.Q.value = 0.38;
        var airHpf  = ctx.createBiquadFilter();
        airHpf.type = 'highpass'; airHpf.frequency.value = 280;
        var airGain = ctx.createGain();
        airGain.gain.setValueAtTime(0.0001, t);
        airGain.gain.linearRampToValueAtTime(vary(0.32, 0.10), t + whooshDur * 0.55);
        airGain.gain.exponentialRampToValueAtTime(0.0001, t + whooshDur + 0.01);
        airSrc.connect(airBpf); airBpf.connect(airHpf);
        airHpf.connect(airGain); airGain.connect(out);
        airSrc.start(t); airSrc.stop(t + whooshDur + 0.03);


        /* ══════════════════════════════════════════════════════
           PHASE 2 — DETONATION  (impact moment)
        ══════════════════════════════════════════════════════ */
        var impact = t + whooshDur;

        /* ── CRACK L channel ── */
        var crackSizeL = Math.floor(ctx.sampleRate * 0.07);
        var crackBufL  = ctx.createBuffer(1, crackSizeL, ctx.sampleRate);
        var cdL        = crackBufL.getChannelData(0);
        for (var ci = 0; ci < crackSizeL; ci++)
            cdL[ci] = (rng() * 2 - 1)
                    * Math.pow(1 - ci / crackSizeL, 2.2)
                    * (1 + 0.4 * Math.sin(ci * 0.8));
        var crackL    = ctx.createBufferSource(); crackL.buffer = crackBufL;
        var crackDistL = ctx.createWaveShaper();
        (function() {
            var k = 180 + rng() * 60;
            var curve = new Float32Array(512);
            for (var i = 0; i < 512; i++) {
                var x = (i * 2) / 512 - 1;
                curve[i] = (Math.PI + k) * x / (Math.PI + k * Math.abs(x));
            }
            crackDistL.curve = curve;
        })();
        var crackLpfL = ctx.createBiquadFilter();
        crackLpfL.type = 'lowpass'; crackLpfL.frequency.value = vary(3800, 0.15);
        var crackGainL = ctx.createGain();
        crackGainL.gain.setValueAtTime(0.85, impact);
        crackGainL.gain.exponentialRampToValueAtTime(0.0001, impact + 0.068);
        crackL.connect(crackDistL); crackDistL.connect(crackLpfL);
        crackLpfL.connect(crackGainL); crackGainL.connect(merger, 0, 0);
        crackL.start(impact); crackL.stop(impact + 0.08);

        /* ── CRACK R channel (2ms delayed for stereo width) ── */
        var crackSizeR = Math.floor(ctx.sampleRate * 0.07);
        var crackBufR  = ctx.createBuffer(1, crackSizeR, ctx.sampleRate);
        var cdR        = crackBufR.getChannelData(0);
        for (var cj = 0; cj < crackSizeR; cj++)
            cdR[cj] = (rng() * 2 - 1)
                    * Math.pow(1 - cj / crackSizeR, 2.4)
                    * (1 + 0.35 * Math.sin(cj * 0.75));
        var crackR     = ctx.createBufferSource(); crackR.buffer = crackBufR;
        var crackDistR = ctx.createWaveShaper();
        (function() {
            var k = 180 + rng() * 60;
            var curve = new Float32Array(512);
            for (var i = 0; i < 512; i++) {
                var x = (i * 2) / 512 - 1;
                curve[i] = (Math.PI + k) * x / (Math.PI + k * Math.abs(x));
            }
            crackDistR.curve = curve;
        })();
        var crackLpfR = ctx.createBiquadFilter();
        crackLpfR.type = 'lowpass'; crackLpfR.frequency.value = vary(3400, 0.15);
        var crackGainR = ctx.createGain();
        crackGainR.gain.setValueAtTime(0.82, impact + 0.002);
        crackGainR.gain.exponentialRampToValueAtTime(0.0001, impact + 0.070);
        crackR.connect(crackDistR); crackDistR.connect(crackLpfR);
        crackLpfR.connect(crackGainR); crackGainR.connect(merger, 0, 1);
        crackR.start(impact + 0.002); crackR.stop(impact + 0.08);


        /* ══════════════════════════════════════════════════════
           PHASE 3 — SUB-BASS & PRESSURE WAVE  (0 → 1s)
        ══════════════════════════════════════════════════════ */

        /* ── INFRASONIC CANNON — 10–18Hz felt not heard ── */
        var cannon = ctx.createOscillator();
        cannon.type = 'sine';
        cannon.frequency.setValueAtTime(vary(16, 0.12), impact);
        cannon.frequency.exponentialRampToValueAtTime(vary(3, 0.10), impact + 3.8);
        var cannonGain = ctx.createGain();
        cannonGain.gain.setValueAtTime(0.0001, impact);
        cannonGain.gain.linearRampToValueAtTime(1.0, impact + 0.003);
        cannonGain.gain.exponentialRampToValueAtTime(0.55, impact + 0.055);
        cannonGain.gain.exponentialRampToValueAtTime(0.18, impact + 0.90);
        cannonGain.gain.exponentialRampToValueAtTime(0.0001, impact + 3.9);
        cannon.connect(cannonGain); cannonGain.connect(out);
        cannon.start(impact); cannon.stop(impact + 4.0);

        /* ── SUB 1 — 12Hz gut punch ── */
        var sub1 = ctx.createOscillator();
        sub1.type = 'sine';
        sub1.frequency.setValueAtTime(vary(12, 0.12), impact);
        sub1.frequency.exponentialRampToValueAtTime(vary(3, 0.10), impact + 2.4);
        var sub1Gain = ctx.createGain();
        sub1Gain.gain.setValueAtTime(0.0001, impact);
        sub1Gain.gain.linearRampToValueAtTime(0.95, impact + 0.004);
        sub1Gain.gain.exponentialRampToValueAtTime(0.38, impact + 0.12);
        sub1Gain.gain.exponentialRampToValueAtTime(0.0001, impact + 2.5);
        sub1.connect(sub1Gain); sub1Gain.connect(out);
        sub1.start(impact); sub1.stop(impact + 2.6);

        /* ── SUB 2 — 22Hz pressure wave (slightly detuned) ── */
        var sub2 = ctx.createOscillator();
        sub2.type = 'sine';
        sub2.frequency.setValueAtTime(vary(22, 0.10), impact);
        sub2.frequency.exponentialRampToValueAtTime(vary(5, 0.10), impact + 1.8);
        var sub2Gain = ctx.createGain();
        sub2Gain.gain.setValueAtTime(0.0001, impact);
        sub2Gain.gain.linearRampToValueAtTime(0.80, impact + 0.005);
        sub2Gain.gain.exponentialRampToValueAtTime(0.25, impact + 0.14);
        sub2Gain.gain.exponentialRampToValueAtTime(0.0001, impact + 1.9);
        sub2.connect(sub2Gain); sub2Gain.connect(out);
        sub2.start(impact); sub2.stop(impact + 2.0);

        /* ── BODY THUD — 35–50Hz warmth ── */
        var body = ctx.createOscillator();
        body.type = 'sine';
        body.frequency.setValueAtTime(vary(42, 0.12), impact);
        body.frequency.exponentialRampToValueAtTime(vary(7, 0.10), impact + 1.1);
        var bodyGain = ctx.createGain();
        bodyGain.gain.setValueAtTime(0.0001, impact);
        bodyGain.gain.linearRampToValueAtTime(0.70, impact + 0.006);
        bodyGain.gain.exponentialRampToValueAtTime(0.28, impact + 0.18);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, impact + 1.2);
        body.connect(bodyGain); bodyGain.connect(out);
        body.start(impact); body.stop(impact + 1.3);


        /* ══════════════════════════════════════════════════════
           PHASE 4 — FIRE + DEBRIS + RUMBLE  (impact → 4s)
        ══════════════════════════════════════════════════════ */

        /* ── EARTH RUMBLE — double-filtered, very low noise ── */
        var rumbleSize = Math.floor(ctx.sampleRate * 4.5);
        var rumbleBuf  = ctx.createBuffer(2, rumbleSize, ctx.sampleRate);
        for (var rc = 0; rc < 2; rc++) {
            var rbd = rumbleBuf.getChannelData(rc);
            for (var ri = 0; ri < rumbleSize; ri++) {
                var rp = ri / rumbleSize;
                /* slight randomness in envelope for organic feel */
                rbd[ri] = (rng() * 2 - 1)
                        * Math.pow(1 - rp, 0.28)
                        * (1 + 0.18 * Math.sin(rp * 12 + rc));
            }
        }
        var rumble  = ctx.createBufferSource(); rumble.buffer = rumbleBuf;
        var rLpf1   = ctx.createBiquadFilter();
        rLpf1.type  = 'lowpass'; rLpf1.frequency.value = 95;
        var rLpf2   = ctx.createBiquadFilter();
        rLpf2.type  = 'lowpass'; rLpf2.frequency.value = 95;
        var rumbleGain = ctx.createGain();
        rumbleGain.gain.setValueAtTime(0.0001, impact);
        rumbleGain.gain.linearRampToValueAtTime(0.75, impact + 0.020);
        rumbleGain.gain.setValueAtTime(0.75, impact + 0.22);
        rumbleGain.gain.exponentialRampToValueAtTime(0.38, impact + 1.00);
        rumbleGain.gain.exponentialRampToValueAtTime(0.0001, impact + 4.5);
        rumble.connect(rLpf1); rLpf1.connect(rLpf2);
        rLpf2.connect(rumbleGain); rumbleGain.connect(out);
        rumble.start(impact); rumble.stop(impact + 4.6);

        /* ── FIRE ROAR — evolving turbulent noise with LFO mod ── */
        var fireSize = Math.floor(ctx.sampleRate * 3.5);
        var fireBuf  = ctx.createBuffer(2, fireSize, ctx.sampleRate);
        for (var fc = 0; fc < 2; fc++) {
            var fcd = fireBuf.getChannelData(fc);
            for (var fi = 0; fi < fireSize; fi++) {
                var fp  = fi / fireSize;
                var mod = 1 + 0.55 * Math.sin(fp * 28 + fc * 0.9)   /* turbulence */
                            + 0.22 * Math.sin(fp * 71 + fc * 1.7)   /* flutter    */
                            + 0.10 * Math.sin(fp * 134 + fc * 0.4); /* grain      */
                fcd[fi] = (rng() * 2 - 1)
                        * Math.pow(1 - fp, 0.50)
                        * mod * 0.38;
            }
        }
        var fire     = ctx.createBufferSource(); fire.buffer = fireBuf;
        var fireLpf  = ctx.createBiquadFilter();
        fireLpf.type = 'lowpass'; fireLpf.frequency.value = vary(380, 0.12);
        var fireLpf2 = ctx.createBiquadFilter();
        fireLpf2.type = 'lowpass'; fireLpf2.frequency.value = vary(380, 0.12);
        var firePeak = ctx.createBiquadFilter();
        firePeak.type = 'peaking';
        firePeak.frequency.value = vary(180, 0.15);
        firePeak.gain.value = 5; firePeak.Q.value = 0.6;
        var fireGain = ctx.createGain();
        fireGain.gain.setValueAtTime(0.0001, impact);
        fireGain.gain.linearRampToValueAtTime(0.62, impact + 0.025);
        fireGain.gain.exponentialRampToValueAtTime(0.40, impact + 0.50);
        fireGain.gain.exponentialRampToValueAtTime(0.0001, impact + 3.5);
        fire.connect(fireLpf); fireLpf.connect(fireLpf2);
        fireLpf2.connect(firePeak); firePeak.connect(fireGain);
        fireGain.connect(out);
        fire.start(impact); fire.stop(impact + 3.6);

        /* ── DEBRIS CRACKLES — granular noise bursts post-impact ── */
        var debrisCount = 6 + Math.floor(rng() * 5); /* 6–10 bursts */
        for (var db = 0; db < debrisCount; db++) {
            (function() {
                var dbDelay = 0.08 + rng() * 1.60;
                var dbDur   = 0.012 + rng() * 0.025;
                var dbSize  = Math.floor(ctx.sampleRate * dbDur);
                var dbBuf   = ctx.createBuffer(1, dbSize, ctx.sampleRate);
                var dbd     = dbBuf.getChannelData(0);
                for (var di = 0; di < dbSize; di++)
                    dbd[di] = (rng() * 2 - 1)
                            * Math.pow(1 - di / dbSize, 2.0 + rng() * 2);
                var dbSrc  = ctx.createBufferSource(); dbSrc.buffer = dbBuf;
                var dbBpf  = ctx.createBiquadFilter();
                dbBpf.type = 'bandpass';
                dbBpf.frequency.value = 800 + rng() * 3200;
                dbBpf.Q.value = 0.5 + rng() * 1.5;
                var dbPan  = ctx.createStereoPanner();
                dbPan.pan.value = (rng() * 2 - 1) * 0.85; /* scatter across field */
                var dbGain = ctx.createGain();
                var dbVol  = (0.08 + rng() * 0.22) * (1 - dbDelay / 2.0);
                dbGain.gain.setValueAtTime(dbVol, impact + dbDelay);
                dbGain.gain.exponentialRampToValueAtTime(0.0001, impact + dbDelay + dbDur);
                dbSrc.connect(dbBpf); dbBpf.connect(dbPan);
                dbPan.connect(dbGain); dbGain.connect(out);
                dbSrc.start(impact + dbDelay);
                dbSrc.stop(impact + dbDelay + dbDur + 0.01);
            })();
        }

        /* ── MID SHRAPNEL — continuous fizz after impact ── */
        var shrapSize = Math.floor(ctx.sampleRate * 0.55);
        var shrapBuf  = ctx.createBuffer(2, shrapSize, ctx.sampleRate);
        for (var sc = 0; sc < 2; sc++) {
            var scd = shrapBuf.getChannelData(sc);
            for (var si = 0; si < shrapSize; si++) {
                var sp = si / shrapSize;
                scd[si] = (rng() * 2 - 1)
                        * Math.pow(1 - sp, 1.1)
                        * (1 + 0.3 * Math.sin(sp * 55 + sc));
            }
        }
        var shrap     = ctx.createBufferSource(); shrap.buffer = shrapBuf;
        var shrapHpf  = ctx.createBiquadFilter();
        shrapHpf.type = 'highpass'; shrapHpf.frequency.value = vary(3800, 0.12);
        var shrapGain = ctx.createGain();
        shrapGain.gain.setValueAtTime(0.0001, impact);
        shrapGain.gain.linearRampToValueAtTime(vary(0.38, 0.12), impact + 0.009);
        shrapGain.gain.exponentialRampToValueAtTime(0.0001, impact + 0.58);
        shrap.connect(shrapHpf); shrapHpf.connect(shrapGain);
        shrapGain.connect(out);
        shrap.start(impact); shrap.stop(impact + 0.60);


        /* ══════════════════════════════════════════════════════
           PHASE 5 — CINEMATIC TAIL  (impact+0.1 → 6s)
        ══════════════════════════════════════════════════════ */

        /* ── DEEP RING-OUT — subsonic resonance, very slow fade ── */
        var ringLo = ctx.createOscillator();
        ringLo.type = 'sine';
        ringLo.frequency.setValueAtTime(vary(24, 0.10), impact + 0.05);
        ringLo.frequency.exponentialRampToValueAtTime(vary(5, 0.10), impact + 5.8);
        var ringLoGain = ctx.createGain();
        ringLoGain.gain.setValueAtTime(0.0001, impact + 0.05);
        ringLoGain.gain.linearRampToValueAtTime(0.28, impact + 0.20);
        ringLoGain.gain.exponentialRampToValueAtTime(0.0001, impact + 6.0);
        ringLo.connect(ringLoGain); ringLoGain.connect(out);
        ringLo.start(impact + 0.05); ringLo.stop(impact + 6.2);

        /* ── MID RING-OUT — airy metallic tone ── */
        var ringMid = ctx.createOscillator();
        ringMid.type = 'sine';
        ringMid.frequency.setValueAtTime(vary(88, 0.10), impact + 0.06);
        ringMid.frequency.exponentialRampToValueAtTime(vary(22, 0.10), impact + 4.2);
        var ringMidGain = ctx.createGain();
        ringMidGain.gain.setValueAtTime(0.0001, impact + 0.06);
        ringMidGain.gain.linearRampToValueAtTime(0.12, impact + 0.18);
        ringMidGain.gain.exponentialRampToValueAtTime(0.0001, impact + 4.4);
        ringMid.connect(ringMidGain); ringMidGain.connect(out);
        ringMid.start(impact + 0.06); ringMid.stop(impact + 4.5);

        /* ── ATMOSPHERIC DUST — ultra soft high-freq whisper ── */
        var dustSize = Math.floor(ctx.sampleRate * 3.8);
        var dustBuf  = ctx.createBuffer(2, dustSize, ctx.sampleRate);
        for (var dc = 0; dc < 2; dc++) {
            var dcd = dustBuf.getChannelData(dc);
            for (var dui = 0; dui < dustSize; dui++) {
                var dp = dui / dustSize;
                dcd[dui] = (rng() * 2 - 1)
                         * Math.pow(1 - dp, 0.42)
                         * (1 + 0.14 * Math.sin(dp * 22 + dc * 0.8));
            }
        }
        var dust     = ctx.createBufferSource(); dust.buffer = dustBuf;
        var dustHpf  = ctx.createBiquadFilter();
        dustHpf.type = 'highpass'; dustHpf.frequency.value = 5500;
        var dustPan  = ctx.createStereoPanner(); dustPan.pan.value = 0;
        var dustGain = ctx.createGain();
        dustGain.gain.setValueAtTime(0.0001, impact + 0.55);
        dustGain.gain.linearRampToValueAtTime(0.06, impact + 1.10);
        dustGain.gain.exponentialRampToValueAtTime(0.0001, impact + 4.8);
        dust.connect(dustHpf); dustHpf.connect(dustPan);
        dustPan.connect(dustGain); dustGain.connect(out);
        dust.start(impact + 0.55); dust.stop(impact + 5.0);

        /* ── SIMULATED REVERB TAIL — sparse late reflections ── */
        /* We simulate room/canyon reverb with 4 staggered
           filtered noise bursts that mimic late reflections */
        [0.18, 0.38, 0.65, 1.05].forEach(function(refDelay, idx) {
            var refDelaySeed = refDelay * vary(1, 0.18);
            var refSize = Math.floor(ctx.sampleRate * vary(0.10, 0.20));
            var refBuf  = ctx.createBuffer(1, refSize, ctx.sampleRate);
            var refd    = refBuf.getChannelData(0);
            for (var rfi = 0; rfi < refSize; rfi++)
                refd[rfi] = (rng() * 2 - 1)
                          * Math.pow(1 - rfi / refSize, 1.8 + idx * 0.4);
            var refSrc  = ctx.createBufferSource(); refSrc.buffer = refBuf;
            var refBpf  = ctx.createBiquadFilter();
            refBpf.type = 'bandpass';
            refBpf.frequency.value = vary(350 - idx * 55, 0.18);
            refBpf.Q.value = 0.4;
            var refPan  = ctx.createStereoPanner();
            refPan.pan.value = (idx % 2 === 0 ? -1 : 1) * (0.3 + idx * 0.12);
            var refGain = ctx.createGain();
            var refVol  = (0.22 - idx * 0.04) * vary(1, 0.15);
            refGain.gain.setValueAtTime(refVol, impact + refDelaySeed);
            refGain.gain.exponentialRampToValueAtTime(0.0001,
                impact + refDelaySeed + vary(0.18, 0.20));
            refSrc.connect(refBpf); refBpf.connect(refPan);
            refPan.connect(refGain); refGain.connect(out);
            refSrc.start(impact + refDelaySeed);
            refSrc.stop(impact + refDelaySeed + 0.25);
        });

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