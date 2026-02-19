/**
 * POST /api/booking/cancel
 * Body: { id, token }
 * - 예약 취소 처리
 * - 슬롯 해제 (다른 고객이 예약 가능하게)
 * - 취소 확인 이메일 발송
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

async function sendCancellationEmail(env, booking) {
  if (!env.RESEND_API_KEY || !booking.email) return;

  const html = `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Noto Sans KR',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <div style="background:#13131f;border:1px solid #2a2a3e;border-radius:16px;padding:32px;text-align:center;">
      <span style="font-size:28px;color:#7c6aff;">◈</span>
      <h2 style="color:#ffffff;margin:16px 0 8px;">예약이 취소되었습니다</h2>
      <p style="color:#8888aa;margin:0 0 24px;">예약 번호: <strong style="color:#ffffff;">${booking.id}</strong></p>
      <div style="background:#0a0a0f;border:1px solid #2a2a3e;border-radius:8px;padding:16px;text-align:left;margin-bottom:24px;">
        <p style="color:#8888aa;font-size:13px;margin:4px 0;"><strong style="color:#fff;">서비스:</strong> ${booking.serviceName}</p>
        <p style="color:#8888aa;font-size:13px;margin:4px 0;"><strong style="color:#fff;">일시:</strong> ${booking.date} ${booking.time}</p>
      </div>
      <p style="color:#8888aa;font-size:13px;">다음에 또 방문해 주세요. 언제든 새 예약을 하실 수 있습니다.</p>
      <a href="${env.BASE_URL || 'https://palantir.pages.dev'}/booking.html" style="display:inline-block;margin-top:16px;background:#7c6aff;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:13px;font-weight:600;">새 예약하기</a>
    </div>
  </div>
</body>
</html>`;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'palantir@noreply.golmokgil.com',
        to: [booking.email],
        subject: `[팔란티어] 예약 취소 완료 - ${booking.id}`,
        html,
      }),
    });
  } catch {}
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { id, token } = await request.json();

    if (!id || !token) {
      return new Response(JSON.stringify({ error: '예약 ID와 취소 토큰이 필요합니다.' }), {
        status: 400, headers: CORS,
      });
    }

    if (!env.BOOKINGS) {
      return new Response(JSON.stringify({ success: true, message: '예약이 취소되었습니다. (데모 모드)' }), {
        headers: CORS,
      });
    }

    // 예약 조회
    const bookingData = await env.BOOKINGS.get(`booking:${id}`, { type: 'json' });
    if (!bookingData) {
      return new Response(JSON.stringify({ error: '예약을 찾을 수 없습니다.' }), {
        status: 404, headers: CORS,
      });
    }

    // 토큰 검증
    if (bookingData.cancelToken !== token) {
      return new Response(JSON.stringify({ error: '취소 토큰이 올바르지 않습니다.' }), {
        status: 403, headers: CORS,
      });
    }

    // 이미 취소됨?
    if (bookingData.status === 'cancelled') {
      return new Response(JSON.stringify({ error: '이미 취소된 예약입니다.' }), {
        status: 409, headers: CORS,
      });
    }

    // 예약 날짜 확인 (당일 2시간 전 이내면 취소 불가)
    const bookingDateTime = new Date(`${bookingData.date}T${bookingData.time}:00`);
    const now = new Date();
    const hoursUntil = (bookingDateTime - now) / (1000 * 3600);
    if (hoursUntil < 2 && hoursUntil > 0) {
      return new Response(JSON.stringify({
        error: '예약 시간 2시간 전에는 온라인 취소가 불가합니다. 직접 연락해주세요.',
      }), { status: 409, headers: CORS });
    }

    // 슬롯 해제
    const slotsKey = `slots:${bookingData.date}`;
    const bookedSlots = await env.BOOKINGS.get(slotsKey, { type: 'json' }) || {};
    const slotsToRelease = bookingData.slotsBooked || [bookingData.time];
    for (const slot of slotsToRelease) {
      delete bookedSlots[slot];
    }

    // 예약 상태 업데이트
    bookingData.status = 'cancelled';
    bookingData.cancelledAt = new Date().toISOString();

    await Promise.all([
      env.BOOKINGS.put(`booking:${id}`, JSON.stringify(bookingData)),
      Object.keys(bookedSlots).length > 0
        ? env.BOOKINGS.put(slotsKey, JSON.stringify(bookedSlots))
        : env.BOOKINGS.delete(slotsKey),
    ]);

    // 취소 확인 이메일
    await sendCancellationEmail(env, bookingData);

    return new Response(JSON.stringify({
      success: true,
      message: '예약이 취소되었습니다.',
      booking: { id: bookingData.id, date: bookingData.date, time: bookingData.time },
    }), { headers: CORS });

  } catch (err) {
    return new Response(JSON.stringify({ error: '서버 오류가 발생했습니다.' }), {
      status: 500, headers: CORS,
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
