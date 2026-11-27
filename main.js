
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

// ── Home hero scroll animation ──────────────────────────────────────────────
let heroTextShown = false;

function onScroll() {
  const heroEl = document.getElementById('hero-sticky');
  if (!heroEl) return;

  const textThreshold = window.innerHeight * 0.10;
  const shouldShowText = window.scrollY >= textThreshold;

  if (shouldShowText !== heroTextShown) {
    heroEl.classList.toggle('text-visible', shouldShowText);
    heroTextShown = shouldShowText;
  }
}

window.addEventListener('scroll', onScroll, { passive: true });

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

  const backdrop = document.getElementById('modal-backdrop');
  if (backdrop) backdrop.classList.remove('open');

  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeProject();
});

// ── Init ─────────────────────────────────────────────────────────────────────
setTimeout(() => {
  document.querySelectorAll('.page')
    .forEach(p => p.classList.add('page-entering'));

  triggerReveals();
  onScroll();

  // Show scroll hint after hero image loads (home page only)
  const hint = document.getElementById('hero-scroll-hint');

  if (hint) {
    setTimeout(() => {
      hint.classList.add('hint-show');
    }, 1600);
  }
}, 50);
