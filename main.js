// =====================================================
//  SILVERMINT - 귀금속 직구몰
// =====================================================

// ── 시세 데이터 (시뮬레이션) ──────────────────────
const spot = { ag: 30.15, au: 2652.40, rate: 1382.5 };

function tickSpot() {
  spot.ag   += (Math.random() - 0.5) * 0.06;
  spot.au   += (Math.random() - 0.5) * 3.0;
  spot.rate += (Math.random() - 0.5) * 0.8;
  spot.ag   = Math.max(28, Math.min(35, spot.ag));
  spot.au   = Math.max(2500, Math.min(2900, spot.au));
  spot.rate = Math.max(1340, Math.min(1420, spot.rate));
  renderSpot();
  updateAllPrices();
}

function renderSpot() {
  const now = new Date();
  const t = now.toLocaleTimeString('ko-KR');

  setText('p-ag',     spot.ag.toFixed(2));
  setText('p-ag-krw', '(' + Math.round(spot.ag * spot.rate).toLocaleString() + '원)');
  setText('p-au',     spot.au.toFixed(2));
  setText('p-rate',   spot.rate.toFixed(1));
  setText('p-time',   '시세 기준: ' + t);
}

// ── 상품 데이터 ────────────────────────────────────
// premium: 현물가 대비 달러 프리미엄 / weight: troy oz
const PRODUCTS = [
  {
    id: 1, cat: 'silver',
    emoji: '🍁', isGold: false,
    img: 'pp-5515-1.avif', img2: 'pp-5515-2.avif',
    badge: 'NEW',
    name: '캐나다 메이플 은화 1oz 2025',
    nameEn: 'Canadian Silver Maple Leaf 1oz 2025',
    purity: '99.99%', mint: '캐나다 왕립조폐국',
    weight: 1, weightLabel: '1 Troy oz (31.1g)',
    premium: 4.50,
    stock: 48,
    desc: '세계에서 가장 인기 있는 은화 중 하나. 엘리자베스 2세 여왕 초상과 캐나다의 상징인 메이플 리프(단풍잎)가 정교하게 새겨져 있습니다. 캐나다 왕립조폐국(Royal Canadian Mint)이 발행하는 공식 법화로, 순도 99.99%를 보증합니다.',
  },
  {
    id: 2, cat: 'silver',
    emoji: '🍁', isGold: false,
    img: 'pp-5515-1.avif', img2: 'pp-5515-2.avif',
    badge: 'BEST',
    name: '캐나다 메이플 은화 1oz (랜덤연도)',
    nameEn: 'Canadian Silver Maple Leaf 1oz (Random Year)',
    purity: '99.99%', mint: '캐나다 왕립조폐국',
    weight: 1, weightLabel: '1 Troy oz (31.1g)',
    premium: 2.80,
    stock: 200,
    desc: '연도 랜덤 발송 상품으로 프리미엄 없이 합리적인 가격에 정품 캐나다 메이플 은화를 구매할 수 있습니다. 은 투자 입문에 적합한 상품입니다.',
  },
  {
    id: 3, cat: 'silver',
    emoji: '🍁', isGold: false,
    img: 'pp-5515-1.avif', img2: 'pp-5515-2.avif',
    badge: null,
    name: '캐나다 메이플 은화 10oz 2024',
    nameEn: 'Canadian Silver Maple Leaf 10oz 2024',
    purity: '99.99%', mint: '캐나다 왕립조폐국',
    weight: 10, weightLabel: '10 Troy oz (311g)',
    premium: 28.0,
    stock: 12,
    desc: '10온스 대형 은화로 투자 효율이 높습니다. 1온스 대비 낮은 프리미엄으로 대량 은 투자에 최적화된 상품입니다.',
  },
  {
    id: 4, cat: 'silver',
    emoji: '🦅', isGold: false,
    badge: 'NEW',
    name: '아메리카 이글 은화 1oz 2025',
    nameEn: 'American Silver Eagle 1oz 2025',
    purity: '99.9%', mint: '미국 조폐국',
    weight: 1, weightLabel: '1 Troy oz (31.1g)',
    premium: 6.50,
    stock: 35,
    desc: '미국 조폐국(US Mint)이 발행하는 공식 은화. 자유의 여신상과 대머리독수리가 새겨진 전통적인 디자인으로 전 세계 투자자들에게 사랑받는 은화입니다.',
  },
  {
    id: 5, cat: 'silver',
    emoji: '🎵', isGold: false,
    badge: null,
    name: '오스트리아 빈 하모닉 은화 1oz 2024',
    nameEn: 'Austrian Silver Vienna Philharmonic 1oz 2024',
    purity: '99.9%', mint: '오스트리아 조폐국',
    weight: 1, weightLabel: '1 Troy oz (31.1g)',
    premium: 5.20,
    stock: 28,
    desc: '오스트리아 조폐국(Münze Österreich)이 발행하는 유럽 최고 인기 은화. 빈 필하모닉 오케스트라의 악기들이 섬세하게 새겨진 예술적인 디자인이 특징입니다.',
  },
  {
    id: 6, cat: 'silver',
    emoji: '🦘', isGold: false,
    badge: null,
    name: '오스트레일리아 캥거루 은화 1oz 2024',
    nameEn: 'Australian Silver Kangaroo 1oz 2024',
    purity: '99.99%', mint: '퍼스 조폐국',
    weight: 1, weightLabel: '1 Troy oz (31.1g)',
    premium: 4.80,
    stock: 22,
    desc: '호주 퍼스 조폐국(Perth Mint)이 발행. 매년 디자인이 변경되는 캥거루 은화로 수집 가치도 높습니다.',
  },
  {
    id: 7, cat: 'silver',
    emoji: '🍁', isGold: false,
    badge: 'PRESALE',
    name: '캐나다 메이플 은화 1oz 2025 (밀크스팟 없음)',
    nameEn: 'Canadian Silver Maple Leaf 1oz 2025 (No Milk Spot)',
    purity: '99.99%', mint: '캐나다 왕립조폐국',
    weight: 1, weightLabel: '1 Troy oz (31.1g)',
    premium: 7.00,
    stock: 0,
    desc: '밀크스팟(유백색 반점) 없음을 보증하는 특별 선별 상품. 수집 목적으로 완벽한 상태를 원하는 분께 추천합니다. 사전예약 후 재고 확보 시 발송됩니다.',
  },
  {
    id: 8, cat: 'gold',
    emoji: '🍁', isGold: true,
    badge: 'NEW',
    name: '캐나다 메이플 금화 1/10oz 2025',
    nameEn: 'Canadian Gold Maple Leaf 1/10oz 2025',
    purity: '99.99%', mint: '캐나다 왕립조폐국',
    weight: 0.1, weightLabel: '1/10 Troy oz (3.11g)',
    premium: 18.0,
    stock: 20,
    desc: '소액 투자에 적합한 1/10온스 금화. 순도 99.99% 캐나다 메이플 금화의 소형 버전으로, 부담 없이 금 투자를 시작할 수 있습니다.',
  },
  {
    id: 9, cat: 'gold',
    emoji: '🍁', isGold: true,
    badge: null,
    name: '캐나다 메이플 금화 1/4oz 2024',
    nameEn: 'Canadian Gold Maple Leaf 1/4oz 2024',
    purity: '99.99%', mint: '캐나다 왕립조폐국',
    weight: 0.25, weightLabel: '1/4 Troy oz (7.78g)',
    premium: 32.0,
    stock: 15,
    desc: '중소액 금 투자에 최적화된 1/4온스 금화. 전 세계 어디서나 통용되는 캐나다 왕립조폐국 발행 공식 법화입니다.',
  },
  {
    id: 10, cat: 'supply',
    emoji: '🔵', isGold: false,
    badge: null,
    name: '에어타이트 캡슐 1oz 은화용 (10개)',
    nameEn: 'Airtight Capsule for 1oz Silver (10pcs)',
    purity: null, mint: null,
    weight: 0, weightLabel: null,
    premium: 0, fixedKRW: 8500,
    stock: 999,
    desc: '1온스 은화 보관용 에어타이트 캡슐. 산화와 밀크스팟 예방에 효과적. 내경 40mm, 투명 아크릴 소재.',
  },
  {
    id: 11, cat: 'supply',
    emoji: '📦', isGold: false,
    badge: null,
    name: '은화 보관 앨범 (20장)',
    nameEn: 'Silver Coin Album (20 slots)',
    purity: null, mint: null,
    weight: 0, weightLabel: null,
    premium: 0, fixedKRW: 12000,
    stock: 50,
    desc: '1온스 은화 20매 보관 앨범. PVC-free 소재로 동전 표면을 보호합니다.',
  },
];

