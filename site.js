const header = document.querySelector('.site-header');
const nav = document.querySelector('.site-nav');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = [...nav.querySelectorAll('a')];
const sections = navLinks.map((link) => document.querySelector(link.hash));
const projectSection = document.getElementById('project');
const contactsSection = document.getElementById('contacts');
const mobile = window.matchMedia('(max-width: 800px)');

function setMenuOpen(open) {
  nav.toggleAttribute('data-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
}

navToggle.addEventListener('click', () => setMenuOpen(!nav.hasAttribute('data-open')));
header.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenuOpen(false);
});
document.addEventListener('click', (event) => {
  if (!header.contains(event.target)) setMenuOpen(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.hasAttribute('data-open')) {
    setMenuOpen(false);
    navToggle.focus();
  }
});
mobile.addEventListener('change', () => setMenuOpen(false));

let navigationFrame = 0;

function updateNavigation() {
  navigationFrame = 0;
  const scrollTop = window.scrollY;
  const viewportHeight = window.innerHeight;
  const headerHeight = header.offsetHeight;
  const readingLine = headerHeight + Math.min(125, viewportHeight * 0.18);
  const maxScrollTop = document.documentElement.scrollHeight - viewportHeight;
  const sectionInterval = Math.min(80, viewportHeight * 0.1);
  const projectTop = projectSection.getBoundingClientRect().top + scrollTop;
  const contactsTop = contactsSection.getBoundingClientRect().top + scrollTop;

  // Reserve a scroll interval for both sections even if their headings cannot reach the header.
  const contactsStart = Math.min(contactsTop - readingLine, maxScrollTop - sectionInterval);
  const projectStart = Math.min(projectTop - readingLine, contactsStart - sectionInterval);
  const projectAnchor = Math.min(projectTop - headerHeight, contactsStart - sectionInterval / 2);

  const current = sections.findLastIndex((section) => {
    if (section === contactsSection) return scrollTop >= contactsStart;
    if (section === projectSection) return scrollTop >= projectStart;
    return section.getBoundingClientRect().top <= readingLine;
  });

  header.classList.toggle('is-scrolled', scrollTop > 12);
  projectSection.style.scrollMarginTop = `${Math.ceil(projectTop - projectAnchor)}px`;
  navLinks.forEach((link, index) => {
    if (index === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

function scheduleNavigationUpdate() {
  if (!navigationFrame) navigationFrame = requestAnimationFrame(updateNavigation);
}

window.addEventListener('scroll', scheduleNavigationUpdate, { passive: true });
window.addEventListener('resize', scheduleNavigationUpdate);
window.addEventListener('hashchange', scheduleNavigationUpdate);
window.addEventListener('load', scheduleNavigationUpdate);
new ResizeObserver(scheduleNavigationUpdate).observe(projectSection.parentElement);
updateNavigation();

const breathing = document.querySelector('[data-breathing]');
const breathButton = breathing.querySelector('.breath-button');
const breathLabel = breathing.querySelector('.breath-label');
let breathTimer;

function stopBreathing() {
  clearTimeout(breathTimer);
  delete breathing.dataset.phase;
  breathLabel.textContent = 'Дыхательное упражнение';
  breathButton.textContent = 'Начать';
}

function breathe(inhaling) {
  breathing.dataset.phase = inhaling ? 'in' : 'out';
  breathLabel.textContent = inhaling ? 'Вдох' : 'Выдох';
  breathTimer = window.setTimeout(() => breathe(!inhaling), inhaling ? 4000 : 6000);
}

breathButton.addEventListener('click', () => {
  if (breathing.dataset.phase) {
    stopBreathing();
    return;
  }

  breathButton.textContent = 'Завершить';
  breathe(true);
});

const showcase = document.querySelector('.showcase');
const showcaseTrack = showcase.closest('.showcase-track');
const tabList = showcase.querySelector('.tab-list');
const tabs = [...tabList.querySelectorAll('[role="tab"]')];
const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
const dots = [...showcase.querySelectorAll('.carousel-dots button')];
const exercisePanel = breathing.closest('.tab-panel');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let activeTab = 0;
let scrollStep = 0;
let stickyTop = 0;
let tabFrame = 0;

function selectTab(index, focus = false) {
  const nextTab = (index + tabs.length) % tabs.length;

  if (nextTab !== activeTab) {
    const previousPanel = panels[activeTab];
    focus ||= previousPanel.contains(document.activeElement);
    if (previousPanel === exercisePanel) stopBreathing();

    activeTab = nextTab;
    tabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === activeTab;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[tabIndex].hidden = !selected;
      dots[tabIndex].setAttribute('aria-pressed', String(selected));
    });
  }

  if (focus) tabs[activeTab].focus({ preventScroll: true });
}

function pinnedOffset() {
  return stickyTop - showcaseTrack.getBoundingClientRect().top;
}

function followScroll() {
  tabFrame = 0;
  if (!scrollStep) return;

  const step = Math.floor(pinnedOffset() / scrollStep);
  selectTab(Math.min(tabs.length - 1, Math.max(0, step)));
}

function updateStickyTabs() {
  if (!showcaseTrack) return;

  const viewportHeight = window.innerHeight;
  const headerHeight = header.offsetHeight;
  const showcaseHeight = showcase.offsetHeight;
  const canPin = !reducedMotion.matches && showcaseHeight + 24 <= viewportHeight - headerHeight;

  showcaseTrack.toggleAttribute('data-scroll-tabs', canPin);
  if (!canPin) {
    scrollStep = 0;
    return;
  }

  stickyTop = Math.round((viewportHeight + headerHeight - showcaseHeight) / 2);
  scrollStep = Math.round(Math.min(300, Math.max(130, viewportHeight * 0.27)));
  showcaseTrack.style.setProperty('--showcase-top', `${stickyTop}px`);
  showcaseTrack.style.setProperty('--showcase-scroll-distance', `${scrollStep * tabs.length}px`);
  followScroll();
}

function controlTab(index, focus = false) {
  const previousTab = activeTab;
  selectTab(index, focus);
  if (!scrollStep || activeTab === previousTab) return;

  const trackStart = window.scrollY - pinnedOffset();
  window.scrollTo({ top: trackStart + (activeTab + 0.5) * scrollStep, behavior: 'instant' });
}

window.addEventListener('scroll', () => {
  if (scrollStep && !tabFrame) tabFrame = requestAnimationFrame(followScroll);
}, { passive: true });
window.addEventListener('resize', updateStickyTabs);
reducedMotion.addEventListener('change', updateStickyTabs);
new ResizeObserver(updateStickyTabs).observe(showcase);
updateStickyTabs();

tabs.forEach((tab, index) => tab.addEventListener('click', () => controlTab(index)));
dots.forEach((dot, index) => dot.addEventListener('click', () => controlTab(index)));
showcase.querySelector('.previous').addEventListener('click', () => controlTab(activeTab - 1));
showcase.querySelector('.next').addEventListener('click', () => controlTab(activeTab + 1));

tabList.addEventListener('keydown', (event) => {
  const positions = { ArrowLeft: activeTab - 1, ArrowRight: activeTab + 1, Home: 0, End: tabs.length - 1 };
  if (!Object.hasOwn(positions, event.key)) return;

  event.preventDefault();
  controlTab(positions[event.key], true);
});

const scene = document.querySelector('[data-scene]');
const sceneToggle = scene.querySelector('.scene-toggle');
sceneToggle.addEventListener('click', () => {
  const paused = scene.classList.toggle('is-paused');
  sceneToggle.setAttribute('aria-label', paused ? 'Продолжить анимацию' : 'Приостановить анимацию');
});

const intro = document.getElementById('intro');
const video = intro.querySelector('video');
document.querySelector('[data-dialog="intro"]').addEventListener('click', () => {
  intro.showModal();
  video.play().catch(() => {
    // The built-in controls remain available when autoplay is blocked.
  });
});

intro.addEventListener('close', () => {
  video.pause();
  if (video.readyState > 0) video.currentTime = 0;
});

const legal = document.getElementById('legal');
const legalTitle = legal.querySelector('h2');
const legalContent = legal.querySelector('.legal-content');
document.querySelectorAll('[data-document]').forEach((button) => {
  button.addEventListener('click', () => {
    const template = document.getElementById(button.dataset.document);
    legalTitle.textContent = button.textContent;
    legalContent.replaceChildren(template.content.cloneNode(true));
    legal.showModal();
  });
});

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;

    const { left, right, top, bottom } = dialog.getBoundingClientRect();
    const clickedBackdrop = event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom;
    if (clickedBackdrop) dialog.close();
  });
});
