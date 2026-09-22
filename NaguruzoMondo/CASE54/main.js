'use strict';

// 標準CASE設定
const nazoid = 54;
const puzzle = window.AmidaPuzzle;
const answers = puzzle.config.answers;
const explanationMessage = puzzle.config.explanation;
let remainingAttempts = 3;
let cleared = false;
let tweetMess = '';

// CASE54固有の無限盤面
const scroller = document.getElementById('board-scroll');
const space = document.getElementById('board-space');
const canvas = document.getElementById('board');
const context = canvas.getContext('2d');
const panelImage = new Image();
const opened = new Set();
let baseRow = 0n;
let cell = 1;
let boardWidth = 1;
let boardHeight = 1;
let showAll = false;
let frame = 0;
let press = null;
let scrollHintShown = false;

function scheduleDraw() {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; drawArea(); });
}
function resizeBoard() {
    const oldRows = scroller.scrollTop / cell;
    boardWidth = scroller.clientWidth;
    boardHeight = scroller.clientHeight;
    cell = boardWidth / 5;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(boardWidth * ratio);
    canvas.height = Math.round(boardHeight * ratio);
    canvas.style.height = `${boardHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    space.style.height = `${1000 * cell}px`;
    scroller.scrollTop = oldRows * cell;
    scheduleDraw();
}
function drawPanelImage(number, x, y) {
    if (panelImage.complete && panelImage.naturalWidth) {
        context.drawImage(panelImage, x, y, cell, cell);
    } else {
        context.fillStyle = '#f2b183';
        context.fillRect(x, y, cell, cell);
        context.strokeStyle = 'white';
        context.strokeRect(x + cell * .1, y + cell * .1, cell * .8, cell * .8);
    }
    context.fillStyle = 'white';
    context.font = `${Math.min(cell * .2, cell * .72 / (number.length * .62))}px Arial`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(number, x + cell / 2, y + cell / 2);
}
function drawArea() {
    context.fillStyle = 'white';
    context.fillRect(0, 0, boardWidth, boardHeight);
    const scrollRows = scroller.scrollTop / cell;
    const first = Math.floor(scrollRows);
    const startRow = Math.floor(puzzle.config.layout.amidaStartRows);
    const startOffset = puzzle.config.layout.amidaStartRows - startRow;
    const firstPatternRow = Math.ceil(puzzle.config.layout.amidaStartRows);
    for (let local = first; local < Math.ceil(scrollRows + boardHeight / cell); local++) {
        const row = baseRow + BigInt(local);
        const y = (local - scrollRows) * cell;
        context.strokeStyle = '#20252d';
        context.lineWidth = Math.max(2, cell * .025);
        context.beginPath();
        if (row >= BigInt(startRow)) {
            for (let col = 0; col < 5; col++) {
                const x = (col + .5) * cell;
                context.moveTo(x, row === BigInt(startRow) ? y + cell * startOffset : y);
                context.lineTo(x, y + cell);
            }
        }
        if (row >= BigInt(firstPatternRow)) {
            for (const connection of puzzle.connections(row - BigInt(firstPatternRow))) {
                const left = (connection.lane + .5) * cell;
                context.moveTo(left, y + cell * connection.startOffset);
                context.lineTo(left + cell, y + cell * connection.endOffset);
            }
        }
        context.stroke();
        if (row === 0n) {
            context.fillStyle = '#20252d';
            context.font = `${cell * puzzle.config.layout.letterSizeRows}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            puzzle.config.letters.forEach((letter, col) => context.fillText(letter, (col + .5) * cell, y + cell * puzzle.config.layout.letterCenterRows));
        }
        if (!showAll) {
            for (let col = 0; col < 5; col++) {
                const id = puzzle.panelId(row, col);
                if (!opened.has(id)) drawPanelImage(id, col * cell, y);
            }
        }
    }
}
scroller.addEventListener('scroll', () => {
    const next = puzzle.rebase(baseRow, scroller.scrollTop / cell);
    if (next.base !== baseRow) {
        baseRow = next.base;
        scroller.scrollTop = next.scrollRows * cell;
    }
    if (press) press.moved = true;
    scheduleDraw();
}, { passive: true });
canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, lastY: event.clientY, moved: false };
    canvas.setPointerCapture?.(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
    if (!press || event.pointerId !== press.id) return;
    if (!press.moved && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 8) {
        press.moved = true;
        canvas.classList.add('dragging');
    }
    if (press.moved) {
        scroller.scrollTop += press.lastY - event.clientY;
        press.lastY = event.clientY;
    }
});
canvas.addEventListener('pointercancel', event => {
    if (press && event.pointerId === press.id) finishPointer();
});
canvas.addEventListener('pointerup', event => {
    if (!press || event.pointerId !== press.id) return;
    const start = press;
    finishPointer();
    if (start.moved || cleared || showAll) return;
    const bounds = canvas.getBoundingClientRect();
    const col = Math.floor((event.clientX - bounds.left) / cell);
    const row = baseRow + BigInt(Math.floor((event.clientY - bounds.top + scroller.scrollTop) / cell));
    if (col < 0 || col >= 5 || row < 0n) return;
    const id = puzzle.panelId(row, col);
    if (opened.has(id)) return;
    opened.add(id);
    scheduleDraw();
    // 初期5段目の開放をきっかけに、タップした箇所が少し上へ動く。
    // ヒント文や矢印を足さず、6段目の存在を動きで伝える。一度だけ。
    if (!scrollHintShown && row === 4n && baseRow === 0n && scroller.scrollTop < cell * .25) {
        scrollHintShown = true;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        scroller.scrollBy({ top: cell * .45, behavior: reducedMotion ? 'instant' : 'smooth' });
    }
});
function finishPointer() {
    if (press) canvas.releasePointerCapture?.(press.id);
    press = null;
    canvas.classList.remove('dragging');
}
// 標準CASEの回答・結果フロー
document.getElementById('answer-form').addEventListener('submit', event => {
    event.preventDefault();
    if (cleared) return;
    const answer = document.getElementById('answerInput').value.trim().normalize('NFKC').toLowerCase();
    if (answers.some(value => value.normalize('NFKC').toLowerCase() === answer)) {
        cleared = true;
        tweetMess = make_tweet();
        showResultButtons(tweetMess);
        window.showCaseMessage('正解！');
    } else {
        remainingAttempts--;
        document.getElementById('remainingAttempts').textContent = `残り解答回数: ${remainingAttempts}`;
        window.showCaseMessage('ちがいます');
    }
});

