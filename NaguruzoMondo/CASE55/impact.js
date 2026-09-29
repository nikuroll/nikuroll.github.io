/* CASE55専用。盤面・回答・得点はmain.js（CASE47コピー）に保持する。 */
const Case55Impact = (() => {
    const colors = ['#526079', '#35bed0', '#448bff', '#a36bff', '#ff639c', '#ffe28a'];
    const names = ['MISS', 'GOOD', 'GREAT', 'SUPER', 'EXCELLENT', 'PERFECT'];
    colors[.5] = '#80ffd4';
    names[.5] = 'PINPOINT';
    // 中心からの距離。色帯と判定は同じ定義を使用。
    const bands = [
        { limit: .012, radius: 5 },
        { limit: .092, radius: 4 },
        { limit: .172, radius: 3 },
        { limit: .252, radius: 2 },
        { limit: .340, radius: 1 },
        { limit: .360, radius: .5 }, // 外側のMISSとの境界に、選択マスだけを開く細帯。
        { limit: .500, radius: 0 }
    ];
    function rank(position) {
        const distance = Math.abs(position - .5);
        return bands.find(band => distance <= band.limit + 1e-9)?.radius ?? 0;
    }
    function targets(index, radius, opened) {
        if (radius === 0) return [];
        return Array.from({ length: 25 }, (_, i) => i).filter(i => !opened[i] &&
            (radius === 5 || Math.hypot(i % 5 - index % 5, Math.floor(i / 5) - Math.floor(index / 5)) <= radius));
    }
    // 一往復1.6秒。フレーム数に依存せず、入力した瞬間の時刻で判定する。
    function positionAt(elapsed) {
        const phase = ((elapsed / 800) % 2 + 2) % 2;
        return phase <= 1 ? phase : 2 - phase;
    }
    let audio;
    function unlockAudio() {
        try {
            const Audio = window.AudioContext || window.webkitAudioContext;
            if (Audio && !audio) audio = new Audio();
            if (audio && audio.state === 'suspended') audio.resume().catch(() => {});
        } catch (_) { /* 音声非対応でも操作は継続。 */ }
    }
    function tone(frequency, length = .12, volume = .035, slide = 1, delay = 0) {
        if (!audio || audio.state !== 'running') return;
        const at = audio.currentTime + delay;
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, at);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(25, frequency * slide), at + length);
        gain.gain.setValueAtTime(volume, at);
        gain.gain.exponentialRampToValueAtTime(.0001, at + length);
        oscillator.connect(gain).connect(audio.destination);
        oscillator.start(at);
        oscillator.stop(at + length);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    }
    function play(options) {
        unlockAudio();
        const previousFocus = document.activeElement;
        const dialog = document.createElement('dialog');
        dialog.id = 'impact-dialog';
        dialog.setAttribute('aria-labelledby', 'impact-title');
        dialog.innerHTML = `<div class="impact-card">
            <div class="impact-eyebrow">PANEL ${String(options.index + 1).padStart(2, '0')}</div>
            <div class="impact-title" id="impact-title">BREAK POINT</div>
            <div class="impact-track"><div class="impact-zones"></div><div class="impact-center"></div><div class="impact-needle"></div></div>
            <div class="impact-scale"><span>0</span><span>5</span><span>0</span></div>
            <button class="impact-stop" type="button">STOP</button>
            <div class="impact-result" aria-live="polite">半径 0 — 5</div>
        </div>`;
        const zones = dialog.querySelector('.impact-zones');
        const edges = [0, ...bands.slice(0, -1).reverse().map(v => .5 - v.limit), ...bands.map(v => .5 + v.limit)];
        for (let i = 0; i < edges.length - 1; i++) {
            const segment = document.createElement('div');
            segment.className = 'impact-zone';
            segment.style.width = `${(edges[i + 1] - edges[i]) * 100}%`;
            segment.style.background = colors[rank((edges[i] + edges[i + 1]) / 2)];
            zones.appendChild(segment);
        }
        document.body.appendChild(dialog);
        dialog.showModal();
        const button = dialog.querySelector('button');
        button.focus({ preventScroll: true });
        const needle = dialog.querySelector('.impact-needle');
        const started = performance.now();
        let stopped = false, raf, lastZone = -1;
        const render = now => {
            const position = positionAt(now - started);
            needle.style.left = `${position * 100}%`;
            const zone = rank(position);
            if (zone !== lastZone) {
                tone(180 + zone * 95, .045, .012);
                lastZone = zone;
            }
            raf = requestAnimationFrame(render);
        };
        raf = requestAnimationFrame(render);
        return new Promise(resolve => {
            const cleanup = () => {
                cancelAnimationFrame(raf);
                dialog.close();
                dialog.remove();
                if (previousFocus && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
                resolve();
            };
            dialog.addEventListener('cancel', e => {
                e.preventDefault();
                if (!stopped) { stopped = true; cleanup(); }
            });
            const stop = () => {
                if (stopped) return;
                stopped = true;
                unlockAudio();
                cancelAnimationFrame(raf);
                const position = positionAt(performance.now() - started);
                const radius = rank(position);
                const panels = options.targets(radius);
                needle.style.left = `${position * 100}%`;
                const card = dialog.querySelector('.impact-card');
                card.style.setProperty('--accent', colors[radius]);
                card.classList.add('is-hit');
                dialog.querySelector('.impact-title').textContent = names[radius];
                dialog.querySelector('.impact-result').textContent = radius === .5 ? 'PINPOINT · 1 PANEL' : `半径 ${radius} · ${panels.length} PANELS`;
                button.disabled = true;
                button.textContent = radius ? 'BREAK!' : 'MISS';
                tone(radius ? 90 : 130, .28, .08, radius ? .3 : .6);
                if (radius) [1, 1.25, 1.5, 2].forEach((n, i) => tone(330 * n, .3, .035, 1, i * .055));
                setTimeout(async () => {
                    dialog.close();
                    dialog.remove();
                    await burst(options, panels, radius);
                    cleanup();
                }, radius === 5 ? 650 : 460);
            };
            // pointerdownで止め、指を離す遅延を判定に含めない。clickはキーボード/支援技術用。
            button.addEventListener('pointerdown', e => {
                if (e.isPrimary && e.button === 0) { e.preventDefault(); stop(); }
            });
            button.addEventListener('click', stop);
            button.addEventListener('keydown', e => {
                if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); stop(); }
            });
        });
    }
    function burst(options, panels, radius) {
        if (!panels.length) return Promise.resolve();
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const layer = document.createElement('canvas');
        layer.id = 'impact-fx';
        const dpr = Math.min(devicePixelRatio || 1, 2);
        layer.width = innerWidth * dpr;
        layer.height = innerHeight * dpr;
        document.body.appendChild(layer);
        const ctx = layer.getContext('2d');
        ctx.scale(dpr, dpr);
        const rect = options.canvas.getBoundingClientRect();
        const cell = rect.width / 5;
        const origin = { x: rect.left + (options.index % 5 + .5) * cell, y: rect.top + (Math.floor(options.index / 5) + .5) * cell };
        const distance = i => Math.hypot(i % 5 - options.index % 5, Math.floor(i / 5) - Math.floor(options.index / 5));
        const queue = panels.map(i => ({ i, delay: reduced ? 0 : distance(i) * 65, opened: false }));
        const pieces = [], sparks = [];
        let count = 0;
        const started = performance.now();
        function shatter(i, now) {
            const x = rect.left + (i % 5 + .5) * cell;
            const y = rect.top + (Math.floor(i / 5) + .5) * cell;
            options.open(i);
            count++;
            tone(170 + count * 23, .075, .018, 1.7);
            if (reduced) return;
            const direction = Math.atan2(y - origin.y, x - origin.x);
            for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) {
                const angle = direction + (Math.random() - .5) * 2.4;
                const speed = 170 + Math.random() * 220 + radius * 30;
                pieces.push({ img: options.image(i), sx, sy, x: x + (sx - .5) * cell / 2, y: y + (sy - .5) * cell / 2,
                    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 230,
                    rotation: (Math.random() - .5) * 9, at: now });
            }
            for (let n = 0; n < 12; n++) {
                const angle = Math.random() * Math.PI * 2, speed = 90 + Math.random() * 400;
                sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, at: now, size: 1 + Math.random() * 3 });
            }
        }
        return new Promise(resolve => {
            const duration = reduced ? 450 : 1650;
            function frame(now) {
                const elapsed = now - started;
                queue.forEach(p => { if (!p.opened && elapsed >= p.delay) { p.opened = true; shatter(p.i, now); } });
                ctx.clearRect(0, 0, innerWidth, innerHeight);
                const shake = reduced ? 0 : Math.max(0, 1 - elapsed / 700) * radius * 1.8;
                options.canvas.style.transform = shake ? `translate(${Math.sin(elapsed * .13) * shake}px, ${Math.cos(elapsed * .17) * shake}px)` : '';
                if (!reduced) {
                    // 一発の光、二重の衝撃波、放射線。連続フラッシュは行わない。
                    ctx.fillStyle = `rgba(255,230,174,${Math.max(0, 1 - elapsed / 210) * .45})`;
                    ctx.fillRect(0, 0, innerWidth, innerHeight);
                    for (let ring = 0; ring < 2; ring++) {
                        const age = Math.max(0, elapsed - ring * 100) / 700;
                        ctx.globalAlpha = Math.max(0, 1 - age);
                        ctx.strokeStyle = colors[radius];
                        ctx.lineWidth = (1 - Math.min(age, 1)) * 10 + 1;
                        ctx.beginPath(); ctx.arc(origin.x, origin.y, age * rect.width * 1.2, 0, Math.PI * 2); ctx.stroke();
                    }
                    ctx.globalAlpha = Math.max(0, 1 - elapsed / 500) * .65;
                    ctx.lineWidth = 2;
                    for (let n = 0; n < 32; n++) {
                        const angle = n / 32 * Math.PI * 2;
                        const r = 60 + elapsed * .7;
                        ctx.beginPath(); ctx.moveTo(origin.x + Math.cos(angle) * r, origin.y + Math.sin(angle) * r);
                        ctx.lineTo(origin.x + Math.cos(angle) * (r + 90), origin.y + Math.sin(angle) * (r + 90)); ctx.stroke();
                    }
                    for (const p of pieces) {
                        const t = (now - p.at) / 1000;
                        ctx.save();
                        ctx.globalAlpha = Math.max(0, 1 - t / 1.1);
                        ctx.translate(p.x + p.vx * t, p.y + p.vy * t + 420 * t * t);
                        ctx.rotate(p.rotation * t);
                        const scale = Math.max(.1, 1 - t * .5);
                        ctx.scale(scale, scale);
                        if (p.img) ctx.drawImage(p.img, p.sx * p.img.width / 2, p.sy * p.img.height / 2, p.img.width / 2, p.img.height / 2, -cell / 4, -cell / 4, cell / 2, cell / 2);
                        ctx.restore();
                    }
                    ctx.fillStyle = colors[radius];
                    for (const p of sparks) {
                        const t = (now - p.at) / 1000;
                        ctx.globalAlpha = Math.max(0, 1 - t / .8);
                        ctx.fillRect(p.x + p.vx * t, p.y + p.vy * t + 120 * t * t, p.size, p.size);
                    }
                }
                ctx.globalAlpha = Math.min(1, Math.max(0, (duration - elapsed) / 350));
                const pop = reduced ? 1 : 1 + Math.max(0, 1 - elapsed / 240) * .4;
                ctx.save();
                ctx.translate(innerWidth / 2, Math.min(innerHeight - 100, Math.max(100, origin.y)));
                ctx.scale(pop, pop);
                ctx.textAlign = 'center';
                ctx.font = `900 ${Math.min(64, innerWidth * .12)}px Arial`;
                ctx.lineWidth = 7; ctx.strokeStyle = '#131526'; ctx.fillStyle = colors[radius];
                ctx.strokeText(names[radius], 0, 0); ctx.fillText(names[radius], 0, 0);
                ctx.font = '900 24px Arial';
                ctx.strokeText(`${count} PANELS`, 0, 40); ctx.fillText(`${count} PANELS`, 0, 40);
                ctx.restore();
                ctx.globalAlpha = 1;
                if (elapsed < duration) requestAnimationFrame(frame);
                else { options.canvas.style.transform = ''; layer.remove(); resolve(); }
            }
            requestAnimationFrame(frame);
        });
    }
    return { rank, targets, positionAt, play };
})();
if (typeof module !== 'undefined') module.exports = Case55Impact;
