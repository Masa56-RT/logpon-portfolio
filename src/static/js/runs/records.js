// =====================
// 1) state
// =====================
const state = {
  date: null,
  programs: [],
  timerRuns: [],
  dailyTotalElapsedSec: 0,
  selectedProgramRunId: "all",
  selectedTimerRunId: null,
};

// =====================
// 2) DOM
// =====================
const modal = document.getElementById("modal");
const overlay = document.getElementById("modalOverlay");
const modalArea = document.getElementById("modalArea");
const closeBtn = document.getElementById("closeBtn");

const dateInput = document.getElementById("recordsDate");
const programList = document.getElementById("recordedProgramList");
const timerList = document.getElementById("recordedTimerList");

const memoModalTitle = document.getElementById("memoModalTitle");
const timerNameSnapshot = document.getElementById("timerNameSnapshot");
const memoTextarea = document.getElementById("memoTextarea");
const memoSendBtn = document.getElementById("memoSendBtn");

// =====================
// utils
// =====================
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatHm(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatEnd(r) {
  // finished だけ終了時刻、それ以外は日本語ラベル
  if (r.status === "finished") return r.ended_at ? formatHm(r.ended_at) : "";
  return r.status_label || "";
}
function formatDuration(sec) {
  const totalMin = Math.floor((sec ?? 0) / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}分`;
  return `${h}時間${String(m).padStart(2, "0")}分`;
}

function getCookie(name) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

// =====================
// fetch
// =====================

// 初回取得（当日）
async function fetchToday() {
  const res = await fetch("/records/data", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(res.status);
  return res.json();
}

// 日付指定取得
async function fetchByDate(dateYmd) {
  const res = await fetch(`/records/data?date=${encodeURIComponent(dateYmd)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(res.status);
  return res.json();
}

// メモ保存
async function saveMemo(timerRunId, memo) {
  const csrftoken = getCookie("csrftoken");

  const res = await fetch(`/timer-runs/${timerRunId}/memo/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken ?? "",
      Accept: "application/json",
    },
    body: JSON.stringify({ memo }),
  });

  if (!res.ok) throw new Error(res.status);
  return res.json();
}

// =====================
// derive
// =====================
function getFilteredTimerRuns() {
  if (state.selectedProgramRunId === "all") return state.timerRuns;
  return state.timerRuns.filter(
    (r) => String(r.program_run_id) === String(state.selectedProgramRunId)
  );
}

function countTimersByProgram(programRunId) {
  return state.timerRuns.filter(
    (r) => String(r.program_run_id) === String(programRunId)
  ).length;
}

// =====================
// render
// =====================
function renderPrograms() {
  const allCount = state.timerRuns.length;

  let html = `
    <button type="button"
      class="recordedCard recordedProgram ${state.selectedProgramRunId === "all" ? "currentProgram" : ""}"
      data-program-run-id="all">
      <p>全て</p>
      <div class="programInfo">
        <p class="numberOfTimer">${allCount}件</p>
        <p class="duration">${formatDuration(state.dailyTotalElapsedSec)}</p>
      </div>
    </button>
  `;

  for (const p of state.programs) {
    const cnt = countTimersByProgram(p.program_run_id);

    html += `
      <button type="button"
        class="recordedCard recordedProgram ${String(state.selectedProgramRunId) === String(p.program_run_id) ? "currentProgram" : ""}"
        data-program-run-id="${escapeHtml(p.program_run_id)}">
        <p>${escapeHtml(p.program_name)}</p>
        <div class="programInfo">
          <p class="numberOfTimer">${cnt}件</p>
          <p class="duration">${formatDuration(p.total_elapsed_sec)}</p>
        </div>
      </button>
    `;
  }

  programList.innerHTML = html;
}

function renderTimers() {
  const runs = getFilteredTimerRuns();

  if (runs.length === 0) {
    timerList.innerHTML =
      `<p style="margin:0;padding:8px;font-size:.9rem;">記録がありません</p>`;
    return;
  }

  timerList.innerHTML = runs.map(r => `
    <button type="button"
      class="recordedCard recordedTimer"
      data-timer-run-id="${r.timer_run_id}">
      <p class="startFinish">
        <span>${formatHm(r.started_at)}</span> ~ <span>${escapeHtml(formatEnd(r))}</span>
      </p>
      <p class="timerName">${escapeHtml(r.timer_name)}</p>
      <p class="elapsedSec">${formatDuration(r.elapsed_sec)}</p>
      <p class="recordsMemo">${escapeHtml(r.memo || "")}</p>
    </button>
  `).join("");
}

function renderAll() {
  if (state.date) dateInput.value = state.date;
  renderPrograms();
  renderTimers();
}

// =====================
// modal
// =====================
function openMemoModal(timerRunId) {
  const run = state.timerRuns.find(r => String(r.timer_run_id) === String(timerRunId));
  if (!run) return;

  state.selectedTimerRunId = timerRunId;
// !!は値をbooleanで正規化する
  const hasMemo = !!run.memo;

  memoModalTitle.textContent = hasMemo ? "メモ編集" : "メモ作成";
  memoSendBtn.textContent = hasMemo ? "更新" : "作成"

  timerNameSnapshot.textContent = run.timer_name ?? "";
  memoTextarea.value = run.memo ?? "";

  modal.hidden = false;
}

function closeModal() {
  modal.hidden = true;
  state.selectedTimerRunId = null;
}

// =====================
// events
// =====================
function registerEvents() {

  // 日付変更 → fetchだけ（画面遷移しない）
  dateInput.addEventListener("change", async () => {
    const v = dateInput.value;
    if (!v) return;

    try {
      const data = await fetchByDate(v);

      state.date = data.date;
      state.programs = data.programs ?? [];
      state.timerRuns = data.timer_runs ?? [];
      state.dailyTotalElapsedSec = data.daily_total_elapsed_sec ?? 0;
      state.selectedProgramRunId = "all";

      renderAll();
    } catch (err) {
      console.error(err);
      alert("データ取得失敗");
    }
  });

  // program click
  programList.addEventListener("click", (e) => {
    const btn = e.target.closest(".recordedProgram");
    if (!btn) return;

    state.selectedProgramRunId = btn.dataset.programRunId;
    renderPrograms();
    renderTimers();
  });

  // timer click
  timerList.addEventListener("click", (e) => {
    const btn = e.target.closest(".recordedTimer");
    if (!btn) return;
    openMemoModal(btn.dataset.timerRunId);
  });

  closeBtn.addEventListener("click", closeModal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  modalArea.addEventListener("click", (e) => e.stopPropagation());

  memoSendBtn.addEventListener("click", async () => {
    const id = state.selectedTimerRunId;
    if (!id) return;

    const memo = memoTextarea.value;

    try {
      await saveMemo(id, memo);

      const run = state.timerRuns.find(r => String(r.timer_run_id) === String(id));
      if (run) run.memo = memo;

      closeModal();
      renderTimers();
    } catch (err) {
      console.error(err);
      alert("保存失敗");
    }
  });
}

// =====================
// init
// =====================
async function init() {
  registerEvents();

  try {
    const data = await fetchToday();

    state.date = data.date;
    state.programs = data.programs ?? [];
    state.timerRuns = data.timer_runs ?? [];
    state.dailyTotalElapsedSec = data.daily_total_elapsed_sec ?? 0;

    renderAll();
  } catch (err) {
    console.error(err);
    timerList.innerHTML = "取得失敗";
  }
}

init();