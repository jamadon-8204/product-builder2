/* ── 골목길 팔란티어 JS ── */

// ── 언어 상태 ──
let currentLang = 'ko';

// ── NAV 스크롤 ──
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ── 한/영 전환 ──
const langToggle = document.getElementById('langToggle');
const langKo = document.getElementById('langKo');
const langEn = document.getElementById('langEn');

function setLang(lang) {
  currentLang = lang;

  // 활성 표시
  langKo.classList.toggle('active', lang === 'ko');
  langEn.classList.toggle('active', lang === 'en');

  // html lang 속성
  document.documentElement.lang = lang === 'ko' ? 'ko' : 'en';

  // 모든 번역 대상 요소 업데이트
  const elements = document.querySelectorAll('[data-ko][data-en]');
  elements.forEach(el => {
    el.classList.add('lang-transition');
    setTimeout(() => {
      const text = el.getAttribute(`data-${lang}`);
      if (text) {
        // input placeholder 처리
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = text;
        } else if (el.tagName === 'OPTION') {
          el.textContent = text;
        } else {
          el.textContent = text;
        }
      }
      el.classList.remove('lang-transition');
    }, 80);
  });

  // select 기본 옵션 placeholder
  const selectEl = document.getElementById('formIndustry');
  if (selectEl) {
    const emptyOpt = selectEl.querySelector('option[value=""]');
    if (emptyOpt) {
      emptyOpt.textContent = lang === 'ko' ? '업종을 선택하세요' : 'Select your industry';
    }
  }

  // 터미널 텍스트 업데이트
  updateTerminal(lang);

  // 페이지 타이틀 업데이트
  document.title = lang === 'ko'
    ? '골목길 팔란티어 | 1인 소상공인 AI 운영 자동화'
    : 'Alley Palantir | AI Operations for Solo Businesses';
}

langToggle.addEventListener('click', () => {
  setLang(currentLang === 'ko' ? 'en' : 'ko');
});

// ── 터미널 텍스트 ──
const terminalLines = {
  ko: [
    { type: 'cmd', text: 'system.boot()' },
    { type: 'success', text: '✓ CS Bot 온라인' },
    { type: 'success', text: '✓ 예약 시스템 연결됨' },
    { type: 'success', text: '✓ 매출 분석 활성화' },
    { type: 'info', text: '━━ 오늘 신규 문의 12건 처리 완료' },
    { type: 'info', text: '━━ 예약 충돌 0건' },
    { type: 'highlight', text: '▸ 사장님, 오늘도 잘 부탁드립니다.' },
  ],
  en: [
    { type: 'cmd', text: 'system.boot()' },
    { type: 'success', text: '✓ CS Bot online' },
    { type: 'success', text: '✓ Booking system connected' },
    { type: 'success', text: '✓ Revenue analysis active' },
    { type: 'info', text: '━━ 12 new inquiries handled today' },
    { type: 'info', text: '━━ 0 scheduling conflicts' },
    { type: 'highlight', text: '▸ Owner, have a great day.' },
  ]
};

function updateTerminal(lang) {
  const body = document.getElementById('terminalBody');
  const lines = terminalLines[lang];
  let html = '';
  lines.forEach((line, i) => {
    if (i === 0) {
      html += `<div class="t-line"><span class="t-prompt">▸</span> <span class="t-cmd">${line.text}</span></div>`;
    } else {
      html += `<div class="t-line"><span class="t-out ${line.type}">${line.text}</span></div>`;
    }
  });
  html += '<div class="t-cursor">_</div>';
  body.innerHTML = html;
}

// ── 터미널 타이핑 애니메이션 ──
function typewriterEffect() {
  const body = document.getElementById('terminalBody');
  const lines = terminalLines[currentLang];
  body.innerHTML = '<div class="t-cursor">_</div>';

  let lineIndex = 0;

  function addLine() {
    if (lineIndex >= lines.length) return;

    const line = lines[lineIndex];
    const cursor = body.querySelector('.t-cursor');

    let newEl;
    if (lineIndex === 0) {
      newEl = document.createElement('div');
      newEl.className = 't-line';
      newEl.innerHTML = `<span class="t-prompt">▸</span> <span class="t-cmd">${line.text}</span>`;
    } else {
      newEl = document.createElement('div');
      newEl.className = 't-line';
      newEl.innerHTML = `<span class="t-out ${line.type}">${line.text}</span>`;
    }

    body.insertBefore(newEl, cursor);
    lineIndex++;

    const delay = lineIndex === 1 ? 400 : 300 + Math.random() * 200;
    setTimeout(addLine, delay);
  }

  setTimeout(addLine, 600);
}

// ── 폼 제출 ──
const form = document.getElementById('contactForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('formName').value;
  const btn = form.querySelector('.btn-primary');
  const original = btn.textContent;

  btn.textContent = currentLang === 'ko' ? '신청 완료! 곧 연락드립니다 ✓' : 'Submitted! We\'ll be in touch ✓';
  btn.style.background = '#22d3a0';
  btn.style.borderColor = '#22d3a0';
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = original;
    btn.style.background = '';
    btn.style.borderColor = '';
    btn.disabled = false;
    form.reset();
  }, 3500);
});

// ── Intersection Observer (fade-in) ──
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

function initAnimations() {
  const targets = document.querySelectorAll(
    '.problem-card, .service-card, .industry-card, .step'
  );
  targets.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.5s ease ${i * 0.06}s, transform 0.5s ease ${i * 0.06}s`;
    observer.observe(el);
  });
}

// ── 초기화 ──
document.addEventListener('DOMContentLoaded', () => {
  setLang('ko');
  typewriterEffect();
  initAnimations();
});
