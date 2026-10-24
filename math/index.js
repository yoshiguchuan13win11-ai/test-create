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
分数は必ず \\\\frac{分子}{分母} の形で書き、a/7 のようなスラッシュ表記は使わないでください。JSONの文字列内ではバックスラッシュを必ず2つ重ねてください（例: \\\\frac、\\\\times、\\\\leqq）。

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
表、数直線、カレンダー、図形など、視覚的な図表を前提とする問題は出題しないでください（このツールはテキストのみで問題を生成するため、図が必要な問題は成立しません）。
グラフ問題は、出題範囲に「比例・反比例のグラフ」が含まれる場合にのみ出題してください。グラフ問題を出題するときは、その大問のgraphフィールドに kind("proportion"または"inverse")・task("draw"または"read")・a(比例定数)・xRange・yRange・pointXs(曲線上に示すx座標の配列)をセットしてください。taskは「グラフを書かせる問題」ならdraw、「グラフを読み取らせる問題」ならreadです。グラフフィールドを持たない大問にはgraphを含めないでください。
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
const unitCheckboxes = document.querySelectorAll('input[name="question"]');

function getSelectedUnits() {
    const checked = Array.from(unitCheckboxes).filter(function(cb) {
        return cb.checked;
    });
    return checked.map(function(cb) {
        return cb.nextSibling.textContent.trim();
    }).join("、");
}

function buildMathPrompt() {
    let finalPrompt = mathTemplate.replaceAll("{{学年}}", ageSelect.value);
    finalPrompt = finalPrompt.replaceAll("{{単元名}}", getSelectedUnits());
    const hasGraph = Array.from(unitCheckboxes).some(function(cb) {
        return cb.checked && cb.value === "hihan_gurafu";
    });
    if (!hasGraph) {
        finalPrompt += "\n【追加制約】出題範囲にグラフは含まれていません。graphフィールドを持つ大問は一切出さないでください。";
    }
    finalPrompt += `\n【出題範囲の厳守・最重要】このテストで出題してよい内容は「${getSelectedUnits()}」だけです。それ以外の単元は、グラフの前提知識であっても一切出題しないでください。`;
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
    let prompt = `${ageSelect.value}「${getSelectedUnits()}」の数学のテストを作成してください。
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
const FOOTER_HTML = `<div class="ai-footer">AI作成 - 予想テスト</div>`;

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
    graphMode = "question";
    let html = `<div class="paper">`;
    html += renderPaperHead(worksheet);

    worksheet.parts.forEach(function(part) {
        html += `<div class="part-title">${part.partTitle}（${part.partPoints}点）</div>`;
        part.questions.forEach(function(q) {
            html += `<div class="daimon">`;
            html += `<div class="daimon-head"><span class="daimon-number">${q.number}</span>${q.instruction}</div>${renderGraph(q, "question")}`;
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
    graphMode = "sheet";
    let html = `<div class="paper">`;
    html += renderPaperHead(worksheet);

    worksheet.parts.forEach(function(part) {
        html += `<div class="part-title">${part.partTitle}（${part.partPoints}点）</div>`;
        part.questions.forEach(function(q) {
            html += `<div class="daimon">`;
            html += `<div class="daimon-head"><span class="daimon-number">${q.number}</span></div>${renderGraph(q, "sheet")}`;
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
    graphMode = "key";
    let html = `<div class="paper">`;
    html += `<div class="paper-title">${worksheet.title || ""}（模範解答）</div>`;

    worksheet.parts.forEach(function(part) {
        html += `<div class="part-title">${part.partTitle}（${part.partPoints}点）</div>`;
        part.questions.forEach(function(q) {
            html += `<div class="daimon">`;
            html += `<div class="daimon-head"><span class="daimon-number">${q.number}</span>${q.instruction}</div>${renderGraph(q, "key")}`;
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

// ===== グラフ描画(SVG) =====
let graphMode = "question"; // いま作っている用紙: question / sheet / key
let graphIdCounter = 0;     // clipPathのidが重ならないための通し番号

// 比例・反比例のグラフをSVG文字列にして返す
function drawGraphSvg(g, showCurve, color) {
    const xMin = Number(g.xRange[0]);
    const xMax = Number(g.xRange[1]);
    const yMin = Number(g.yRange[0]);
    const yMax = Number(g.yRange[1]);
    const a = Number(g.a);

    // 範囲がおかしいときは描かない(0が範囲内にないと軸が引けない)
    if (isNaN(xMin) || isNaN(xMax) || isNaN(yMin) || isNaN(yMax) || isNaN(a)) return "";
    if (!(xMin < 0 && xMax > 0 && yMin < 0 && yMax > 0)) return "";

    const unit = Math.floor(360 / Math.max(xMax - xMin, yMax - yMin)); // 1目盛りのpx
    const margin = 24;
    const width = (xMax - xMin) * unit + margin * 2;
    const height = (yMax - yMin) * unit + margin * 2;

    // 数学の座標 → SVGの座標
    function toPx(x) { return margin + (x - xMin) * unit; }
    function toPy(y) { return margin + (yMax - y) * unit; }

    let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
    const labelStep = unit >= 16 ? 1 : 2; // 目盛りが細かいときは数字を1つおきにする

    // たて線(x = 整数)と、x軸の数字
    for (let i = Math.ceil(xMin); i <= Math.floor(xMax); i++) {
        const isAxis = (i === 0);
        svg += `<line x1="${toPx(i)}" y1="${toPy(yMax)}" x2="${toPx(i)}" y2="${toPy(yMin)}" stroke="${isAxis ? "#000" : "#ccc"}" stroke-width="${isAxis ? 1.5 : 1}"/>`;
        if (!isAxis && i % labelStep === 0) {
            svg += `<text x="${toPx(i)}" y="${toPy(0) + 14}" font-size="11" text-anchor="middle">${i}</text>`;
        }
    }
    // よこ線(y = 整数)と、y軸の数字
    for (let i = Math.ceil(yMin); i <= Math.floor(yMax); i++) {
        const isAxis = (i === 0);
        svg += `<line x1="${toPx(xMin)}" y1="${toPy(i)}" x2="${toPx(xMax)}" y2="${toPy(i)}" stroke="${isAxis ? "#000" : "#ccc"}" stroke-width="${isAxis ? 1.5 : 1}"/>`;
        if (!isAxis && i % labelStep === 0) {
            svg += `<text x="${toPx(0) - 6}" y="${toPy(i) + 4}" font-size="11" text-anchor="end">${i}</text>`;
        }
    }
    // 原点Oと軸の名前
    svg += `<text x="${toPx(0) - 6}" y="${toPy(0) + 14}" font-size="11" text-anchor="end">O</text>`;
    svg += `<text x="${toPx(xMax) + 6}" y="${toPy(0) + 4}" font-size="12">x</text>`;
    svg += `<text x="${toPx(0) + 6}" y="${toPy(yMax) - 8}" font-size="12">y</text>`;

    if (showCurve) {
        // 枠の外にはみ出した部分を切り取る範囲
        const clipId = "graph-clip-" + (graphIdCounter++);
        svg += `<clipPath id="${clipId}"><rect x="${toPx(xMin)}" y="${toPy(yMax)}" width="${(xMax - xMin) * unit}" height="${(yMax - yMin) * unit}"/></clipPath>`;

        let d = "";
        if (g.kind === "proportion") {
            // 比例: 直線なので、両端の2点を結ぶだけ
            d = `M ${toPx(xMin)} ${toPy(a * xMin)} L ${toPx(xMax)} ${toPy(a * xMax)}`;
        } else {
            // 反比例: x<0 と x>0 を別々の線にする(x=0は通らない)
            const step = 0.05;
            const branches = [[xMin, -step], [step, xMax]];
            branches.forEach(function(br) {
                const n = Math.round((br[1] - br[0]) / step);
                for (let i = 0; i <= n; i++) {
                    const x = br[0] + i * step;
                    d += (i === 0 ? "M " : "L ") + toPx(x) + " " + toPy(a / x) + " ";
                }
            });
        }
        svg += `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" clip-path="url(#${clipId})"/>`;

        // 曲線上の点(yはJSで計算する)
        (g.pointXs || []).forEach(function(xv) {
            const x = Number(xv);
            const y = (g.kind === "proportion") ? a * x : a / x;
            if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {
                svg += `<circle cx="${toPx(x)}" cy="${toPy(y)}" r="3.5" fill="${color}"/>`;
            }
        });
    }

    svg += `</svg>`;
    return svg;
}

