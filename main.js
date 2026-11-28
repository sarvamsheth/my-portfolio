
// ── Scroll reveal (runs on whichever page is loaded) ────────────────────────
function triggerReveals() {
  // Standard reveal for generic elements
  const revObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.07 });

  document.querySelectorAll('.reveal:not(.visible)')
    .forEach(el => revObs.observe(el));

  // Project items — slide left/right halves in from sides
  const projObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('slide-in');
        projObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll(
    '.proj-slide-left:not(.slide-in), .proj-slide-right:not(.slide-in)'
  ).forEach(el => projObs.observe(el));

  // Skill boxes — staggered pop-in
  const skillObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const boxes = e.target.querySelectorAll('.skill-box:not(.pop-in)');
        boxes.forEach((box, i) => {
          setTimeout(() => box.classList.add('pop-in'), i * 70);
        });
        skillObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.skills-boxes')
    .forEach(el => skillObs.observe(el));
}

// ── Home hero intro — box rises in on page load ─────────────────────────────
function showHeroText() {
  const heroEl = document.getElementById('hero-sticky');
  if (heroEl) heroEl.classList.add('text-visible');
}

// ── Project modals (only relevant on projects.html) ─────────────────────────
function openProject(id) {
  const backdrop = document.getElementById('modal-backdrop');
  const modal = document.getElementById('modal-' + id);
  if (!backdrop || !modal) return;

  backdrop.classList.add('open');
  modal.classList.add('open');
  modal.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function closeProject() {
  document.querySelectorAll('.proj-modal')
    .forEach(m => m.classList.remove('open'));

  if (/^#p\d+$/.test(location.hash)) {
    history.replaceState(null, '', location.pathname + location.search);
  }

  const backdrop = document.getElementById('modal-backdrop');
  if (backdrop) backdrop.classList.remove('open');

  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeProject(); toggleNav(false); }
});

// ── Phone menu (☰ button, shown on small screens only) ──────────────────────
function toggleNav(force) {
  const nav = document.querySelector('nav');
  const btn = document.querySelector('.nav-toggle');
  if (!nav || !btn) return;
  const open = typeof force === 'boolean' ? force : !nav.classList.contains('nav-open');
  nav.classList.toggle('nav-open', open);
  btn.setAttribute('aria-expanded', open);
  btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

document.addEventListener('click', e => {
  const nav = document.querySelector('nav');
  if (nav && nav.classList.contains('nav-open') && !nav.contains(e.target)) toggleNav(false);
});

// ── Home project carousel ────────────────────────────────────────────────────
// Loops forever, drifts slowly on its own, and can be scrolled with a trackpad,
// dragged with the mouse, swiped on phones, or moved with the arrow buttons.
function initCarousel() {
  const track = document.querySelector('.work-track');
  if (!track) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const originals = [...track.children];
  const n = originals.length;
  if (!n) return;

  // Two extra copies so the row can loop without ever reaching an end
  for (let k = 0; k < 2; k++) {
    originals.forEach(c => {
      const copy = c.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.tabIndex = -1;
      track.appendChild(copy);
    });
  }
  track.querySelectorAll('a, img').forEach(el => el.setAttribute('draggable', 'false'));

  let setW = 0, step = 0, pos = 0, lastSet = -1;
  let hovering = false, dragging = false, idleUntil = 0, tween = null;

  function measure() {
    const kids = track.children;
    setW = kids[n].offsetLeft - kids[0].offsetLeft;
    step = kids[1].offsetLeft - kids[0].offsetLeft;
  }
  function wrap() {
    if (pos < setW * 0.5) pos += setW;
    else if (pos > setW * 1.5) pos -= setW;
  }
  function apply() {
    wrap();
    lastSet = Math.round(pos);
    track.scrollLeft = lastSet;
  }

  measure();
  pos = setW;
  apply();

  // Someone scrolled it themselves (trackpad, swipe, keyboard focus)
  track.addEventListener('scroll', () => {
    if (Math.abs(track.scrollLeft - lastSet) <= 2) return;
    pos = track.scrollLeft;
    idleUntil = performance.now() + 2500;
    tween = null;
    if (pos < setW * 0.5 || pos > setW * 1.5) apply();
    else lastSet = track.scrollLeft;
  }, { passive: true });

  // Pause while the mouse is over it
  track.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hovering = true; });
  track.addEventListener('pointerleave', () => { hovering = false; idleUntil = performance.now() + 600; });

  // Drag with the mouse
  let startX = 0, startPos = 0, moved = false;
  track.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true; moved = false; tween = null;
    startX = e.clientX; startPos = pos;
  });
  window.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add('dragging'); }
    if (moved) { pos = startPos - dx; apply(); }
  });
  window.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('dragging');
    idleUntil = performance.now() + 1500;
    if (moved) {
      // A drag shouldn't count as clicking the project underneath
      track.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); }, { capture: true, once: true });
      setTimeout(() => { moved = false; }, 0);
    }
  });

  // Arrow buttons
  document.querySelectorAll('.work-arrow').forEach(btn => btn.addEventListener('click', () => {
    const t0 = performance.now();
    tween = { dist: step * Number(btn.dataset.dir), done: 0, t0, dur: 650 };
    idleUntil = t0 + 3500;
  }));

  // Animation loop
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(now - last, 50); last = now;
    if (tween) {
      const k = Math.min((now - tween.t0) / tween.dur, 1);
      const want = tween.dist * (1 - Math.pow(1 - k, 3));   // ease-out
      pos += want - tween.done;
      tween.done = want;
      apply();
      if (k >= 1) tween = null;
    } else if (!reduce && !hovering && !dragging && now > idleUntil) {
      pos += 0.4 * dt / 16.67;
      apply();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.addEventListener('resize', () => {
    const frac = setW ? (pos - setW) / setW : 0;
    measure();
    pos = setW + frac * setW;
    apply();
  });
}

