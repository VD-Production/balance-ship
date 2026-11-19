const pageUrl = new URL(window.location.href);
if (pageUrl.searchParams.get('__pages_redirect') === '1') {
  pageUrl.searchParams.delete('__pages_redirect');
  window.history.replaceState(window.history.state, '', pageUrl.href);
}

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

  const current = sections.findLastIndex((section) => {
    if (section === contactsSection) return scrollTop >= contactsStart;
    if (section === projectSection) return scrollTop >= projectStart;
    return section.getBoundingClientRect().top <= readingLine;
  });

  header.classList.toggle('is-scrolled', scrollTop > 12);
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
const panelScrollLayout = window.matchMedia('(max-width: 720px), (hover: none) and (pointer: coarse)');
let activeTab = 0;
let panelsInFlow = false;
let scrollStep = 0;
let stickyTop = 0;
let tabFrame = 0;

function renderTabSelection() {
  tabs.forEach((tab, index) => {
    const selected = index === activeTab;
    if (panelsInFlow) {
      if (selected) tab.setAttribute('aria-current', 'location');
      else tab.removeAttribute('aria-current');
    } else {
      tab.setAttribute('aria-selected', String(selected));
    }

    tab.tabIndex = panelsInFlow || selected ? 0 : -1;
    panels[index].hidden = !panelsInFlow && !selected;
    dots[index].setAttribute('aria-pressed', String(selected));
  });
}

function setPanelsInFlow(inFlow) {
  if (inFlow === panelsInFlow) return;

  panelsInFlow = inFlow;
  showcaseTrack.toggleAttribute('data-panel-scroll', inFlow);
  tabList.setAttribute('role', inFlow ? 'group' : 'tablist');
  tabs.forEach((tab, index) => {
    if (inFlow) {
      tab.removeAttribute('role');
      tab.removeAttribute('aria-selected');
    } else {
      tab.setAttribute('role', 'tab');
      tab.removeAttribute('aria-current');
    }
    panels[index].setAttribute('role', inFlow ? 'region' : 'tabpanel');
    panels[index].tabIndex = inFlow ? -1 : 0;
  });
  renderTabSelection();
}

function selectTab(index, focus = false) {
  const nextTab = (index + tabs.length) % tabs.length;

  if (nextTab !== activeTab) {
    const previousPanel = panels[activeTab];
    focus ||= !panelsInFlow && previousPanel.contains(document.activeElement);
    if (previousPanel === exercisePanel) stopBreathing();

    activeTab = nextTab;
    renderTabSelection();
  }

  if (focus) tabs[activeTab].focus({ preventScroll: true });
}

function pinnedOffset() {
  return stickyTop - showcaseTrack.getBoundingClientRect().top;
}

function panelReadingLine() {
  return header.offsetHeight + tabList.offsetHeight + 12;
}

function followScroll() {
  tabFrame = 0;
  if (panelsInFlow) {
    const line = panelReadingLine();
    const visiblePanel = panels.findLastIndex((panel) => panel.getBoundingClientRect().top <= line);
    selectTab(Math.max(0, visiblePanel));
    return;
  }
  if (!scrollStep) return;

  const step = Math.floor(pinnedOffset() / scrollStep);
  selectTab(Math.min(tabs.length - 1, Math.max(0, step)));
}

function updateShowcaseLayout() {
  if (!showcaseTrack) return;

  setPanelsInFlow(panelScrollLayout.matches && !reducedMotion.matches);
  if (panelsInFlow) {
    showcaseTrack.removeAttribute('data-scroll-tabs');
    scrollStep = 0;
    followScroll();
    scheduleNavigationUpdate();
    return;
  }

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
  if (panelsInFlow) {
    const panelTop = panels[activeTab].getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: panelTop - panelReadingLine() + 2, behavior: 'instant' });
    return;
  }
  if (!scrollStep || activeTab === previousTab) return;

  const trackStart = window.scrollY - pinnedOffset();
  window.scrollTo({ top: trackStart + (activeTab + 0.5) * scrollStep, behavior: 'instant' });
}

window.addEventListener('scroll', () => {
  if ((panelsInFlow || scrollStep) && !tabFrame) tabFrame = requestAnimationFrame(followScroll);
}, { passive: true });
window.addEventListener('resize', updateShowcaseLayout);
panelScrollLayout.addEventListener('change', updateShowcaseLayout);
reducedMotion.addEventListener('change', updateShowcaseLayout);
new ResizeObserver(updateShowcaseLayout).observe(showcase);
updateShowcaseLayout();

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

const inquiry = document.getElementById('inquiry');
const inquiryForm = inquiry.querySelector('.inquiry-form');
const inquirySubmit = inquiryForm.querySelector('.inquiry-submit');
const inquiryFeedback = inquiryForm.querySelector('.inquiry-feedback');
const inquiryMessage = inquiryFeedback.querySelector('span');
const inquiryEmail = inquiryFeedback.querySelector('a');
const inquiryMailto = inquiryEmail.href;

function showInquiryMessage(message, state = '', fields) {
  inquiryMessage.textContent = message;
  inquiryFeedback.dataset.state = state;
  inquiryEmail.hidden = !fields;
  inquiryEmail.href = inquiryMailto;
  if (!fields) return;

  const body = Object.entries(fields)
    .filter(([name]) => !name.startsWith('_'))
    .map(([name, value]) => `${name}: ${value}`)
    .join('\n')
    .replace(/\r?\n/g, '\r\n');
  inquiryEmail.href = `${inquiryMailto}?subject=${encodeURIComponent(fields._subject)}&body=${encodeURIComponent(body)}`;
}

document.querySelector('[aria-controls="inquiry"]').addEventListener('click', () => {
  if (!inquirySubmit.disabled) showInquiryMessage('');
  inquiry.showModal();
});

inquiryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (inquirySubmit.disabled) return;

  const fields = Object.fromEntries([...new FormData(inquiryForm)].map(([name, value]) => [name, value.trim()]));
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  inquirySubmit.disabled = true;
  showInquiryMessage('Отправляем заявку…');

  try {
    const response = await fetch(inquiryForm.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(fields),
      signal: controller.signal,
    });
    const result = await response.json();
    const accepted = result?.success === true || result?.success === 'true';
    const awaitingActivation = /not (?:yet |been )?activated|needs activation|requires activation|activation (?:required|link|e-?mail)|activate (?:the |your )?form|(?:confirm|verify) your e-?mail/i.test(result?.message ?? '');
    if (awaitingActivation) {
      showInquiryMessage('Почта проекта ждёт подтверждения.', 'error', fields);
      return;
    }
    if (!response.ok || !accepted) throw new Error('The email relay did not accept the request.');

    inquiryForm.reset();
    showInquiryMessage('Заявка отправлена. Спасибо!', 'success');
  } catch {
    showInquiryMessage('Не удалось подтвердить отправку. Попробуйте ещё раз.', 'error', fields);
  } finally {
    clearTimeout(timeout);
    inquirySubmit.disabled = false;
  }
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
