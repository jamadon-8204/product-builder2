/**
 * GET /api/booking/slots?date=YYYY-MM-DD&duration=60
 * Returns all time slots with available/booked status.
 * Uses Cloudflare KV (BOOKINGS) to check real bookings.
 */

const ALL_SLOTS = [
  '09:00','10:00','11:00','12:00','13:00',
  '14:00','15:00','16:00','17:00','18:00',
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const duration = parseInt(url.searchParams.get('duration') || '60', 10);

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Response(JSON.stringify({ error: 'date 파라미터가 필요합니다 (YYYY-MM-DD)' }), {
      status: 400, headers: CORS,
    });
  }

  const today = new Date().toISOString().split('T')[0];
  const isPast = date < today;

  // KV에서 해당 날짜 예약된 슬롯 가져오기
  let bookedSlots = {};
  if (env.BOOKINGS) {
    const data = await env.BOOKINGS.get(`slots:${date}`, { type: 'json' });
    if (data) bookedSlots = data;
  }

  // 서비스 duration에 따라 연속 슬롯 차단
  const slotsNeeded = Math.ceil(duration / 60);
  const slotStatus = ALL_SLOTS.map((time, idx) => {
    if (isPast) return { time, available: false, reason: 'past' };

    // 이 슬롯 자체가 예약됨?
    if (bookedSlots[time]) return { time, available: false, reason: 'booked' };

    // 이 슬롯부터 slotsNeeded개가 연속으로 비어있는지 확인
    for (let i = 0; i < slotsNeeded; i++) {
      const checkSlot = ALL_SLOTS[idx + i];
      if (!checkSlot || bookedSlots[checkSlot]) {
        return { time, available: false, reason: 'insufficient_consecutive' };
      }
    }

    return { time, available: true };
  });

  return new Response(JSON.stringify({ date, slots: slotStatus, duration }), {
    headers: CORS,
  });
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
