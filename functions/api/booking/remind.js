/**
 * POST /api/booking/remind  (Cloudflare Cron Trigger 또는 수동 호출)
 * 24시간 후 예약에 대해 리마인더 이메일/SMS 발송
 *
 * wrangler.toml에 cron 설정 추가:
 * [triggers]
 * crons = ["0 * * * *"]  # 매 시간 정각에 실행
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

async function sendReminderEmail(env, booking) {
  if (!env.RESEND_API_KEY || !booking.email) return { sent: false };

  const cancelUrl = `${env.BASE_URL || 'https://palantir.pages.dev'}/booking-cancel.html?id=${booking.id}&token=${booking.cancelToken}`;

  const html = `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Noto Sans KR',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <div style="background:#13131f;border:1px solid #2a2a3e;border-radius:16px;padding:32px;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:28px;color:#7c6aff;">◈</span>
        <div style="display:inline-block;margin-left:8px;background:#ffa50022;border:1px solid #ffa50044;border-radius:6px;padding:4px 12px;">
          <span style="color:#ffa500;font-size:12px;font-weight:600;">⏰ 내일 예약 리마인더</span>
        </div>
      </div>
      <h2 style="color:#ffffff;font-size:20px;margin:0 0 8px;">${booking.name}님, 내일 예약이 있습니다!</h2>
      <p style="color:#8888aa;font-size:14px;margin:0 0 24px;">예약 시간을 잊지 마세요.</p>
      <div style="background:#0a0a0f;border:1px solid #2a2a3e;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="color:#8888aa;font-size:13px;margin:6px 0;"><strong style="color:#7c6aff;">서비스</strong> &nbsp; ${booking.serviceName}</p>
        <p style="color:#8888aa;font-size:13px;margin:6px 0;"><strong style="color:#7c6aff;">날짜</strong> &nbsp; ${booking.date}</p>
        <p style="color:#8888aa;font-size:13px;margin:6px 0;"><strong style="color:#7c6aff;">시간</strong> &nbsp; ${booking.time}</p>
        <p style="color:#8888aa;font-size:13px;margin:6px 0;"><strong style="color:#7c6aff;">예약번호</strong> &nbsp; ${booking.id}</p>
      </div>
      <div style="background:#ff446622;border:1px solid #ff446644;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
        <p style="color:#ff8899;font-size:12px;margin:0;">노쇼(무단 불참) 시 향후 예약이 제한될 수 있습니다. 불참 예정이시면 미리 취소해 주세요.</p>
      </div>
      <a href="${cancelUrl}" style="display:inline-block;background:#ff4466;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;">예약 취소하기</a>
    </div>
  </div>
</body>
</html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'palantir@noreply.golmokgil.com',
        to: [booking.email],
        subject: `[팔란티어] ⏰ 내일 ${booking.time} 예약 리마인더 - ${booking.serviceName}`,
        html,
      }),
    });
    return { sent: res.ok };
  } catch (err) {
    return { sent: false, error: err.message };
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // 내부 호출 인증 (cron 또는 관리자)
  const secret = request.headers.get('X-Cron-Secret');
  if (env.CRON_SECRET && secret !== env.CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: CORS,
    });
  }

  if (!env.BOOKINGS) {
    return new Response(JSON.stringify({ message: 'KV not configured, skipping reminders.' }), {
      headers: CORS,
    });
  }

  // 내일 날짜의 예약 목록 조회
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const slotsData = await env.BOOKINGS.get(`slots:${tomorrowStr}`, { type: 'json' });
  if (!slotsData) {
    return new Response(JSON.stringify({ message: `${tomorrowStr} 예약 없음`, sent: 0 }), {
      headers: CORS,
    });
  }

  // 중복 제거 (여러 슬롯에 같은 bookingId)
  const uniqueBookingIds = [...new Set(Object.values(slotsData))];
  let sentCount = 0;
  const results = [];

  for (const bookingId of uniqueBookingIds) {
    const booking = await env.BOOKINGS.get(`booking:${bookingId}`, { type: 'json' });
    if (!booking || booking.status !== 'confirmed' || booking.reminderSent) continue;

    const result = await sendReminderEmail(env, booking);
    if (result.sent) {
      booking.reminderSent = true;
      await env.BOOKINGS.put(`booking:${bookingId}`, JSON.stringify(booking));
      sentCount++;
    }
    results.push({ id: bookingId, ...result });
  }

  return new Response(JSON.stringify({
    date: tomorrowStr,
    processed: uniqueBookingIds.length,
    sent: sentCount,
    results,
  }), { headers: CORS });
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

// Cloudflare Cron Trigger 핸들러 (Workers 전용)
export async function scheduled(event, env, ctx) {
  const fakeRequest = new Request('https://internal/remind', {
    method: 'POST',
    headers: { 'X-Cron-Secret': env.CRON_SECRET || '' },
  });
  await onRequestPost({ request: fakeRequest, env });
}
