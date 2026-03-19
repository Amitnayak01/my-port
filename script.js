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
    (function() {
        try {
            if (!sessionStorage.getItem('akn-hint-shown')) {
                sessionStorage.setItem('akn-hint-shown', '1');
                setTimeout(() => {
                    const toast = document.createElement('div');
                    Object.assign(toast.style, { position: 'fixed', bottom: '5.5rem', right: '1.5rem', background: 'rgba(22,22,22,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(201,169,110,0.25)', borderRadius: '10px', padding: '0.55rem 1rem', fontSize: '0.78rem', color: '#a8a098', zIndex: '997', transition: 'opacity 0.4s ease', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' });
                    toast.innerHTML = 'Press <kbd style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);padding:1px 5px;border-radius:4px;font-family:monospace;color:#c9a96e">Ctrl+K</kbd> for quick navigation';
                    document.body.appendChild(toast);
                    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 4000);
                }, 2500);
            }
        } catch(e) {}
    })();
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
(function() {
    const grid    = document.querySelector('.projects-grid');
    const btnPrev = document.getElementById('carouselPrev');
    const btnNext = document.getElementById('carouselNext');
    const curr    = document.getElementById('carouselCurrent');
    const total   = document.getElementById('carouselTotal');
    const fill    = document.getElementById('carouselFill');
    if (!grid || !btnPrev || !btnNext) return;

    const cards = grid.querySelectorAll('.project-card');
    const count = cards.length;
    if (total) total.textContent = count;

    function getCardWidth() {
        const c = cards[0];
        if (!c) return 360;
        return c.offsetWidth + parseInt(getComputedStyle(grid).gap || 20);
    }

    function updateUI() {
        const scrollLeft = grid.scrollLeft;
        const maxScroll  = grid.scrollWidth - grid.clientWidth;
        const idx = Math.min(
            Math.round(scrollLeft / getCardWidth()),
            count - 1
        );
        if (curr) curr.textContent = idx + 1;
        if (fill) fill.style.width = ((idx + 1) / count * 100) + '%';
        if (btnPrev) btnPrev.style.opacity = scrollLeft <= 4 ? '0.35' : '1';
        if (btnNext) btnNext.style.opacity = scrollLeft >= maxScroll - 4 ? '0.35' : '1';
    }

    btnNext.addEventListener('click', () => {
        grid.scrollBy({ left: getCardWidth(), behavior: 'smooth' });
    });
    btnPrev.addEventListener('click', () => {
        grid.scrollBy({ left: -getCardWidth(), behavior: 'smooth' });
    });

    grid.addEventListener('scroll', throttle(updateUI, 60), { passive: true });

    /* drag-to-scroll */
    let isDragging = false, dragStartX = 0, dragScrollLeft = 0;
    grid.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragStartX = e.clientX;
        dragScrollLeft = grid.scrollLeft;
        grid.style.scrollBehavior = 'auto';
    });
    document.addEventListener('mouseup', () => {
        isDragging = false;
        grid.style.scrollBehavior = 'smooth';
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        grid.scrollLeft = dragScrollLeft - (e.clientX - dragStartX);
    });

    updateUI();
})();

