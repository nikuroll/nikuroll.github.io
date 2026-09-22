(function (root) {
    'use strict';
    const config = {
        letters: [...'しょうじき'],
        answers: ['しょうじき'],
        explanation:
            '線は必ず2本一組です。同じ高さの横線2本は独立した交換を2回、平行な斜線2本は隣接する交換を2回行います。\n\n' +
            'どこまで進んでも偶置換にしかならないため、奇置換になる「じょうしき」「しきじょう」にはなりません。そこで、答えは「しょうじき」です。',
        seed: 54n,
        // 単位はパネル1段分。文字は1段目と2段目の境界をまたぎ、
        // あみだはその下から始める。ここだけで縦位置を調整できる。
        layout: {
            letterCenterRows: 1,
            letterSizeRows: .5,
            amidaStartRows: 1.55
        }
    };
    function rowRandom(row, salt) {
        // 行だけで決定するため、生成順・開放順・スクロール往復に依存しない。
        let value = BigInt(row) * 0x9e3779b97f4a7c15n + config.seed + BigInt(salt) * 0x632be59bd9b4e019n;
        value = (value ^ (value >> 30n)) * 0xbf58476d1ce4e5b9n;
        value = (value ^ (value >> 27n)) * 0x94d049bb133111ebn;
        return Number((value ^ (value >> 31n)) & 0xffffffn) / 0x1000000;
    }
    function connections(row) {
        if (rowRandom(row, 0) < .5) {
            // 同じ高さの独立した交換を2本。共有する縦線がない組だけを使う。
            const pairs = [[0, 2], [0, 3], [1, 3]];
            const lanes = pairs[Math.floor(rowRandom(row, 1) * pairs.length)];
            const offset = .22 + rowRandom(row, 2) * .56;
            return lanes.map(lane => ({ pattern: 'parallel', lane, startOffset: offset, endOffset: offset }));
        }

        // 隣接する3列に、時間順の異なる斜め交換を2本置く。
        // 2回の隣接交換なので、この段が作る置換は3-cycle（偶置換）になる。
        const firstLane = Math.floor(rowRandom(row, 1) * 3);
        const top = .16 + rowRandom(row, 2) * .1;
        const tilt = rowRandom(row, 3) < .5 ? .16 : -.16;
        const startOffset = top + (tilt < 0 ? .16 : 0);
        const endOffset = top + (tilt > 0 ? .16 : 0);
        return [firstLane, firstLane + 1].map(lane => ({
            pattern: 'diagonal', lane, startOffset, endOffset
        }));
    }
    function rowPermutation(row) {
        const order = [0, 1, 2, 3, 4];
        [...connections(row)]
            .sort((a, b) => (a.startOffset + a.endOffset) - (b.startOffset + b.endOffset))
            .forEach(rung => {
                [order[rung.lane], order[rung.lane + 1]] = [order[rung.lane + 1], order[rung.lane]];
            });
        return order;
    }
    function permutationParity(order) {
        let inversions = 0;
        order.forEach((value, i) => order.slice(i + 1).forEach(other => { if (value > other) inversions++; }));
        return inversions % 2;
    }
    function panelId(row, column) { return (BigInt(row) * 5n + BigInt(column) + 1n).toString(); }
    function parity(base, word) {
        const letters = [...base];
        if (new Set(letters).size !== letters.length) throw new Error('偶奇の判定には互いに異なる文字が必要です');
        const positions = [...word].map(letter => letters.indexOf(letter));
        if (positions.length !== letters.length || positions.includes(-1) || new Set(positions).size !== letters.length) throw new Error('アナグラムではありません');
        let inversions = 0;
        positions.forEach((value, i) => positions.slice(i + 1).forEach(other => { if (value > other) inversions++; }));
        return inversions % 2;
    }
    // ブラウザのスクロール高を有限に保ち、論理行だけをBigIntで進める。
    function rebase(base, scrollRows) {
        if (scrollRows > 750) return { base: base + 500n, scrollRows: scrollRows - 500 };
        if (scrollRows < 250 && base > 0n) {
            const shift = base < 500n ? base : 500n;
            return { base: base - shift, scrollRows: scrollRows + Number(shift) };
        }
        return { base, scrollRows };
    }
    const api = { config, connections, rowPermutation, permutationParity, panelId, parity, rebase };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.AmidaPuzzle = api;
})(typeof window === 'undefined' ? globalThis : window);
