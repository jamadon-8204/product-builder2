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
        system: `당신은 골목길 팔란티어의 CS 상담봇입니다.
소상공인 운영 자동화 서비스에 대해 친절하게 안내합니다.
답변은 3문장 이내로 간결하게 합니다.`,
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
