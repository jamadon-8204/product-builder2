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

  // 대시보드 언어 업데이트
  updateDashboardLang(lang);

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
  initChat();
  initDashboard();
});

/* ════════════════════════════════════════
   AI CS봇 채팅 위젯
════════════════════════════════════════ */

const KAKAO_APP_KEY = '4749a561346095905c8974a428341878';
const CHAT_API = '/api/chat';

let chatUser = null;
let chatMessages = [];
let chatOpen = false;

function initChat() {
  // 카카오 SDK 초기화
  if (window.Kakao && !Kakao.isInitialized()) {
    Kakao.init(KAKAO_APP_KEY);
  }

  const launcher = document.getElementById('chatLauncher');
  const closeBtn = document.getElementById('chatClose');
  const kakaoBtn = document.getElementById('kakaoLoginBtn');
  const sendBtn  = document.getElementById('chatSend');
  const input    = document.getElementById('chatInput');

  launcher.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', closeChat);
  kakaoBtn.addEventListener('click', loginWithKakao);
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
}

function toggleChat() {
  chatOpen ? closeChat() : openChat();
}

function openChat() {
  chatOpen = true;
  document.getElementById('chatWindow').classList.add('open');
  document.getElementById('chatUnread').classList.add('hidden');
  // 로그인 상태면 인풋 포커스
  if (chatUser) setTimeout(() => document.getElementById('chatInput').focus(), 300);
}

function closeChat() {
  chatOpen = false;
  document.getElementById('chatWindow').classList.remove('open');
}

// ── 카카오 로그인 ──
function loginWithKakao() {
  if (!window.Kakao || !Kakao.isInitialized()) {
    alert('카카오 SDK 로드 중입니다. 잠시 후 다시 시도해주세요.');
    return;
  }

  Kakao.Auth.login({
    success: function() {
      Kakao.API.request({
        url: '/v2/user/me',
        success: function(res) {
          chatUser = {
            id: res.id,
            nickname: res.kakao_account?.profile?.nickname || '사장님',
            profileImg: res.kakao_account?.profile?.profile_image_url || null,
          };
          onLoginSuccess();
        },
        fail: function() {
          // 프로필 권한 없어도 기본 닉네임으로 진행
          chatUser = { id: 'guest', nickname: '사장님', profileImg: null };
          onLoginSuccess();
        }
      });
    },
    fail: function(err) {
      console.error('카카오 로그인 실패:', err);
      alert('로그인에 실패했습니다. 도메인 설정을 확인해주세요.');
    }
  });
}

function onLoginSuccess() {
  // UI 전환: 로그인 패널 숨기고 채팅 표시
  document.getElementById('chatLoginPane').style.display = 'none';
  const body = document.getElementById('chatBody');
  body.classList.add('active');

  // 환영 메시지
  addBotMessage(`안녕하세요, ${chatUser.nickname}님! 👋\n무엇이든 물어보세요. 예약, 가격, 서비스 안내 등 도와드립니다.`);
  setTimeout(() => document.getElementById('chatInput').focus(), 100);
}

// ── 메시지 전송 ──
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.disabled = true;
  document.getElementById('chatSend').disabled = true;

  // 사용자 메시지 추가
  addUserMessage(text);
  chatMessages.push({ role: 'user', content: text });

  // 타이핑 표시
  showTyping(true);

  try {
    const res = await fetch(CHAT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatMessages }),
    });

    const data = await res.json();
    showTyping(false);

    const reply = data.reply || '죄송합니다, 잠시 후 다시 시도해주세요.';
    addBotMessage(reply);
    chatMessages.push({ role: 'assistant', content: reply });

  } catch (err) {
    showTyping(false);
    addBotMessage('연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요. 🙏');
  }

  input.disabled = false;
  document.getElementById('chatSend').disabled = false;
  input.focus();
}

// ── UI 헬퍼 ──
function addUserMessage(text) {
  const msgs = document.getElementById('chatMessages');
  const el = document.createElement('div');
  el.className = 'msg user';
  el.innerHTML = `
    <div class="msg-avatar">${chatUser?.nickname?.[0] || 'U'}</div>
    <div class="msg-bubble">${escapeHtml(text)}</div>
  `;
  msgs.appendChild(el);
  scrollToBottom();
}

