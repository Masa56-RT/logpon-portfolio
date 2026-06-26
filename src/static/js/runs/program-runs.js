// 1.state
// タイマー実行の状態
const state = {
  timer_runs: [],
  program_run_id: null,
  currentTimerRunId: null,
  remainingSec: null,
  isRunning: false,
  intervalId: null,
  lastProgressSentElapsed: 0,
  lastTickAtMs: null,
}

// メモモーダルの状態
const modalState = {
  timerRunId: null,
  isOpen: false,
  isSaving: false,
};

// 定期報告の状態
const progressState = {
  lastSentElapsedSec: 0,
}

// async関数が進行中のフラグ（stateではないが）
let isAdvancing = false;

// audioの自動再生のアンロックフラグ
let audioUnlocked = false;

// interrupttの二重送信防止フラグ
let interruptSent = false;

// プログラム選択のリロードでpagehideが発火しないためのフラグ
let suppressInterruptOnce = false;

// 2.DOM
// モーダルに関するDOM
const modal = document.getElementById("modal");
const overlay = document.getElementById("modalOverlay");
const modalArea = document.getElementById("modalArea");
const closeBtn = document.getElementById("closeBtn");

const memoTextarea = document.getElementById("memoTextarea");
const memoSendBtn = document.getElementById("memoSendBtn");
const memoModalTitle = document.getElementById("memoModalTitle");
const timerNameSnapshotEl = document.getElementById("timerNameSnapshot");

const timerList = document.getElementById("executeTimerList");

// タイマー部分の表示に関するDOM
const currentTimerNameEl = document.getElementById("currentTimerName");
const remainingTimeEl = document.getElementById("remainingTime");
const timerFaceEl = document.querySelector(".timerFace");

// スタートボタンに関するDOM
const startBtn = document.getElementById("startBtn");
const startIcon = document.getElementById("startIcon");
const pauseIcon = document.getElementById("pauseIcon");
const skipbtn = document.getElementById("skipBtn");

// プログラムメニューの選択に関するDOM
const programSelect = document.getElementById("programId");
const config = document.getElementById("config");

// サウンドマップ読み取り（DOMではないが）
// --- Sound (global) ---
const soundMap = (() => {
  const el = document.getElementById("soundMap");
  if (!el) return {};
  try {
    return JSON.parse(el.textContent || "{}");
  } catch {
    return {};
  }
})();

// 3.関数
// timerRunIDを受けてモーダルを開く関数を定義
function openMemoModal(timerRunId) {
  modalState.timerRunId = Number(timerRunId);
  modalState.isOpen = true;
  modalState.isSaving = false;

  const tr = state.timer_runs.find(x => x.id === modalState.timerRunId);
  if (tr) {
    timerNameSnapshotEl.textContent = tr.timer_name_snapshot;

    // メモがすでにあれば編集モード、なければ作成モードにする
    const hasMemo = !!(tr.memo && tr.memo.length > 0);
    memoModalTitle.textContent = hasMemo ? "メモ編集" : "メモ作成";
    memoSendBtn.textContent = hasMemo ? "更新" : "作成";

    memoTextarea.value = tr.memo ?? "";
  } else {
    timerNameSnapshotEl.textContent = "";
    memoModalTitle.textContent = "メモ作成";
    memoSendBtn.textContent = "作成";
    memoTextarea.value = "";
  }
  memoSendBtn.disabled = false;
  modal.hidden = false;
}

// モーダルを閉じる関数
function closeMemoModal() {
  modal.hidden = true;
  // modalStateをリセット
  modalState.timerRunId = null;
  modalState.isOpen = false;
  modalState.isSaving = false;

  memoSendBtn.disabled = false;
}

// カテゴリーのDBデータを日本語に変える関数
function categoryToLabel(category) {
  if (category === "focus") return "集中";
  if (category === "break") return "休憩";
  if (category === "refresh") return "リフレッシュ";
  return category;
}

