// テンプレート使用の有無で追加フォームを表示・非表示
const noRadio = document.querySelector('input[name="use-template"][value="no"]');
const yesRadio = document.querySelector('input[name="use-template"][value="yes"]');
const extraOptions = document.getElementById('extra-options');

noRadio.addEventListener('change', function() {
    extraOptions.style.display = "block";
});

yesRadio.addEventListener('change', function() {
    extraOptions.style.display = "none";
});

// 知識技能・思考判断表現の点数と合計
const knowledgeScore = document.querySelector('input[name="knowledge-score"]');
const thinkingScore = document.querySelector('input[name="thinking-score"]');
const totalScoreDisplay = document.getElementById('total-score');
const knowledgeWarning = document.getElementById('knowledge-warning');
const thinkingWarning = document.getElementById('thinking-warning');
function updateTotal() {
    if (Number(knowledgeScore.value) < 0 || Number(knowledgeScore.value) > 500) {
        knowledgeWarning.style.display = "block";
    } else {
        knowledgeWarning.style.display = "none";
    }
    if (Number(thinkingScore.value) < 0 || Number(thinkingScore.value) > 500) {
        thinkingWarning.style.display = "block";
    } else {
        thinkingWarning.style.display = "none";
    }
    const total = Number(knowledgeScore.value) + Number(thinkingScore.value);
    totalScoreDisplay.textContent = total;
}

knowledgeScore.addEventListener('input', updateTotal);
thinkingScore.addEventListener('input', updateTotal);

// 【数式の書き方について・重要】の共通ルール(mathTemplate / buildFreePrompt 両方から参照)
const NOTATION_RULES = `
【数式の書き方について・重要】
LaTeX記法は使わず、x^2（累乗）、a/b（分数）、× （掛け算）のような、プレーンテキストの日本の教科書表記にしてください。
`;

const mathTemplate = `あなたは経験豊富な日本の公立中学校数学科教員です。
{{学年}}「{{単元名}}」の単元の定期テストを1つ作成してください。


【全体構成】
- 大問は12〜14個程度、小問は全体で40問前後を目安にする
- 大問を2部に分ける
  - 第1部:《知識・技能》(前半、純粋な計算・処理能力を問う)
  - 第2部:《思考力・判断力・表現力等》(後半、文章題・応用・説明を要する問題)


【第1部(知識・技能)の構成ルール】
- 小問を全体の半分程度、多めに配分する
- そのうち1つの大問は、単純計算のみを10問前後連続させる「反復練習ブロック」とする


【第2部(思考力・判断力・表現力等)の構成ルール】
- 1大問あたりの小問数は1〜4問に絞る
- 代わりに、説明・立式・誤り訂正など負荷の高い設問形式にする
- 中盤に、正誤判定+理由説明+訂正計算をセットで求める「誤り探し」大問を1つ入れる


【難易度の付け方】
- 各大問内では(1)基礎→(2)以降応用、という難易度上昇を必ずつける
- 全体の最後の1〜2大問は、複数ステップかつ前の設問の答えを使う統合的な総合問題とし、テスト全体の中で最も難しく配置する


【出題ルールと難易度】
- 難易度は{{学年}}の定期テスト相当(基礎6割・応用4割程度)とする
- 数値は毎回変えて、既存の類題と数字がかぶらないようにする
- 選択肢問題は記号(ア・イ・ウ…)で答えさせ、「すべて選び」と「1つ選び」を使い分ける
- 計算問題は「途中式→答え」の形式が分かるように問題を設計する
${NOTATION_RULES}
【出力について】
- instructionには大問全体の指示文、subQuestionsの各labelには"(1)"のような番号、textには問題文だけを入れてください
- 解答・解説は含めないでください`;

const ageSelect = document.querySelector('select[name="test-age"]');
const topicInput = document.querySelector('input[name="topic"]');

function buildMathPrompt() {
    let finalPrompt = mathTemplate.replaceAll("{{学年}}", ageSelect.value);
    finalPrompt = finalPrompt.replaceAll("{{単元名}}", topicInput.value);
    return finalPrompt;
}

const questionCount = document.querySelector('input[name="question-count"]');
const difficultySelect = document.querySelector('select[name="difficulty"]');
const exampleProblem = document.querySelector('textarea[name="example-problem"]');
const additionalInstructions = document.querySelector('textarea[name="additional-instructions"]');
const questionTypeCheckboxes = document.querySelectorAll('input[name="question-type"]');

function getSelectedQuestionTypes() {
    const checkedBoxes = Array.from(questionTypeCheckboxes).filter(function(checkbox) {
        return checkbox.checked;
    });
    const labels = checkedBoxes.map(function(checkbox) {
        return checkbox.nextSibling.textContent.trim();
    });
    return labels.join("、");
}

function buildFreePrompt() {
    let prompt = `${ageSelect.value}「${topicInput.value}」の数学のテストを作成してください。
問題数は${questionCount.value}問、難易度は${difficultySelect.value}にしてください。
出題形式は${getSelectedQuestionTypes()}を含めてください。
知識技能の配点は${knowledgeScore.value}点、思考判断表現の配点は${thinkingScore.value}点にしてください。
${NOTATION_RULES}
instructionには大問全体の指示文、subQuestionsの各labelには"(1)"のような番号、textには問題文だけを入れてください。`;

    if (exampleProblem.value.trim() !== "") {
        prompt += `\n参考にする例題: ${exampleProblem.value}`;
    }
    if (additionalInstructions.value.trim() !== "") {
        prompt += `\n追加の指示: ${additionalInstructions.value}`;
    }

    return prompt;
}

// JSON形式で返ってきた問題データをプリント用HTMLに変換
function renderWorksheet(worksheet) {
    let html = `<div class="paper">`;
    html += `<div class="paper-title">${worksheet.title || ""}</div>`;
    html += `<div class="student-info"><span>組：＿＿＿＿</span><span>番号：＿＿＿＿</span><span>氏名：＿＿＿＿＿＿＿＿＿＿＿＿</span></div>`;

    worksheet.parts.forEach(function(part) {
        html += `<div class="part-title">${part.partTitle}</div>`;
        part.questions.forEach(function(q) {
            html += `<div class="daimon">`;
            html += `<div class="daimon-head"><span class="daimon-number">${q.number}</span>${q.instruction}</div>`;
            (q.subQuestions || []).forEach(function(sq) {
                html += `<div class="subquestion"><span class="sub-label">${sq.label}</span><span class="sub-text">${sq.text}</span><div class="answer-blank"></div></div>`;
            });
            html += `</div>`;
        });
    });

    html += `</div>`;
    return html;
}

// 作成ボタンとAPI呼び出し
const generateBtn = document.getElementById('generate-btn');
const resultArea = document.getElementById('result-area');
const printBtn = document.getElementById('print-btn');

generateBtn.addEventListener('click', async function() {
    let prompt;
    if (yesRadio.checked) {
        prompt = buildMathPrompt();
    } else {
        prompt = buildFreePrompt();
    }

    resultArea.innerHTML = "<p>生成中です。少々お待ちください...</p>";
    printBtn.style.display = "none";

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });
        const data = await response.json();

        if (!response.ok) {
            resultArea.innerHTML = "<p>エラー: " + data.error + "</p>";
            return;
        }

        resultArea.innerHTML = renderWorksheet(data);
        printBtn.style.display = "block";
    } catch (err) {
        resultArea.innerHTML = "<p>通信エラーが発生しました: " + err.message + "</p>";
    }
});

printBtn.addEventListener('click', function() {
    window.print();
});