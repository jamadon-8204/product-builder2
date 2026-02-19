export async function onRequestPost(context) {
  const { request, env } = context;

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const { messages, businessType, businessName } = await request.json();

    const systemPrompt = `당신은 ${businessName || '골목길 소상공인 가게'}의 AI 고객 서비스 담당자입니다.
업종: ${businessType || '소상공인 가게'}

역할:
- 고객의 예약 문의, 가격 안내, 운영 시간, 위치 안내를 친절하게 응대합니다
- 불만 고객에게는 공감하며 해결 방법을 안내합니다
- 답변은 2~3문장으로 간결하게 합니다
- 반드시 한국어로 답변합니다
- 친근하고 전문적인 톤을 유지합니다
- 적절한 이모지를 1~2개 사용합니다

현재는 골목길 팔란티어 AI CS봇 데모입니다. 미용실, 학원, 의원 등 다양한 업종 질문에 자연스럽게 응대해주세요.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Claude API error');
    }

    return new Response(JSON.stringify({ reply: data.content[0].text }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
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
