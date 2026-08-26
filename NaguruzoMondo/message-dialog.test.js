const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = __dirname;

function listCaseJavaScriptFiles() {
    return fs.readdirSync(projectRoot, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && /^CASE\d+$/.test(entry.name))
        .flatMap(entry => fs.readdirSync(path.join(projectRoot, entry.name))
            .filter(fileName => fileName.endsWith(".js"))
            .map(fileName => path.join(projectRoot, entry.name, fileName)));
}

test("all CASE messages use the shared dialog and load it on their page", () => {
    const messageFiles = [];

    for (const jsPath of listCaseJavaScriptFiles()) {
        const source = fs.readFileSync(jsPath, "utf8");
        assert.doesNotMatch(source, /\balert\s*\(/, path.relative(projectRoot, jsPath));
        if (source.includes("window.showCaseMessage(")) messageFiles.push(jsPath);
    }

    assert.ok(messageFiles.length > 0);
    for (const jsPath of messageFiles) {
        const directory = path.dirname(jsPath);
        const baseName = path.basename(jsPath, ".js");
        const htmlPath = baseName === "main"
            ? path.join(directory, "index.html")
            : path.join(directory, `${baseName}.html`);
        const html = fs.readFileSync(htmlPath, "utf8");
        assert.match(html, /<script src="\.\.\/message-dialog\.js"><\/script>/, path.relative(projectRoot, htmlPath));
    }
});

test("shared dialog preserves text, queues messages, and restores focus", async () => {
    class FakeElement {
        constructor(tagName) {
            this.tagName = tagName;
            this.children = [];
            this.listeners = {};
            this.attributes = {};
            this.hidden = false;
            this.textContent = "";
        }

        appendChild(child) {
            this.children.push(child);
        }

        setAttribute(name, value) {
            this.attributes[name] = value;
        }

        addEventListener(type, listener) {
            this.listeners[type] = listener;
        }

        focus() {
            this.focused = true;
            document.activeElement = this;
        }
    }

    const previousFocus = new FakeElement("input");
    const body = new FakeElement("body");
    const document = {
        activeElement: previousFocus,
        body,
        createElement: tagName => new FakeElement(tagName)
    };
    const window = {};
    const source = fs.readFileSync(path.join(projectRoot, "message-dialog.js"), "utf8");
    vm.runInNewContext(source, { document, window, Promise, String });

    const first = window.showCaseMessage("1行目\n2行目");
    const second = window.showCaseMessage("次の表示");
    const overlay = body.children[0];
    const dialog = overlay.children[0];
    const message = dialog.children[0];
    const button = dialog.children[1];

    assert.equal(overlay.hidden, false);
    assert.equal(message.textContent, "1行目\n2行目");
    assert.equal(button.focused, true);

    button.listeners.click();
    await first;
    assert.equal(overlay.hidden, false);
    assert.equal(message.textContent, "次の表示");

    button.listeners.click();
    await second;
    assert.equal(overlay.hidden, true);
    assert.equal(previousFocus.focused, true);
    assert.equal(document.activeElement, previousFocus);
});
