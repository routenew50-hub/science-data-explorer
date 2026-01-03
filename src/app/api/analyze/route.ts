import { NextResponse } from 'next/server';

// OpenRouter API 설정
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SITE_NAME = 'Somatic Science Lab';

// 사용할 모델 정의
const MODELS = {
  gemini: process.env.MODEL_GEMINI || 'google/gemini-2.0-flash-exp:free',
  llama: process.env.MODEL_LLAMA || 'meta-llama/llama-3.3-70b-instruct',
  deepseek: process.env.MODEL_DEEPSEEK || 'deepseek/deepseek-chat',
};

// 소메틱 과학 특화 시스템 프롬프트 (수정됨: 아코디언 요청 포함)
const SYSTEM_PROMPT = `
당신은 '소메틱 과학(Somatic Science)' 교육 전문가이자 제품 기획자입니다.
주어진 논문 내용을 바탕으로 초등학생/중학생을 위한 교육 콘텐츠와 키트를 기획해야 합니다.

다음 4가지 구조로 분석하여 Markdown 형식으로 출력하세요.

1. **핵심 원리 (The Science)**:
   - 논문의 핵심 내용을 '고유감각' 또는 '내부감각'과 연결하여 설명하세요.
   - "내 몸의 GPS(고유감각)", "내 몸의 배터리(내부감각)" 등 쉬운 비유를 사용하세요.

2. **연구 방법론 (Methodology)**:
   - 이 섹션은 반드시 HTML standard <details> 태그를 사용하여 접을 수 있게 만드세요.
   - 요약 내용은 모바일에서 읽기 편하게 간결하게 작성하세요.
   - 예시: 
     <details>
     <summary style="cursor: pointer; font-weight: bold;">연구 방법 자세히 보기 (클릭)</summary>
     <div style="margin-top: 8px;">
     여기에 연구 대상, 실험 절차, 측정 방법 등을 요약해서 기술하세요.
     </div>
     </details>

3. **체험 활동 (Somatic Activity)**:
   - 원리를 몸으로 느낄 수 있는 간단한 활동 1가지를 제안하세요.

4. **DIY 키트 아이디어 (Hands-on Kit)**:
   - 저렴하고 안전한 재료의 키트를 기획하세요.
   - 키트 이름, 준비물, 만드는 법, 배울 수 있는 점을 포함하세요.

답변은 한국어로 작성하세요.
`;

export async function POST(request: Request) {
  try {
    const { paper, modelKey } = await request.json();
    
    if (!paper || !modelKey) {
      return NextResponse.json({ error: 'Missing paper data or model key' }, { status: 400 });
    }

    const modelId = MODELS[modelKey as keyof typeof MODELS];
    if (!modelId) {
      return NextResponse.json({ error: 'Invalid model key' }, { status: 400 });
    }

    const prompt = `
    논문 제목: ${paper.title}
    초록: ${paper.abstract || '초록 없음'}
    
    위 논문을 분석해 주세요.
    `;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenRouter API Error (${modelKey}):`, errorText);
        throw new Error(`OpenRouter API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '분석에 실패했습니다.';

    return NextResponse.json({ result: content, model: modelKey });

  } catch (error) {
    console.error('Analysis API Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze paper' },
      { status: 500 }
    );
  }
}
