import modelListData from '../model-list.json' assert { type: 'json' };

const MODEL_FALLBACK_LIST = modelListData.fallbackList;

const ENGLISH_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    instruction: { type: 'STRING' },
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          number: { type: 'NUMBER' },
          questionType: { type: 'STRING' },
          prompt: { type: 'STRING' },
          answer: { type: 'STRING' }
        },
        required: ['number', 'questionType', 'prompt', 'answer']
      }
    }
  },
  required: ['title', 'instruction', 'questions']
};

async function callGemini(prompt, schema, apiKey) {
    let lastError;
    for (const model of MODEL_FALLBACK_LIST) {
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
                            responseSchema: schema
                        }
                    })
                }
            );
            const data = await response.json();
            if (!response.ok) {
                lastError = new Error(data.error?.message || `${model}でエラーが発生しました`);
                continue;
            }
            const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('');
            if (!text) {
                lastError = new Error(`${model}から有効な返答が得られませんでした`);
                continue;
            }
            return JSON.parse(text);
        } catch (err) {
            lastError = err;
        }
    }
    throw lastError;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POSTメソッドのみ対応しています' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'サーバーにGEMINI_API_KEYが設定されていません' });
  }

  const body = req.body || {};
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    return res.status(400).json({ error: 'プロンプト(prompt)が正しく送られていません' });
  }

  try {
    const worksheet = await callGemini(prompt, ENGLISH_SCHEMA, apiKey);
    return res.status(200).json(worksheet);
  } catch (err) {
    return res.status(500).json({ error: '生成中にエラーが発生しました: ' + err.message });
  }
}