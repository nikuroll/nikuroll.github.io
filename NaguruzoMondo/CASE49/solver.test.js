const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const solver = require("./solver.js");
const { enumerateSuccessfulBoards } = require("./test/enumerate.js");

function mask(binaryBoard) {
    return solver.maskFromCells(Array.from(binaryBoard, value => value === "1"));
}

test("empty board has no solution in either puzzle", () => {
    const result = solver.analyzeBoard(mask("0".repeat(25)));
    assert.equal(result.singleLoop.count, 0);
    assert.equal(result.shakashaka.count, 0);
});

test("2x2 white block is a unique loop but not a unique Shakashaka", () => {
    const board = mask("0000001100011000000000000");
    const loop = solver.solveSingleLoop(board, 3);
    const shakashaka = solver.solveShakashaka(board, 3);
    assert.equal(loop.count, 1);
    assert.equal(loop.capped, false);
    assert.equal(loop.solutions.length, 1);
    assert.equal(shakashaka.count, 2);
    assert.equal(shakashaka.capped, false);
    assert.equal(shakashaka.solutions.length, 2);
    assert.notEqual(
        shakashaka.solutions[0].triangles.join(","),
        shakashaka.solutions[1].triangles.join(",")
    );
    assert.ok(shakashaka.solution.triangles.some(value => value > 0));
});

test("the built-in example is unique under both rules", () => {
    const result = solver.analyzeBoard(mask("1111111011010101101111111"), 2);
    assert.equal(result.singleLoop.count, 1);
    assert.equal(result.singleLoop.capped, false);
    assert.equal(result.shakashaka.count, 1);
    assert.equal(result.shakashaka.capped, false);
    assert.equal(result.singleLoop.solutions.length, 1);
    assert.equal(result.shakashaka.solutions.length, 1);
    assert.ok(result.singleLoop.solution.edges.length > 0);
    assert.ok(result.shakashaka.solution.triangles.some(value => value > 0));
});

test("a full 4x4 area has multiple answers", () => {
    const board = mask("1111011110111101111000000");
    const loop = solver.solveSingleLoop(board);
    assert.equal(loop.capped, true);
    assert.equal(loop.solutions.length, 2);
    assert.notDeepEqual(loop.solutions[0].edges, loop.solutions[1].edges);
    assert.equal(solver.solveShakashaka(board).capped, true);
});

test("all 5x5 loop shapes contain 232 successful boards", () => {
    const result = enumerateSuccessfulBoards();
    assert.equal(result.loopSolvableBoards, 6812);
    assert.equal(result.uniqueLoopBoards, 5547);
    assert.equal(result.successfulBoards, 232);
    assert.equal(result.symmetryClasses, 36);
    assert.equal(result.boards.length, 232);
    assert.equal(result.symmetryRepresentatives.length, 36);
    assert.deepEqual(result.byOpenCount, { 12: 24, 14: 84, 16: 66, 18: 40, 20: 18 });
});

test("production page keeps the standard minimal CASE layout", () => {
    const productionHtml = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
    const testHtml = fs.readFileSync(path.join(__dirname, "test", "index.html"), "utf8");

    assert.match(productionHtml, /id="canvas"/);
    assert.match(productionHtml, /一覧に戻る/);
    assert.match(productionHtml, /src="solver\.js"/);
    assert.doesNotMatch(productionHtml, /solver-panel|case49-intro|expectedBoardDetails|quiz-container/);

    const productionMain = fs.readFileSync(path.join(__dirname, "main.js"), "utf8");
    assert.doesNotMatch(productionMain, /URLSearchParams|searchParams|\?ac=/);
    assert.doesNotMatch(productionMain, /if \(pressedCell >= 0\) redraw\(\);\s*return false;/);
    assert.doesNotMatch(productionMain, /pressedCell = -1;\s*redraw\(\);\s*}\s*return false;/);
    assert.match(productionMain, /if \(mouseButton === RIGHT\) return false;/);

    assert.match(testHtml, /CASE49 TEST/);
    assert.match(testHtml, /expectedBoardDetails/);
    assert.match(testHtml, /src="\.\.\/solver\.js"/);
});
