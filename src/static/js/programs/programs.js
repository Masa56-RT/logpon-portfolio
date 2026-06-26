// 1.state
// タイマー選択に関するstate
const state = {
  selectedTimerId: null,
  selectedCategory: null,
};

// 二重送信防止に関するstate
const uiState = {
  isSaving: false,
  isDirty: false,
};


// 2.DOM取得
// モーダルに関するDOM
const upsertModal = document.getElementById("programUpsertModal");
const upsertOverlay = document.getElementById("upsertModalOverlay");
const upsertArea = document.getElementById("upsertModalArea");
const createForm = document.getElementById("programCreateForm");
const editForm = document.getElementById("programEditForm");
const upsertCloseBtn = document.getElementById("upsertCloseBtn");
const deleteModal = document.getElementById("deleteModal");
const deleteOverlay = document.getElementById("deleteModalOverlay");
const deleteArea = document.getElementById("deleteModalArea");
const deleteCloseBtn = document.getElementById("deleteCloseBtn");
const programDeleteBtn = document.getElementById("programDelete");

// タイマー選択に関するDOM
const focusList = document.getElementById("focusList");
const restList  = document.getElementById("restList");

// タイマーの移動に関するDOM
const listInAProgram = document.getElementById("listInAProgram");
const focusAddBtn = document.getElementById("focusAdd");
const restAddBtn = document.getElementById("restAdd");
const programSelect = document.getElementById("programId");

// タイマー登録に関するDOM
const programDecideBtn = document.getElementById("program-decide");


// 関数
// upsertmodalを開く関数
function openUpsertModal(mode) {
  if (!upsertModal) return;

  upsertModal.hidden = false;

  const createForm = document.getElementById("programCreateForm");
  const editForm = document.getElementById("programEditForm");

  if (createForm) createForm.hidden = (mode !== "create");
  if (editForm) editForm.hidden = (mode !== "edit");
}

// upsertmodalを閉じる関数
function closeUpsertModal() {
  if (!upsertModal) return;
  upsertModal.hidden = true;
}

// deletemodalを開く関数
function openDeleteModal() {
  if (!deleteModal) return;
  // selected_program_id がないときはボタンが disabled の想定だけど、保険
  const programId = document.getElementById("programId")?.value;
  if (!programId) return;

  deleteModal.hidden = false;
}

// deletemodalを閉じる関数
function closeDeleteModal() {
  if (!deleteModal) return;
  deleteModal.hidden = true;
}

// プログラムの選択を変えたときに表示を変える関数
function registerProgramSelectNavigation() {
  const programSelect = document.getElementById("programId");
  if (!programSelect) return;

  const baseUrl = programSelect.dataset.baseUrl || "/programs/";

  programSelect.addEventListener("change", () => {
    const programId = programSelect.value;
    if (!programId) return; // 未選択は使わない方針だけど安全のため
    window.location.href = `${baseUrl}?selected=${encodeURIComponent(programId)}`;
  });
}

// 作成ずみタイマーが０件の場合に空メッセージを表示する関数
function ensureEmptyMessage(containerEl, message) {
  if (!containerEl) return;

  // 既にタイマーがあるなら、空メッセージがあれば消す
  const hasTimer = containerEl.querySelector(".oneTimer");
  const existingMsg = containerEl.querySelector(".empty-msg");

  if (hasTimer) {
    if (existingMsg) existingMsg.remove();
    return;
  }

  // タイマーが無くてメッセージも無いなら追加
  if (!existingMsg) {
    const p = document.createElement("p");
    p.className = "empty-msg";
    p.innerHTML = message; // <br>を使いたいので innerHTML
    containerEl.appendChild(p);
  }
}

// 空メッセージを実行する関数
function renderRightTimerEmptyStates() {
  const focusList = document.getElementById("focusList");
  const restList = document.getElementById("restList");

  ensureEmptyMessage(
    focusList,
    '集中タイマーが登録されていません。<br>「タイマー作成・一覧」から作成してください。'
  );

  ensureEmptyMessage(
    restList,
    '休憩・リフレッシュタイマーが登録されていません。<br>「タイマー作成・一覧」から作成してください。'
  );
}


// タイマーの選択状態を作る関数
function selectTimer(el) {
  // すでに選択されているものを解除
  document.querySelectorAll(".oneTimer.selected")
    .forEach(node => node.classList.remove("selected"));

  // 新しく選択
  el.classList.add("selected");

  state.selectedTimerId = el.dataset.timer_id;
  state.selectedCategory = el.dataset.category;
}