// ステータスを元にクラスを付ける関数
function applyStatusClass(btn, status) {
  btn.classList.remove("currentOneTimer", "finishedOneTimer");

  if (status === "running" || status === "paused") {
    btn.classList.add("currentOneTimer");
  }
  if (status === "finished" || status === "skipped") {
    btn.classList.add("finishedOneTimer");
  } 
}

// duration_sec_snapshotを分単位に変える関数
function secToMinLabel (sec) {
  const min = Math.floor(sec / 60);
  return `${min}分`;
}

// タイマー名に記号が入っていた時にエスケープする関数
function escapeHtml(str) {
return String(str)
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll('"', "&quot;")
.replaceAll("'", "&#039;");
}

// currentTimerを決める関数（中断があれば中断、なければpending先頭）
function initCurrentTimer () {
  // running or pausedがあれば復元
  const active = state.timer_runs.find(
    tr => tr.status === "running" || tr.status ==="paused"
  );
  if (active) {
    state.currentTimerRunId = active.id;
    state.remainingSec = Math.max(0, active.duration_sec_snapshot - active.elapsed_sec);
    state.isRunning = (active.status === "running");
    state.lastProgressSentElapsed = active.elapsed_sec - (active.elapsed_sec % 60);
    return;
  }

  // なければpendingの先頭
  const sorted = getSortedTimerRuns();
  const firstPending = sorted.find(tr => tr.status === "pending");
  if (firstPending) {
    state.currentTimerRunId = firstPending.id;
    state.remainingSec = firstPending.duration_sec_snapshot;
    state.isRunning = false;
    state.lastProgressSentElapsed = 0;
    return;
  }

  // スタートできるタイマーがない時
  state.currentTimerRunId = null;
  state.remainingSec = null;
  state.isRunning = false;

  const tr = getCurrentTimerRun();
  progressState.lastSentElapsedSec = tr ? tr.elapsed_sec - (tr.elapsed_sec % 60) : 0;
}

// ソート関数
function getSortedTimerRuns() {
  return [...state.timer_runs].sort(
    (a, b) => a.order_index_snapshot - b.order_index_snapshot
  );
}

// stateのtimer_runsからcurrentTimerRunIdと同じものを探す関数
function getCurrentTimerRun() {
  return state.timer_runs.find(tr => tr.id === state.currentTimerRunId) || null;
}

// timerFaceを表示する関数
function renderCurrentTimerFace() {
  const tr = getCurrentTimerRun();
  if (!tr) {
    currentTimerNameEl.textContent = "";
    remainingTimeEl.textContent = "--:--";
    return;
  }
  currentTimerNameEl.textContent = tr.timer_name_snapshot;
  remainingTimeEl.textContent = formatMMSS(state.remainingSec ?? 0);
}

