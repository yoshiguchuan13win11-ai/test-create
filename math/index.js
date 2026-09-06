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

// 数式表記・配点・出題範囲に関する共通ルール
const NOTATION_RULES = `
【数式の書き方について・重要】
数式は、必ずLaTeX記法を使い、インライン数式は $ ... $ で囲んでください（例: $x^2$、$\\frac{a}{7}$、$\\times$）。
分数は必ず \\frac{分子}{分母} の形で書き、a/7 のようなスラッシュ表記は使わないでください。

【配点について・重要】
第1部(知識・技能)全体の配点(partPoints)は60点、第2部(思考力・判断力・表現力等)全体の配点(partPoints)は40点、テスト全体の合計は100点にしてください。
各小問(subQuestions)のpointsは、その大問のpartPointsの範囲内で、問題の難易度に応じて割り振り、大問内の小問の合計がpartPointsと一致するようにしてください。
各subQuestionのanswerには、その問題の模範解答（簡潔な答えと、必要なら短い解き方）を必ず入れてください。

【出題範囲について・重要】
指定された単元の範囲を明確に超える内容（未習の公式や、その学年でまだ習っていない概念）は出題しないでください。

【難易度の一貫性について】
知識・技能パートには、判断・説明・理由づけを要する問題を含めず、純粋な計算・分類・穴埋めなど、機械的に答えが出せる問題のみにしてください。
急激な難易度上昇を避け、各大問・各パートの中で段階的に難しくなるようにしてください。

【出題形式の制約について・重要】
図、グラフ、表、数直線、カレンダー、図形など、視覚的な図表を前提とする問題は出題しないでください（このツールはテキストのみで問題を生成するため、図が必要な問題は成立しません）。
文章題は、文章だけで状況が正確に伝わるように書いてください。

【レイアウトについて・重要】
反復練習ブロックのように小問数が多い大問(6問以上)では、1つのsubQuestionのtextを短く簡潔にし、labelとtextの間、text自体の中に無駄な空白や長い説明を入れないでください。
各subQuestionは独立した短い1行で完結するようにし、余計な前置きの文章を挟まないでください。
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
- 難易度は{{学年}}の定期テスト相当とする
- 数値は毎回変えて、既存の類題と数字がかぶらないようにする
- 選択肢問題は記号(ア・イ・ウ…)で答えさせ、「すべて選び」と「1つ選び」を使い分ける
- 計算問題は「途中式→答え」の形式が分かるように問題を設計する
${NOTATION_RULES}
【出力について】
- instructionには大問全体の指示文、subQuestionsの各labelには"(1)"のような番号、textには問題文だけを入れてください`;

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

// 各ページ下部に付ける注意書き
const FOOTER_HTML = `<div class="ai-footer">このテストはAI作成です。実際のテストではありません。このテストは https://test-create-theta.vercel.app/ で無料で生成できます。</div>`;

// 共通のヘッダー部分(タイトル・配点・氏名欄)
function renderPaperHead(worksheet) {
    const kPoints = worksheet.parts[0] ? worksheet.parts[0].partPoints : "";
    const tPoints = worksheet.parts[1] ? worksheet.parts[1].partPoints : "";
    const total = Number(kPoints) + Number(tPoints);

    let html = `<div class="paper-title">${worksheet.title || ""}</div>`;
    html += `<div class="student-info"><span>組：＿＿＿＿</span><span>番号：＿＿＿＿</span><span>氏名：＿＿＿＿＿＿＿＿＿＿＿＿</span></div>`;
    html += `<table class="score-table">
        <tr><th>知識・技能</th><th>思考・判断・表現</th><th>合計</th></tr>
        <tr><td>／${kPoints}</td><td>／${tPoints}</td><td>／${total}</td></tr>
    </table>`;
    return html;
}

// 問題用紙(配点は表示、解答欄は空欄、模範解答は含めない)
function renderQuestionPaper(worksheet) {
    let html = `<div class="paper">`;
    html += renderPaperHead(worksheet);

    worksheet.parts.forEach(function(part) {
        html += `<div class="part-title">${part.partTitle}（${part.partPoints}点）</div>`;
        part.questions.forEach(function(q) {
            html += `<div class="daimon">`;
            html += `<div class="daimon-head"><span class="daimon-number">${q.number}</span>${q.instruction}</div>`;
            (q.subQuestions || []).forEach(function(sq) {
                html += `<div class="subquestion">
                    <span class="sub-label">${sq.label}</span>
                    <span class="sub-text">${sq.text}</span>
                    <span class="sub-points">(${sq.points}点)</span>
                    <div class="answer-blank"></div>
                </div>`;
            });
            html += `</div>`;
        });
    });

    html += FOOTER_HTML;
    html += `</div>`;
    return html;
}

