import { translations } from './i18n.js';

let currentLang = localStorage.getItem('solara-lang') || 'en';

// ==========================================
// i18n — LANGUAGE SWITCHER
// ==========================================
function applyLanguage(lang) {
  const t = translations[lang];
  if (!t) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.textContent = t[key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.dataset.i18nHtml;
    if (t[key] !== undefined) el.innerHTML = t[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (t[key] !== undefined) el.placeholder = t[key];
  });

  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-opt').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.lang === lang);
  });

  // Update WhatsApp link with localized message
  const wa = document.getElementById('whatsapp-float');
  if (wa) {
    wa.href = `https://wa.me/18323887224?text=${encodeURIComponent(t['wa.msg'])}`;
  }

  currentLang = lang;
  localStorage.setItem('solara-lang', lang);
}

// ==========================================
// REVIEWS CAROUSEL
// ==========================================
function initCarousel() {
  const track = document.getElementById('reviews-track');
  const dotsContainer = document.getElementById('reviews-dots');
  if (!track || !dotsContainer) return;

  const slides = track.children.length;
  let activeSlide = 0;

  function visibleSlides() {
    if (window.innerWidth < 700) return 1;
    if (window.innerWidth < 1100) return 2;
    return 3;
  }

  function pageCount() {
    return Math.max(1, slides - visibleSlides() + 1);
  }

  // Build dots dynamically
  function rebuildDots() {
    dotsContainer.innerHTML = '';
    const pages = pageCount();
    for (let i = 0; i < pages; i++) {
      const d = document.createElement('button');
      d.className = 'dot' + (i === 0 ? ' active' : '');
      d.dataset.slide = i;
      d.setAttribute('aria-label', `Page ${i + 1}`);
      d.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(d);
    }
  }

  function goTo(i) {
    activeSlide = Math.max(0, Math.min(i, pageCount() - 1));
    // Use bounding rects so we precisely account for gap/padding.
    const targetSlide = track.children[activeSlide];
    if (targetSlide) {
      // Reset transform first to measure the natural position correctly.
      const prev = track.style.transform;
      track.style.transform = '';
      const trackLeft = track.getBoundingClientRect().left;
      const slideLeft = targetSlide.getBoundingClientRect().left;
      const offset = slideLeft - trackLeft;
      track.style.transform = `translateX(${-offset}px)`;
    }
    dotsContainer.querySelectorAll('.dot').forEach((d, idx) => {
      d.classList.toggle('active', idx === activeSlide);
    });
  }

  // Touch/swipe
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) {
      goTo(activeSlide + (dx > 0 ? 1 : -1));
    }
  }, { passive: true });

  // Auto-advance every 7s — respects prefers-reduced-motion and pauses on hover/focus
  let autoTimer;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function startAuto() {
    if (reducedMotion) return;
    clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      const pages = pageCount();
      goTo((activeSlide + 1) % pages);
    }, 7000);
  }
  function stopAuto() { clearInterval(autoTimer); }

  rebuildDots();
  goTo(0);
  startAuto();

  // Pause on user interaction so screen readers / keyboard users can read at their pace
  const viewport = track.parentElement;
  if (viewport) {
    viewport.addEventListener('mouseenter', stopAuto);
    viewport.addEventListener('mouseleave', startAuto);
    viewport.addEventListener('focusin', stopAuto);
    viewport.addEventListener('focusout', startAuto);
  }

  window.addEventListener('resize', () => {
    rebuildDots();
    goTo(0);
  });
}

// ==========================================
// ACTIVE NAV LINK ON SCROLL
// ==========================================
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav__link');

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px' });

  sections.forEach(s => obs.observe(s));
}

// ==========================================
// SMOOTH ANCHOR SCROLL
// ==========================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length <= 1) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: 'smooth' });
      closeMobileMenu();
    });
  });
}

// ==========================================
// MOBILE MENU
// ==========================================
let hamburgerEl, mobileMenuEl;
function closeMobileMenu() {
  hamburgerEl?.classList.remove('open');
  mobileMenuEl?.classList.remove('open');
  document.body.classList.remove('no-scroll');
  hamburgerEl?.setAttribute('aria-expanded', 'false');
}
function initMobileMenu() {
  hamburgerEl = document.getElementById('hamburger');
  mobileMenuEl = document.getElementById('mobile-menu');
  if (!hamburgerEl || !mobileMenuEl) return;

  hamburgerEl.setAttribute('aria-expanded', 'false');
  hamburgerEl.setAttribute('aria-controls', 'mobile-menu');
  hamburgerEl.addEventListener('click', () => {
    const open = hamburgerEl.classList.toggle('open');
    mobileMenuEl.classList.toggle('open', open);
    document.body.classList.toggle('no-scroll', open);
    hamburgerEl.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('.mobile-link, .mobile-phone').forEach(link =>
    link.addEventListener('click', closeMobileMenu));
}

// ==========================================
// FORM SUBMIT  (posts to Google Sheets via Apps Script)
// ==========================================
const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzI24lbWf9C3tfNgug7PwyoVFFdjPmrKGTgt80dAVU24Hlrf0EYrtZQbEoRYjNabOI/exec';

function initForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const errorEl = document.getElementById('form-error');

  function showError(key) {
    if (!errorEl) return;
    const t = translations[currentLang];
    errorEl.textContent = (t && t[key]) || errorEl.textContent;
    errorEl.hidden = false;
  }
  function clearError() {
    if (errorEl) errorEl.hidden = true;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearError();
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    const data = Object.fromEntries(new FormData(form).entries());

    // Honeypot: if a bot filled the hidden field, fake success silently
    if (data.website) {
      btn.textContent = translations[currentLang]['gs.success'];
      btn.disabled = true;
      btn.style.background = '#22c55e';
      btn.style.color = '#fff';
      return;
    }

    // Client-side validation
    const name = (data.name || '').trim();
    const phone = (data.phone || '').trim();
    const digits = phone.replace(/\D/g, '');
    if (name.length < 2 || digits.length < 7) {
      showError('gs.invalid');
      return;
    }

    btn.disabled = true;
    btn.textContent = '...';

    data.submittedAt = new Date().toISOString();
    data.language = currentLang;
    data.pageUrl = location.href;
    delete data.website;

    try {
      await fetch(SHEETS_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data)
      });
      btn.textContent = translations[currentLang]['gs.success'];
      btn.style.background = '#22c55e';
      btn.style.color = '#fff';
      form.reset();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = originalText;
      showError('gs.error');
    }
  });
}

// ==========================================
// SCROLLED NAVBAR
// ==========================================
function initScrolledNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ==========================================
// LANG TOGGLE
// ==========================================
function initLangToggle() {
  const toggle = document.getElementById('lang-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    applyLanguage(currentLang === 'en' ? 'es' : 'en');
  });
}

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLang);
  initSmoothScroll();
  initMobileMenu();
  initLangToggle();
  initCarousel();
  initActiveNav();
  initForm();
  initScrolledNav();
});