function formatMMSS(sec) {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

// タイマーの円を減らすアニメーションを作る関数
function updateTimerCircle() {
  const tr = getCurrentTimerRun();
  if (!tr || state.remainingSec == null) return;

  const total = tr.duration_sec_snapshot || 0;
  if (total <= 0) {
    timerFaceEl.style.setProperty("--deg", "0deg");
    return;
  }

  const remainingRatio = 1 - (state.remainingSec / total);

  const deg = remainingRatio * 360;

  timerFaceEl.style.setProperty("--deg", `${deg}deg`);
}


// タイマー一覧をレンダリングする関数
function renderTimerList() {
  timerList.innerHTML = "";

  const sorted = getSortedTimerRuns();
  sorted.forEach((tr) => {
    const btn = document.createElement("button");
    btn.className = "oneTimer";
    btn.dataset.timerRunId = tr.id;
    btn.dataset.category = tr.category_snapshot;
    btn.dataset.status = tr.status;

    // サウンドのIDがあればそれもdatasetに追加
    if (tr.sound_file_snapshot) {
      btn.dataset.soundFile = tr.sound_file_snapshot;
    }

    // btnにstatusに合わせたクラスを付与
    applyStatusClass(btn, tr.status);

    const categoryLabel = categoryToLabel(tr.category_snapshot);
    const durationLabel = secToMinLabel(tr.duration_sec_snapshot);

    btn.innerHTML = `
    <p class="category">${categoryLabel}</p>
    <p class="timerName">${escapeHtml(tr.timer_name_snapshot)}</p>
    <p class="duration">${durationLabel}</p>
    `;
    timerList.appendChild(btn);
  })
}

// stateの状態に合わせてスタートボタンのアイコンを変える関数
function syncPlayIcon() {
  if (state.isRunning) {
    startIcon.classList.add("hidden");
    pauseIcon.classList.remove("hidden");
  } else {
    startIcon.classList.remove("hidden");
    pauseIcon.classList.add("hidden");
  }
}

// タイマーをスタートする時の処理を行う関数
async function startTimer() {
  if (state.intervalId) return;
  if (!state.currentTimerRunId) return;

  const tr = getCurrentTimerRun();
  if (!tr) return;

  // サーバの報告を投げるurlをstatusで判断
  let kind = null;
  if (tr.status === "pending") kind = "start";
  else if (tr.status === "paused") kind = "resume";
  else if (tr.status === "running") return;
  else {
    kind = "resume";
  }

  // 状態を更新
  state.isRunning = true;
  tr.status = "running";

  // tickの基準時刻をstateへ追加
  state.lastTickAtMs = Date.now();

  syncPlayIcon();
  renderTimerList();
  renderCurrentTimerFace();

  // サーバーへ報告
  const elapsedToSend = (kind === "start") ? 0 : tr.elapsed_sec;
  if (kind === "start") tr.elapsed_sec = 0;
  await postStartOrResume(kind, tr.id, elapsedToSend);

  progressState.lastSentElapsedSec = tr.elapsed_sec - (tr.elapsed_sec % 60);

  state.intervalId = setInterval(tick, 1000);
}

// タイマーを進める関数
function tick() {
  if (!state.isRunning) return;
  if (isAdvancing) return

  const tr = getCurrentTimerRun();
  if (!tr) return;
  // 現在時間を取得
  const now = Date.now();
  if(!state.lastTickAtMs) state.lastTickAtMs = now;

  // 秒経過を基準時間との差で算出
  const deltaSec = Math.floor((now - state.lastTickAtMs) / 1000);
  if ( deltaSec <= 0) return;

  // 秒経過の分だけ基準時間も進める（止まっていた時間もまとめて処理）
  state.lastTickAtMs += deltaSec * 1000;

  // タイマーを進めてstateのremainingSecを減らす
  tr.elapsed_sec += deltaSec;
  state.remainingSec = Math.max(0, tr.duration_sec_snapshot - tr.elapsed_sec);
  // remainingSecを元に表示を変える
  renderCurrentTimerFace();
  updateTimerCircle();
  // 定期送信
  sendProgressIfNeeded(false);
  // タイマーが0以下になったら次へ
  if (state.remainingSec <= 0) {
    finishCurrentAndMoveNext();
  }
}

// タイマーを一時停止する時の処理を行う関数
async function pauseTimer() {
  if(!state.intervalId) return;

  clearInterval(state.intervalId);
  state.intervalId = null;

  state.isRunning = false;
  // 基準時間を削除（次に残らないように）
  state.lastTickAtMs = null

  const tr = getCurrentTimerRun();
  if(!tr) {
    syncPlayIcon();
    renderTimerList();
    renderCurrentTimerFace();
    return;
  }

  tr.status = "paused";

  syncPlayIcon();
  renderTimerList();
  renderCurrentTimerFace();

  await postPause(tr.id, tr.elapsed_sec)

  progressState.lastSentElapsedSec = tr.elapsed_sec - (tr.elapsed_sec % 60);

}

// スタート時と再開時で報告先を変える関数
const startUrlTemplate = config?.dataset.startUrlTemplate;
const pauseUrlTemplate = config?.dataset.pauseUrlTemplate;
const resumeUrlTemplate = config?.dataset.resumeUrlTemplate;
const skipUrlTemplate = config?.dataset.skipUrlTemplate;
const nextUrlTemplate = config?.dataset.nextUrlTemplate;
const progressUrlTemplate = config?.dataset.progressUrlTemplate;
const interruptUrlTemplate = config?.dataset.interruptUrlTemplate;

function buildUrl(tpl) {
  if(!tpl || !state.program_run_id) return null;
  return tpl.replace("__ID__", String(state.program_run_id));
}

// スタートもしくは再開をサーバへ報告する関数
async function postStartOrResume(kind, timerRunId, elapsedSec) {
  const url = kind === "start" 
    ? buildUrl(startUrlTemplate) 
    : buildUrl(resumeUrlTemplate);

  if (!url) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf,
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        timer_run_id: timerRunId,
        elapsed_sec: elapsedSec,
      }),
    });
    if (!res.ok) throw new Error(`${kind} failed:${res.status}`);
  } catch (e) {
    console.error(e?.message || e);
  }
}