// 作成済みタイマーからプログラムに登録するタイマーカードを作る関数
function createProgramTimerCardFromRightTimer(rightTimerEl) {
  const timerId = rightTimerEl.dataset.timerId;
  const category = rightTimerEl.dataset.category;
  console.log(timerId);

  const categoryText = rightTimerEl.querySelector(".category")?.textContent?.trim() ?? "";
  const timerName = rightTimerEl.querySelector(".timerName")?.textContent?.trim() ?? "";
  const durationText = rightTimerEl.querySelector(".duration")?.textContent?.trim() ?? "";

  const div = document.createElement("div");
  div.className = "oneTimer";
  div.dataset.timerId = timerId;
  div.dataset.category = category;
  div.draggable = true; // 次のDnDで使う

  div.innerHTML = `
    <p class="category">${categoryText}</p>
    <p class="timerName">${timerName}</p>
    <p class="duration">${durationText}</p>
    <button type="button" class="trash-btn" data-action="removeFromProgram">
      <iconify-icon icon="iconamoon:trash" class="trash-icon"></iconify-icon>
    </button>
  `;

  return div;
}

// 選択されたタイマーを返す関数
function getSelectedRightTimerEl() {
  return document.querySelector(".oneTimer.selected");
}

// プログラムが選択されているか確認する関数
function assertProgramSelected() {
  return programSelect && programSelect.value; // 未選択なし方針なら基本true
}

// 選択したタイマーを左に加える関数
function addSelectedTimerToLeft(expectedCategoryKind) {
  if (!assertProgramSelected()) {
    alert("プログラムを選択してください。");
    return;
  }

  const selected = getSelectedRightTimerEl();
  if (!selected) {
    alert("右側のタイマーを選択してください。");
    return;
  }

  const cat = selected.dataset.category; // focus / break / refresh
  const isFocus = (cat === "focus");

  if (expectedCategoryKind === "focus" && !isFocus) {
    alert("集中タイマーを選択してください。");
    return;
  }
  if (expectedCategoryKind === "rest" && isFocus) {
    alert("休憩・リフレッシュタイマーを選択してください。");
    return;
  }

  const card = createProgramTimerCardFromRightTimer(selected);
  listInAProgram.appendChild(card);

  markDirty();

  removeEmptyProgramMessage();
}

// タイマーカードを追加したときに空メッセージを消す関数
function removeEmptyProgramMessage() {
  const msg = listInAProgram.querySelector(".empty-program-msg");
  if (msg) msg.remove();
}

// ドラッグ＆ドロップの並び替え
// ===== Drag & Drop reorder =====
let draggingEl = null;

function isReorderableTimerCard(el) {
  return el && el.classList && el.classList.contains("oneTimer");
}

// ドロップ位置（挿入先）を計算：マウスY位置より下にある最初の要素を探す
function getDragAfterElement(container, mouseY) {
  const draggableEls = [...container.querySelectorAll(".oneTimer:not(.dragging)")];

  let closest = { offset: Number.NEGATIVE_INFINITY, element: null };

  for (const child of draggableEls) {
    const box = child.getBoundingClientRect();
    const offset = mouseY - (box.top + box.height / 2);
    // offset が負（=マウスが要素の上半分）で、かつ一番近いもの
    if (offset < 0 && offset > closest.offset) {
      closest = { offset, element: child };
    }
  }

  return closest.element;
}

function registerProgramTimerDnD() {
  const container = document.getElementById("listInAProgram");
  if (!container) return;

  // dragstart / dragend は、要素側で発火するが、バブリングするので委譲で取れる
  container.addEventListener("dragstart", (e) => {
    const target = e.target.closest(".oneTimer");
    if (!isReorderableTimerCard(target)) return;

    draggingEl = target;
    target.classList.add("dragging");

    // Firefox対策：dataTransferを触らないとDnDが動かないことがある
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", target.dataset.timer_id || "");
    }
  });

  container.addEventListener("dragend", (e) => {
    const target = e.target.closest(".oneTimer");
    if (!isReorderableTimerCard(target)) return;

    target.classList.remove("dragging");
    draggingEl = null;
    markDirty();
  });

  // dragover で挿入位置を決める（ここがメイン）
  container.addEventListener("dragover", (e) => {
    if (!draggingEl) return;
    e.preventDefault(); // これがないとdropできない

    const afterEl = getDragAfterElement(container, e.clientY);
    if (afterEl == null) {
      container.appendChild(draggingEl);
    } else {
      container.insertBefore(draggingEl, afterEl);
    }
  });

  // drop は必須じゃない（dragoverで並び替えできている）けど、念のため
  container.addEventListener("drop", (e) => {
    if (!draggingEl) return;
    e.preventDefault();
  });
}
// ドラッグ＆ドロップの並び替え、ここまで

// プログラムに登録したタイマーからJSONを作る関数
function buildProgramTimersPayload() {
  const cards = document.querySelectorAll("#listInAProgram .oneTimer");

  const timer_ids = [];

  cards.forEach(card => {
    const timerId = card.dataset.timerId;
    if (!timerId) return;

    timer_ids.push(Number(timerId));
  });

  return { timer_ids };
}

// csrftokenを取得する関数
function getCsrfToken() {
  return document.cookie.split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
}