// 大問qにグラフがあれば、用紙の種類(mode)に合わせたHTMLを返す
function renderGraph(q, mode) {
    const g = q.graph;
    if (!g) return "";
    if (g.task === "read" && mode === "sheet") return ""; // 読み取り問題は解答用紙に不要
    const showCurve = (g.task === "read") || (mode === "key");
    const color = (mode === "key") ? "#1a4d8f" : "#000";
    const svg = drawGraphSvg(g, showCurve, color);
    return svg === "" ? "" : `<div class="graph-wrap">${svg}</div>`;
}

// 数式(KaTeX)をresultArea内でレンダリングする
function renderMath() {
    renderMathInElement(resultArea, {
        delimiters: [
            {left: "$$", right: "$$", display: true},
            {left: "$", right: "$", display: false}
        ]
    });
}

// 作成ボタンとAPI呼び出し
const generateBtn = document.getElementById('generate-btn');
const resultArea = document.getElementById('result-area');
const printQuestionBtn = document.getElementById('print-question-btn');
const printAnswerSheetBtn = document.getElementById('print-answersheet-btn');
const printAnswerKeyBtn = document.getElementById('print-answerkey-btn');
const modelInfo = document.getElementById('model-info');

let currentWorksheet = null; // 生成結果を保存しておく変数

function hideAllPrintButtons() {
    printQuestionBtn.style.display = "none";
    printAnswerSheetBtn.style.display = "none";
    printAnswerKeyBtn.style.display = "none";
}

generateBtn.addEventListener('click', async function() {
    if (getSelectedUnits() === "") {
        resultArea.innerHTML = "<p>出題範囲を1つ以上選択してください。</p>";
        return;
    }

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
        modelInfo.textContent = `使用モデル: ${data.usedModel}`;
        resultArea.innerHTML = renderQuestionPaper(currentWorksheet);
        renderMath();
        printQuestionBtn.style.display = "inline-block";
        printAnswerSheetBtn.style.display = "inline-block";
        printAnswerKeyBtn.style.display = "inline-block";
    } catch (err) {
        resultArea.innerHTML = "<p>通信エラーが発生しました: " + err.message + "</p>";
    }
});

printQuestionBtn.addEventListener('click', function() {
    resultArea.innerHTML = renderQuestionPaper(currentWorksheet);
    renderMath();
    setTimeout(function() {
        window.print();
    }, 200);
});

printAnswerSheetBtn.addEventListener('click', function() {
    resultArea.innerHTML = renderAnswerSheet(currentWorksheet);
    renderMath();
    setTimeout(function() {
        window.print();
    }, 200);
});

printAnswerKeyBtn.addEventListener('click', function() {
    resultArea.innerHTML = renderAnswerKey(currentWorksheet);
    renderMath();
    setTimeout(function() {
        window.print();
    }, 200);
});