// 一時停止（pause）をサーバへ報告する関数
async function postPause(timerRunId, elapsedSec) {
  const url = buildUrl(pauseUrlTemplate);

  if (!url) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf,
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        timer_run_id: timerRunId,
        elapsed_sec: elapsedSec,
      }),
    });
    if (!res.ok) throw new Error(`pause failed:${res.status}`);
  } catch (e) {
    console.error(e?.message || e);
  }
}


// 次のタイマー（タイマー完了/Skip）をサーバへ報告する関数
async function postSkipOrNext(kind,{finishedTimerRunId, elapsedSec, nextTimerRunId}) {
  const url = kind === "skip" ? buildUrl(skipUrlTemplate) : buildUrl(nextUrlTemplate);
  if (!url) return null;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf,
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        finished_timer_run_id: finishedTimerRunId,
        elapsed_sec: elapsedSec,
        next_timer_run_id: nextTimerRunId ?? null,
      }),
    });
    if (!res.ok) throw new Error(`${kind} failed: ${res.status}`);
    return await res.json()
  } catch (e){
    console.error(e?.message || e);
    return null;
  }
}

// 1つのタイマーが終わったら次のタイマーに進む関数（サーバ同期版：nextレスポンス対応）
async function finishCurrentAndMoveNext() {
  if (isAdvancing) return;
  isAdvancing = true;

  try {
    const current = getCurrentTimerRun();
    if (!current) return;

    // 終了音を鳴らす（UX）
    playFinishSoundForTimerRun(current);

    // 次の候補ID
    const next = findNextPendingAfterCurrent();
    const nextId = next ? next.id : null;

    // サーバへ通知（レスポンスを受け取る）
    const resp = await postSkipOrNext("next", {
      finishedTimerRunId: current.id,
      elapsedSec: current.duration_sec_snapshot, // 終了なので満了で送るのが自然
      nextTimerRunId: nextId,
    });

    // レスポンスが無い場合のフォールバック（最低限）
    if (!resp?.runs_data) {
      // 旧ロジックで進める（ただし不整合は起き得る）
      current.status = "finished";
      current.elapsed_sec = current.duration_sec_snapshot;

      if (!next) {
        stopCompletely();
        state.currentTimerRunId = null;
        state.remainingSec = null;
      } else {
        state.currentTimerRunId = next.id;
        next.status = "running";
        state.isRunning = true;
        if (!state.intervalId) state.intervalId = setInterval(tick, 1000);
        state.lastTickAtMs = Date.now();
        state.remainingSec = Math.max(0, next.duration_sec_snapshot - next.elapsed_sec);
      }

      renderTimerList();
      renderCurrentTimerFace();
      updateTimerCircle();
      syncPlayIcon();
      return;
    }

    const { program_run, finished_timer, next_timer } = resp.runs_data;

    // 1) finished_timer を state.timer_runs に反映
    if (finished_timer) {
      const f = state.timer_runs.find(x => x.id === finished_timer.id);
      if (f) {
        f.status = finished_timer.status; // "finished"
        // ended_at を使うなら保存（使わないなら不要）
        // f.ended_at = finished_timer.ended_at;
        f.elapsed_sec = f.duration_sec_snapshot; // 見た目/整合のため満了に寄せる
      }
    }

    // 2) next_timer を反映
    if (next_timer) {
      const n = state.timer_runs.find(x => x.id === next_timer.id);
      if (n) {
        n.status = next_timer.status; // "running" or "paused"
        // started_at を使うなら保存（使わないなら不要）
        // n.started_at = next_timer.started_at;
      }
    }

    // 3) current を next に移す（サーバの next_timer を正にする）
    if (next_timer) {
      state.currentTimerRunId = next_timer.id;
      const n = state.timer_runs.find(x => x.id === next_timer.id);
      state.remainingSec = Math.max(0, n.duration_sec_snapshot - n.elapsed_sec);
      state.lastTickAtMs = Date.now();
    } else {
      // next が無い＝プログラム終了
      stopCompletely();
      state.currentTimerRunId = null;
      state.remainingSec = null;
    }

    // 4) program_run.status に合わせてフロントの実行状態を揃える
    if (program_run?.status === "running") {
      state.isRunning = true;
      if (!state.intervalId) state.intervalId = setInterval(tick, 1000);
    } else {
      state.isRunning = false;
      if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
      }
    }

    // 5) UI同期（★runningでもpausedでも必ず）
    renderTimerList();
    renderCurrentTimerFace();
    updateTimerCircle();
    syncPlayIcon();

  } finally {
    isAdvancing = false;
  }
}

