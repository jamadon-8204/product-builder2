// 카카오 i 오픈빌더 웹훅 → Claude AI 응답
export async function onRequestPost(context) {
  const { request, env } = context;

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await request.json();

    // 카카오 i 오픈빌더 메시지 추출
    const userMessage = body.userRequest?.utterance;

    if (!userMessage) {
      return new Response(JSON.stringify({ error: '메시지 없음' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Claude Haiku 호출
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: `당신은 골목길 팔란티어 CS 상담봇입니다.
골목길 팔란티어는 소상공인(식당, 카페, 미용실 등)의 운영을 AI로 자동화하는 서비스입니다.

주요 기능:
- AI 고객 응대 자동화
- 예약 관리
- 매출 분석

규칙:
- 항상 친절하고 따뜻하게 답변
- 3문장 이내로 간결하게
- 모르는 질문은 "담당자에게 연결해드릴게요" 라고 답변
- 절대 "제가 할 수 없어요" 라고 하지 말 것`,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const data = await response.json();
    const botReply = data.content?.[0]?.text || '죄송합니다. 잠시 후 다시 시도해주세요.';

    // 카카오 i 오픈빌더 응답 형식
    return new Response(JSON.stringify({
      version: '2.0',
      template: {
        outputs: [
          {
            simpleText: {
              text: botReply,
            },
          },
        ],
      },
    }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text: '죄송합니다. 잠시 후 다시 시도해주세요.' } }],
      },
    }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}