// Clicking a project photo grows it to fill the screen, then opens that
// project (projects.html#p0 etc.), where the photo carries on into place.
document.addEventListener('click', e => {
  const card = e.target.closest && e.target.closest('.work-card');
  if (!card || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const img = card.querySelector('img');
  if (!img || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  e.preventDefault();

  try { sessionStorage.setItem('pf-zoom', img.getAttribute('src')); } catch (err) {}

  const box = card.querySelector('.work-img');
  const r = box.getBoundingClientRect();
  const zoom = document.createElement('div');
  zoom.className = 'page-zoom';
  Object.assign(zoom.style, {
    top: r.top + 'px', left: r.left + 'px', width: r.width + 'px', height: r.height + 'px'
  });
  zoom.appendChild(img.cloneNode());
  document.body.appendChild(zoom);
  document.body.classList.add('leaving');

  requestAnimationFrame(() => requestAnimationFrame(() => {
    Object.assign(zoom.style, { top: '0px', left: '0px', width: '100vw', height: '100vh', borderRadius: '0px' });
  }));
  setTimeout(() => { location.href = card.href; }, 720);
});

// Coming back with the browser's Back button: clear the zoom overlay
window.addEventListener('pageshow', () => {
  document.querySelectorAll('.page-zoom').forEach(z => z.remove());
  document.body.classList.remove('leaving');
});

// Projects page opened from a home photo (projects.html#p2): the full-screen
// photo moves up into the project's banner, then the text animates in.
function openFromHash() {
  const root = document.documentElement;
  const m = location.hash.match(/^#(p\d+)$/);
  const modal = m && document.getElementById('modal-' + m[1]);
  let src = null;
  try { src = sessionStorage.getItem('pf-zoom'); sessionStorage.removeItem('pf-zoom'); } catch (e) {}

  const release = () => { root.classList.remove('arriving'); root.style.background = ''; };
  if (!modal) { release(); return; }

  modal.classList.add('instant');
  const hero = modal.querySelector('.pmod-hero-img');
  const animated = src && hero && !matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (animated) {
    document.body.classList.add('arrived');
    modal.classList.add('hero-hold');
  }
  openProject(m[1]);

  if (!animated) {
    release();
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.remove('instant')));
    return;
  }

  const cover = document.createElement('div');
  cover.className = 'zoom-arrive';
  Object.assign(cover.style, { top: '0px', left: '0px', width: '100vw', height: '100vh' });
  const im = new Image();
  im.src = src;
  im.alt = '';
  cover.appendChild(im);
  document.body.appendChild(cover);
  release();

  const go = () => {
    const r = hero.getBoundingClientRect();
    const move = cover.animate([
      { top: '0px', left: '0px', width: innerWidth + 'px', height: innerHeight + 'px' },
      { top: r.top + 'px', left: r.left + 'px', width: r.width + 'px', height: r.height + 'px' }
    ], { duration: 900, easing: 'cubic-bezier(.65,0,.25,1)', fill: 'forwards' });
    move.onfinish = () => {
      modal.classList.remove('hero-hold', 'instant');
      cover.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' })
        .onfinish = () => cover.remove();
    };
  };
  (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() =>
    requestAnimationFrame(() => setTimeout(go, 120)));
}

// ── Mouse tracking for the soft background light, card tilt and spotlight ─────
(function () {
  const root = document.documentElement;
  const TILT = '.proj-img-wrap, .skill-box, .tl-img-item, .about-row-img, .contact-channel, .avail-card';
  document.addEventListener('pointermove', e => {
    root.style.setProperty('--mx', (e.clientX / innerWidth).toFixed(3));
    root.style.setProperty('--my', (e.clientY / innerHeight).toFixed(3));
    const el = e.target.closest && e.target.closest(TILT);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--px', (x * 100).toFixed(1) + '%');
    el.style.setProperty('--py', (y * 100).toFixed(1) + '%');
    el.style.setProperty('--ry', ((x - 0.5) * 10).toFixed(2) + 'deg');
    el.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
  }, { passive: true });
  document.addEventListener('pointerout', e => {
    const el = e.target.closest && e.target.closest(TILT);
    if (el && !el.contains(e.relatedTarget)) {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    }
  });
})();

// ── Init ─────────────────────────────────────────────────────────────────────
openFromHash();
initCarousel();

setTimeout(() => {
  document.querySelectorAll('.page')
    .forEach(p => p.classList.add('page-entering'));

  triggerReveals();
  setTimeout(showHeroText, 350);

  // Show scroll hint after hero image loads (home page only)
  const hint = document.getElementById('hero-scroll-hint');

  if (hint) {
    setTimeout(() => {
      hint.classList.add('hint-show');
    }, 1600);
  }
}, 50);
