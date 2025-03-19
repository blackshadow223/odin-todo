function generateDialog(message?: string) {
    const dialog = document.createElement("dialog");
    dialog.classList.add("dialog");
    document.body.appendChild(dialog);

    // Content container
    const content = document.createElement("div");
    content.classList.add("dialog-content");
    dialog.appendChild(content);

    // Heading
    const heading = document.createElement("h2");
    heading.classList.add("dialog-content-heading");
    heading.textContent = "Confirm";
    content.appendChild(heading);

    // Description
    const desc = document.createElement("p");
    desc.classList.add("dialog-content-description");
    if (message) {
        desc.textContent = message;
    }
    content.appendChild(desc);

    // Confirmation Buttons
    const confirmDiv = document.createElement("div");
    confirmDiv.classList.add("dialog-buttons");
    dialog.appendChild(confirmDiv);

    const cancel = document.createElement("button");
    cancel.classList.add("dialog-cancel-button");
    cancel.textContent = "Cancel";
    confirmDiv.appendChild(cancel);

    const ok = document.createElement("button");
    ok.classList.add("dialog-ok-button");
    ok.textContent = "OK";
    confirmDiv.appendChild(ok);

    return {
        dialog,
        confirmDiv,
        ok,
        cancel,
    };
}

function confirmUI(message?: string): Promise<boolean> {
    return new Promise((resolve) => {
        // Initialize
        document.body.style.overflowY = "hidden";

        const { dialog, confirmDiv, ok, cancel } = generateDialog(message);

        dialog.style.setProperty("--backdrop-opacity", "0");
        dialog.showModal();
        ok.focus();

        // Animation/Transition Effect
        requestAnimationFrame(() => {
            dialog.style.opacity = "1";
            dialog.style.top = "-32%";
            dialog.style.setProperty("--backdrop-opacity", "1");
        });

        // Close dialog function
        const _closeDialog = (result: boolean) => {
            dialog.style.opacity = "0";
            dialog.style.top = "-20%";
            dialog.style.setProperty("--backdrop-opacity", "0");

            setTimeout(() => {
                resolve(result);
                dialog.close();
                dialog.remove();
                document.body.style.overflowY = "";
            }, 300);
        };

        // Button functions
        confirmDiv.onclick = (event: MouseEvent) => {
            if (event.target === ok) {
                _closeDialog(true);
            } else if (event.target === cancel) {
                _closeDialog(false);
            }
        };

        dialog.onkeydown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                _closeDialog(false);
                event.preventDefault();
            }
        };
    });
}

export default confirmUI;
