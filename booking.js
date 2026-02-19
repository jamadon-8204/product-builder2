/* ── 골목길 팔란티어 예약 시스템 JS ── */

// ── 서비스 데이터 ──
const SERVICES = {
  beauty: [
    { id: 'cut',   name: '커트',       duration: 45,  price: '20,000원~' },
    { id: 'color', name: '염색',       duration: 120, price: '80,000원~' },
    { id: 'perm',  name: '파마',       duration: 150, price: '100,000원~' },
    { id: 'nail',  name: '네일',       duration: 90,  price: '50,000원~' },
    { id: 'care',  name: '두피 케어',  duration: 60,  price: '40,000원~' },
    { id: 'treat', name: '트리트먼트', duration: 60,  price: '30,000원~' },
  ],
  clinic: [
    { id: 'consult',   name: '일반 진료', duration: 30, price: '진찰료 별도' },
    { id: 'followup',  name: '재진',      duration: 20, price: '진찰료 별도' },
    { id: 'treatment', name: '치료',      duration: 60, price: '치료비 별도' },
    { id: 'check',     name: '건강 검진', duration: 90, price: '검진비 별도' },
  ],
  academy: [
    { id: 'trial',   name: '체험 수업',  duration: 60, price: '무료' },
    { id: 'consult', name: '입학 상담',  duration: 30, price: '무료' },
    { id: 'class',   name: '정규 수업',  duration: 90, price: '수강료 별도' },
    { id: 'makeup',  name: '특강',       duration: 120, price: '특강비 별도' },
  ],
};

// ── 상태 ──
const state = {
  step: 1,
  businessType: 'beauty',
  service: null,
  date: null,
  time: null,
  name: '',
  phone: '',
  email: '',
  notes: '',
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  slotsCache: {},
  booking: null,
};

// ── DOM refs ──
const steps = [null, 'step1', 'step2', 'step3', 'step4', 'stepSuccess'].map(
  id => id ? document.getElementById(id) : null
);
const progressFill = document.getElementById('progressFill');
const btnNext = document.getElementById('btnNext');
const btnBack = document.getElementById('btnBack');
const navButtons = document.getElementById('navButtons');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

// ── 초기화 ──
function init() {
  renderServiceGrid();
  renderCalendar();
  bindEvents();
  updateUI();
}

// ── 탭 이벤트 ──
function bindEvents() {
  document.querySelectorAll('.bk-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.bk-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.businessType = tab.dataset.type;
      state.service = null;
      renderServiceGrid();
      updateNextBtn();
    });
  });

  document.getElementById('calPrev').addEventListener('click', () => {
    state.calMonth--;
    if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
    renderCalendar();
  });

  document.getElementById('calNext').addEventListener('click', () => {
    state.calMonth++;
    if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
    renderCalendar();
  });

  btnNext.addEventListener('click', handleNext);
  btnBack.addEventListener('click', handleBack);

  document.getElementById('addCalendarBtn')?.addEventListener('click', addToCalendar);
}

