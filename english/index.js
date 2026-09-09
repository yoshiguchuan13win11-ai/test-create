// ページ読み込み時に、単元ごとの単語・パターンリストを取得しておく
let englishData = {};

fetch('english-list.json')
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        englishData = data;
    });

// フォームの各要素を取得
const testTitleInput = document.querySelector('input[name="test-title"]');
const ageSelect = document.querySelector('select[name="test-age"]');
const unitCheckboxes = document.querySelectorAll('input[name="unit"]');
const questionTypeCheckboxes = document.querySelectorAll('input[name="question-type"]');
const questionCount = document.querySelector('input[name="question-count"]');
const additionalInstructions = document.querySelector('textarea[name="additional-instructions"]');

// チェックされている項目のラベル(表示文字)を取り出す共通関数
function getCheckedLabels(checkboxes) {
    const checked = Array.from(checkboxes).filter(function(cb) {
        return cb.checked;
    });
    return checked.map(function(cb) {
        return cb.nextSibling.textContent.trim();
    });
}

// プロンプトを組み立てる
function buildEnglishPrompt() {
    const checkedUnits = Array.from(unitCheckboxes).filter(function(cb) {
        return cb.checked;
    });

    let itemsText = "";
    checkedUnits.forEach(function(cb) {
        const unitInfo = englishData[cb.value];
        if (unitInfo) {
            itemsText += `・${unitInfo.label}: ${unitInfo.items.join(", ")}\n`;
        }
    });

    const types = getCheckedLabels(questionTypeCheckboxes).join("、");

    let prompt = `あなたは経験豊富な日本の中学校英語科教員です。
${ageSelect.value}を対象に、英語の定期テストを1つ作成してください。

【出題範囲・重要】
以下の単元で習う表現・単語の中から出題してください。ここに挙げたもの以外の、未習の文法・単語は使わないでください。
${itemsText}

【出題形式について・重要】
以下の出題形式を組み合わせて出題してください。questionTypeには、以下の英語表記のいずれかを入れてください。
- 単語(word): 単語の意味や、日本語訳を答えさせる問題。promptには単語（または日本語の意味）、answerには対応する訳を入れる。
- 並び替え(sort): バラバラの単語を並び替えて正しい英文を作らせる問題。promptにはカンマ区切りの単語列（例: "can, I, play, soccer"）、answerには正しい語順の英文（例: "I can play soccer."）を入れる。
- 穴埋め(anaume): 英文の一部を空欄にした問題。promptには空欄を含む英文（空欄は"( )"で表す）、answerには空欄に入る語句を入れる。
- 英文書きかえ(kakikae): ある英文を指示にしたがって別の形に書きかえさせる問題。promptには元の英文と書きかえの指示、answerには書きかえた後の正しい英文を入れる。
- 作文(create): 対話文の一部を完成させる問題。promptには対話文全体（空欄部分は"( )"で表す）、answerには空欄に入る適切な応答文を入れる。
- 人物になったつもりで(narikiri): ある設定・状況を提示し、その人物の立場で答えさせる問題。promptには設定・状況の説明と質問、answerにはその状況にふさわしい模範解答の英文を入れる。

今回出題してほしい形式: ${types}

【問題数】
全部で${questionCount.value}問にしてください。

【出力について・重要】
大問は作らず、テスト全体で1つの指示文（instruction）だけを用意してください。
instructionには、出題形式に応じた分かりやすい指示文（例:「次の単語を並べかえて、正しい英文にしなさい。」など、複数の形式が混ざる場合は全体をまとめた指示）を入れてください。
numberには1から始まる連番を入れてください。`;

    if (additionalInstructions.value.trim() !== "") {
        prompt += `\n\n【追加指示】\n${additionalInstructions.value}`;
    }

    return prompt;
}

// 各ページ下部に付ける注意書き
const FOOTER_HTML = `<div class="ai-footer">このテストはAI作成です。実際のテストではありません。このテストは https://test-create-theta.vercel.app/ で無料で生成できます。</div>`;

