(function () {
    "use strict";

    const messageQueue = [];
    let activeMessage = null;
    let overlay = null;
    let messageText = null;
    let closeButton = null;
    let previousFocus = null;

    function focusWithoutScrolling(element) {
        if (!element || typeof element.focus !== "function") return;
        try {
            element.focus({ preventScroll: true });
        } catch (_error) {
            element.focus();
        }
    }

    function buildDialog() {
        if (overlay) return;

        overlay = document.createElement("div");
        overlay.className = "case-message-overlay";
        overlay.hidden = true;

        const dialog = document.createElement("div");
        dialog.className = "case-message-dialog";
        dialog.setAttribute("role", "alertdialog");
        dialog.setAttribute("aria-modal", "true");
        dialog.setAttribute("aria-labelledby", "case-message-text");

        messageText = document.createElement("p");
        messageText.id = "case-message-text";
        messageText.className = "case-message-text";

        closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "case-message-close";
        closeButton.textContent = "OK";
        closeButton.addEventListener("click", closeCurrentMessage);

        dialog.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                event.preventDefault();
                closeCurrentMessage();
            } else if (event.key === "Tab") {
                event.preventDefault();
                focusWithoutScrolling(closeButton);
            }
            event.stopPropagation();
        });

        dialog.appendChild(messageText);
        dialog.appendChild(closeButton);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }

    function showNextMessage() {
        if (activeMessage || messageQueue.length === 0) return;

        buildDialog();
        activeMessage = messageQueue.shift();
        if (!previousFocus) previousFocus = document.activeElement;
        messageText.textContent = activeMessage.message;
        overlay.hidden = false;
        focusWithoutScrolling(closeButton);
    }

    function closeCurrentMessage() {
        if (!activeMessage) return;

        const finishedMessage = activeMessage;
        activeMessage = null;
        overlay.hidden = true;
        finishedMessage.resolve();

        if (messageQueue.length > 0) {
            showNextMessage();
            return;
        }

        focusWithoutScrolling(previousFocus);
        previousFocus = null;
    }

    window.showCaseMessage = function (message) {
        return new Promise(resolve => {
            messageQueue.push({ message: String(message), resolve });
            showNextMessage();
        });
    };
})();
