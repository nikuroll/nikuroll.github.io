import { play, groupAt, neighbors } from './engine.js';
/** One-ply heuristic. Only ordinary legal empty-point moves, never alters the result. */
export function chooseMove(state, random = Math.random) {
  if (state.over) return -1;
  const { board, size, turn } = state;
  let best = -Infinity, choice = -1;
  const threatened = new Set(), seen = new Set();
  board.forEach((stone, p) => {
    if (stone !== turn || seen.has(p)) return;
    const g = groupAt(board, size, p); g.stones.forEach(i => seen.add(i));
    if (g.liberties.size === 1) g.stones.forEach(i => threatened.add(i));
  });
  for (let p = 0; p < board.length; p++) {
    if (board[p]) continue;
    const result = play(state, p), g = groupAt(result.state.board, size, p);
    const adjacent = neighbors(p, size), own = adjacent.filter(i => board[i] === turn).length;
    const enemy = adjacent.filter(i => board[i] === 3 - turn).length;
    const x = p % size, y = Math.floor(p / size), edge = Math.min(x, y, size - 1 - x, size - 1 - y);
    let score = result.event.captured.length * 18 - result.event.suicide.length * 30;
    if (result.state.board[p] === turn) {
      score += Math.min(g.liberties.size, 6) * 1.3;
      score += g.stones.filter(i => threatened.has(i)).length * (g.liberties.size > 1 ? 8 : 0);
      if (g.liberties.size === 1) score -= 7;
    }
    score += enemy * 1.4 + (own === 1 ? 2 : own >= 3 ? -5 : 0);
    if (state.moves < size * 2) score += edge === 2 ? 4 : edge === 0 ? -3 : 1;
    score += random() * 3;
    if (score > best) { best = score; choice = p; }
  }
  return choice;
}