// スキップした時に次のタイマーに進む関数
async function skipCurrentTimer() {
  // 連打防止フラグ
  if (isAdvancing) return;
  isAdvancing = true;

  try {
    const current = getCurrentTimerRun();
    if (!current) return;

    current.status = "skipped";

    const next = findNextPendingAfterCurrent();
    const nextId = next ? next.id : null;

    const resp = await postSkipOrNext("skip", {
      finishedTimerRunId: current.id,
      elapsedSec: current.elapsed_sec,
      nextTimerRunId: nextId,
    });

    if (resp?.runs_data) {
      const {program_run, skipped_timer, next_timer} = resp.runs_data;

      // stateのskipされたタイマーにバックエンドから返されたstateを反映
      if (skipped_timer) {
        const s = state.timer_runs.find(x => x.id === skipped_timer.id);
        if (s) s.status = skipped_timer.status;
      }

      // stateの次のタイマーにバックエンドから返されたstateを反映
      if (next_timer) {
        const n = state.timer_runs.find(x => x.id === next_timer.id);
        if (n) {
          n.status = next_timer.status;
        }
      }

      // 現在タイマーをnextに移す
      if (next_timer) {
        state.currentTimerRunId = next_timer.id;
        const n = state.timer_runs.find(x => x.id === next_timer.id);
        state.remainingSec = Math.max(0, n.duration_sec_snapshot - n.elapsed_sec);
        state.lastTickAtMs = Date.now();
      } else {
        stopCompletely();
        state.currentTimerRunId = null;
        state.remainingSec = null;
      }

      // program_run.statusと同期してフロントの状態を揃える
      if (program_run?.status === "running") {
        state.isRunning = true;
        if (!state.intervalId) state.intervalId = setInterval(tick, 1000);
      } else {
        state.isRunning = false;
        if (state.intervalId) {
          clearInterval(state.intervalId);
          state.intervalId = null;
        }
      }

      renderTimerList();
      renderCurrentTimerFace();
      updateTimerCircle();
      syncPlayIcon();
        return;
    }
  } finally {
    isAdvancing = false;
  }
}

// 次のpending状態のタイマーを探す関数
function findNextPendingAfterCurrent() {
  const sorted = getSortedTimerRuns();
  const idx = sorted.findIndex(tr => tr.id === state.currentTimerRunId);
  for (let i = idx + 1; i < sorted.length; i++) {
    if (sorted[i].status === "pending") return sorted[i];
  }
  return null;
}

// タイマーを止めてstateを書き換える関数
function stopCompletely() {
  if (state.intervalId) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
  state.isRunning = false;  
  // 基準時間を削除（次に残らないように）
  state.lastTickAtMs = null;
}

