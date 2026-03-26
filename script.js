

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

function flipHeroAvatar() {
    const card = document.querySelector('.hero-img-outer');
    card.classList.toggle('flipped');
}

function flipAvatar() {
    const card = document.getElementById('lockAvatarCard');
    card.classList.toggle('flipped');
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

    /* ── V-Meet Mosaic Lightbox (unchanged) ── */
    (function() {
        const gallery = document.getElementById('vmGallery'), lightbox = document.getElementById('vmgLightbox'), stage = document.getElementById('vmgLbStage'), caption = document.getElementById('vmgLbCaption'), currEl = document.getElementById('vmgLbCurr'), totalEl = document.getElementById('vmgLbTotal'), dotsWrap = document.getElementById('vmgLbDots'), btnClose = document.getElementById('vmgLbClose'), btnPrev = document.getElementById('vmgLbPrev'), btnNext = document.getElementById('vmgLbNext');
        if (!gallery || !lightbox) return;
        const cells = Array.from(gallery.querySelectorAll('.vmg-cell')), captions = ['Zoom Grid Video Call', 'WhatsApp-Style Chat', 'Audio Conference', 'Group Call — Pinned Speaker', 'Meeting Dashboard'];
        let current = 0;
        totalEl.textContent = cells.length;
        cells.forEach((_, i) => { const d = document.createElement('div'); d.className = 'vmg-lb-dot' + (i === 0 ? ' active' : ''); d.addEventListener('click', () => goTo(i)); dotsWrap.appendChild(d); });
        function updateDots(idx) { dotsWrap.querySelectorAll('.vmg-lb-dot').forEach((d, i) => { d.classList.toggle('active', i === idx); }); }
        function renderSlide(idx) { const src = cells[idx].querySelector('.vmg-screenshot'); const clone = src.cloneNode(true); stage.innerHTML = ''; stage.appendChild(clone); caption.textContent = captions[idx] || ''; currEl.textContent = idx + 1; updateDots(idx); }
        function goTo(idx, dir) {
            const next = (idx + cells.length) % cells.length;
            if (next === current && stage.innerHTML !== '') return;
            if (dir) stage.classList.add(dir === 'left' ? 'vmg-slide-out-left' : 'vmg-slide-out-right');
            setTimeout(() => {
                stage.classList.remove('vmg-slide-out-left', 'vmg-slide-out-right'); current = next; renderSlide(current);
                stage.style.opacity = '0'; stage.style.transform = dir === 'left' ? 'translateX(5%)' : (dir === 'right' ? 'translateX(-5%)' : 'translateX(0)');
                requestAnimationFrame(() => { requestAnimationFrame(() => { stage.style.transition = 'opacity 0.32s ease, transform 0.32s ease'; stage.style.opacity = '1'; stage.style.transform = 'translateX(0)'; }); });
            }, dir ? 180 : 0);
        }
        function open(idx) { current = idx; renderSlide(current); stage.style.opacity = '1'; stage.style.transform = 'translateX(0)'; stage.style.transition = ''; lightbox.classList.add('vmg-open'); document.body.style.overflow = 'hidden'; btnClose.focus(); }
        function close() { lightbox.classList.remove('vmg-open'); document.body.style.overflow = ''; }
        cells.forEach((cell, i) => { cell.addEventListener('click', () => open(i)); cell.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } }); });
        btnClose.addEventListener('click', close);
        btnPrev.addEventListener('click', () => goTo(current - 1, 'right'));
        btnNext.addEventListener('click', () => goTo(current + 1, 'left'));
        document.getElementById('vmgLightbox').querySelector('.vmg-lb-backdrop').addEventListener('click', close);
        document.addEventListener('keydown', e => { if (!lightbox.classList.contains('vmg-open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') goTo(current - 1, 'right'); if (e.key === 'ArrowRight') goTo(current + 1, 'left'); });
        let touchX = 0;
        lightbox.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
        lightbox.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - touchX; if (Math.abs(dx) > 45) dx < 0 ? goTo(current + 1, 'left') : goTo(current - 1, 'right'); }, { passive: true });
    })();
    /* ── V-Meet Mosaic Slideshow (unchanged) ── */
    (function() {
        const gallery = document.getElementById('vmGallery');
        if (!gallery) return;
        const SCREENS = [
            { label: 'Zoom Grid Call', build: () => { const el = document.createElement('div'); el.className = 'vmg-screenshot vmg-s0'; el.innerHTML = `<div class="vmg-s-topbar"><span class="vmg-dot r"></span><span class="vmg-dot y"></span><span class="vmg-dot g"></span><span class="vmg-s-url">v-meet2.vercel.app</span><span class="vmg-s-rec">⬤ REC</span></div><div class="vmg-s-body"><div class="vmg-grid4"><div class="vmg-vcell vmg-active"><div class="vmg-av" style="background:linear-gradient(135deg,#c9a96e,#7a5520)">A</div><div class="vmg-vname">Amit<span class="vmg-host">Host</span></div><div class="vmg-vring"></div><div class="vmg-vbar"><span></span><span></span><span></span><span></span><span></span></div></div><div class="vmg-vcell"><div class="vmg-av" style="background:linear-gradient(135deg,#5a9b6e,#2a6a3e)">R</div><div class="vmg-vname">Remote</div></div><div class="vmg-vcell"><div class="vmg-av" style="background:linear-gradient(135deg,#6e8dc9,#3a5ea0)">S</div><div class="vmg-vname">Sarah</div></div><div class="vmg-vcell vmg-screenshare"><div class="vmg-ss-label">🖥️ Sharing</div><div class="vmg-ssbar"><i></i><i></i><i></i><i></i><i></i></div></div></div><div class="vmg-ctrl-row"><button class="vmg-cb vmg-cb-on"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/></svg></button><button class="vmg-cb vmg-cb-end"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.4 21 3 13.6 3 5c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg></button></div></div>`; return el; } },
            { label: 'WhatsApp Chat', build: () => { const el = document.createElement('div'); el.className = 'vmg-screenshot vmg-s1'; el.innerHTML = `<div class="vmg-s-topbar sm"><span class="vmg-dot r"></span><span class="vmg-dot y"></span><span class="vmg-dot g"></span><span class="vmg-s-url">v-meet — Chat</span></div><div class="vmg-s-body"><div class="vmg-chat-mini" style="height:100%"><div class="vmg-chat-sb"><div class="vmg-csb-item active"><div class="vmg-cav" style="background:linear-gradient(135deg,#c9a96e,#a07c45)">A</div><div><div class="vmg-cn">Amit</div><div class="vmg-cl">Hey! 👋</div></div></div></div><div class="vmg-chat-msgs"><div class="vmg-msg in">Can we start? 👋<span>10:42</span></div><div class="vmg-msg out">Yes! Starting...<span>10:43 ✓✓</span></div><div class="vmg-typing"><span></span><span></span><span></span><em>typing…</em></div></div></div></div>`; return el; } },
            { label: 'Audio Conference', build: () => { const el = document.createElement('div'); el.className = 'vmg-screenshot vmg-s2'; el.innerHTML = `<div class="vmg-s-topbar sm"><span class="vmg-dot r"></span><span class="vmg-dot y"></span><span class="vmg-dot g"></span><span class="vmg-s-url">Audio Conference</span><span class="vmg-s-rec">● LIVE</span></div><div class="vmg-s-body"><div class="vmg-audio-mini"><div class="vmg-audio-center-mini"><div class="vmg-pulse-ring"></div><div class="vmg-pulse-ring vmg-pr2"></div><div class="vmg-av-large" style="background:linear-gradient(135deg,#c9a96e,#a07c45)">A</div><div class="vmg-speak-label">Speaking</div></div><div class="vmg-orb-row"><div class="vmg-mini-orb" style="background:linear-gradient(135deg,#5a9b6e,#3a7a4e)">R</div><div class="vmg-mini-orb" style="background:linear-gradient(135deg,#6e8dc9,#4a6ea0)">S</div><div class="vmg-mini-orb vmg-orb-muted" style="background:linear-gradient(135deg,#9b6e5a,#7a4e3a)">J</div></div><div class="vmg-audio-stat">🎙 3 speaking · 🔇 2 muted</div></div></div>`; return el; } },
            { label: 'Group Call', build: () => { const el = document.createElement('div'); el.className = 'vmg-screenshot vmg-s3'; el.innerHTML = `<div class="vmg-s-topbar sm"><span class="vmg-dot r"></span><span class="vmg-dot y"></span><span class="vmg-dot g"></span><span class="vmg-s-url">Dev Team · 6 members</span></div><div class="vmg-s-body"><div class="vmg-group-mini"><div class="vmg-pin-stage"><div class="vmg-av-large" style="background:linear-gradient(135deg,#5a9b6e,#2a6a3e)">R</div><div class="vmg-pin-wave"><i></i><i></i><i></i><i></i><i></i></div><div class="vmg-pin-tag">📌 Pinned · Speaking</div></div><div class="vmg-strip-mini"><div class="vmg-sm-cell vmg-sm-me"><div class="vmg-av sm" style="background:linear-gradient(135deg,#c9a96e,#a07c45)">A</div><small>You</small></div><div class="vmg-sm-cell"><div class="vmg-av sm" style="background:linear-gradient(135deg,#6e8dc9,#4a6ea0)">S</div><small>Sarah</small></div></div></div></div>`; return el; } },
            { label: 'Meeting Dashboard', build: () => { const el = document.createElement('div'); el.className = 'vmg-screenshot vmg-s4'; el.innerHTML = `<div class="vmg-s-topbar sm"><span class="vmg-dot r"></span><span class="vmg-dot y"></span><span class="vmg-dot g"></span><span class="vmg-s-url">v-meet — Dashboard</span></div><div class="vmg-s-body"><div class="vmg-dash-mini"><div class="vmg-dash-welcome">Welcome back, Amit 👋</div><div class="vmg-dash-row"><div class="vmg-dash-btn vmg-new-meet">New Meeting</div><div class="vmg-dash-btn vmg-join-meet">Join Room</div></div><div class="vmg-recent-label">Recent Rooms</div><div class="vmg-recent-row"><div class="vmg-recent-item">vm-x9k2p</div><div class="vmg-recent-item">vm-8x3tz</div></div></div></div>`; return el; } }
        ];
        const ACCENTS = ['201,169,110','90,155,110','110,141,201','201,155,90','201,110,155'];
        function shuffled(arr, exclude) { let pool = arr.filter(i => i !== exclude); for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; } return pool; }
        const SLIDE_DUR = 780, EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';
        const cells = Array.from(gallery.querySelectorAll('.vmg-cell'));
        cells.forEach((cell, cellIdx) => {
            let currentIdx = cellIdx < SCREENS.length ? cellIdx : cellIdx % SCREENS.length;
            let queue = shuffled(Array.from({length: SCREENS.length}, (_, i) => i), currentIdx), queuePos = 0, busy = false;
            const accent = ACCENTS[cellIdx] || ACCENTS[0], interval = 3600 + cellIdx * 400 + Math.random() * 700;
            function swapContent() {
                if (document.hidden || busy) return; busy = true;
                const nextIdx = queue[queuePos % queue.length]; queuePos++;
                if (queuePos >= queue.length) { queue = shuffled(Array.from({length: SCREENS.length}, (_, i) => i), nextIdx); queuePos = 0; }
                const existing = cell.querySelector('.vmg-screenshot');
                if (!existing) { busy = false; return; }
                const h = existing.offsetHeight || cell.offsetHeight;
                cell.classList.add('vmg-swapping'); setTimeout(() => cell.classList.remove('vmg-swapping'), 1400);
                const incoming = SCREENS[nextIdx].build();
                Object.assign(incoming.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', zIndex: '3', transform: `translateY(-${h}px)`, transition: 'none', willChange: 'transform' });
                const wipe = document.createElement('div');
                Object.assign(wipe.style, { position: 'absolute', left: '0', right: '0', height: '60px', zIndex: '4', transform: `translateY(-${h}px)`, transition: 'none', pointerEvents: 'none', background: `linear-gradient(to bottom, transparent 0%, rgba(${accent},0.15) 20%, rgba(${accent},0.55) 45%, rgba(${accent},0.85) 50%, rgba(${accent},0.55) 55%, rgba(${accent},0.15) 80%, transparent 100%)`, willChange: 'transform' });
                const parent = existing.parentNode; parent.style.position = 'relative'; existing.style.zIndex = '2'; parent.appendChild(incoming); parent.appendChild(wipe);
                requestAnimationFrame(() => { requestAnimationFrame(() => {
                    const t = `transform ${SLIDE_DUR}ms ${EASE}`;
                    existing.style.transition = t; incoming.style.transition = t; wipe.style.transition = t;
                    existing.style.transform = `translateY(${h}px)`; incoming.style.transform = 'translateY(0)'; wipe.style.transform = `translateY(${h}px)`;
                    setTimeout(() => { existing.remove(); wipe.remove(); incoming.style.cssText = ''; const lbl = cell.querySelector('.vmg-label'); if (lbl) lbl.textContent = SCREENS[nextIdx].label; cell.dataset.index = nextIdx; currentIdx = nextIdx; busy = false; }, SLIDE_DUR + 40);
                }); });
            }
            setTimeout(() => { swapContent(); setInterval(swapContent, interval); }, 2000 + cellIdx * 900);
        });
        const lightbox = document.getElementById('vmgLightbox');
        if (lightbox) { const obs = new MutationObserver(() => { gallery.dataset.paused = lightbox.classList.contains('vmg-open') ? '1' : '0'; }); obs.observe(lightbox, { attributes: true, attributeFilter: ['class'] }); }
    })();
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