// JSONを保存する関数
async function saveProgramTimers() {
  if (uiState.isSaving) return;

  const programId = document.getElementById("programId")?.value;
  if (!programId) return;

  const payload = buildProgramTimersPayload();

  setSavingState(true);

  try {
    const res = await fetch(`/program_timers/${programId}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfToken(),
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      showToast(data.error || "保存に失敗");
      return;
    }

    clearDirty();
    showToast("保存しました");

  } catch (e) {
    console.error(e);
    showToast("通信エラー");
  } finally {
    setSavingState(false);
  }
}


// 確定ボタン二度押しで二重送信を防止する関数
function setSavingState(isSaving) {
  const btn = document.getElementById("program-decide");
  if (!btn) return;

  uiState.isSaving = isSaving;
  btn.disabled = isSaving;

  if (isSaving) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = "保存中...";
  } else {
    btn.textContent = btn.dataset.originalText || "確定";
  }
}

// 引数をメッセージとして表示するトースト
function showToast(msg) {
  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.classList.add("show");

  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    toast.classList.remove("show");
  }, 1600);
}

// 状態変更フラグを操作する関数
// 変更あり
function markDirty() {
  uiState.isDirty = true;

  const btn = document.getElementById('program-decide');
  if (!btn) return;

  btn.classList.add("is-dirty");

  btn.classList.remove("pulse");
  void btn.offsetWidth;
  btn.classList.add("pulse");

  setTimeout(() => btn.classList.remove("pulse"), 2200);
}

// 変更なし
function clearDirty() {
  uiState.isDirty = false;

  const btn = document.getElementById('program-decide');
  if (!btn) return;

  btn.classList.remove("is-dirty", "pulse");
}



// イベント
// モーダル開閉を実行する処理
document.getElementById("programCreate")?.addEventListener("click", () => openUpsertModal("create"));
document.getElementById("programEdit")?.addEventListener("click", () => openUpsertModal("edit"));
upsertCloseBtn?.addEventListener("click", closeUpsertModal);

// upsertmodalにイベントを登録する処理
function registerUpsertModalEvents() {
  document.getElementById("programCreate")
    ?.addEventListener("click", () => openUpsertModal("create"));

  document.getElementById("programUpdate")
    ?.addEventListener("click", () => openUpsertModal("edit"));

  upsertCloseBtn?.addEventListener("click", closeUpsertModal);

  // 外側クリック
  upsertOverlay?.addEventListener("click", closeUpsertModal);

  // 内側クリックは閉じない
  upsertArea?.addEventListener("click", (e) => e.stopPropagation());
}

// deletemodalに関するイベントを登録する関数
function registerDeleteModalEvents() {
  programDeleteBtn?.addEventListener("click", openDeleteModal);
  deleteCloseBtn?.addEventListener("click", closeDeleteModal);

  // オーバーレイクリックで閉じる
  deleteOverlay?.addEventListener("click", closeDeleteModal);

  // モーダル内クリックは閉じない
  deleteArea?.addEventListener("click", (e) => e.stopPropagation());
}

// クリックしたタイマーでselectTimer()を実行する処理
function registerTimerSelectEvents() {
  if (focusList) {
    focusList.addEventListener("click", e => {
      const timer = e.target.closest(".oneTimer");
      if (!timer) return;
      selectTimer(timer);
    });
  }

  if (restList) {
    restList.addEventListener("click", e => {
      const timer = e.target.closest(".oneTimer");
      if (!timer) return;
      selectTimer(timer);
    });
  }
}

// 矢印ボタンにイベントをつける関数
function registerAddToProgramEvents() {
  if (focusAddBtn) {
    focusAddBtn.addEventListener("click", () => addSelectedTimerToLeft("focus"));
  }
  if (restAddBtn) {
    restAddBtn.addEventListener("click", () => addSelectedTimerToLeft("rest"));
  }
}

// ゴミ箱ボタンでタイマーを削除するイベントをつける関数
function registerRemoveFromProgramEvents() {
  if (!listInAProgram) return;

  listInAProgram.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-action="removeFromProgram"]');
    if (!btn) return;

    const card = btn.closest(".oneTimer");
    if (!card) return;

    card.remove();

    markDirty();
  });
}

// 確定ボタンを押した時にプログラムを保存する関数を実行する処理
function registerSaveProgramEvents() {
  if (!programDecideBtn) return;

  programDecideBtn.addEventListener("click", saveProgramTimers);
}

// 保存前にページを移動しようとした時に注意喚起するイベント
window.addEventListener("beforeunload", (e) => {
  if (!uiState.isDirty) return;

  e.preventDefault();
  e.returnValue = "";
});


// 初期化処理
// ロード時に上の関数を実行する関数
function init() {
  registerProgramSelectNavigation();
  renderRightTimerEmptyStates();
  registerTimerSelectEvents();
  registerAddToProgramEvents();
  registerRemoveFromProgramEvents();
  registerProgramTimerDnD();
  registerSaveProgramEvents();
  registerUpsertModalEvents();
  registerDeleteModalEvents();
}

document.addEventListener("DOMContentLoaded", init);