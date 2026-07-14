(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.Case49Solver = api;
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const SIZE = 5;
    const CELL_COUNT = SIZE * SIZE;
    const EPSILON = 1e-7;

    const ORTHOGONAL_NEIGHBORS = Array.from({ length: CELL_COUNT }, (_, index) => {
        const row = Math.floor(index / SIZE);
        const col = index % SIZE;
        const neighbors = [];
        if (row > 0) neighbors.push(index - SIZE);
        if (col < SIZE - 1) neighbors.push(index + 1);
        if (row < SIZE - 1) neighbors.push(index + SIZE);
        if (col > 0) neighbors.push(index - 1);
        return neighbors;
    });

    let shakashakaUniverse = null;

    function bit(index) {
        return 1 << index;
    }

    function hasCell(mask, index) {
        return (mask & bit(index)) !== 0;
    }

    function popcount(mask) {
        let value = mask >>> 0;
        let count = 0;
        while (value !== 0) {
            value &= value - 1;
            count++;
        }
        return count;
    }

    function maskFromCells(cells) {
        let mask = 0;
        for (let index = 0; index < CELL_COUNT; index++) {
            if (cells[index]) mask |= bit(index);
        }
        return mask;
    }

    function cellsFromMask(mask) {
        return Array.from({ length: CELL_COUNT }, (_, index) => hasCell(mask, index));
    }

    function isConnected(mask) {
        if (mask === 0) return false;
        let start = 0;
        while (!hasCell(mask, start)) start++;

        let reached = bit(start);
        const queue = [start];
        for (let head = 0; head < queue.length; head++) {
            const current = queue[head];
            for (const next of ORTHOGONAL_NEIGHBORS[current]) {
                if (hasCell(mask, next) && !hasCell(reached, next)) {
                    reached |= bit(next);
                    queue.push(next);
                }
            }
        }
        return reached === mask;
    }

    function remainingPathIsPossible(remainingMask, endpoint, start) {
        const allowedMask = remainingMask | bit(endpoint) | bit(start);
        const queue = [endpoint];
        let reached = bit(endpoint);

        for (let head = 0; head < queue.length; head++) {
            const current = queue[head];
            for (const next of ORTHOGONAL_NEIGHBORS[current]) {
                if (hasCell(allowedMask, next) && !hasCell(reached, next)) {
                    reached |= bit(next);
                    queue.push(next);
                }
            }
        }
        if ((reached & allowedMask) !== allowedMask) return false;

        let endpointDegree = 0;
        let startDegree = 0;
        for (const next of ORTHOGONAL_NEIGHBORS[endpoint]) {
            if (hasCell(remainingMask | bit(start), next)) endpointDegree++;
        }
        for (const next of ORTHOGONAL_NEIGHBORS[start]) {
            if (hasCell(remainingMask | bit(endpoint), next)) startDegree++;
        }
        if (endpointDegree === 0 || startDegree === 0) return false;

        for (let index = 0; index < CELL_COUNT; index++) {
            if (!hasCell(remainingMask, index)) continue;
            let degree = 0;
            for (const next of ORTHOGONAL_NEIGHBORS[index]) {
                if (hasCell(allowedMask, next)) degree++;
            }
            if (degree < 2) return false;
        }
        return true;
    }

    function solveSingleLoop(openMask, limit = 2) {
        const openCount = popcount(openMask);
        const result = { count: 0, capped: false, solution: null, solutions: [] };
        if (openCount < 4 || openCount % 2 !== 0 || !isConnected(openMask)) return result;

        let lightCells = 0;
        let darkCells = 0;
        let start = -1;
        let smallestDegree = Infinity;

        for (let index = 0; index < CELL_COUNT; index++) {
            if (!hasCell(openMask, index)) continue;
            const row = Math.floor(index / SIZE);
            const col = index % SIZE;
            if ((row + col) % 2 === 0) lightCells++;
            else darkCells++;

            const degree = ORTHOGONAL_NEIGHBORS[index].filter(next => hasCell(openMask, next)).length;
            if (degree < 2) return result;
            if (degree < smallestDegree) {
                smallestDegree = degree;
                start = index;
            }
        }
        if (lightCells !== darkCells) return result;

        const path = [start];
        let visitedMask = bit(start);
        const solutions = [];

        function recordSolution() {
            if (path[1] > path[path.length - 1]) return;
            const edges = [];
            for (let i = 0; i < path.length; i++) {
                const a = path[i];
                const b = path[(i + 1) % path.length];
                edges.push(a < b ? [a, b] : [b, a]);
            }
            edges.sort((left, right) => left[0] - right[0] || left[1] - right[1]);
            solutions.push({ path: path.slice(), edges });
        }

        function search(current) {
            if (solutions.length >= limit) return;
            if (path.length === openCount) {
                if (ORTHOGONAL_NEIGHBORS[current].includes(start)) recordSolution();
                return;
            }

            const candidates = ORTHOGONAL_NEIGHBORS[current]
                .filter(next => hasCell(openMask, next) && !hasCell(visitedMask, next))
                .sort((left, right) => {
                    const leftOptions = ORTHOGONAL_NEIGHBORS[left]
                        .filter(next => hasCell(openMask, next) && !hasCell(visitedMask, next)).length;
                    const rightOptions = ORTHOGONAL_NEIGHBORS[right]
                        .filter(next => hasCell(openMask, next) && !hasCell(visitedMask, next)).length;
                    return leftOptions - rightOptions;
                });

            for (const next of candidates) {
                const nextBit = bit(next);
                visitedMask |= nextBit;
                path.push(next);

                const remainingMask = openMask & ~visitedMask;
                const isLastCell = path.length === openCount;
                if (isLastCell || remainingPathIsPossible(remainingMask, next, start)) {
                    search(next);
                }

                path.pop();
                visitedMask &= ~nextBit;
                if (solutions.length >= limit) return;
            }
        }

        search(start);
        result.count = solutions.length;
        result.capped = solutions.length >= limit;
        result.solution = solutions[0] || null;
        result.solutions = solutions;
        return result;
    }

    function polygonArea(polygon) {
        let twiceArea = 0;
        for (let i = 0; i < polygon.length; i++) {
            const a = polygon[i];
            const b = polygon[(i + 1) % polygon.length];
            twiceArea += a.x * b.y - b.x * a.y;
        }
        return Math.abs(twiceArea) / 2;
    }

    function polygonCentroid(polygon) {
        let crossSum = 0;
        let xSum = 0;
        let ySum = 0;
        for (let i = 0; i < polygon.length; i++) {
            const a = polygon[i];
            const b = polygon[(i + 1) % polygon.length];
            const cross = a.x * b.y - b.x * a.y;
            crossSum += cross;
            xSum += (a.x + b.x) * cross;
            ySum += (a.y + b.y) * cross;
        }
        if (Math.abs(crossSum) < EPSILON) return null;
        return {
            x: xSum / (3 * crossSum),
            y: ySum / (3 * crossSum)
        };
    }

    function clipPolygon(polygon, valueOf, boundary, keepGreater) {
        if (polygon.length === 0) return polygon;
        const clipped = [];

        for (let i = 0; i < polygon.length; i++) {
            const from = polygon[i];
            const to = polygon[(i + 1) % polygon.length];
            const fromValue = valueOf(from) - boundary;
            const toValue = valueOf(to) - boundary;
            const fromInside = keepGreater ? fromValue >= -EPSILON : fromValue <= EPSILON;
            const toInside = keepGreater ? toValue >= -EPSILON : toValue <= EPSILON;

            if (fromInside) clipped.push(from);
            if (fromInside !== toInside) {
                const ratio = fromValue / (fromValue - toValue);
                clipped.push({
                    x: from.x + (to.x - from.x) * ratio,
                    y: from.y + (to.y - from.y) * ratio
                });
            }
        }
        return clipped;
    }

    function clipCellToDiagonalRectangle(row, col, rectangle) {
        let polygon = [
            { x: col, y: row },
            { x: col + 1, y: row },
            { x: col + 1, y: row + 1 },
            { x: col, y: row + 1 }
        ];
        polygon = clipPolygon(polygon, point => point.x + point.y, rectangle.u0, true);
        polygon = clipPolygon(polygon, point => point.x + point.y, rectangle.u1, false);
        polygon = clipPolygon(polygon, point => point.x - point.y, rectangle.v0, true);
        polygon = clipPolygon(polygon, point => point.x - point.y, rectangle.v1, false);
        return polygon;
    }

    function oppositeCornerFromWhiteCentroid(centroid, row, col) {
        const localX = centroid.x - col;
        const localY = centroid.y - row;
        const whiteIsLeft = localX < 0.5;
        const whiteIsTop = localY < 0.5;

        if (whiteIsLeft && whiteIsTop) return 3; // black: bottom-right
        if (!whiteIsLeft && whiteIsTop) return 4; // black: bottom-left
        if (!whiteIsLeft && !whiteIsTop) return 1; // black: top-left
        return 2; // black: top-right
    }

    function addAxisCandidates(candidates) {
        for (let y0 = 0; y0 < SIZE; y0++) {
            for (let y1 = y0 + 1; y1 <= SIZE; y1++) {
                for (let x0 = 0; x0 < SIZE; x0++) {
                    for (let x1 = x0 + 1; x1 <= SIZE; x1++) {
                        let mask = 0;
                        const coverage = [];
                        for (let row = y0; row < y1; row++) {
                            for (let col = x0; col < x1; col++) {
                                const index = row * SIZE + col;
                                mask |= bit(index);
                                coverage.push({ index, blackCorner: 0 });
                            }
                        }
                        candidates.push({
                            orientation: "axis",
                            x0, x1, y0, y1,
                            mask,
                            coverage
                        });
                    }
                }
            }
        }
    }

    function parity(value) {
        return ((value % 2) + 2) % 2;
    }

    function diagonalVerticesInsideBoard(u0, u1, v0, v1) {
        for (const u of [u0, u1]) {
            for (const v of [v0, v1]) {
                const x = (u + v) / 2;
                const y = (u - v) / 2;
                if (x < -EPSILON || x > SIZE + EPSILON || y < -EPSILON || y > SIZE + EPSILON) {
                    return false;
                }
            }
        }
        return true;
    }

    function addDiagonalCandidates(candidates) {
        for (let u0 = 0; u0 < SIZE * 2; u0++) {
            for (let u1 = u0 + 1; u1 <= SIZE * 2; u1++) {
                for (let v0 = -SIZE; v0 < SIZE; v0++) {
                    for (let v1 = v0 + 1; v1 <= SIZE; v1++) {
                        const p = parity(u0);
                        if (parity(u1) !== p || parity(v0) !== p || parity(v1) !== p) continue;
                        if (!diagonalVerticesInsideBoard(u0, u1, v0, v1)) continue;

                        const rectangle = { orientation: "diagonal", u0, u1, v0, v1 };
                        let mask = 0;
                        let coveredArea = 0;
                        const coverage = [];
                        let valid = true;

                        for (let row = 0; row < SIZE && valid; row++) {
                            for (let col = 0; col < SIZE; col++) {
                                const polygon = clipCellToDiagonalRectangle(row, col, rectangle);
                                if (polygon.length < 3) continue;
                                const area = polygonArea(polygon);
                                if (area < EPSILON) continue;

                                let blackCorner = 0;
                                if (Math.abs(area - 0.5) < EPSILON) {
                                    const centroid = polygonCentroid(polygon);
                                    if (!centroid) {
                                        valid = false;
                                        break;
                                    }
                                    blackCorner = oppositeCornerFromWhiteCentroid(centroid, row, col);
                                } else if (Math.abs(area - 1) >= EPSILON) {
                                    valid = false;
                                    break;
                                }

                                const index = row * SIZE + col;
                                mask |= bit(index);
                                coverage.push({ index, blackCorner });
                                coveredArea += area;
                            }
                        }

                        const expectedArea = (u1 - u0) * (v1 - v0) / 2;
                        if (!valid || mask === 0 || Math.abs(coveredArea - expectedArea) >= EPSILON) continue;
                        candidates.push({ ...rectangle, mask, coverage });
                    }
                }
            }
        }
    }

    function buildShakashakaUniverse() {
        const candidates = [];
        addAxisCandidates(candidates);
        addDiagonalCandidates(candidates);
        candidates.sort((left, right) => {
            const sizeDifference = popcount(right.mask) - popcount(left.mask);
            if (sizeDifference !== 0) return sizeDifference;
            if (left.orientation !== right.orientation) return left.orientation === "axis" ? -1 : 1;
            return 0;
        });
        return candidates;
    }

    function rectanglesTouch(left, right) {
        if (left.orientation !== right.orientation) return false;
        if (left.orientation === "axis") {
            const verticalTouch = (left.x1 === right.x0 || right.x1 === left.x0)
                && Math.min(left.y1, right.y1) - Math.max(left.y0, right.y0) > EPSILON;
            const horizontalTouch = (left.y1 === right.y0 || right.y1 === left.y0)
                && Math.min(left.x1, right.x1) - Math.max(left.x0, right.x0) > EPSILON;
            return verticalTouch || horizontalTouch;
        }

        const uTouch = (left.u1 === right.u0 || right.u1 === left.u0)
            && Math.min(left.v1, right.v1) - Math.max(left.v0, right.v0) > EPSILON;
        const vTouch = (left.v1 === right.v0 || right.v1 === left.v0)
            && Math.min(left.u1, right.u1) - Math.max(left.u0, right.u0) > EPSILON;
        return uTouch || vTouch;
    }

    function solveShakashaka(openMask, limit = 2) {
        const result = { count: 0, capped: false, solution: null, solutions: [] };
        if (openMask === 0) return result;
        if (!shakashakaUniverse) shakashakaUniverse = buildShakashakaUniverse();

        const active = shakashakaUniverse.filter(candidate => (candidate.mask & ~openMask) === 0);
        const optionsByCell = Array.from({ length: CELL_COUNT }, () => []);
        for (let candidateIndex = 0; candidateIndex < active.length; candidateIndex++) {
            for (const cell of active[candidateIndex].coverage) {
                optionsByCell[cell.index].push(candidateIndex);
            }
        }

        const selected = [];
        const solutions = [];

        function isCompatible(candidate, coveredMask) {
            if ((candidate.mask & coveredMask) !== 0) return false;
            for (const selectedIndex of selected) {
                if (rectanglesTouch(candidate, active[selectedIndex])) return false;
            }
            return true;
        }

        function search(coveredMask) {
            if (solutions.length >= limit) return;
            if (coveredMask === openMask) {
                const triangles = Array(CELL_COUNT).fill(-1);
                for (const selectedIndex of selected) {
                    for (const cell of active[selectedIndex].coverage) {
                        triangles[cell.index] = cell.blackCorner;
                    }
                }
                solutions.push({
                    triangles,
                    rectangles: selected.map(index => active[index])
                });
                return;
            }

            let bestOptions = null;
            for (let index = 0; index < CELL_COUNT; index++) {
                if (!hasCell(openMask, index) || hasCell(coveredMask, index)) continue;
                const compatible = optionsByCell[index].filter(candidateIndex =>
                    isCompatible(active[candidateIndex], coveredMask)
                );
                if (compatible.length === 0) return;
                if (bestOptions === null || compatible.length < bestOptions.length) {
                    bestOptions = compatible;
                    if (compatible.length === 1) break;
                }
            }

            for (const candidateIndex of bestOptions) {
                const candidate = active[candidateIndex];
                selected.push(candidateIndex);
                search(coveredMask | candidate.mask);
                selected.pop();
                if (solutions.length >= limit) return;
            }
        }

        search(0);
        result.count = solutions.length;
        result.capped = solutions.length >= limit;
        // 複数解時に「三角なし」の解だけが表示されると差が見えないため、
        // 探索済み解のうち黒三角が最も多い盤面を表示例に選ぶ。
        result.solution = solutions.reduce((best, candidate) => {
            if (!best) return candidate;
            const bestTriangles = best.triangles.filter(value => value > 0).length;
            const candidateTriangles = candidate.triangles.filter(value => value > 0).length;
            return candidateTriangles > bestTriangles ? candidate : best;
        }, null);
        result.solutions = solutions;
        return result;
    }

    function analyzeBoard(cells, limit = 2) {
        const openMask = Array.isArray(cells) ? maskFromCells(cells) : cells;
        return {
            openMask,
            openCount: popcount(openMask),
            singleLoop: solveSingleLoop(openMask, limit),
            shakashaka: solveShakashaka(openMask, limit)
        };
    }

    return {
        SIZE,
        CELL_COUNT,
        analyzeBoard,
        cellsFromMask,
        maskFromCells,
        solveSingleLoop,
        solveShakashaka
    };
});
