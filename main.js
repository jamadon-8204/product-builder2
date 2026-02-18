// =====================================================
//  테트리스 게임
// =====================================================

const COLS  = 10;
const ROWS  = 20;
const BLOCK = 30;

// 단계별 설정: lines = 이 단계에서 클리어해야 할 줄 수
const STAGES = [
  { lines: 10, speed: 800 },  // 1단계
  { lines:  5, speed: 620 },  // 2단계
  { lines:  5, speed: 450 },  // 3단계
  { lines:  5, speed: 300 },  // 4단계
  { lines:  5, speed: 180 },  // 5단계
];

// 7가지 테트로미노
const PIECES = [
  { shape: [[1,1,1,1]],           color: '#00f5ff' }, // I
  { shape: [[1,1],[1,1]],         color: '#ffd700' }, // O
  { shape: [[0,1,0],[1,1,1]],     color: '#bf5fff' }, // T
  { shape: [[0,1,1],[1,1,0]],     color: '#39e600' }, // S
  { shape: [[1,1,0],[0,1,1]],     color: '#ff4444' }, // Z
  { shape: [[1,0,0],[1,1,1]],     color: '#4d9fff' }, // J
  { shape: [[0,0,1],[1,1,1]],     color: '#ff9933' }, // L
];

// ── Canvas 초기화 ─────────────────────────────────
const canvas  = document.getElementById('canvas');
const ctx     = canvas.getContext('2d');
const nextCvs = document.getElementById('next-canvas');
const nextCtx = nextCvs.getContext('2d');

canvas.width  = COLS  * BLOCK;
canvas.height = ROWS  * BLOCK;
nextCvs.width  = 4 * BLOCK;
nextCvs.height = 4 * BLOCK;

// ── 게임 상태 ─────────────────────────────────────
let board, cur, nxt;
let score, stage, stageLines, totalLines;
let running, raf, lastT, dropAcc;
let flashText, flashAlpha;

// ── 보드 / 피스 유틸 ──────────────────────────────
function newBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// 랜덤 피스 정의(모양+색) 반환
function randDef() {
  const p = PIECES[Math.floor(Math.random() * PIECES.length)];
  return { shape: p.shape.map(r => [...r]), color: p.color };
}

// 피스 정의 → 위치 포함 라이브 피스
function spawn(def) {
  return {
    shape: def.shape.map(r => [...r]),
    color: def.color,
    x: Math.floor(COLS / 2) - Math.ceil(def.shape[0].length / 2),
    y: 0,
  };
}

// 시계 방향 90° 회전
function rotate90(shape) {
  return shape[0].map((_, c) => shape.map(r => r[c]).reverse());
}

// 충돌 검사 (dx, dy 이동 + 옵셔널 새 shape)
function fits(piece, dx = 0, dy = 0, shape = piece.shape) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = piece.x + c + dx;
      const ny = piece.y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
      if (ny >= 0 && board[ny][nx]) return false;
    }
  }
  return true;
}

// ── 게임 로직 ─────────────────────────────────────

// 현재 피스를 보드에 고정
function lock() {
  for (let r = 0; r < cur.shape.length; r++) {
    for (let c = 0; c < cur.shape[r].length; c++) {
      if (!cur.shape[r][c]) continue;
      const row = cur.y + r;
      if (row < 0) { triggerGameOver(); return; }
      board[row][cur.x + c] = cur.color;
    }
  }

  const cleared = sweepLines();

  if (cleared > 0) {
    // 점수: 줄 수에 따른 기본점 × 단계 배율
    const base = [0, 100, 300, 500, 800][Math.min(cleared, 4)];
    score      += base * (stage + 1);
    stageLines += cleared;
    totalLines += cleared;

    // 단계 클리어 체크
    if (stageLines >= STAGES[stage].lines) {
      const overflow = stageLines - STAGES[stage].lines;

      if (stage === STAGES.length - 1) {
        // 마지막 단계 클리어 → 게임 클리어
        spawnNext();
        render();
        triggerClear();
        return;
      }

      // 다음 단계로
      stage++;
      stageLines = overflow;
      setFlash('STAGE ' + (stage + 1));
    }
  }

  spawnNext();
}

// 꽉 찬 줄 제거, 제거한 줄 수 반환
function sweepLines() {
  let n = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(cell => cell !== 0)) {
      board.splice(r, 1);
      board.unshift(Array(COLS).fill(0));
      n++;
      r++; // 같은 인덱스 재검사
    }
  }
  return n;
}

// 다음 피스 등장
function spawnNext() {
  cur = spawn(nxt);
  nxt = randDef();
  if (!fits(cur)) triggerGameOver();
}

// 소프트 드롭 한 칸
function softDrop() {
  if (fits(cur, 0, 1)) {
    cur.y++;
    score++;
    dropAcc = 0;
  } else {
    lock();
  }
}

// 고스트(착지 예상 위치) Y 좌표
function ghostY() {
  let y = cur.y;
  while (fits(cur, 0, y - cur.y + 1)) y++;
  return y;
}

// 하드 드롭
function hardDrop() {
  const gy = ghostY();
  score += (gy - cur.y) * 2;
  cur.y = gy;
  lock();
}

// 벽킥 포함 회전 시도
function tryRotate() {
  const rot = rotate90(cur.shape);
  for (const kick of [0, -1, 1, -2, 2]) {
    if (fits(cur, kick, 0, rot)) {
      cur.x += kick;
      cur.shape = rot;
      return;
    }
  }
}

// ── 렌더링 ────────────────────────────────────────