// ── 서비스 그리드 렌더링 ──
function renderServiceGrid() {
  const grid = document.getElementById('serviceGrid');
  const services = SERVICES[state.businessType];
  grid.innerHTML = services.map(s => `
    <div class="bk-service-card ${state.service?.id === s.id ? 'selected' : ''}"
         data-id="${s.id}" data-name="${s.name}" data-duration="${s.duration}" data-price="${s.price}">
      <div class="bk-service-name">${s.name}</div>
      <div class="bk-service-meta">
        <span class="bk-service-duration">⏱ ${formatDuration(s.duration)}</span>
        <span class="bk-service-price">${s.price}</span>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.bk-service-card').forEach(card => {
    card.addEventListener('click', () => {
      grid.querySelectorAll('.bk-service-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.service = {
        id: card.dataset.id,
        name: card.dataset.name,
        duration: parseInt(card.dataset.duration),
        price: card.dataset.price,
      };
      updateNextBtn();
    });
  });
}

// ── 달력 렌더링 ──
function renderCalendar() {
  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  document.getElementById('calMonth').textContent = `${state.calYear}년 ${monthNames[state.calMonth]}`;

  const today = new Date();
  today.setHours(0,0,0,0);
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 60); // 60일 후까지 예약 가능

  const firstDay = new Date(state.calYear, state.calMonth, 1).getDay();
  const daysInMonth = new Date(state.calYear, state.calMonth + 1, 0).getDate();

  let html = '';
  // 빈 셀 (달 시작 전)
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="bk-cal-day empty"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(state.calYear, state.calMonth, d);
    date.setHours(0,0,0,0);
    const dateStr = toDateStr(date);
    const isPast = date < today;
    const isTooFar = date > maxDate;
    const isSunday = date.getDay() === 0;
    const isSaturday = date.getDay() === 6;
    const isSelected = dateStr === state.date;
    const isToday = dateStr === toDateStr(today);

    const classes = [
      'bk-cal-day',
      isPast || isTooFar ? 'disabled' : '',
      isSunday ? 'sunday' : '',
      isSaturday ? 'saturday' : '',
      isSelected ? 'selected' : '',
      isToday ? 'today' : '',
    ].filter(Boolean).join(' ');

    html += `<div class="${classes}" data-date="${dateStr}">${d}</div>`;
  }

  const daysEl = document.getElementById('calDays');
  daysEl.innerHTML = html;

  daysEl.querySelectorAll('.bk-cal-day:not(.disabled):not(.empty)').forEach(day => {
    day.addEventListener('click', () => selectDate(day.dataset.date));
  });
}

// ── 날짜 선택 ──
async function selectDate(dateStr) {
  state.date = dateStr;
  state.time = null;

  // 달력 갱신
  document.querySelectorAll('.bk-cal-day').forEach(d => {
    d.classList.toggle('selected', d.dataset.date === dateStr);
  });

  // 날짜 레이블 업데이트
  const [y, m, d] = dateStr.split('-');
  document.getElementById('selectedDateLabel').textContent = `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;

  await loadSlots(dateStr);
  updateNextBtn();
}

// ── 슬롯 로딩 ──
async function loadSlots(date) {
  if (!state.service) return;

  const grid = document.getElementById('slotsGrid');
  grid.innerHTML = '<div class="bk-slot-loading">⏳ 예약 가능한 시간을 확인하는 중...</div>';

  const cacheKey = `${date}_${state.service.duration}`;
  if (state.slotsCache[cacheKey]) {
    renderSlots(state.slotsCache[cacheKey]);
    return;
  }

  try {
    const res = await fetch(`/api/booking/slots?date=${date}&duration=${state.service.duration}`);
    const data = await res.json();
    state.slotsCache[cacheKey] = data.slots;
    renderSlots(data.slots);
  } catch (err) {
    // 오프라인/개발 환경: 모든 슬롯을 available로 표시
    const mockSlots = [
      '09:00','10:00','11:00','12:00','13:00',
      '14:00','15:00','16:00','17:00','18:00',
    ].map(time => ({ time, available: true }));
    state.slotsCache[cacheKey] = mockSlots;
    renderSlots(mockSlots);
  }
}

// ── 슬롯 렌더링 ──
function renderSlots(slots) {
  const grid = document.getElementById('slotsGrid');
  if (!slots || slots.length === 0) {
    grid.innerHTML = '<div class="bk-slots-placeholder"><span>😔</span><p>예약 가능한 시간이 없습니다.</p></div>';
    return;
  }

  grid.innerHTML = slots.map(s => `
    <div class="bk-slot ${s.available ? '' : 'booked'} ${state.time === s.time ? 'selected' : ''}"
         data-time="${s.time}" ${!s.available ? 'aria-disabled="true"' : ''}>
      ${s.time}
      ${!s.available ? '' : ''}
    </div>
  `).join('');

  grid.querySelectorAll('.bk-slot:not(.booked)').forEach(slot => {
    slot.addEventListener('click', () => {
      grid.querySelectorAll('.bk-slot').forEach(s => s.classList.remove('selected'));
      slot.classList.add('selected');
      state.time = slot.dataset.time;
      updateNextBtn();
    });
  });
}

// ── Step 3 요약 ──
function renderStep3Summary() {
  const el = document.getElementById('step3Summary');
  el.innerHTML = `
    <strong>${state.service.name}</strong>
    <span>📅 ${formatDateKo(state.date)}</span>
    <span>⏰ ${state.time}</span>
    <span>⏱ ${formatDuration(state.service.duration)}</span>
  `;
}

// ── Step 4 확인 카드 ──
function renderConfirmCard() {
  const el = document.getElementById('confirmCard');
  const rows = [
    ['서비스', state.service.name],
    ['날짜', formatDateKo(state.date)],
    ['시간', state.time],
    ['소요 시간', formatDuration(state.service.duration)],
    ['요금', state.service.price],
    ['성함', state.name],
    ['연락처', state.phone],
    state.email ? ['이메일', state.email] : null,
    state.notes ? ['메모', state.notes] : null,
  ].filter(Boolean);

  el.innerHTML = rows.map(([label, value]) => `
    <div class="bk-confirm-row">
      <span class="bk-confirm-label">${label}</span>
      <span class="bk-confirm-value">${escHtml(value)}</span>
    </div>
  `).join('') + `
    <div class="bk-confirm-row" style="padding-top:16px;border-top:1px solid var(--border);">
      <span class="bk-confirm-label">상태</span>
      <span class="bk-confirm-badge">✓ 예약 가능</span>
    </div>
  `;
}

// ── 다음 버튼 처리 ──
async function handleNext() {
  if (btnNext.classList.contains('loading')) return;

  if (state.step === 1) {
    if (!state.service) return;
    goToStep(2);

  } else if (state.step === 2) {
    if (!state.date || !state.time) return;
    renderStep3Summary();
    goToStep(3);

  } else if (state.step === 3) {
    if (!validateForm()) return;
    renderConfirmCard();
    goToStep(4);

  } else if (state.step === 4) {
    if (!document.getElementById('termsCheck').checked) {
      showToast('예약 정책에 동의해주세요.', 'error');
      return;
    }
    await submitBooking();
  }
}

// ── 이전 버튼 ──
function handleBack() {
  if (state.step > 1) goToStep(state.step - 1);
}

// ── 스텝 이동 ──
function goToStep(n) {
  steps[state.step]?.classList.add('hidden');
  state.step = n;
  steps[state.step]?.classList.remove('hidden');
  updateUI();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── UI 업데이트 ──
function updateUI() {
  const isSuccess = state.step === 5;
  navButtons.classList.toggle('hidden', isSuccess);
  progressFill.style.width = `${(state.step / 4) * 100}%`;

  btnBack.classList.toggle('hidden', state.step <= 1);

  if (state.step === 4) {
    btnNext.textContent = '예약 완료하기';
    btnNext.className = 'bk-btn-next submit';
    btnNext.disabled = false;
  } else {
    btnNext.textContent = '다음 →';
    btnNext.className = 'bk-btn-next';
    updateNextBtn();
  }

  // 체크박스 상태 변화시 버튼 갱신
  const termsCheck = document.getElementById('termsCheck');
  if (termsCheck) {
    termsCheck.onchange = () => {};
  }
}

function updateNextBtn() {
  if (state.step === 1) {
    btnNext.disabled = !state.service;
  } else if (state.step === 2) {
    btnNext.disabled = !state.date || !state.time;
  } else if (state.step === 3) {
    btnNext.disabled = false;
  }
}

// ── 폼 검증 ──
function validateForm() {
  state.name = document.getElementById('fieldName').value.trim();
  state.phone = document.getElementById('fieldPhone').value.trim();
  state.email = document.getElementById('fieldEmail').value.trim();
  state.notes = document.getElementById('fieldNotes').value.trim();

  if (!state.name) {
    showToast('성함을 입력해주세요.', 'error');
    document.getElementById('fieldName').focus();
    return false;
  }
  if (!state.phone || !/^0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}$/.test(state.phone.replace(/\s/g,''))) {
    showToast('올바른 휴대폰 번호를 입력해주세요.', 'error');
    document.getElementById('fieldPhone').focus();
    return false;
  }
  if (state.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) {
    showToast('올바른 이메일 주소를 입력해주세요.', 'error');
    document.getElementById('fieldEmail').focus();
    return false;
  }
  return true;
}

// ── 예약 제출 ──
async function submitBooking() {
  setLoading(true, '예약을 처리하는 중입니다...');
  btnNext.classList.add('loading');
  btnNext.disabled = true;

  try {
    const res = await fetch('/api/booking/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: state.service.id,
        serviceName: state.service.name,
        duration: state.service.duration,
        date: state.date,
        time: state.time,
        name: state.name,
        phone: state.phone,
        email: state.email || null,
        notes: state.notes || null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || '예약 처리 중 오류가 발생했습니다.');
    }

    state.booking = data.booking;
    setLoading(false);
    showSuccess(data.booking);

  } catch (err) {
    setLoading(false);
    btnNext.classList.remove('loading');
    btnNext.disabled = false;
    showToast(err.message || '예약 처리 중 오류가 발생했습니다.', 'error');
  }
}

