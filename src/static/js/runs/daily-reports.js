// トーストにmessageを表示する関数
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.dataset.type = type; // success / error
  toast.classList.add("is-visible");

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1800);
}

// クリップボードにコピーする関数（ダメなら仮想コピペ）
async function copyToClipboard(text) {
  const value = (text ?? "").toString();

  // Clipboard API (https環境などで安定)
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  // ユーザーから見えないtextareaを作ってJSでコピーコマンドを再現
  const temp = document.createElement("textarea");
  temp.value = value;
  temp.setAttribute("readonly", "");
  temp.style.position = "fixed";
  temp.style.top = "-9999px";
  temp.style.left = "-9999px";
  document.body.appendChild(temp);
  temp.select();

  const ok = document.execCommand("copy");
  document.body.removeChild(temp);

  if (!ok) {
    throw new Error("Fallback copy failed");
  }
}

// 時間数、テキストエリアの中を返す関数
function getTextFromTargetId(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  return (el.innerText || "").trim();
}

function getTextFromTextareaId(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  return (el.value || "").toString();
}

// イベント
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".copy-btn");
  if (!btn) return;

  const targetId = btn.dataset.copyTarget;
  const textareaId = btn.dataset.copyTextarea;

  let text = null;

  if (targetId) {
    text = getTextFromTargetId(targetId);
  } else if (textareaId) {
    text = getTextFromTextareaId(textareaId);
  }

  if (text === null) {
    showToast("コピー対象が見つかりません", "error");
    return;
  }

  if (text.length === 0) {
    showToast("コピーする内容がありません", "error");
    return;
  }

  try {
    await copyToClipboard(text);
    showToast("コピーしました");
  } catch (err) {
    showToast("コピーに失敗しました", "error");
  }
});