// progresをサーバへ送信する関数
async function postProgress({currentTimerRunId, elapsedSec}) {
  const url = buildUrl(progressUrlTemplate);
  if (!url) return;
  if (!currentTimerRunId) return;

  try {
    const res = await fetch(url,{
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf,
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        current_timer_run_id: currentTimerRunId,
        elapsed_sec: elapsedSec,
      }),
    });
    if (!res.ok) throw new Error(`progress failed: ${res.status}`);
  } catch (e) {
    console.error(e?.message || e);
  }
}

// 必要な時にサーバにprogressを送信する処理を呼び出す関数
async function sendProgressIfNeeded(force = false) {
  const tr = getCurrentTimerRun();
  if (!tr) return;

  const elapsed = tr.elapsed_sec;

  const shouldSend = force || (elapsed - progressState.lastSentElapsedSec >= 60);
  if (!shouldSend) return;

  await postProgress({
    currentTimerRunId: tr.id,
    elapsedSec: elapsed,
  })
  progressState.lastSentElapsedSec = elapsed;
}

// サウンドのURLを作る関数
// sound_file_snapshot ("sounds/bell.mp3") から再生URLを作る
function buildSoundUrl(soundFile) {
  if (!soundFile) return null;

  // 例: "sounds/bell.mp3" → "/static/sounds/bell.mp3"
  // ※ STATIC_URL を "/static/" と仮定
  const base = "/static/";

  // 先頭スラッシュ有無などを吸収
  const cleaned = String(soundFile).replace(/^\/+/, ""); // "/sounds/x" → "sounds/x"
  return base + cleaned;
}


// audioの自動再生を許可させておく関数
function unlockAudioOnce() {
  if (audioUnlocked) return;
  audioUnlocked = true;

  // 現在タイマーの音で解禁（なければ何もしない）
  const tr = getCurrentTimerRun();
  const url = buildSoundUrl(tr?.sound_file_snapshot);
  if (!url) return;

  const audio = new Audio(url);
  audio.volume = 0.001; // 極小音（実質聞こえないくらい）

  const p = audio.play();
  p.then(() => {
    // すぐ止める（ユーザー操作で再生した実績を作る）
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;
    }, 50); //あまりに短すぎると再生したと判定されないことがあるため50ms
  }).catch(() => {
    // 失敗しても無視（終了時に再挑戦）
  });
}


// タイマーの終了音を鳴らす関数
function playFinishSoundForTimerRun(tr) {
  const url = buildSoundUrl(tr?.sound_file_snapshot);
  if (!url) return;

  const audio = new Audio(url);
  audio.currentTime = 0;
  audio.play().catch(() => {
    // play()はPromiseを返すので、失敗してもcatchして無視する
  });
}

// interrupt時のpayloadを作る関数
function buildInterruptPayload() {
  const tr = getCurrentTimerRun();
  if(!tr) return null;

  return {
    timer_run_id: tr.id,
    elapsed_sec: tr.elapsed_sec,
  };
}

// sendBeaconとkeepalive fetchのベストエフォートでinterruptを送る関数
function sendInterruptBestEffort(reason = "") {
  if (suppressInterruptOnce) return;
  if (interruptSent) return;

  const url = buildUrl(interruptUrlTemplate);
  if(!url) return;
  
  const payload = buildInterruptPayload();
  if(!payload) return;
  
  interruptSent = true;

  const body = JSON.stringify(payload);

  // sendBeaconの処理
  // try {
  //   if (navigator.sendBeacon) {
  //     const blob = new Blob([body],{ type: "application/json" });
  //     const ok = navigator.sendBeacon(url, blob);
  //     if (ok) return;
  //   }
  // } catch {}

  // keepalive fetch
  try {
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf,
        "X-Requestd-With": "XMLHttpRequest",
      },
      credentials: "same-origin",
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

// interruptのイベントを登録する関数
function registerInterruptHandlers() {
  // メイン(pagehide)
  window.addEventListener("pagehide", (e) => {
    sendInterruptBestEffort("pagehide");
    },
    { capture: true }
  );

  // 保険（beforeunload）
  window.addEventListener("beforeunload", () => {
    sendInterruptBestEffort("beforeunload");
    },
    { capture: true}
  );

  // bfcache復帰対策
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      interruptSent = false;
    }
  });
}