// ── 가격 계산 ──────────────────────────────────────
function calcKRW(product) {
  if (product.fixedKRW) return product.fixedKRW;
  const base = product.isGold ? spot.au : spot.ag;
  const usd  = base * product.weight + product.premium;
  return Math.round(usd * spot.rate / 100) * 100; // 100원 단위 반올림
}

function spotLabel(product) {
  if (product.fixedKRW) return '';
  const metal = product.isGold ? 'Au' : 'Ag';
  const base  = product.isGold ? spot.au : spot.ag;
  return metal + ' $' + base.toFixed(2) + '/oz + 프리미엄 $' + product.premium.toFixed(2);
}

function updateAllPrices() {
  document.querySelectorAll('[data-pid]').forEach(el => {
    const pid = parseInt(el.dataset.pid);
    const p   = PRODUCTS.find(x => x.id === pid);
    if (!p) return;
    const priceEl = el.querySelector('.card-price');
    const spotEl  = el.querySelector('.card-spot');
    if (priceEl) priceEl.textContent = calcKRW(p).toLocaleString() + '원';
    if (spotEl && !p.fixedKRW)
      spotEl.textContent = (p.isGold ? 'Au' : 'Ag') + ' $' + (p.isGold ? spot.au : spot.ag).toFixed(2);
  });
}