function drawBlock(c, x, y, color, size = BLOCK) {
  c.fillStyle = color;
  c.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  // 하이라이트 (상단/좌측)
  c.fillStyle = 'rgba(255,255,255,0.22)';
  c.fillRect(x * size + 1, y * size + 1, size - 2, 3);
  c.fillRect(x * size + 1, y * size + 1, 3, size - 2);
  // 그림자 (하단)
  c.fillStyle = 'rgba(0,0,0,0.22)';
  c.fillRect(x * size + 1, y * size + size - 4, size - 2, 3);
}

function render() {
  // ── 메인 캔버스 ──
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 격자선
  ctx.strokeStyle = '#161d27';
  ctx.lineWidth = 0.5;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      ctx.strokeRect(c * BLOCK, r * BLOCK, BLOCK, BLOCK);

  // 고정된 블록
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (board[r][c]) drawBlock(ctx, c, r, board[r][c]);

  // 현재 피스 + 고스트
  if (cur) {
    const gy = ghostY();

    // 고스트 (반투명)
    if (gy !== cur.y) {
      ctx.globalAlpha = 0.28;
      for (let r = 0; r < cur.shape.length; r++)
        for (let c = 0; c < cur.shape[r].length; c++)
          if (cur.shape[r][c])
            drawBlock(ctx, cur.x + c, gy + r, cur.color);
      ctx.globalAlpha = 1;
    }

    // 현재 피스
    for (let r = 0; r < cur.shape.length; r++)
      for (let c = 0; c < cur.shape[r].length; c++)
        if (cur.shape[r][c])
          drawBlock(ctx, cur.x + c, cur.y + r, cur.color);
  }

  // 단계 전환 플래시 메시지
  if (flashAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, flashAlpha);
    ctx.fillStyle = '#ffd700';
    ctx.font = `bold ${Math.floor(BLOCK * 1.5)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // 텍스트 배경
    const tw = ctx.measureText(flashText).width;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(canvas.width / 2 - tw / 2 - 14, canvas.height / 2 - 26, tw + 28, 52);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(flashText, canvas.width / 2, canvas.height / 2);
    ctx.restore();
    flashAlpha -= 0.022;
  }

  // ── 다음 피스 캔버스 ──
  nextCtx.fillStyle = '#0d1117';
  nextCtx.fillRect(0, 0, nextCvs.width, nextCvs.height);
  if (nxt) {
    const ox = Math.floor((4 - nxt.shape[0].length) / 2);
    const oy = Math.floor((4 - nxt.shape.length)    / 2);
    for (let r = 0; r < nxt.shape.length; r++)
      for (let c = 0; c < nxt.shape[r].length; c++)
        if (nxt.shape[r][c])
          drawBlock(nextCtx, ox + c, oy + r, nxt.color);
  }

  // ── UI 텍스트 업데이트 ──
  document.getElementById('ui-score').textContent = score.toLocaleString();
  document.getElementById('ui-stage').textContent = stage + 1;
  const target = STAGES[stage].lines;
  document.getElementById('ui-lines').textContent = stageLines + ' / ' + target;
  document.getElementById('ui-total').textContent = totalLines;
  document.getElementById('ui-prog').style.width =
    Math.min(100, (stageLines / target) * 100) + '%';
}

function setFlash(text) {
  flashText  = text;
  flashAlpha = 1.0;
}

// ── 게임 루프 ─────────────────────────────────────
function loop(t) {
  if (!running) return;

  const delta = Math.min(t - lastT, 200); // 탭 전환 등으로 큰 점프 방지
  lastT    = t;
  dropAcc += delta;

  if (dropAcc >= STAGES[stage].speed) {
    dropAcc -= STAGES[stage].speed;
    if (fits(cur, 0, 1)) cur.y++;
    else lock();
  }

  render();
  raf = requestAnimationFrame(loop);
}

// ── 키 입력 ───────────────────────────────────────
document.addEventListener('keydown', e => {
  if (!running || !cur) return;

  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      if (fits(cur, -1)) cur.x--;
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (fits(cur, 1)) cur.x++;
      break;
    case 'ArrowDown':
      e.preventDefault();
      softDrop();
      break;
    case 'ArrowUp':
      e.preventDefault();
      tryRotate();
      break;
    case ' ':
      e.preventDefault();
      hardDrop();
      break;
    default: return;
  }
  render();
});

// ── 게임 시작 / 종료 ──────────────────────────────
function startGame() {
  board      = newBoard();
  score      = 0;
  stage      = 0;
  stageLines = 0;
  totalLines = 0;
  dropAcc    = 0;
  flashText  = '';
  flashAlpha = 0;

  cur = spawn(randDef());
  nxt = randDef();

  running = true;
  hideAll();

  lastT = performance.now();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
}

function triggerGameOver() {
  running = false;
  cancelAnimationFrame(raf);
  render();
  document.getElementById('over-score').textContent =
    '점수: ' + score.toLocaleString() + '점';
  document.getElementById('over-stage').textContent =
    '도달 단계: ' + (stage + 1) + '단계';
  show('screen-over');
}

function triggerClear() {
  running = false;
  cancelAnimationFrame(raf);
  document.getElementById('clear-score').textContent =
    '최종 점수: ' + score.toLocaleString() + '점';
  show('screen-clear');
}

function hideAll() {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
}

function show(id) {
  hideAll();
  document.getElementById(id).classList.remove('hidden');
}

// ── 버튼 이벤트 ───────────────────────────────────
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-retry').addEventListener('click', startGame);
document.getElementById('btn-clear-retry').addEventListener('click', startGame);