function make_tweet(res = 0) {
    const score = 25 - opened.size;
    const attempt = 3 - remainingAttempts + 1;
    let tweetText = `CASE${nazoid}\n\nScore: ${score}/25 (${attempt}回目)\n`;

    for (let row = 0; row < 5; row++) {
        let line = '';
        for (let col = 0; col < 5; col++) {
            const panelId = String(row * 5 + col + 1);
            line += opened.has(panelId) ? '⬜' : '🟨';
        }
        tweetText += `${line}\n`;
    }

    tweetText += `#NaguruzoMondo\n`;
    tweetText += location.origin + location.pathname;
    return tweetText;
}

function tweet(tweetText) {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank', 'noopener');
}

function allOpen() {
    showAll = true;
    scheduleDraw();
}

function showExplanationMessageOnScreen(message, open = false) {
    const box = document.getElementById('explanation-message');
    document.getElementById('explanation-message-body').textContent = message;
    box.hidden = false;
    box.open = open;
}

function showResultButtons() {
    document.getElementById('answer-form').hidden = true;
    document.getElementById('result-buttons').hidden = false;
    showExplanationMessageOnScreen(explanationMessage, false);
}

document.getElementById('share-result').addEventListener('click', () => tweet(tweetMess));
document.getElementById('all-open').addEventListener('click', event => {
    allOpen();
    event.currentTarget.disabled = true;
});

panelImage.onload = scheduleDraw;
panelImage.src = 'images/panel.PNG';
new ResizeObserver(resizeBoard).observe(scroller);
resizeBoard();