// ── 상품 그리드 렌더 ────────────────────────────────
let currentCat = 'all';

function renderGrid(cat) {
  currentCat = cat;
  const grid = document.getElementById('product-grid');
  const list = cat === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === cat);
  const titles = { all:'전체 상품', silver:'은화', gold:'금화', supply:'용품', presale:'예약구매' };
  setText('shop-title', titles[cat] || '전체 상품');

  grid.innerHTML = list.map(p => {
    const price    = calcKRW(p);
    const spotTxt  = !p.fixedKRW ? `<span class="card-spot">${p.isGold?'Au':'Ag'} $${(p.isGold?spot.au:spot.ag).toFixed(2)}</span>` : '';
    const badge    = p.badge ? `<span class="card-badge badge-${p.badge.toLowerCase().replace(' ','')}">${p.badge}</span>` : '';
    const stockTxt = p.stock === 0 ? '<span style="color:#e03131;font-size:.78rem;font-weight:600">품절</span>' : '';
    const addBtn   = p.stock > 0
      ? `<button class="card-add" onclick="event.stopPropagation();addToCart(${p.id})">장바구니 담기</button>`
      : `<button class="card-add" disabled style="opacity:.4;cursor:not-allowed">품절</button>`;
    const weightTxt = p.weightLabel ? `<div class="card-weight">${p.weightLabel}</div>` : '';
    const imgEl = p.img
      ? `<img class="card-coin-img" src="${p.img}" alt="${p.name}">`
      : `<div class="coin-thumb${p.isGold?' gold':''}">${p.emoji}</div>`;

    return `
    <div class="product-card" data-pid="${p.id}" onclick="openProduct(${p.id})">
      <div class="card-img">
        ${imgEl}
        ${badge}
      </div>
      <div class="card-body">
        <div class="card-cat">${catLabel(p.cat)}</div>
        <div class="card-name">${p.name}</div>
        <div class="card-price-row">
          <span class="card-price">${price.toLocaleString()}원</span>
          ${spotTxt}
        </div>
        ${weightTxt}
        ${stockTxt}
        ${addBtn}
      </div>
    </div>`;
  }).join('');
}

function catLabel(cat) {
  return { silver:'은화 · SILVER', gold:'금화 · GOLD', supply:'용품 · SUPPLY', presale:'예약구매' }[cat] || cat;
}

// ── 카테고리 필터 ───────────────────────────────────
function filterCat(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderGrid(cat);
}

function navClick(el, cat) {
  document.querySelectorAll('.nav-a').forEach(a => a.classList.remove('active'));
  el.classList.add('active');
  filterCat(cat);
}

// ── 상품 상세 모달 ──────────────────────────────────
let modalQty = 1;
let modalProduct = null;

