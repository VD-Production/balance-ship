const header = document.querySelector('.site-header');
const nav = document.querySelector('.site-nav');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = [...nav.querySelectorAll('a')];
const sections = navLinks.map((link) => document.querySelector(link.hash));
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
  header.classList.toggle('is-scrolled', window.scrollY > 12);

  const readingLine = header.offsetHeight + Math.min(125, window.innerHeight * 0.18);
  let current = sections.findLastIndex((section) => section.getBoundingClientRect().top <= readingLine);
  const reachedEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3;

  if (reachedEnd) {
    const requested = navLinks.findIndex((link) => link.hash === window.location.hash);
    const requestedPosition = sections[requested]?.getBoundingClientRect();
    current = requestedPosition?.bottom > readingLine ? requested : sections.length - 1;
  }

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
scheduleNavigationUpdate();

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
const tabList = showcase.querySelector('.tab-list');
const tabs = [...tabList.querySelectorAll('[role="tab"]')];
const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
const dots = [...showcase.querySelectorAll('.carousel-dots button')];
const exercisePanel = breathing.closest('.tab-panel');
let activeTab = 0;

function selectTab(index, focus = false) {
  const nextTab = (index + tabs.length) % tabs.length;

  if (panels[activeTab] === exercisePanel && nextTab !== activeTab) stopBreathing();
  activeTab = nextTab;

  tabs.forEach((tab, tabIndex) => {
    const selected = tabIndex === activeTab;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    panels[tabIndex].hidden = !selected;
    dots[tabIndex].setAttribute('aria-pressed', String(selected));
  });

  if (focus) tabs[activeTab].focus();
}

tabs.forEach((tab, index) => tab.addEventListener('click', () => selectTab(index)));
dots.forEach((dot, index) => dot.addEventListener('click', () => selectTab(index)));
showcase.querySelector('.previous').addEventListener('click', () => selectTab(activeTab - 1));
showcase.querySelector('.next').addEventListener('click', () => selectTab(activeTab + 1));

tabList.addEventListener('keydown', (event) => {
  const positions = { ArrowLeft: activeTab - 1, ArrowRight: activeTab + 1, Home: 0, End: tabs.length - 1 };
  if (!Object.hasOwn(positions, event.key)) return;

  event.preventDefault();
  selectTab(positions[event.key], true);
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
