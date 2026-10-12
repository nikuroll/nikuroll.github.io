'use strict';
// Optional display only. Disabled mode creates no DOM and does no score calculation.
window.LiveScore = {
    create({ enabled, anchor, getScore }) {
        if (!enabled) return { update() {}, hide() {} };
        const element = document.createElement('p');
        element.id = 'live-score';
        anchor.insertAdjacentElement('afterend', element);
        const display = {
            update() {
                if (element.hidden) return;
                const text = `現在のスコア: ${getScore()}/25`;
                if (element.textContent !== text) element.textContent = text;
            },
            hide() { element.hidden = true; },
        };
        display.update();
        return display;
    },
};