function openProduct(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  modalProduct = p;
  modalQty = 1;

  const price = calcKRW(p);
  const imgBlock = p.img ? `
    <div class="pm-img-wrap">
      <img class="pm-photo" id="pm-photo" src="${p.img}" alt="${p.name}">
      ${p.img2 ? `
      <div class="pm-img-tabs">
        <button class="pm-itab active" onclick="switchCoinImg('${p.img}',this)">앞면</button>
        <button class="pm-itab" onclick="switchCoinImg('${p.img2}',this)">뒷면</button>
      </div>` : ''}
    </div>` : `<div class="pm-coin${p.isGold?' gold':''}">${p.emoji}</div>`;

  document.getElementById('product-modal-body').innerHTML = `
    <div class="pm-grid">
      <div>${imgBlock}</div>
      <div class="pm-info">
        <div class="pm-cat">${catLabel(p.cat)}</div>
        <h2>${p.name}</h2>
        <p class="pm-sub">${p.nameEn}</p>
        <div class="pm-price-big" id="pm-price">${price.toLocaleString()}원</div>
        ${!p.fixedKRW ? `<div class="pm-spot">${spotLabel(p)}</div>` : ''}
        <div class="pm-spec">
          ${p.purity   ? `<div class="pm-spec-row"><span>순도</span><span>${p.purity}</span></div>` : ''}
          ${p.weightLabel ? `<div class="pm-spec-row"><span>중량</span><span>${p.weightLabel}</span></div>` : ''}
          ${p.mint     ? `<div class="pm-spec-row"><span>발행처</span><span>${p.mint}</span></div>` : ''}
          <div class="pm-spec-row"><span>재고</span><span>${p.stock > 0 ? p.stock + '개' : '품절'}</span></div>
        </div>
        ${p.stock > 0 ? `
        <div class="pm-qty-row">
          <label>수량</label>
          <div class="pm-qty-ctrl">
            <button onclick="changeQty(-1)">−</button>
            <span class="pm-qty-num" id="pm-qty">1</span>
            <button onclick="changeQty(1)">＋</button>
          </div>
        </div>
        <button class="btn-addcart" onclick="addToCartQty()">장바구니 담기</button>
        ` : '<button class="btn-addcart" disabled style="opacity:.4;cursor:not-allowed">품절</button>'}
      </div>
      <div class="pm-desc">
        <h4>상품 설명</h4>
        <p>${p.desc}</p>
        ${p.purity ? `
        <p style="margin-top:12px;font-size:.8rem;color:var(--muted)">
          ※ 귀금속 가격은 국제 시세(은 $${spot.ag.toFixed(2)}/oz, USD/KRW ${spot.rate.toFixed(1)})를 기준으로 실시간 변동됩니다.<br>
          ※ 주문 확정 시 해당 시점의 시세로 최종 금액이 결정됩니다.
        </p>` : ''}
      </div>
    </div>`;

  show('pdim');
  show('product-modal');
}

function changeQty(d) {
  modalQty = Math.max(1, modalQty + d);
  setText('pm-qty', modalQty);
  if (modalProduct) {
    const total = calcKRW(modalProduct) * modalQty;
    setText('pm-price', total.toLocaleString() + '원');
  }
}

function addToCartQty() {
  if (!modalProduct) return;
  for (let i = 0; i < modalQty; i++) addToCart(modalProduct.id, true);
  closeProduct();
  openCart();
}

function switchCoinImg(src, btn) {
  document.getElementById('pm-photo').src = src;
  document.querySelectorAll('.pm-itab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function closeProduct() {
  hide('pdim');
  hide('product-modal');
}

// ── 장바구니 ────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('sm_cart') || '[]');

function saveCart() {
  localStorage.setItem('sm_cart', JSON.stringify(cart));
}

function addToCart(id, silent = false) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p || p.stock === 0) return;
  const item = cart.find(c => c.id === id);
  if (item) item.qty++;
  else cart.push({ id, qty: 1 });
  saveCart();
  renderCart();
  if (!silent) flashCartBadge();
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
  renderCart();
}

function changeCartQty(id, d) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty = Math.max(1, item.qty + d);
  saveCart();
  renderCart();
}

