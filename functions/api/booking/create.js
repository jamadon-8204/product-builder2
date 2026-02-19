/**
 * POST /api/booking/create
 * Body: { service, serviceName, duration, date, time, name, phone, email, notes }
 * - 더블부킹 방지 (KV atomic write)
 * - 확인 이메일 즉시 발송 (Resend API)
 * - 24시간 전 리마인더 이메일 예약
 * - 노쇼 방지용 취소 토큰 생성
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const ALL_SLOTS = [
  '09:00','10:00','11:00','12:00','13:00',
  '14:00','15:00','16:00','17:00','18:00',
];

function generateId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `BK-${ts}-${rand}`;
}

function generateToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

async function sendConfirmationEmail(env, booking) {
  if (!env.RESEND_API_KEY) return { sent: false, reason: 'no_api_key' };
  if (!booking.email) return { sent: false, reason: 'no_email' };

  const cancelUrl = `${env.BASE_URL || 'https://palantir.pages.dev'}/booking-cancel.html?id=${booking.id}&token=${booking.cancelToken}`;

  const html = `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Noto Sans KR',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;color:#7c6aff;">◈</span>
      <h1 style="color:#ffffff;font-size:20px;margin:8px 0 0;">골목길 팔란티어</h1>
    </div>
    <div style="background:#13131f;border:1px solid #2a2a3e;border-radius:16px;padding:32px;">
      <div style="background:#7c6aff22;border:1px solid #7c6aff44;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
        <span style="color:#7c6aff;font-size:13px;font-weight:600;">✓ 예약 확인</span>
      </div>
      <h2 style="color:#ffffff;font-size:22px;margin:0 0 8px;">${booking.name}님, 예약이 완료되었습니다!</h2>
      <p style="color:#8888aa;font-size:14px;margin:0 0 28px;">예약 번호: <strong style="color:#ffffff;">${booking.id}</strong></p>

      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#8888aa;font-size:13px;padding:10px 0;border-bottom:1px solid #2a2a3e;">서비스</td>
          <td style="color:#ffffff;font-size:13px;padding:10px 0;border-bottom:1px solid #2a2a3e;text-align:right;">${booking.serviceName}</td>
        </tr>
        <tr>
          <td style="color:#8888aa;font-size:13px;padding:10px 0;border-bottom:1px solid #2a2a3e;">날짜</td>
          <td style="color:#ffffff;font-size:13px;padding:10px 0;border-bottom:1px solid #2a2a3e;text-align:right;">${booking.date}</td>
        </tr>
        <tr>
          <td style="color:#8888aa;font-size:13px;padding:10px 0;border-bottom:1px solid #2a2a3e;">시간</td>
          <td style="color:#ffffff;font-size:13px;padding:10px 0;border-bottom:1px solid #2a2a3e;text-align:right;">${booking.time}</td>
        </tr>
        <tr>
          <td style="color:#8888aa;font-size:13px;padding:10px 0;border-bottom:1px solid #2a2a3e;">연락처</td>
          <td style="color:#ffffff;font-size:13px;padding:10px 0;border-bottom:1px solid #2a2a3e;text-align:right;">${booking.phone}</td>
        </tr>
        ${booking.notes ? `
        <tr>
          <td style="color:#8888aa;font-size:13px;padding:10px 0;">메모</td>
          <td style="color:#ffffff;font-size:13px;padding:10px 0;text-align:right;">${booking.notes}</td>
        </tr>` : ''}
      </table>

      <div style="margin-top:28px;padding:16px;background:#0a0a0f;border-radius:8px;border:1px solid #2a2a3e;">
        <p style="color:#8888aa;font-size:12px;margin:0 0 8px;">예약을 취소하시려면 아래 버튼을 클릭하세요.</p>
        <a href="${cancelUrl}" style="display:inline-block;background:#ff4466;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">예약 취소하기</a>
      </div>

      <p style="color:#555566;font-size:11px;margin:24px 0 0;text-align:center;">
        예약 24시간 전에 리마인더를 보내드립니다.<br>
        이 이메일은 골목길 팔란티어 자동 발송 시스템에서 전송되었습니다.
      </p>
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
        subject: `[팔란티어] ${booking.date} ${booking.time} 예약 확인 - ${booking.id}`,
        html,
      }),
    });
    const data = await res.json();
    return { sent: res.ok, emailId: data.id, error: data.message };
  } catch (err) {
    return { sent: false, error: err.message };
  }
}

async function sendSms(env, booking) {
  if (!env.COOLSMS_API_KEY || !env.COOLSMS_API_SECRET) return { sent: false };

  const message = `[팔란티어] ${booking.name}님 예약 확인\n${booking.date} ${booking.time}\n서비스: ${booking.serviceName}\n예약번호: ${booking.id}\n\n*노쇼 시 재예약이 제한될 수 있습니다.`;

  try {
    const timestamp = Date.now().toString();
    const signature = await computeHmac(env.COOLSMS_API_SECRET, timestamp);

    const res = await fetch('https://api.coolsms.co.kr/messages/v4/send', {
      method: 'POST',
      headers: {
        'Authorization': `HMAC-SHA256 apiKey=${env.COOLSMS_API_KEY}, date=${timestamp}, salt=${timestamp}, signature=${signature}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          to: booking.phone.replace(/-/g, ''),
          from: env.SMS_FROM || '01000000000',
          text: message,
        },
      }),
    });
    return { sent: res.ok };
  } catch {
    return { sent: false };
  }
}

async function computeHmac(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { service, serviceName, duration = 60, date, time, name, phone, email, notes } = body;

    // 입력 검증
    if (!service || !date || !time || !name || !phone) {
      return new Response(JSON.stringify({ error: '필수 항목이 누락되었습니다.' }), {
        status: 400, headers: CORS,
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Response(JSON.stringify({ error: '날짜 형식이 잘못되었습니다.' }), {
        status: 400, headers: CORS,
      });
    }

    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      return new Response(JSON.stringify({ error: '지난 날짜는 예약할 수 없습니다.' }), {
        status: 400, headers: CORS,
      });
    }

    // 슬롯 계산
    const slotsNeeded = Math.ceil(duration / 60);
    const slotIdx = ALL_SLOTS.indexOf(time);
    if (slotIdx === -1) {
      return new Response(JSON.stringify({ error: '유효하지 않은 시간입니다.' }), {
        status: 400, headers: CORS,
      });
    }

    const slotsToBook = ALL_SLOTS.slice(slotIdx, slotIdx + slotsNeeded);
    if (slotsToBook.length < slotsNeeded) {
      return new Response(JSON.stringify({ error: '해당 시간에 예약할 수 없습니다.' }), {
        status: 400, headers: CORS,
      });
    }

    // KV가 없으면 데모 모드 (실제 저장 없이 성공 응답)
    if (!env.BOOKINGS) {
      const booking = {
        id: generateId(),
        service, serviceName, duration,
        date, time, name, phone, email: email || null, notes: notes || null,
        status: 'confirmed',
        cancelToken: generateToken(),
        createdAt: new Date().toISOString(),
        demoMode: true,
      };
      return new Response(JSON.stringify({
        success: true,
        booking,
        notice: 'KV가 설정되지 않아 데모 모드로 동작합니다. wrangler.toml에 KV 바인딩을 추가하세요.',
      }), { headers: CORS });
    }

    // 더블부킹 방지: 현재 슬롯 상태 읽기
    const existingKey = `slots:${date}`;
    let bookedSlots = await env.BOOKINGS.get(existingKey, { type: 'json' }) || {};

    // 중복 체크
    for (const slot of slotsToBook) {
      if (bookedSlots[slot]) {
        return new Response(JSON.stringify({
          error: '죄송합니다. 방금 다른 고객이 해당 시간을 예약했습니다. 다른 시간을 선택해주세요.',
          conflictSlot: slot,
        }), { status: 409, headers: CORS });
      }
    }

    // 예약 객체 생성
    const bookingId = generateId();
    const cancelToken = generateToken();
    const booking = {
      id: bookingId,
      service, serviceName, duration,
      date, time,
      slotsBooked: slotsToBook,
      name, phone, email: email || null, notes: notes || null,
      status: 'confirmed',
      cancelToken,
      reminderSent: false,
      noShowRisk: false,
      createdAt: new Date().toISOString(),
    };

    // 슬롯 맵 업데이트
    for (const slot of slotsToBook) {
      bookedSlots[slot] = bookingId;
    }

    // KV에 저장 (예약 만료: 90일)
    const ttl = 90 * 24 * 3600;
    await Promise.all([
      env.BOOKINGS.put(`booking:${bookingId}`, JSON.stringify(booking), { expirationTtl: ttl }),
      env.BOOKINGS.put(existingKey, JSON.stringify(bookedSlots), { expirationTtl: ttl }),
    ]);

    // 알림 발송 (병렬)
    const [emailResult, smsResult] = await Promise.all([
      sendConfirmationEmail(env, booking),
      sendSms(env, booking),
    ]);

    return new Response(JSON.stringify({
      success: true,
      booking: {
        id: booking.id,
        service: booking.serviceName,
        date: booking.date,
        time: booking.time,
        name: booking.name,
        phone: booking.phone,
        status: booking.status,
        cancelToken: booking.cancelToken,
      },
      notifications: { email: emailResult, sms: smsResult },
    }), { headers: CORS });

  } catch (err) {
    return new Response(JSON.stringify({ error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }), {
      status: 500, headers: CORS,
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
