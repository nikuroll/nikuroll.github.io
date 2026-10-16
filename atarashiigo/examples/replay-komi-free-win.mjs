// Run from the repository root:
// node atarashiigo/examples/replay-komi-free-win.mjs
// This only simulates a game; it does not change the browser game or its RNG.
import assert from 'node:assert/strict';
import { createGame, play, countStones } from '../src/engine.js';
import { chooseMove } from '../src/cpu.js';

function seededRandom(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const whiteMoves = [34,45,20,29,37,39,10,12,6,0,2,26,22,44,4,14,36,7,24,8,15,21,47,16];
const random = seededRandom(379);
let state = createGame(7), whiteIndex = 0;
while (!state.over) {
  const player = state.turn;
  const index = player === 1 ? chooseMove(state, random) : whiteMoves[whiteIndex++];
  const result = play(state, index);
  assert.ok(result, `Illegal move ${state.moves + 1}`);
  console.log(`${state.moves + 1}: ${player === 1 ? 'B' : 'W'} (${Math.floor(index / 7) + 1},${index % 7 + 1}) captures=${result.event.captured.length}`);
  if (state.moves === 47) assert.equal(result.event.captured.length, 32);
  state = result.state;
}
const counts = countStones(state.board);
assert.deepEqual(counts, { black: 4, white: 45 });
console.log('Komi: 0. Result:', counts, 'White wins.');