function renderCart() {
  const count = cart.reduce((s, c) => s + c.qty, 0);
  const countEl = document.getElementById('cart-count');
  countEl.textContent = count;
  countEl.classList.toggle('hidden', count === 0);

  const itemsEl = document.getElementById('cart-item-list');
  const emptyEl = document.getElementById('cart-empty');
  const footEl  = document.getElementById('cp-foot');

  if (cart.length === 0) {
    emptyEl.style.display = 'block';
    itemsEl.innerHTML = '';
    footEl.style.display = 'none';
    return;
  }
  emptyEl.style.display = 'none';
  footEl.style.display = 'block';

  itemsEl.innerHTML = cart.map(c => {
    const p     = PRODUCTS.find(x => x.id === c.id);
    if (!p) return '';
    const price = calcKRW(p);
    return `
    <div class="cart-item">
      <div class="ci-thumb${p.isGold?' gold':''}">${p.emoji}</div>
      <div class="ci-info">
        <div class="ci-name">${p.name}</div>
        <div class="ci-price">${(price * c.qty).toLocaleString()}원</div>
        <div class="ci-qty">
          <button class="qty-btn" onclick="changeCartQty(${p.id},-1)">−</button>
          <span class="qty-num">${c.qty}</span>
          <button class="qty-btn" onclick="changeCartQty(${p.id},1)">＋</button>
        </div>
      </div>
      <button class="ci-del" onclick="removeFromCart(${p.id})">✕</button>
    </div>`;
  }).join('');

  const subtotal = cart.reduce((s, c) => {
    const p = PRODUCTS.find(x => x.id === c.id);
    return s + (p ? calcKRW(p) * c.qty : 0);
  }, 0);
  const ship  = subtotal >= 50000 ? 0 : 3000;
  const total = subtotal + ship;

  setText('cp-subtotal', subtotal.toLocaleString() + '원');
  setText('cp-ship', ship === 0 ? '무료' : ship.toLocaleString() + '원');
  setText('cp-total', total.toLocaleString() + '원');
}

function flashCartBadge() {
  const el = document.getElementById('btn-cart');
  el.style.transform = 'scale(1.15)';
  setTimeout(() => el.style.transform = '', 200);
}

function openCart() {
  renderCart();
  show('cart-dimmer');
  document.getElementById('cart-panel').classList.add('open');
}

function closeCart() {
  hide('cart-dimmer');
  document.getElementById('cart-panel').classList.remove('open');
}

// ── 주문 ────────────────────────────────────────────
function goOrder() {
  closeCart();
  const subtotal = cart.reduce((s, c) => {
    const p = PRODUCTS.find(x => x.id === c.id);
    return s + (p ? calcKRW(p) * c.qty : 0);
  }, 0);
  const ship  = subtotal >= 50000 ? 0 : 3000;
  const total = subtotal + ship;

  const rows = cart.map(c => {
    const p = PRODUCTS.find(x => x.id === c.id);
    if (!p) return '';
    return `<div class="order-row"><span>${p.name} ×${c.qty}</span><span>${(calcKRW(p)*c.qty).toLocaleString()}원</span></div>`;
  }).join('');

  document.getElementById('order-summary').innerHTML = `
    ${rows}
    <div class="order-row"><span>배송비</span><span>${ship === 0 ? '무료' : ship.toLocaleString() + '원'}</span></div>
    <div class="order-total-row"><span>결제 금액</span><span>${total.toLocaleString()}원</span></div>`;

  show('odim');
  show('order-modal');
}

function closeOrder() {
  hide('odim');
  hide('order-modal');
}

// ── 로그인 ──────────────────────────────────────────
function openLogin() {
  show('ldim');
  show('login-modal');
}

function closeLogin() {
  hide('ldim');
  hide('login-modal');
}

function switchLoginTab(tab) {
  document.getElementById('login-form').style.display  = tab === 'login'  ? 'block' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? 'block' : 'none';
  document.getElementById('ltab-login').classList.toggle('active', tab === 'login');
  document.getElementById('ltab-signup').classList.toggle('active', tab === 'signup');
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeProduct(); closeLogin(); closeOrder(); closeCart();
  }
});

// ── 유틸 ────────────────────────────────────────────
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function show(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'block';
  requestAnimationFrame(() => el.classList.add('show'));
}

function hide(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('show');
}

// ── 초기화 ──────────────────────────────────────────
renderSpot();
renderGrid('all');
renderCart();
setInterval(tickSpot, 4000); // 4초마다 시세 갱신
