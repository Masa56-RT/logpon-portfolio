// トーストを表示する関数
function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");
    // clearTimeoutは複数回呼ばれた時に前回のsetTimeoutを消す
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 2200);
}

// Django messages
if (window.__DJANGO_MESSAGES__?.length) {
    const last = window.__DJANGO_MESSAGES__[window.__DJANGO_MESSAGES__.length - 1];
    showToast(last.text);
}

// 変更ボタンを押した時に変更フォームを表示する関数
document.querySelectorAll(".edit-row").forEach((row) => {
    const view = row.querySelector("[data-view]");
    const form = row.querySelector("[data-editForm]");
    const badge = row.querySelector("[data-badge]");
    const editBtn = row.querySelector("[data-edit]");
    const cancelBtn = row.querySelector("[data-cancel]");
    const input = row.querySelector("[data-input]");

    if (!view || !form || !editBtn || !cancelBtn || !input) return;

    const initialValue = input.value;

    editBtn.addEventListener("click", () => {
        document.querySelectorAll(".edit-row").forEach((otherRow) => {
            if (otherRow === row) return;

            const otherView = otherRow.querySelector("[data-view]");
            const otherForm = otherRow.querySelector("[data-editForm]");
            const otherBadge = otherRow.querySelector("[data-badge]");

            otherForm?.classList.add("is-hidden");
            otherView?.classList.remove("is-hidden");
            otherBadge?.classList.add("is-hidden");
        });

        view.classList.add("is-hidden");
        form.classList.remove("is-hidden");
        badge?.classList.remove("is-hidden");
        input.focus();
    });

    cancelBtn.addEventListener("click", () => {
        input.value = initialValue;
        form.classList.add("is-hidden");
        view.classList.remove("is-hidden");
        badge?.classList.add("is-hidden");
    });
});

// eyeマークを押した時にパスワードを表示する処理
document.querySelectorAll("[data-toggle]").forEach((btn) => {
    const wrap = btn.closest(".pw-input-wrap");
    const input = wrap?.querySelector("[data-pw]");
    if (!input) return;

    const show = () => {
        input.type = "text";
        btn.setAttribute("aria-label", "パスワードを非表示");
    };
    const hide = () => {
        input.type = "password";
        btn.setAttribute("aria-label", "パスワードを表示");
    };

    btn.addEventListener("mousedown", show);
    btn.addEventListener("mouseup", hide);
    btn.addEventListener("mouseleave", hide);

    // キーボードでの操作
    btn.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "Enter") show();
    });
    btn.addEventListener("keyup", (e) => {
        if (e.key === " " || e.key === "Enter") hide();
    });
});