// 問題の種類に応じて、解答欄のクラス名を決める
function getBlankClass(questionType) {
    const longAnswerTypes = ["kakikae", "create", "narikiri"];
    if (longAnswerTypes.indexOf(questionType) !== -1) {
        return "answer-blank answer-blank-large";
    }
    return "answer-blank";
}

// 共通のヘッダー部分(タイトル・氏名欄)
function renderPaperHead(worksheet, showScoreTable) {
    let html = `<div class="paper-title">${worksheet.title || ""}</div>`;
    html += `<div class="student-info"><span>組：＿＿＿＿</span><span>番号：＿＿＿＿</span><span>氏名：＿＿＿＿＿＿＿＿＿＿＿＿</span></div>`;
    if (showScoreTable) {
        const total = worksheet.questions.length;
        html += `<div class="student-info"><span>得点：＿＿＿＿ ／ ${total}点</span></div>`;
    }
    return html;
}

// 問題用紙(問題文は表示、解答欄は空欄)
function renderQuestionPaper(worksheet) {
    let html = `<div class="paper">`;
    html += renderPaperHead(worksheet, true);
    html += `<div class="instruction-text">${worksheet.instruction || ""}</div>`;

    worksheet.questions.forEach(function(q) {
        html += `<div class="english-question">
            <span class="english-number">${q.number}</span>
            <span class="english-sentence">${q.prompt}</span>
            <div class="${getBlankClass(q.questionType)}"></div>
        </div>`;
    });

    html += FOOTER_HTML;
    html += `</div>`;
    return html;
}

// 解答用紙(問題文は省略し、番号と解答欄だけ)
function renderAnswerSheet(worksheet) {
    let html = `<div class="paper">`;
    html += renderPaperHead(worksheet, true);
    html += `<div class="instruction-text">${worksheet.instruction || ""}</div>`;

    worksheet.questions.forEach(function(q) {
        html += `<div class="english-question">
            <span class="english-number">${q.number}</span>
            <div class="${getBlankClass(q.questionType)}"></div>
        </div>`;
    });

    html += FOOTER_HTML;
    html += `</div>`;
    return html;
}

// 模範解答(問題文+解答)
function renderAnswerKey(worksheet) {
    let html = `<div class="paper">`;
    html += `<div class="paper-title">${worksheet.title || ""}（模範解答）</div>`;
    html += `<div class="instruction-text">${worksheet.instruction || ""}</div>`;

    worksheet.questions.forEach(function(q) {
        html += `<div class="english-question">
            <span class="english-number">${q.number}</span>
            <span class="english-sentence">${q.prompt}</span>
            <span class="answer-key-text">${q.answer}</span>
        </div>`;
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

let currentWorksheet = null;

function hideAllPrintButtons() {
    printQuestionBtn.style.display = "none";
    printAnswerSheetBtn.style.display = "none";
    printAnswerKeyBtn.style.display = "none";
}

generateBtn.addEventListener('click', async function() {
    const prompt = buildEnglishPrompt();

    resultArea.innerHTML = "<p>生成中です。少々お待ちください...</p>";
    hideAllPrintButtons();

    try {
        const response = await fetch('/api/english/generate', {
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
        printQuestionBtn.style.display = "inline-block";
        printAnswerSheetBtn.style.display = "inline-block";
        printAnswerKeyBtn.style.display = "inline-block";
    } catch (err) {
        resultArea.innerHTML = "<p>通信エラーが発生しました: " + err.message + "</p>";
    }
});

printQuestionBtn.addEventListener('click', function() {
    resultArea.innerHTML = renderQuestionPaper(currentWorksheet);
    window.print();
});

printAnswerSheetBtn.addEventListener('click', function() {
    resultArea.innerHTML = renderAnswerSheet(currentWorksheet);
    window.print();
});

printAnswerKeyBtn.addEventListener('click', function() {
    resultArea.innerHTML = renderAnswerKey(currentWorksheet);
    window.print();
});