// 解答用紙(問題文は省略し、配点と解答欄だけを大きく取る)
function renderAnswerSheet(worksheet) {
    let html = `<div class="paper">`;
    html += renderPaperHead(worksheet);

    worksheet.parts.forEach(function(part) {
        html += `<div class="part-title">${part.partTitle}（${part.partPoints}点）</div>`;
        part.questions.forEach(function(q) {
            html += `<div class="daimon">`;
            html += `<div class="daimon-head"><span class="daimon-number">${q.number}</span></div>`;
            (q.subQuestions || []).forEach(function(sq) {
                html += `<div class="subquestion">
                    <span class="sub-label">${sq.label}</span>
                    <span class="sub-points">(${sq.points}点)</span>
                    <div class="answer-blank answer-blank-large"></div>
                </div>`;
            });
            html += `</div>`;
        });
    });

    html += FOOTER_HTML;
    html += `</div>`;
    return html;
}

// 模範解答(問題文・答えの両方を表示)
function renderAnswerKey(worksheet) {
    let html = `<div class="paper">`;
    html += `<div class="paper-title">${worksheet.title || ""}（模範解答）</div>`;

    worksheet.parts.forEach(function(part) {
        html += `<div class="part-title">${part.partTitle}（${part.partPoints}点）</div>`;
        part.questions.forEach(function(q) {
            html += `<div class="daimon">`;
            html += `<div class="daimon-head"><span class="daimon-number">${q.number}</span>${q.instruction}</div>`;
            (q.subQuestions || []).forEach(function(sq) {
                html += `<div class="subquestion">
                    <span class="sub-label">${sq.label}</span>
                    <span class="sub-text">${sq.text}</span>
                    <span class="sub-points">(${sq.points}点)</span>
                    <div class="answer-key-text">解答：${sq.answer || ""}</div>
                </div>`;
            });
            html += `</div>`;
        });
    });

    html += FOOTER_HTML;
    html += `</div>`;
    return html;
}

// 作成ボタンとAPI呼び出し
const generateBtn = document.getElementById('generate-btn');
const resultArea = document.getElementById('result-area');
const printQuestionBtn = document.getElementById('print-question-btn');
const printAnswerSheetBtn = document.getElementById('print-answersheet-btn');
const printAnswerKeyBtn = document.getElementById('print-answerkey-btn');

let currentWorksheet = null; // 生成結果を保存しておく変数

function hideAllPrintButtons() {
    printQuestionBtn.style.display = "none";
    printAnswerSheetBtn.style.display = "none";
    printAnswerKeyBtn.style.display = "none";
}

generateBtn.addEventListener('click', async function() {
    let prompt;
    if (yesRadio.checked) {
        prompt = buildMathPrompt();
    } else {
        prompt = buildFreePrompt();
    }

    resultArea.innerHTML = "<p>生成中です。少々お待ちください...</p>";
    hideAllPrintButtons();

    try {
        const response = await fetch('/api/math/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });
        const data = await response.json();

        if (!response.ok) {
            resultArea.innerHTML = "<p>エラー: " + data.error + "</p>";
            return;
        }

        currentWorksheet = data;
        resultArea.innerHTML = renderQuestionPaper(currentWorksheet);
        renderMathInElement(resultArea);
        printQuestionBtn.style.display = "inline-block";
        printAnswerSheetBtn.style.display = "inline-block";
        printAnswerKeyBtn.style.display = "inline-block";
    } catch (err) {
        resultArea.innerHTML = "<p>通信エラーが発生しました: " + err.message + "</p>";
    }
});

printQuestionBtn.addEventListener('click', function() {
    resultArea.innerHTML = renderQuestionPaper(currentWorksheet);
    renderMathInElement(resultArea);
    window.print();
});

printAnswerSheetBtn.addEventListener('click', function() {
    resultArea.innerHTML = renderAnswerSheet(currentWorksheet);
    renderMathInElement(resultArea);
    window.print();
});

printAnswerKeyBtn.addEventListener('click', function() {
    resultArea.innerHTML = renderAnswerKey(currentWorksheet);
    renderMathInElement(resultArea);
    window.print();
});