function addBotMessage(text) {
  const msgs = document.getElementById('chatMessages');
  const el = document.createElement('div');
  el.className = 'msg bot';
  el.innerHTML = `
    <div class="msg-avatar">◈</div>
    <div class="msg-bubble">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
  `;
  msgs.appendChild(el);
  scrollToBottom();
}

function showTyping(show) {
  document.getElementById('chatTyping').classList.toggle('active', show);
  if (show) scrollToBottom();
}

function scrollToBottom() {
  const msgs = document.getElementById('chatMessages');
  msgs.scrollTop = msgs.scrollHeight;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ════════════════════════════════════════
   경영 인사이트 대시보드 데모
════════════════════════════════════════ */

const dashData = {
  daily: {
    labels: { ko: ['월','화','수','목','금','토','일'], en: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
    values: [245, 312, 198, 428, 380, 520, 290],
    peakIdx: 5,
    total: '2,373,000',
    growth: 12.4,
    period: { ko: '전주 대비', en: 'vs last week' },
  },
  weekly: {
    labels: { ko: ['1주','2주','3주','4주'], en: ['Wk1','Wk2','Wk3','Wk4'] },
    values: [1820, 2100, 1950, 2373],
    peakIdx: 3,
    total: '8,243,000',
    growth: 8.7,
    period: { ko: '전월 대비', en: 'vs last month' },
  },
  monthly: {
    labels: { ko: ['9월','10월','11월','12월','1월','2월'], en: ['Sep','Oct','Nov','Dec','Jan','Feb'] },
    values: [6200, 7100, 6800, 8900, 7600, 8243],
    peakIdx: 3,
    total: '44,843,000',
    growth: 15.2,
    period: { ko: '전년 대비', en: 'vs last year' },
  },
};

const topServices = [
  { name: { ko: '커트', en: 'Cut' },       pct: 42, color: '#ff6b2b' },
  { name: { ko: '염색', en: 'Color' },      pct: 31, color: '#3b82f6' },
  { name: { ko: '펌',   en: 'Perm' },       pct: 18, color: '#22d3a0' },
  { name: { ko: '트리트먼트', en: 'Treat' }, pct: 9,  color: '#a78bfa' },
];

// 7 hours (10–16시) × 7 days (월–일)
const hoursHeat = [
  [20, 28, 15, 32, 30, 55, 22],
  [45, 60, 38, 72, 65, 80, 45],
  [62, 75, 52, 78, 72, 85, 62],
  [48, 62, 40, 65, 62, 82, 52],
  [35, 50, 28, 55, 52, 98, 42],
  [32, 46, 25, 52, 48, 94, 38],
  [40, 55, 32, 60, 58, 72, 48],
];
const heatDays = { ko: ['월','화','수','목','금','토','일'], en: ['M','T','W','T','F','S','S'] };

function heatColor(v) {
  if (v < 20) return 'rgba(26,37,64,0.6)';
  if (v < 40) return 'rgba(59,130,246,0.15)';
  if (v < 60) return 'rgba(59,130,246,0.4)';
  if (v < 80) return 'rgba(59,130,246,0.7)';
  if (v < 90) return 'rgba(255,107,43,0.7)';
  return 'rgba(255,107,43,1)';
}

let dashPeriod = 'daily';
let dashAnimated = false;

function initDashboard() {
  // 탭 이벤트
  document.querySelectorAll('.dash-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      dashPeriod = btn.dataset.period;
      renderDashboard(dashPeriod, true);
    });
  });

  // 히트맵 / 서비스는 한 번만 렌더
  renderHeatmap();
  renderServices();
  renderDashboard('daily', false);

  // IntersectionObserver로 바차트 애니메이션
  const dashSection = document.getElementById('dashboard');
  if (dashSection) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !dashAnimated) {
          dashAnimated = true;
          animateBars();
          animateRing();
          animateServiceBars();
        }
      });
    }, { threshold: 0.2 });
    io.observe(dashSection);
  }
}

