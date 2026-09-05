const WORKSHEET_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    parts: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          partTitle: { type: 'STRING' },
          questions: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                number: { type: 'NUMBER' },
                instruction: { type: 'STRING' },
                subQuestions: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      label: { type: 'STRING' },
                      text: { type: 'STRING' }
                    },
                    required: ['label', 'text']
                  }
                }
              },
              required: ['number', 'instruction', 'subQuestions']
            }
          }
        },
        required: ['partTitle', 'questions']
      }
    }
  },
  required: ['title', 'parts']
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POSTメソッドのみ対応しています' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'サーバーにGEMINI_API_KEYが設定されていません' });
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const body = req.body || {};

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    return res.status(400).json({ error: 'プロンプト(prompt)が正しく送られていません' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            responseMimeType: 'application/json',
            responseSchema: WORKSHEET_SCHEMA
          }
        })
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini APIでエラーが発生しました');
    }
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('');
    if (!text) {
      throw new Error('Geminiから有効な返答が得られませんでした');
    }
    let worksheet;
    try {
      worksheet = JSON.parse(text);
    } catch (e) {
      throw new Error('応答をJSONとして解析できませんでした');
    }
    return res.status(200).json(worksheet);
  } catch (err) {
    return res.status(500).json({ error: '生成中にエラーが発生しました: ' + err.message });
  }
}