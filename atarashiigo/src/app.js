import { createGame, play, undo, countStones, canHumanPlay } from './engine.js';
import { chooseMove } from './cpu.js';
import { TIP_BONUS, SHARE_BONUS, LOTTERY_UNLOCK, LOTTERY_COST, LOTTERY_PRIZES, CONTACT_TOPICS, freshBonus, scoreGame, drawLottery } from './bonus.js';
const $ = id => document.getElementById(id);
const bonus = freshBonus();
let sharedThisGame = false;
let hasWon = false;
let closeContactAfterBonus = false;
const formatKomi = value => value.toLocaleString('ja-JP');
const whiteScore = stones => `${stones}石${bonus.komi > 0 ? `＋${formatKomi(bonus.komi)}目` : ''}`;
function updateWhiteScore(board = state.board) {
  $('white-count').textContent = countStones(board).white;
  $('white-komi').textContent = bonus.komi > 0 ? `＋${formatKomi(bonus.komi)}目` : '';
  $('white-komi').hidden = bonus.komi === 0;
}
function showBonus(message, detail = '', closeContact = false) {
  closeContactAfterBonus = closeContact;
  $('bonus-title').textContent = message; $('bonus-detail').textContent = detail;
  $('bonus-detail').hidden = !detail;
  if (!$('bonus-popup').open) $('bonus-popup').showModal();
}
let state = createGame(), history = [state], busy = false, sound = true;
let timers = new Set(), points = [], pendingChange = null, audio;
let tutorialActive = true, tutorialStep = 0, tutorialDone = false, tutorialPoints = [];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
function later(fn, ms) { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); }
function cancelTimers() { timers.forEach(clearTimeout); timers.clear(); busy = false; }
function tone() {
  if (!sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state !== 'running') { audio.resume().catch(() => {}); return; }
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(580, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(120, audio.currentTime + .065);
    g.gain.setValueAtTime(.09, audio.currentTime); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .09);
    o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + .1);
  } catch { /* Sound is optional. */ }
}
function endTone() {
  if (!sound || !audio || audio.state !== 'running') return;
  try {
    const now = audio.currentTime;
    for (const [start, end, volume] of [[100,42,.23],[151,63,.065],[224,94,.025]]) {
      const o = audio.createOscillator(), g = audio.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(start, now); o.frequency.exponentialRampToValueAtTime(end,now+1.7);
      g.gain.setValueAtTime(.001,now); g.gain.exponentialRampToValueAtTime(volume,now+.055);
      g.gain.exponentialRampToValueAtTime(.001,now+2.8);
      o.connect(g); g.connect(audio.destination); o.start(now); o.stop(now+3);
    }
  } catch { /* The visual ending also works without audio. */ }
}
function unlockAudio() { if (!sound) return; try { audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume().catch(() => {}); } catch {} }
document.addEventListener('pointerdown', unlockAudio, { passive: true });
/** Shared renderer for the actual board and the tutorial's separate 5x5 board. */
function makeBoard(board, n, onPoint) {
  const pad = 5.6, step = (100 - pad * 2) / (n - 1), cells = [];
  board.replaceChildren(); board.style.setProperty('--cell', `${step}%`);
  board.setAttribute('aria-label', `${n}路盤`);
  for (let i = 0; i < n; i++) {
    for (const axis of ['h', 'v']) {
      const line = document.createElement('span'); line.className = `grid-line ${axis}`;
      Object.assign(line.style, axis === 'h' ? { left: `${pad}%`, top: `${pad + step * i}%`, width: `${100 - pad * 2}%` } : { top: `${pad}%`, left: `${pad + step * i}%`, height: `${100 - pad * 2}%` }); board.append(line);
    }
  }
  const starPositions = n <= 7 ? [[(n-1)/2,(n-1)/2]] : [[2,2],[n-3,2],[(n-1)/2,(n-1)/2],[2,n-3],[n-3,n-3]];
  for (const [x,y] of starPositions) { const dot = document.createElement('span'); dot.className = 'star'; dot.style.left = `${pad + step*x}%`; dot.style.top = `${pad + step*y}%`; board.append(dot); }
  for (let i = 0; i < n*n; i++) {
    const p = document.createElement('button'); p.className = 'point empty'; p.type = 'button'; p.style.left = `${pad + step*(i%n)}%`; p.style.top = `${pad + step*Math.floor(i/n)}%`;
    p.addEventListener('click', () => onPoint(i));
    p.addEventListener('keydown', e => {
      const next = {ArrowLeft:i-1,ArrowRight:i+1,ArrowUp:i-n,ArrowDown:i+n}[e.key];
      if (next !== undefined) { e.preventDefault(); if (cells[next]) cells[next].focus(); }
    });
    cells.push(p); board.append(p);
  }
  return cells;
}
function paintPoint(p, color, i, size, extra = '', disabled = false) {
  p.className = `point${color ? '' : ' empty'}${extra}`; p.replaceChildren();
  if (color) { const stone = document.createElement('span'); stone.className = `stone ${color === 1 ? 'black' : 'white'}`; p.append(stone); }
  p.setAttribute('aria-label', `${Math.floor(i/size)+1}行${i%size+1}列 ${color === 1 ? '黒' : color === 2 ? '白' : '空点'}`);
  p.setAttribute('aria-disabled', String(disabled));
}
function buildBoard() {
  $('board').className = 'board';
  points = makeBoard($('board'), state.size, i => { if (!tutorialActive && !busy && canHumanPlay(state, 'cpu')) commit(i); });
}
function draw(board = state.board, event = null) {
  points.forEach((p,i) => paintPoint(p, board[i], i, state.size,
    `${i === state.last ? ' last' : ''}${event?.index === i ? ' placed' : ''}${event?.flipped.includes(i) ? ' flip' : ''}`,
    Boolean(board[i]) || busy || tutorialActive || !canHumanPlay(state, 'cpu')));
}
function info(board = state.board) {
  const c = countStones(board);
  $('black-count').textContent = c.black; updateWhiteScore(board);
  $('moves').textContent = state.moves; $('total').textContent = ` / ${state.size**2} 手`;
  $('progress-bar').style.width = `${state.moves/(state.size**2)*100}%`;
  $('black-player').classList.toggle('active', !state.over && state.turn === 1);
  $('white-player').classList.toggle('active', !state.over && state.turn === 2);
  $('status').textContent = tutorialActive ? 'チュートリアル' : state.over ? (busy ? '終局' : '対局が終了しました') : busy ? '着手中' : state.turn === 1 ? 'CPUが考えています…' : 'あなたの手番です';
  $('undo').disabled = tutorialActive || history.length <= 2 || (state.over && busy);
  $('size').disabled = tutorialActive || (state.over && busy);
  $('rules-open').disabled = tutorialActive || (state.over && busy);
  $('size').value = state.size;
}
function animate(before, event, done) {
  busy = true; $('result').hidden = true;
  const placed = before.board.slice(); placed[event.index] = event.player;
  $('board').classList.remove('final'); $('final-caption').classList.remove('show');
  void $('board').offsetWidth;
  if (event.final) {
    $('board').classList.add('final');
    if (!reduced.matches) {
      later(() => $('final-caption').classList.add('show'), 1250);
      later(endTone, 1850);
    }
  }
  draw(placed, event); info(placed); tone();
  const midpoint = reduced.matches ? 0 : event.final ? 740 : event.flipped.length ? 170 : 0;
  later(() => {
    event.flipped.forEach(i => {
      const stone = points[i].firstElementChild;
      if (stone) stone.className = `stone ${state.board[i] === 1 ? 'black' : 'white'}`;
      points[i].setAttribute('aria-label', `${Math.floor(i/state.size)+1}行${i%state.size+1}列 ${state.board[i] === 1 ? '黒' : '白'}`);
    });
    info();
  }, midpoint);
  later(() => {
    busy = false; $('board').classList.remove('final'); $('final-caption').classList.remove('show'); draw(); info(); done();
  }, reduced.matches ? 80 : event.final ? 6200 : event.flipped.length ? 390 : 120);
}
function commit(index) {
  const before = state, result = play(state, index); if (!result) return;
  state = result.state; history.push(state);
  animate(before, result.event, () => state.over ? showResult() : scheduleCpu());
}
function scheduleCpu() {
  if (tutorialActive || state.turn !== 1 || state.over) return;
  info();
  later(() => { if (!tutorialActive && state.turn === 1 && !state.over && !busy) commit(chooseMove(state)); }, 330 + Math.random()*180);
}
function updateResult() {
  const c = scoreGame(countStones(state.board), bonus.komi);
  if (state.over && !busy && c.winner === 'white') hasWon = true;
  $('result-title').textContent = c.winner === 'white' ? '白の勝ち' : c.winner === 'draw' ? '引き分け' : '黒の勝ち';
  $('result-score').textContent = `黒：${c.black}石\n白：${whiteScore(c.white)}`;
  updateWhiteScore();
  $('share-x').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText())}&url=${encodeURIComponent(shareUrl())}`;
  $('share-x').setAttribute('aria-disabled', String(sharedThisGame));
  $('share-x').tabIndex = sharedThisGame ? -1 : 0;
  $('lottery-open').hidden = bonus.komi < LOTTERY_COST || c.winner !== 'black';
  $('lottery-draw').disabled = bonus.komi < LOTTERY_COST || c.winner !== 'black' || !state.over || busy;
  $('lottery-balance').textContent = `所持コミ：${formatKomi(bonus.komi)}目`;
}
function showResult() {
  updateResult();
  $('result').hidden = false;
  $('result').focus({ preventScroll: true });
  $('result').scrollIntoView({ block: 'nearest', behavior: reduced.matches ? 'instant' : 'smooth' });
}
function shareText() {
  const counts = countStones(state.board);
  if (scoreGame(counts, 0).winner === 'white') return '新しい囲碁、あたらし囲碁でCPUに良い感じの勝利、良い勝利を収めた。\n#あたらし囲碁\n';
  return scoreGame(counts, bonus.komi).winner === 'white'
    ? '新しい囲碁、あたらし囲碁でCPUに大きな勝利、大勝利を収めた。\n#あたらし囲碁\n'
    : '新しい囲碁、あたらし囲碁でCPUに大きな敗北、大敗北を喫した。\n#あたらし囲碁\n';
}
function shareUrl() { return location.href.split('#')[0]; }
function reset(size = state.size) {
  cancelTimers(); state = createGame(size); history = [state];
  sharedThisGame = false;
  if ($('bonus-popup').open) $('bonus-popup').close();
  if ($('lottery').open) $('lottery').close();
  $('result').hidden = true; $('final-caption').classList.remove('show');
  buildBoard(); draw(); info(); scheduleCpu();
}
function requestSize(newSize) {
  if (tutorialActive || (busy && state.over)) return;
  if (state.moves <= 1 || state.over) { reset(newSize); return; }
  pendingChange = () => reset(newSize); $('confirm').showModal(); $('size').value = state.size;
}
function tutorialScene() {
  tutorialDone = false; $('tutorial-next').disabled = true;
  $('tutorial-next').textContent = tutorialStep === 0 ? '次へ' : '対局を始める';
  $('tutorial-step').textContent = `${tutorialStep+1} / 2`;
  $('tutorial-title').textContent = tutorialStep === 0 ? '石は交点に置きます' : '囲んだ石は自分の色になります';
  $('tutorial-description').textContent = tutorialStep === 0 ? '印のある交点をタップしてみてください。' : '白石を置いて、中央の黒石を上下左右から囲んでください。';
  $('tutorial-feedback').textContent = '';
  const board = Array(25).fill(0), target = tutorialStep === 0 ? 12 : 13;
  if (tutorialStep === 1) { board[12] = 1; for (const i of [7,11,17]) board[i] = 2; }
  tutorialPoints = makeBoard($('tutorial-board'), 5, i => {
    if (tutorialDone || i !== target) return;
    tutorialDone = true;
    // The tutorial uses the very same transition function as the real game.
    const result = play({size:5,board,turn:2,moves:tutorialStep === 0 ? 0 : 4,last:-1,over:false},i);
    paintPoint(tutorialPoints[i],2,i,5,' placed',true); tone();
    $('tutorial-feedback').textContent = tutorialStep === 0 ? '交点に石を置けました。' : '囲まれた黒石が白石に変わります。';
    if (tutorialStep === 0) { $('tutorial-next').disabled = false; $('tutorial-next').focus(); }
    else {
      for (const p of result.event.flipped) {
        tutorialPoints[p].classList.add('flip');
        later(() => { tutorialPoints[p].firstElementChild.className = 'stone white'; }, reduced.matches ? 0 : 170);
      }
      later(() => { $('tutorial-next').disabled = false; $('tutorial-next').focus(); }, reduced.matches ? 80 : 430);
    }
  });
  tutorialPoints.forEach((p,i) => paintPoint(p,board[i],i,5,i === target ? ' tutorial-target' : '',i !== target));
  tutorialPoints[target].focus();
}
$('tutorial-next').addEventListener('click', () => {
  if (!tutorialDone || $('tutorial-next').disabled) return;
  if (tutorialStep === 0) { tutorialStep = 1; tutorialScene(); }
  else { $('tutorial').close(); tutorialActive = false; draw(); info(); $('board').focus(); scheduleCpu(); }
});
$('tutorial').addEventListener('cancel', e => e.preventDefault());
$('undo').addEventListener('click', () => {
  if ($('undo').disabled) return;
  cancelTimers(); history = undo(history, 'cpu'); state = history.at(-1);
  $('result').hidden = true; $('board').classList.remove('final'); $('final-caption').classList.remove('show'); draw(); info(); scheduleCpu();
});
$('size').addEventListener('change', e => requestSize(Number(e.target.value)));
$('accept-change').addEventListener('click', () => { $('confirm').close(); pendingChange?.(); pendingChange = null; });
$('cancel-change').addEventListener('click', () => { $('confirm').close(); pendingChange = null; });
$('confirm').addEventListener('cancel', () => { pendingChange = null; });
$('sound').addEventListener('click', () => { sound = !sound; $('sound').textContent = `音 ${sound ? 'ON' : 'OFF'}`; $('sound').setAttribute('aria-pressed', String(sound)); $('sound').setAttribute('aria-label', `効果音を${sound ? 'オフ' : 'オン'}にする`); });
$('rules-open').addEventListener('click', () => $('rules').showModal());
for (const id of ['rules-close','rules-done']) $(id).addEventListener('click', () => $('rules').close());
$('share-x').addEventListener('click', e => {
  if (!state.over || busy || sharedThisGame) { e.preventDefault(); return; }
  // Keep this game's claim when undoing and replaying the ending.
  sharedThisGame = true;
  bonus.komi += SHARE_BONUS; bonus.unlocked ||= bonus.komi >= LOTTERY_UNLOCK;
  updateResult();
  showBonus('口コミボーナス！\nコミを６目半獲得しました');
});
$('bonus-close').addEventListener('click', () => {
  $('bonus-popup').close();
});
$('bonus-popup').addEventListener('close', () => {
  if (closeContactAfterBonus) {
    closeContactAfterBonus = false;
    if ($('contact').open) $('contact').close();
  }
});
$('play-again').addEventListener('click', () => reset());
$('lottery-open').addEventListener('click', () => {
  if (!state.over || busy || bonus.komi < LOTTERY_COST || scoreGame(countStones(state.board), bonus.komi).winner !== 'black') return;
  updateResult(); $('lottery').showModal();
});
$('lottery-close').addEventListener('click', () => $('lottery').close());
$('lottery-draw').addEventListener('click', () => {
  if (!state.over || busy || !bonus.unlocked || bonus.komi < LOTTERY_COST || scoreGame(countStones(state.board), bonus.komi).winner !== 'black') return;
  const prize = drawLottery(); bonus.komi += prize.amount - LOTTERY_COST; bonus.lotteryDraws++; updateResult();
  showBonus(prize.amount ? `${prize.label}！\nコミを${prize.amount}目獲得しました` : 'はずれ。\nまたのご参加をお待ちしています。');
});
for (const prize of LOTTERY_PRIZES) {
  const row = document.createElement('tr');
  for (const text of [prize.label, `${formatKomi(prize.amount)}目`, prize.displayChance]) { const cell = document.createElement('td'); cell.textContent = text; row.append(cell); }
  $('lottery-prizes').append(row);
}
function availableContactTopics() {
  return CONTACT_TOPICS.filter(topic => {
    if (topic.id === 'secrets') return hasWon;
    if (topic.id === 'lottery') return bonus.lotteryDraws > 0 && !bonus.tipClaimed;
    return true;
  });
}
function renderContactTopics() {
  $('contact-topic').replaceChildren();
  const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = '選択してください'; $('contact-topic').append(placeholder);
  for (const topic of availableContactTopics()) { const option = document.createElement('option'); option.value = topic.id; option.textContent = topic.label; $('contact-topic').append(option); }
}
$('contact-open').addEventListener('click', () => {
  renderContactTopics();
  $('contact-form').reset(); $('contact-detail').replaceChildren(); $('contact-detail-label').hidden = true;
  $('contact-message').textContent = ''; $('contact').showModal();
});
$('contact-close').addEventListener('click', () => $('contact').close());
$('contact-topic').addEventListener('change', () => {
  const topic = availableContactTopics().find(item => item.id === $('contact-topic').value);
  $('contact-detail').replaceChildren(); $('contact-message').textContent = ''; $('contact-detail-label').hidden = !topic;
  if (!topic) return;
  const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = '選択してください'; $('contact-detail').append(placeholder);
  for (const item of topic.items) { const option = document.createElement('option'); option.value = item.id; option.textContent = item.label; $('contact-detail').append(option); }
});
$('contact-detail').addEventListener('change', () => {
  const topic = availableContactTopics().find(item => item.id === $('contact-topic').value);
  const item = topic?.items.find(item => item.id === $('contact-detail').value);
  $('contact-message').textContent = item?.reply ?? '';
  if (topic?.id !== 'lottery' || item?.id !== 'odds') return;
  bonus.komi += TIP_BONUS; bonus.tipClaimed = true; bonus.unlocked = true;
  updateWhiteScore();
  if (state.over && !busy) updateResult();
  renderContactTopics(); $('contact-detail').replaceChildren(); $('contact-detail-label').hidden = true; $('contact-message').textContent = '';
  showBonus('タレコミボーナス！\n１兆目半を獲得', item.reply, true);
});
reset(); $('tutorial').showModal(); tutorialScene();