// ── 성공 화면 ──
function showSuccess(booking) {
  // 성공 스텝으로 이동
  steps[4]?.classList.add('hidden');
  document.getElementById('stepSuccess').classList.remove('hidden');
  state.step = 5;
  navButtons.classList.add('hidden');
  progressFill.style.width = '100%';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 이메일 안내
  const sub = booking.email
    ? `확인 이메일을 ${booking.email}로 발송했습니다.`
    : '예약이 완료되었습니다. 예약 번호를 저장해두세요.';
  document.getElementById('successSub').textContent = sub;

  // 성공 카드
  const card = document.getElementById('successCard');
  card.innerHTML = `
    <div class="bk-confirm-row">
      <span class="bk-confirm-label">예약 번호</span>
      <span class="bk-confirm-value" style="font-family:monospace;color:var(--purple2);">${booking.id}</span>
    </div>
    <div class="bk-confirm-row">
      <span class="bk-confirm-label">서비스</span>
      <span class="bk-confirm-value">${escHtml(booking.service)}</span>
    </div>
    <div class="bk-confirm-row">
      <span class="bk-confirm-label">날짜</span>
      <span class="bk-confirm-value">${formatDateKo(booking.date)}</span>
    </div>
    <div class="bk-confirm-row">
      <span class="bk-confirm-label">시간</span>
      <span class="bk-confirm-value">${booking.time}</span>
    </div>
    <div class="bk-confirm-row">
      <span class="bk-confirm-label">상태</span>
      <span class="bk-confirm-badge">✓ 예약 확정</span>
    </div>
  `;

  document.getElementById('cancelId').textContent = `예약 번호: ${booking.id}`;

  // 슬롯 캐시 무효화
  const cacheKey = `${booking.date}_${state.service?.duration || 60}`;
  delete state.slotsCache[cacheKey];
}