// 4.イベント
// 【追加】プログラムメニュー選択時のfetchAPI(POST)
const postUrl = config?.dataset.postUrl;
const csrf = config?.dataset.csrf;

programSelect.addEventListener("change", async () => {
  const programId = programSelect.value;
  if (!programId) return;

  try {
    const res = await fetch(postUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf,
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "same-origin",
      body: JSON.stringify({ program_id: programId }),
    });
    const data = await res.json();
    const redirect = await data.redirect_url;
    // pagehide発火のフラグをtrueにして発火しないようにする
    suppressInterruptOnce = true;

    window.location.href = await redirect;
  } catch (error) {
    console.error("エラーが発生しました:", error.message);
  }
});

// 【追加】リダイレクト後の操作
document.addEventListener("DOMContentLoaded", async () => {
  const executePage = document.querySelector(".execute-page");
  const runId = executePage.dataset.programRunId;
  const apiUrl = executePage.dataset.apiUrl;
  if (!runId) return;

  state.program_run_id = Number(runId);

  // リダイレクト先でのプログラムタイマー展開（fetch GET）
  try {
    const res = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });
    if (!res.ok) {
      throw new Error(`レスポンスステータス: ${res.status}`);
    }
    const data = await res.json();
    // 右側画面タイマーの展開
    state.timer_runs = data.runs_data.timer_runs;

    initCurrentTimer();
    renderTimerList();
    renderCurrentTimerFace();
    syncPlayIcon();

    // 選択したプルダウンメニュー固定
    const programId = data.runs_data.program_run.program_id;
    const selectedOption = programSelect.querySelector(
      `option[value="${programId}"]`,
    );
    selectedOption.selected = true;
  } catch (error) {
    console.error(error.message);
  }

  registerInterruptHandlers();
});

// ×ボタンor背景クリックでモーダルを閉じる
closeBtn.addEventListener("click", closeMemoModal);
overlay.addEventListener("click", closeMemoModal);

// modaiAreaのクリックは親要素に伝わらないようにブロック、eはイベントオブジェクト
modalArea.addEventListener("click", (e) => {
  e.stopPropagation();
});

// タイマーをクリックしてモーダルを開く
timerList.addEventListener("click", (e) => {
  const timerEl = e.target.closest(".oneTimer");
  if (!timerEl) return;

  const category = timerEl.dataset.category;
  if (category !== "focus") {
    return;
  }

  const timerRunId = timerEl.dataset.timerRunId;
  openMemoModal(timerRunId);
});

// memoSendBtnを押してメモを保存する処理
memoSendBtn.addEventListener("click", async() => {
  if (!modalState.timerRunId) return;
  if (modalState.isSaving) return;

  modalState.isSaving = true;
  memoSendBtn.disabled = true;

  const memo = memoTextarea.value;

  try {
    const res = await fetch(`/timer-runs/${modalState.timerRunId}/memo/`, {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        "X-CSRFToken": csrf,
        "X-Requested-With": "XMLHttpRequest",
      },
      credentials: "same-origin",
      body: JSON.stringify({memo}),
    });

    if (!res.ok) {
      throw new Error(`memo save failed: ${res.status}`)
    }

    // 保存成功の時
    const tr = state.timer_runs.find(x => x.id === modalState.timerRunId);
    if (tr) tr.memo = memo

    closeMemoModal();
  } catch (e) {
    console.error(e?.message || e);
    modalState.isSaving = false;
    memoSendBtn.disabled = false;
  }
});

// スタートボタンを押した時のイベント
startBtn.addEventListener("click", () => {
  // 音の自動再生を解禁
  unlockAudioOnce();
  // 一時停止と再生を切り替え
  if(state.isRunning) pauseTimer();
  else startTimer();
});

// スキップボタンを押した時のイベント
skipBtn.addEventListener("click", () => {
  skipCurrentTimer();
});