/* ════════════════════════════════════════════════════
   3D ROLL CAROUSEL — MOBILE ONLY  ✦ SMOOTH
════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════
   3D ROLL CAROUSEL — MOBILE ONLY  ✦ SMOOTH
════════════════════════════════════════════════════ */
(function() {

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

    let current      = 0;
    let dragActive   = false;
    let dragStartX   = 0;
    let dragStartY   = 0;
    let dragCurrentX = 0;
    let lastDragX    = 0;
    let lastDragTime = 0;
    let velocity     = 0;
    let isHorizontal = null;
    let rafId        = null;

    const ANGLE_STEP = 38;
    const RADIUS     = 360;
    const DRAG_SENS  = 0.28;

    /* ── Build dots ── */
    if (dotsWrap) {
        cards.forEach((_, i) => {
            const d = document.createElement('button');
            d.className = 'roll-dot' + (i === 0 ? ' active' : '');
            d.setAttribute('aria-label', 'Go to ' + (i + 1));
            d.addEventListener('click', () => {
                if (typeof playButtonClick === 'function') playButtonClick();
                goTo(i);
            });
            dotsWrap.appendChild(d);
        });
    }

    /* ── Tap side cards ── */
    cards.forEach((card, i) => {
        card.addEventListener('click', () => {
            if (!isMobile() || i === current || dragActive) return;
            if (typeof playCardChange === 'function') playCardChange();
            goTo(i);
        });
    });

    /* ── Render fractional position on cylinder ── */
    function renderAt(centerOffset) {
        /* Normalize centerOffset for infinite rendering */
        cards.forEach((card, i) => {
            /* Find shortest angular distance */
            let offset = i - centerOffset;
            offset = offset - Math.round(offset / total) * total;
            const absOff = Math.abs(offset);
            const angle  = offset * ANGLE_STEP;
            const rad    = angle * Math.PI / 180;
            const x      = Math.sin(rad) * RADIUS;
            const z      = Math.cos(rad) * RADIUS - RADIUS;
            const rotY   = -angle;

            if (absOff > 3.5) {
                card.style.opacity       = '0';
                card.style.pointerEvents = 'none';
                card.style.zIndex        = '0';
                card.style.transform     = `translateX(${x}px) translateZ(${z}px) rotateY(${rotY}deg)`;
                return;
            }

            card.style.transform     = `translateX(${x}px) translateZ(${z}px) rotateY(${rotY}deg)`;
            card.style.opacity       = String(Math.max(0, 1 - absOff * 0.32));
            card.style.zIndex        = String(Math.round(10 - absOff * 3));
            card.style.pointerEvents = absOff < 1.5 ? 'auto' : 'none';

            const normalizedCenter = ((Math.round(centerOffset) % total) + total) % total;
            card.classList.toggle('roll-active', i === normalizedCenter);
        });
    }

    /* ── Spring ease ── */
    function easeOutSpring(t) {
        return 1 - Math.pow(2, -10 * t) * Math.cos(t * Math.PI * 2.2);
    }

    /* ── Snap state ── */
    let snapFrom   = 0;
    let snapTarget = 0;
    let snapStart  = 0;
    let snapDur    = 480;
    let isSnapping = false;

    function animateSnap() {
        if (!isSnapping) return;
        const elapsed  = performance.now() - snapStart;
        const progress = Math.min(elapsed / snapDur, 1);
        const eased    = easeOutSpring(progress);
        const pos      = snapFrom + (snapTarget - snapFrom) * eased;

        renderAt(pos);

        if (progress < 1) {
            rafId = requestAnimationFrame(animateSnap);
        } else {
            isSnapping = false;
            current    = ((Math.round(snapTarget) % total) + total) % total;
            renderAt(current);
            cards.forEach(c => c.classList.remove('is-snapping'));
            updateUI();
        }
    }

    /* ── snapTo — handles infinite wrap via shortest path ── */
    function snapTo(idx) {
        idx = ((idx % total) + total) % total;

        const currentPos = isSnapping
            ? snapFrom + (snapTarget - snapFrom) * Math.min((performance.now() - snapStart) / snapDur, 1)
            : current;

        if (rafId) cancelAnimationFrame(rafId);

        /* Shortest path for infinite wrap */
        let diff = idx - currentPos;
        if (diff > total / 2)  diff -= total;
        if (diff < -total / 2) diff += total;
        const virtualTarget = currentPos + diff;

        snapFrom   = currentPos;
        snapTarget = virtualTarget;
        snapStart  = performance.now();
        snapDur    = Math.min(520, Math.max(280, Math.abs(diff) * 180));

        isSnapping = true;
        cards.forEach(c => c.classList.add('is-snapping'));
        animateSnap();
    }

    function goTo(idx) {
        snapTo(idx);
    }

    /* ── Update counter + dots ── */
    function updateUI() {
        if (currEl) currEl.textContent = current + 1;
        if (dotsWrap) {
            Array.from(dotsWrap.children).forEach((d, i) => {
                d.classList.toggle('active', i === current);
            });
        }
    }

    /* ── Drag base position ── */
    let dragBasePos = 0;

    function getDragPos(dx) {
        const cardWidth = cards[0] ? cards[0].offsetWidth : 280;
        return dragBasePos + (-dx / (cardWidth * DRAG_SENS * 2.2));
    }

    /* ── Touch start ── */
    function onTouchStart(e) {
        if (!isMobile() || e.touches.length !== 1) return;

        if (isSnapping) {
            isSnapping = false;
            cancelAnimationFrame(rafId);
            const elapsed  = performance.now() - snapStart;
            const progress = Math.min(elapsed / snapDur, 1);
            dragBasePos    = snapFrom + (snapTarget - snapFrom) * easeOutSpring(progress);
        } else {
            dragBasePos = current;
        }

        dragActive   = true;
        dragStartX   = e.touches[0].clientX;
        dragStartY   = e.touches[0].clientY;
        dragCurrentX = dragStartX;
        lastDragX    = dragStartX;
        lastDragTime = performance.now();
        velocity     = 0;
        isHorizontal = null;

        cards.forEach(c => {
            c.classList.add('is-dragging');
            c.classList.remove('is-snapping');
        });
    }

    /* ── Touch move ── */
    function onTouchMove(e) {
        if (!isMobile() || !dragActive || e.touches.length !== 1) return;

        const dx = e.touches[0].clientX - dragStartX;
        const dy = e.touches[0].clientY - dragStartY;

        if (isHorizontal === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
            isHorizontal = Math.abs(dx) > Math.abs(dy);
        }
        if (!isHorizontal) return;

        e.preventDefault();

        const now = performance.now();
        const dt  = now - lastDragTime;
        if (dt > 0) velocity = (e.touches[0].clientX - lastDragX) / dt;
        lastDragX    = e.touches[0].clientX;
        lastDragTime = now;
        dragCurrentX = e.touches[0].clientX;

        renderAt(getDragPos(dragCurrentX - dragStartX));
    }

    /* ── Touch end — infinite: NO clamping ── */
    function onTouchEnd() {
        if (!isMobile() || !dragActive) return;
        dragActive = false;
        cards.forEach(c => c.classList.remove('is-dragging'));

        if (!isHorizontal) return;

        const dx        = dragCurrentX - dragStartX;
        const cardWidth = cards[0] ? cards[0].offsetWidth : 280;
        const threshold = cardWidth * 0.22;
        const velThresh = 0.4;

        let targetIdx;
        if (Math.abs(velocity) > velThresh) {
            const throwCards = Math.min(2, Math.round(Math.abs(velocity) * 1.4));
            targetIdx = current + (velocity < 0 ? throwCards : -throwCards);
        } else if (Math.abs(dx) > threshold) {
            targetIdx = current + (dx < 0 ? 1 : -1);
        } else {
            targetIdx = current;
        }

        /* NO Math.max/Math.min clamp — snapTo handles infinite wrap */
        if (targetIdx !== current && typeof playCardChange === 'function') playCardChange();
        goTo(targetIdx);
    }

    /* ── Bind touch events ── */
    grid.addEventListener('touchstart',  onTouchStart, { passive: true  });
    grid.addEventListener('touchmove',   onTouchMove,  { passive: false });
    grid.addEventListener('touchend',    onTouchEnd,   { passive: true  });
    grid.addEventListener('touchcancel', onTouchEnd,   { passive: true  });

    /* ── Arrow buttons ── */
    btnPrev.addEventListener('click', () => {
        if (typeof playCardChange === 'function') playCardChange();
        goTo(current - 1);
    });
    btnNext.addEventListener('click', () => {
        if (typeof playCardChange === 'function') playCardChange();
        goTo(current + 1);
    });

    /* ── Resize ── */
    window.addEventListener('resize', throttle(() => {
        if (!isMobile()) {
            isSnapping = false;
            cancelAnimationFrame(rafId);
            cards.forEach(c => {
                c.style.cssText = '';
                c.classList.remove('roll-active', 'is-dragging', 'is-snapping');
            });
        } else {
            renderAt(current);
            updateUI();
        }
    }, 200));

    /* ── Init ── */
    if (isMobile()) {
        renderAt(current);
        updateUI();
    }

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