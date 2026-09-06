// ページ読み込み時に、単元ごとの漢字リストを取得しておく
let kanjiData = {};

fetch('kanji-list.json')
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        kanjiData = data;
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
function buildKanjiPrompt() {
    const checkedUnits = Array.from(unitCheckboxes).filter(function(cb) {
        return cb.checked;
    });

    let kanjiListText = "";
    checkedUnits.forEach(function(cb) {
        const unitInfo = kanjiData[cb.value];
        if (unitInfo) {
            kanjiListText += `・${unitInfo.label}: ${unitInfo.kanjiList.join("、")}\n`;
        }
    });

    const types = getCheckedLabels(questionTypeCheckboxes).join("、");

    let prompt = `あなたは経験豊富な日本の国語科教員です。
${ageSelect.value}を対象に、漢字の読み書きに関する定期テストを1つ作成してください。

【出題範囲・重要】
以下の単元の新出漢字の中から出題してください。ここに挙げた漢字以外は使わないでください。
${kanjiListText}

【出題形式】
${types}の問題を出題してください。読み問題は文中の漢字（またはひらがな表記）に下線を引き、その読みをひらがなで答えさせる形式にしてください。書き問題は文中のカタカナ部分に下線を引き、それを漢字に直させる形式にしてください。

【問題数】
全部で${questionCount.value}問にしてください。

【出力について・重要】
大問は作らず、テスト全体で1つの指示文（instruction）だけを用意してください。
instructionには「次の――線部の読みをひらがなで書きなさい。また、――線のカタカナを漢字に直しなさい。必要なところは送り仮名をつけること。」のような、読み・書き両方に対応する指示文を入れてください。
各questionのsentenceには、下線部を含む短い1文を入れてください。
underlinedPartには、sentenceの中で下線を引くべき部分（漢字またはカタカナの箇所）を、sentenceに実際に含まれる文字列と完全に一致する形で入れてください。
typeには、読み問題なら"reading"、書き問題なら"writing"を入れてください。
answerには、読み問題ならひらがなでの読み、書き問題なら正しい漢字を入れてください。
numberには1から始まる連番を入れてください。`;

    if (additionalInstructions.value.trim() !== "") {
        prompt += `\n\n【追加指示】\n${additionalInstructions.value}`;
    }

    return prompt;
}

// 各ページ下部に付ける注意書き
const FOOTER_HTML = `<div class="ai-footer">このテストはAI作成です。実際のテストではありません。このテストは https://test-create-theta.vercel.app/ で無料で生成できます。</div>`;

// sentenceの中のunderlinedPartに、下線のスタイルを付ける
function underlineSentence(sentence, target) {
    if (!target || sentence.indexOf(target) === -1) {
        return sentence;
    }
    return sentence.replace(target, `<span class="underline-target">${target}</span>`);
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

// 問題用紙(文章+下線、解答欄は空欄)
function renderQuestionPaper(worksheet) {
    let html = `<div class="paper">`;
    html += renderPaperHead(worksheet, true);
    html += `<div class="instruction-text">${worksheet.instruction || ""}</div>`;

    worksheet.questions.forEach(function(q) {
        html += `<div class="kanji-question">
            <span class="kanji-number">${q.number}</span>
            <span class="kanji-sentence">${underlineSentence(q.sentence, q.underlinedPart)}</span>
            <div class="answer-blank"></div>
        </div>`;
    });

    html += FOOTER_HTML;
    html += `</div>`;
    return html;
}

// 解答用紙(文章は省略し、番号と解答欄だけ)
function renderAnswerSheet(worksheet) {
    let html = `<div class="paper">`;
    html += renderPaperHead(worksheet, true);
    html += `<div class="instruction-text">${worksheet.instruction || ""}</div>`;

    worksheet.questions.forEach(function(q) {
        html += `<div class="kanji-question">
            <span class="kanji-number">${q.number}</span>
            <div class="answer-blank answer-blank-large"></div>
        </div>`;
    });

    html += FOOTER_HTML;
    html += `</div>`;
    return html;
}

// 模範解答(文章+下線+解答)
function renderAnswerKey(worksheet) {
    let html = `<div class="paper">`;
    html += `<div class="paper-title">${worksheet.title || ""}（模範解答）</div>`;
    html += `<div class="instruction-text">${worksheet.instruction || ""}</div>`;

    worksheet.questions.forEach(function(q) {
        html += `<div class="kanji-question">
            <span class="kanji-number">${q.number}</span>
            <span class="kanji-sentence">${underlineSentence(q.sentence, q.underlinedPart)}</span>
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
    const prompt = buildKanjiPrompt();

    resultArea.innerHTML = "<p>生成中です。少々お待ちください...</p>";
    hideAllPrintButtons();

    try {
        const response = await fetch('/api/japanese/kanji/generate', {
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