/** @typedef {0|1|2} Stone  Empty / black / white. */
export const BLACK = 1, WHITE = 2;
export function createGame(size = 9) {
  if (![7, 9, 13].includes(size)) throw new Error('Unsupported board size');
  return { size, board: Array(size * size).fill(0), turn: BLACK, moves: 0, last: -1, over: false };
}
export function neighbors(index, size) {
  const x = index % size, y = Math.floor(index / size), result = [];
  if (x > 0) result.push(index - 1);
  if (x < size - 1) result.push(index + 1);
  if (y > 0) result.push(index - size);
  if (y < size - 1) result.push(index + size);
  return result;
}
export function groupAt(board, size, start) {
  if (!board[start]) return { stones: [], liberties: new Set() };
  const seen = new Set([start]), stack = [start], liberties = new Set();
  while (stack.length) {
    for (const p of neighbors(stack.pop(), size)) {
      if (!board[p]) liberties.add(p);
      else if (board[p] === board[start] && !seen.has(p)) { seen.add(p); stack.push(p); }
    }
  }
  return { stones: [...seen], liberties };
}
export function countStones(board) {
  return { black: board.filter(x => x === BLACK).length, white: board.filter(x => x === WHITE).length };
}
/** Pure transition: old state is never mutated; collect captures before flipping. */
export function play(state, index) {
  if (state.over || !Number.isInteger(index) || index < 0 || index >= state.board.length || state.board[index]) return null;
  const { size, turn } = state, other = 3 - turn, board = state.board.slice();
  board[index] = turn;
  const final = !board.includes(0), captured = [], visited = new Set();
  const adjacent = neighbors(index, size);
  const touchesEnemy = adjacent.some(i => board[i] === other);
  // Only enemy groups touching this move can be captured. Do not chain flips.
  for (const i of adjacent) {
    if (board[i] !== other || visited.has(i)) continue;
    const group = groupAt(board, size, i);
    group.stones.forEach(p => visited.add(p));
    if (group.liberties.size === 0) captured.push(...group.stones);
  }
  captured.forEach(p => { board[p] = turn; });
  let suicide = [];
  if (!captured.length && touchesEnemy) {
    const own = groupAt(board, size, index);
    if (!own.liberties.size) { suicide = own.stones; suicide.forEach(p => { board[p] = other; }); }
  }
  return {
    state: { size, board, turn: other, moves: state.moves + 1, last: index, over: final },
    event: { index, player: turn, captured, suicide, flipped: [...captured, ...suicide], final }
  };
}
export function undo(history, mode) {
  if (history.length <= 1) return history;
  let end = history.length - 1;
  // Return to the last human decision, removing a pending human move or a full pair.
  if (mode === 'cpu') while (end > 0 && history[end - 1].turn !== WHITE) end--;
  return history.slice(0, Math.max(1, end));
}
export function canHumanPlay(state, mode) { return !state.over && (mode !== 'cpu' || state.turn === WHITE); }