// ── 캘린더 추가 ──
function addToCalendar() {
  if (!state.booking) return;
  const [y, m, d] = state.booking.date.split('-');
  const [h, min] = state.booking.time.split(':');
  const start = `${y}${m}${d}T${h}${min}00`;
  const endDate = new Date(parseInt(y), parseInt(m)-1, parseInt(d), parseInt(h), parseInt(min) + (state.service?.duration || 60));
  const end = `${endDate.getFullYear()}${String(endDate.getMonth()+1).padStart(2,'0')}${String(endDate.getDate()).padStart(2,'0')}T${String(endDate.getHours()).padStart(2,'0')}${String(endDate.getMinutes()).padStart(2,'0')}00`;

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(state.booking.service + ' 예약')}&dates=${start}/${end}&details=${encodeURIComponent('예약번호: ' + state.booking.id + '\n골목길 팔란티어 예약 시스템')}`;
  window.open(url, '_blank');
}

// ── 로딩 토글 ──
function setLoading(show, text = '') {
  loadingOverlay.classList.toggle('active', show);
  if (text) loadingText.textContent = text;
}

// ── 토스트 ──
let toastTimeout;
function showToast(msg, type = '') {
  let toast = document.querySelector('.bk-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'bk-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `bk-toast ${type}`;
  clearTimeout(toastTimeout);
  requestAnimationFrame(() => {
    toast.classList.add('show');
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
  });
}

// ── 유틸 ──
function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function formatDateKo(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const days = ['일','월','화','수','목','금','토'];
  const dow = days[new Date(parseInt(y), parseInt(m)-1, parseInt(d)).getDay()];
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일 (${dow})`;
}

function formatDuration(min) {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── 폰 번호 자동 하이픈 ──
document.addEventListener('DOMContentLoaded', () => {
  const phoneInput = document.getElementById('fieldPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      let v = phoneInput.value.replace(/\D/g, '');
      if (v.length <= 10) {
        v = v.replace(/(\d{3})(\d{3,4})(\d{0,4})/, (_, a,b,c) => c ? `${a}-${b}-${c}` : b ? `${a}-${b}` : a);
      } else {
        v = v.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
      }
      phoneInput.value = v;
    });
  }
  init();
});
