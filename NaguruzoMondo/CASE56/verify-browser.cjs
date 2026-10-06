// No local HTTP server. Use the bundled playwright or PLAYWRIGHT_MODULE.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
(async () => {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    const output = path.join(__dirname, '../agent/qa/case56'); fs.mkdirSync(output, { recursive: true });
    try {
        for (const mobile of [false, true]) {
            const context = await browser.newContext({ viewport: mobile ? { width: 375, height: 812 } : { width: 1100, height: 1000 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 3 : 1 });
            const page = await context.newPage(), errors = [], external = [];
            await page.addInitScript(() => { navigator.vibrate = pattern => { window.lastVibration = pattern; return true; }; });
            page.on('pageerror', e => errors.push(String(e)));
            await page.route(/^https?:/, route => { external.push(route.request().url()); return route.abort(); });
            await page.goto(pathToFileURL(path.join(__dirname, 'index.html')).href);
            await page.waitForFunction(() => typeof field !== 'undefined' && field);
            await page.waitForFunction(() => panels.every(p => p.complete && p.naturalWidth));
            assert.equal(await page.evaluate(() => openedPanels.size), 0);
            assert.ok(await page.evaluate(() => canvas.width >= 1920 && ctx.getTransform().a === renderScale));
            const press = async locator => mobile ? locator.tap() : locator.click();
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
            const prefix = mobile ? 'mobile' : 'desktop';
            await page.screenshot({ path: path.join(output, `${prefix}-initial.png`), fullPage: true });
            // Also exercise live image-alpha extraction and inspect actual scan RGB.
            if (!mobile) {
                const dataUrl = 'data:image/png;base64,' + fs.readFileSync(path.join(__dirname, 'images/fossil.png')).toString('base64');
                await page.evaluate(src => new Promise(resolve => {
                    fossil.addEventListener('load', resolve, { once: true }); fossil.src = src;
                }), dataUrl);
                await page.evaluate(() => {
                    canvas.width = boardSize * renderScale; scars.width = boardSize;
                    ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0); ctx.imageSmoothingQuality = 'high'; drawBoard();
                });
                assert.equal(await page.evaluate(() => {
                    const pixels = silhouette.getContext('2d').getImageData(0, 0, silhouette.width, silhouette.height).data;
                    for (let i = 0; i < pixels.length; i += 4) {
                        if (pixels[i + 3] === 255 && (pixels[i] !== 255 || pixels[i + 1] !== 255 || pixels[i + 2] !== 255)) return false;
                    }
                    return true;
                }), true);
            }
            const initial = await page.evaluate(() => ({ cover: [...field.cover], stats: field.stats() }));
            await press(page.locator('[data-tool="scan"]'));
            assert.equal(await page.locator('[data-tool="scan"]').getAttribute('aria-pressed'), 'true');
            assert.deepEqual(await page.evaluate(() => ({ cover: [...field.cover], stats: field.stats() })), initial);
            assert.equal(await page.evaluate(() => openedPanels.size), 0);
            await page.waitForTimeout(180);
            assert.equal(await page.evaluate(() => field.startedAt), null);
            assert.equal(await page.evaluate(() => {
                const original = ctx.drawImage, calls = [];
                ctx.drawImage = function (image, ...args) { calls.push(image); return original.call(this, image, ...args); };
                try { drawBoard(); } finally { ctx.drawImage = original; }
                return panels.every(p => calls.includes(p)) && calls.indexOf(panels[0]) > calls.indexOf(silhouette);
            }), true);
            await page.screenshot({ path: path.join(output, `${prefix}-scan.png`), fullPage: true });
            await page.waitForFunction(() => scanUntil < performance.now());
            assert.equal(await page.evaluate(() => openedPanels.size), 0);
            // The drill must remove a numbered panel and chip untouched hard rock by itself.
            await press(page.locator('[data-tool="drill"]'));
            const firstBox = await page.locator('#dig-board').boundingBox();
            const dx = firstBox.x + firstBox.width * .1, dy = firstBox.y + firstBox.height * .1;
            const beforeDrill = await page.evaluate(() => field.cover[8 * 80 + 8]);
            if (mobile) await page.touchscreen.tap(dx, dy); else await page.mouse.click(dx, dy);
            assert.ok(await page.evaluate(() => openedPanels.has(0) && panelFragments.length > 0));
            assert.ok(await page.evaluate(before => field.cover[8 * 80 + 8] < before, beforeDrill));
            await page.screenshot({ path: path.join(output, `${prefix}-drill-panel.png`), fullPage: true });
            const scoreBeforeTime = await page.evaluate(() => {
                field.startedAt = performance.now(); updateStatus(); return field.stats().score;
            });
            await page.waitForFunction(score => document.getElementById('score').textContent === `Score: ${score - 1}/100`, scoreBeforeTime);
            assert.equal(await page.evaluate(() => field.stats().timePenalty), 1);
            await press(page.locator('[data-tool="hammer"]'));
            const box = await page.locator('#dig-board').boundingBox();
            const target = await page.evaluate(() => {
                const index = field.alpha.findIndex((a, i) => a > .95 && field.cover[i] >= 3
                    && i % 80 > 8 && i % 80 < 71 && Math.floor(i / 80) > 8 && Math.floor(i / 80) < 71);
                if (index < 0) throw new Error('No opaque fossil test point found');
                return { index, x: index % 80 + .5, y: Math.floor(index / 80) + .5 };
            });
            const x = box.x + box.width * target.x / 80, y = box.y + box.height * target.y / 80;
            if (mobile) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
            const afterHammer = await page.evaluate(() => [...field.cover]);
            assert.ok(afterHammer.some((n, i) => n < initial.cover[i]));
            assert.equal(await page.evaluate(() => field.stats().damage), 0);
            assert.ok(await page.evaluate(() => openedPanels.size > 0 && openedPanels.size < 25 && rockCracks.length > 0 && impactWaves.length > 0));
            assert.deepEqual(await page.evaluate(() => window.lastVibration), [22, 15, 12]);
            await page.screenshot({ path: path.join(output, `${prefix}-hammer-impact.png`), fullPage: true });
            const panelsBeforeScan = await page.evaluate(() => [...openedPanels]);
            await press(page.locator('[data-tool="scan"]'));
            await page.waitForTimeout(180);
            assert.deepEqual(await page.evaluate(() => [...openedPanels]), panelsBeforeScan);
            await page.screenshot({ path: path.join(output, `${prefix}-scan-rock.png`), fullPage: true });
            await press(page.locator('[data-tool="drill"]'));
            const cell = target.index;
            if (mobile) {
                const cdp = await context.newCDPSession(page);
                await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
                await page.waitForFunction(i => field.damage[i] > 0, cell);
                assert.ok(await page.evaluate(() => particles.length > 0));
                await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + box.width * .07, y }] });
                await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
            } else {
                await page.mouse.move(x, y); await page.mouse.down();
                await page.waitForFunction(i => field.damage[i] > 0, cell);
                assert.ok(await page.evaluate(() => particles.length > 0));
                await page.mouse.move(x + box.width * .07, y, { steps: 8 }); await page.mouse.up();
            }
            assert.equal(await page.evaluate(() => pointer), null);
            assert.ok(await page.evaluate(() => field.stats().damage > 0));
            // Drill cancellation must immediately stop additional damage.
            const damage = await page.evaluate(() => field.damaged);
            await page.waitForTimeout(180);
            assert.equal(await page.evaluate(() => field.damaged), damage);
            await page.screenshot({ path: path.join(output, `${prefix}-digging.png`), fullPage: true });
            // Reveal many cells by real model operations for a representative inspection image.
            await page.evaluate(() => {
                for (let i = 0; i < 25; i++) openedPanels.add(i);
                for (let y = 4; y < 80; y += 8) for (let x = 4; x < 80; x += 8) field.hit(x, y, 'hammer');
                for (let y = 0; y < 80; y += 2) for (let x = 0; x < 80; x += 2) {
                    field.hit(x + .5, y + .5, 'drill'); field.hit(x + .5, y + .5, 'drill');
                }
                drawBoard(); updateStatus();
            });
            await page.screenshot({ path: path.join(output, `${prefix}-excavated.png`), fullPage: true });
            for (let i = 0; i < 4; i++) {
                await page.locator('#answerInput').fill(i === 0 ? 'かせき' : '誤答'); await press(page.locator('#submitAnswer'));
                await press(page.getByRole('button', { name: 'OK', exact: true }));
            }
            assert.equal(await page.locator('#remainingAttempts').innerText(), '残り解答回数: -1');
            const before = await page.evaluate(() => {
                // Avoid crossing a second boundary between assertion and the real submit click.
                field.startedAt = performance.now() - Math.max(200, field.stats().timePenalty) * 1000;
                return { stats: field.stats(), share: make_tweet() };
            });
            assert.ok(before.stats.score < -50);
            assert.equal(await page.evaluate(() => field.shareGrid().split('\n').join('')), '⬜'.repeat(25));
            await page.locator('#answerInput').fill('かきね'); await press(page.locator('#submitAnswer'));
            await press(page.getByRole('button', { name: 'OK', exact: true }));
            const score = await page.locator('#score').innerText();
            await page.waitForTimeout(1100);
            assert.equal(await page.locator('#score').innerText(), score);
            let shared;
            await page.evaluate(() => { window.open = url => { window.testShare = url; }; });
            await press(page.getByRole('button', { name: 'Xで共有', exact: true }));
            shared = await page.evaluate(() => new URL(window.testShare).searchParams.get('text'));
            assert.equal(shared, before.share);
            await press(page.getByRole('button', { name: '全部開ける', exact: true }));
            if (!mobile) assert.deepEqual(await page.evaluate(() => {
                // Clear the file-origin taint left by number-panel images before inspecting RGB.
                canvas.width = boardSize * renderScale;
                ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
                drawBoard();
                return [...ctx.getImageData(0, 0, 1, 1).data];
            }), [255, 255, 255, 255]);
            assert.equal(await page.evaluate(() => field.cover.every(n => n === 0)), true);
            assert.equal(await page.locator('#score').innerText(), score);
            assert.deepEqual(await page.evaluate(() => resultSnapshot), before.stats);
            await press(page.locator('#explanation-message summary'));
            assert.equal(await page.locator('#explanation-message').getAttribute('open'), '');
            assert.equal(await page.locator('#explanation-message-body').innerText(), 'たぬきなので『た』の文字を抜いて考えましょう。');
            assert.equal(await page.evaluate(() => config.hint), '');
            await page.screenshot({ path: path.join(output, `${prefix}-cleared.png`), fullPage: true });
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
            assert.deepEqual(errors, []); assert.deepEqual(external, []);
            console.log(`${prefix}: scan retains panels, flying panel fragments, drill-only panel/crust removal, touch/drag/cancellation, post-clear buttons, frozen result PASS`);
            await context.close();
        }
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