function renderDashboard(period, animate) {
  const d = dashData[period];
  const lang = currentLang;

  // KPI
  document.getElementById('dashTotal').textContent = '₩' + d.total;
  document.getElementById('dashGrowthPct').textContent = d.growth;
  const periodEl = document.getElementById('dashGrowthPeriod');
  if (periodEl) {
    periodEl.setAttribute('data-ko', d.period.ko);
    periodEl.setAttribute('data-en', d.period.en);
    periodEl.textContent = d.period[lang];
  }

  // 바 차트
  const labels = d.labels[lang];
  const values = d.values;
  const max = Math.max(...values);

  const barsEl = document.getElementById('dashBars');
  const xlabelsEl = document.getElementById('dashXLabels');
  barsEl.innerHTML = '';
  xlabelsEl.innerHTML = '';

  values.forEach((val, i) => {
    const heightPct = Math.round((val / max) * 100);
    const col = document.createElement('div');
    col.className = 'dash-bar-col';
    const fill = document.createElement('div');
    fill.className = 'dash-bar-fill' + (i === d.peakIdx ? ' is-peak' : '');
    fill.style.height = animate ? `${heightPct}%` : '0%';
    fill.dataset.target = heightPct;
    col.appendChild(fill);
    barsEl.appendChild(col);

    const lbl = document.createElement('div');
    lbl.className = 'dash-xlabel';
    lbl.textContent = labels[i];
    xlabelsEl.appendChild(lbl);
  });

  if (animate) return;
  // 초기엔 애니메이션 없이 높이 0으로 세팅 (io가 트리거하면 animateBars 호출)
}

function animateBars() {
  const fills = document.querySelectorAll('.dash-bar-fill');
  fills.forEach((fill, i) => {
    setTimeout(() => {
      fill.style.transition = 'height 0.6s cubic-bezier(0.34,1.56,0.64,1)';
      fill.style.height = (fill.dataset.target || '0') + '%';
    }, i * 60);
  });
}

function animateRing() {
  const ring = document.getElementById('dashRingFill');
  if (!ring) return;
  const circumference = 238.76;
  const pct = 68;
  ring.style.strokeDashoffset = circumference;
  requestAnimationFrame(() => {
    setTimeout(() => {
      ring.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
      ring.style.strokeDashoffset = circumference * (1 - pct / 100);
    }, 100);
  });
}

function animateServiceBars() {
  document.querySelectorAll('.dash-svc-fill').forEach((fill, i) => {
    const target = fill.dataset.target || '0';
    fill.style.width = '0%';
    setTimeout(() => {
      fill.style.width = target + '%';
    }, 100 + i * 120);
  });
}

function renderServices() {
  const el = document.getElementById('dashServices');
  if (!el) return;
  el.innerHTML = topServices.map((svc, i) => `
    <div class="dash-svc-row">
      <div class="dash-svc-rank">${i + 1}</div>
      <div class="dash-svc-name">${svc.name[currentLang] || svc.name.ko}</div>
      <div class="dash-svc-track">
        <div class="dash-svc-fill" style="width:0%;background:${svc.color}" data-target="${svc.pct}"></div>
      </div>
      <div class="dash-svc-pct">${svc.pct}%</div>
    </div>
  `).join('');
}

function renderHeatmap() {
  const daysEl = document.getElementById('dashHmapDays');
  const hmapEl = document.getElementById('dashHmap');
  if (!daysEl || !hmapEl) return;

  const lang = currentLang;
  const days = heatDays[lang];
  daysEl.innerHTML = days.map(d => `<div class="dash-hmap-day">${d}</div>`).join('');

  hmapEl.innerHTML = '';
  hoursHeat.forEach(row => {
    row.forEach(val => {
      const cell = document.createElement('div');
      cell.className = 'dash-hmap-cell';
      cell.style.background = heatColor(val);
      cell.title = val + '%';
      hmapEl.appendChild(cell);
    });
  });
}

// 언어 전환 시 대시보드도 업데이트
function updateDashboardLang(lang) {
  // 바 라벨 업데이트
  const d = dashData[dashPeriod];
  const xlabels = document.querySelectorAll('.dash-xlabel');
  d.labels[lang].forEach((lbl, i) => {
    if (xlabels[i]) xlabels[i].textContent = lbl;
  });

  // 성장 기간 텍스트
  const periodEl = document.getElementById('dashGrowthPeriod');
  if (periodEl) periodEl.textContent = d.period[lang];

  // 서비스 이름
  const names = document.querySelectorAll('.dash-svc-name');
  topServices.forEach((svc, i) => {
    if (names[i]) names[i].textContent = svc.name[lang] || svc.name.ko;
  });

  // 히트맵 요일
  const dayEls = document.querySelectorAll('.dash-hmap-day');
  heatDays[lang].forEach((d, i) => {
    if (dayEls[i]) dayEls[i].textContent = d;
  });
}
