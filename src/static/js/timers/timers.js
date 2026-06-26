// 1.定数
// モーダルの状態
const modalState = {
    mode: null,
    currentTimer: null,
};


// 2.DOM取得
// モーダルの制御に向けてDOMの取得
// モーダル全体の表示を分けるDOM
const createUpdateContent = document.getElementById('createUpdateContent');
const deleteContent = document.getElementById('deleteContent');

// 削除のの表示を行うDOM
const beforeDelete = document.getElementById('beforeDelete');

// タイマーの新規作成と編集での表示を分けるDOM
const timerModalTitle = document.getElementById('timerModalTitle');

// 削除前モーダルで削除対象を確認するDOM
const deleteTimerName = document.getElementById('deleteTimerName');
const deleteTimerDuration = document.getElementById('deleteTimerDuration');
const deleteTimerCategory = document.getElementById('deleteTimerCategory');

// タイマーカードを振り分ける場所を表すDOM
const focusTimerList = document.getElementById("focusTimerList");
const otherTimerList = document.getElementById('otherTimerList');

// モーダルに関するDOM
const modal = document.getElementById("modal");
const closeBtn = document.getElementById("closeBtn");
const overlay = document.getElementById('modalOverlay');
const modalArea = document.getElementById("modalArea");

// 追加ボタンに関するDOM
const focusTimerAdd = document.getElementById("focusTimerAdd");
const otherTimerAdd = document.getElementById("otherTimerAdd");

// エラーメッセージに関するDOM
const formError = document.getElementById("formError");
const deleteError = document.getElementById("deleteError");

// 作成、編集フォームに関するDOM
const createForm = document.getElementById("createForm");
const editForm = document.getElementById("editForm");
const deleteForm = document.getElementById("deleteForm");

// 編集フォーム内の操作に関するDOM
const editName = document.getElementById("edit-name");
const editCategory = document.getElementById("edit-category");
const editDuration = document.getElementById("edit-duration");
const editSound = document.getElementById("edit-sound");
const createCategorySelect = createForm.querySelector('[name="create-category"]');
// 作成フォームのサウンドの選択肢のDOM
const createSoundSelect = createForm.querySelector('[name="create-sound"]');

// タイマーが既存プログラム使用中を警告するDOM
const usageWarningEdit = document.getElementById("usageWarningEdit");
const usageTextEdit = document.getElementById("usageTextEdit");
const usageWarningDelete = document.getElementById("usageWarningDelete");
const usageTextDelete = document.getElementById("usageTextDelete");


// 3.ユーティリティ関数
// 変換関数
// バックエンドの秒表示をフロントの分表示に変える関数
function secToMin (sec) {
    return Math.floor(sec/60);
}
// フロントの分表示をバックの秒表示に変える関数
function minToSec (min) {
    return Number(min) * 60;
}

// crsftokenを取得する関数と取得処理
function getCookie(name){
  return document.cookie
    .split("; ")
    .find(row => row.startsWith(name + "="))
    ?.split("=")[1];
}
const csrftoken = getCookie("csrftoken");

if (!csrftoken) {
  console.warn("csrftokenが取得できません。CSRF設定を確認してください。");
}

// datasetからタイマー情報を作る関数（編集フォームに入れる）
function readTimerFromCard(timerEl) {
  return {
    timer_id: Number(timerEl.dataset.timerId),
    timer_name: timerEl.dataset.timerName ?? "",
    duration_sec: Number(timerEl.dataset.durationSec), // data-duration-sec
    category_value: timerEl.dataset.categoryValue ?? "", // data-category-value
    category_label: timerEl.dataset.categoryLabel ?? "", // data-category-label
    sound_value: timerEl.dataset.soundValue ?? "",       // data-sound-value
    
  };
}

// selectの選択肢を複製する関数
function cloneSelectOptions(fromSelect, toSelect) {
  if (!fromSelect || !toSelect) return;
  toSelect.replaceChildren(...Array.from(fromSelect.children).map(n => n.cloneNode(true)));
}

// 編集フォームのプレフィックスを作る関数
function applyEditFieldNames(timerId) {
  // バックエンドの命名規則：edit_(id)-* の形
  const prefix = `edit_${timerId}-`;

  editName.name = `${prefix}name`;
  editCategory.name = `${prefix}category`;
  editDuration.name = `${prefix}duration_minutes`;
  editSound.name = `${prefix}sound`;
}




// 4.描画系の関数
// 片方のみ空の場合もメッセージを出す
function ensureEmptyMessage(listEl) {
  if (!listEl) return;

  const hasCard = listEl.querySelector(".oneTimer");
  const hasEmpty = listEl.querySelector(".empty");

  if (!hasCard && !hasEmpty) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "タイマーが登録されていません";
    listEl.appendChild(p);
  }

  // 逆にカードがあるのにemptyが残っていたら消す（保険）
  if (hasCard && hasEmpty) {
    hasEmpty.remove();
  }
}

// 5.モーダル系の関数
// モーダルを制御する関数を作る
function setModalMode (mode, payload = null) {
    // 最初にmodalStateに値を入れておく
    modalState.mode = mode;
    modalState.currentTimer = payload;
    // モーダル内の全ての表示をリセット
    createUpdateContent.hidden = true;
    deleteContent.hidden = true;
    beforeDelete.hidden = true;
    formError.hidden = true;
    deleteError.hidden = true;
    
    // 警告の取り消し
    hideUsageWarnings();

    // フォーム切り替え用
    if (createForm) createForm.hidden = true;
    if (editForm) editForm.hidden = true;

    // 作成フォームの入力リセット
    if (createForm) createForm.reset?.();

    // editフォームの入力リセット
    if (editName) editName.value = "";
    if (editDuration) editDuration.value = "";
    if (editCategory) editCategory.value = "";
    if (editSound) editSound.value = "";

    // 削除表示リセット
    deleteTimerName.textContent = "";
    deleteTimerDuration.textContent = "";
    deleteTimerCategory.textContent = "";
    formError.textContent = "";
    deleteError.textContent = "";

    if (mode === "create") {
        createUpdateContent.hidden = false
        timerModalTitle.textContent = "タイマー作成";
        
        // 作成フォームを表示
        if (createForm) createForm.hidden = false;

        // クリックしたボタンに応じてカテゴリーを初期入力
        const cat = payload?.category_value;
        if (cat && createCategorySelect) {
            createCategorySelect.value = cat;
        }
    }

    if (mode === "update") {
        createUpdateContent.hidden = false
        timerModalTitle.textContent = "タイマー編集";

        // 編集フォームを表示
        if (editForm) editForm.hidden = false;

        // editフォームのactionをID付きに差し替え
        const t = modalState.currentTimer;

        applyEditFieldNames(t.timer_id);

        const tpl = editForm?.dataset?.editActionTemplate;
        if (tpl && t?.timer_id){
            // htmlに書いてある末尾の0をt.timer_idに置き換える
            editForm.action = tpl.replace("0", t.timer_id);
        }

        // 値を流し込む（datasetのvalueを使うのが重要）
        if (editName) editName.value = t.timer_name;
        if (editDuration) editDuration.value = secToMin(t.duration_sec);
        if (editCategory) editCategory.value = t.category_value;
        if (editSound) editSound.value = t.sound_value; // ""なら未選択
        // モードチェック用
        const reqMode = mode;
        // 使用状況を取得して警告表示
        fetchTimerUsage(t.timer_id)
          .then((data) => {
            // モードチェック
            if (modalState.mode !== reqMode) return;
            // 連打対策
            if (modalState.currentTimer?.timer_id !== t.timer_id) return;
            const text = buildUsageText(data);
            if(text){
              showUsageWarningForMode(reqMode, text, true);
            }            
          })
          .catch(() => {
            // モードチェック
            if (modalState.mode !== reqMode) return;
            // 失敗時も警告する
            if (modalState.currentTimer?.timer_id !== t.timer_id) return;
            showUsageWarningForMode(mode, buildUsageFallbackText(), false); 
          });
    }

    if (mode === "delete-confirm") {
        deleteContent.hidden = false;
        beforeDelete.hidden = false;

        const t = modalState.currentTimer;
        deleteTimerName.textContent = `タイマー名：${t.timer_name}`;
        deleteTimerDuration.textContent = `時間：${secToMin(t.duration_sec)}分`;
        deleteTimerCategory.textContent = `カテゴリー：${t.category_label || t.category_value}`;

        // actionの差し替え
        const tpl = deleteForm?.dataset?.deleteActionTemplate;
        if (tpl && t?.timer_id) {
            deleteForm.action = tpl.replace("0", t.timer_id);
        }
        // モードチェック用
        const reqMode = mode;
        // 使用状況を取得して警告表示
        fetchTimerUsage(t.timer_id)
          .then((data) => {
            // モードチェック
            if (modalState.mode !== reqMode) return;
            // 連打対策
            if (modalState.currentTimer?.timer_id !== t.timer_id) return;
            const text = buildUsageText(data);
            if(text){
              showUsageWarningForMode(mode, text, true);
            }            
          })
          .catch(() => {
            // モードチェック
            if (modalState.mode !== reqMode) return;
            // 失敗時も警告する
            if (modalState.currentTimer?.timer_id !== t.timer_id) return;
            showUsageWarningForMode(mode, buildUsageFallbackText(), false); 
          });
    }
    // モーダル表示
    modal.hidden = false;
}

// タイマーカードのクリック場所によってモーダルのmodeを分ける関数
function handleTimerClick(e) {
  const timerEl = e.target.closest(".oneTimer");
  if (!timerEl) return;

  const timerObj = readTimerFromCard(timerEl);

  // ゴミ箱ボタン
  const deleteBtn = e.target.closest(".delete-btn");
  if (deleteBtn) {
    e.stopPropagation();
    setModalMode("delete-confirm", timerObj);
    return;
  }

  // それ以外は編集
  setModalMode("update", timerObj);
}

// 前回のfetch通信をキャンセルするための変数（下の関数で使う）
let usageAbort = null;

// タイマーの使用状況を取得する関数
async function fetchTimerUsage(timerId) {
  if (usageAbort) usageAbort.abort();
  usageAbort = new AbortController();

  const res = await fetch(`/timers/${timerId}/usage/`, {
    method: "GET",
    credentials: "same-origin",
    headers: { "Accept": "application/json" },
    signal: usageAbort.signal,
  });
  if (!res.ok) throw new Error("usage fetch failed");
  return await res.json();
}

// 取得した使用状況から警告textを作成する関数
function buildUsageText(data) {
  const used = Number(data.used_count || 0);
  if (used <= 0) return "";

  const names = Array.isArray(data.program_names) ? data.program_names : [];
  const remain = Number(data.remain_count || 0);

  const line1 = `このタイマーは ${used} 件のプログラムで使用中です。`;
  const line2 = `使用中：${names.join(" / ")}${remain > 0 ? `（ほか${remain}件）` : ""}`;
  const line3 = `変更・削除は使用中の全てのプログラムに適用されます。`
  return `${line1}\n${line2}\n${line3}`;
}

//　警告を隠す関数 
function hideUsageWarnings(){
  [usageWarningEdit, usageWarningDelete].forEach(el=>{
    if(!el) return;
    el.hidden = true;
    el.textContent = "";
    el.classList.remove("usage-warning--danger"); // ★ここ
  });
}

// モードによって挿入するモーダルを見分ける関数
function showUsageWarningForMode(mode, text, isDanger=false){
  hideUsageWarnings();
  if (!text) return;

  let el = null;
  if (mode === "update") el = usageWarningEdit;
  if (mode === "delete-confirm") el = usageWarningDelete;
  if (!el) return;

  el.textContent = text;
  el.hidden = false;

  // ★ 色切替
  if (isDanger){
    el.classList.add("usage-warning--danger");
  }else{
    el.classList.remove("usage-warning--danger");
  }
}

// 使用中のタイマーの取得を失敗した時のテキスト
function buildUsageFallbackText(){
  return `このタイマーはプログラムで使用されている可能性があります。\n変更・削除は使用中の全てのプログラムに適用されます。`;
}


// 6.サウンド系の関数
// サウンドのファイルパスを取得する関数
function getSoundMap(){
  const el = document.getElementById("soundMap");
  if(!el) return {};
  try{
    return JSON.parse(el.textContent || "{}");
  }catch{
    return {};
  }
}

const SOUND_MAP = getSoundMap();
let previewAudio = null;

// サウンドファイルのURLを生成する関数
function buildSoundUrl(filePath){
  if(!filePath) return "";
  return `/static/${filePath}`;
}

// 音を再生する関数
function playSoundPreview(soundId){
  if(!soundId) return;

  const filePath = SOUND_MAP[String(soundId)];
  if(!filePath) return;

  const url = buildSoundUrl(filePath);

  if(previewAudio){
    previewAudio.pause();
    previewAudio.currentTime = 0;
  }

  previewAudio = new Audio(url);
  previewAudio.volume = 0.8;
  previewAudio.play().catch(()=>{});
}

// 音のプレビューを止める関数
function stopPreview() {
  if (!previewAudio) return;
  previewAudio.pause();
  previewAudio.currentTime = 0;
}


// 7.イベント登録
// バツボタンを押したらモーダルを閉じる処理
closeBtn.addEventListener("click", () => {
    stopPreview();
    modal.hidden =true;
});

// 背景を押したらモーダルを閉じる処理
overlay.addEventListener("click", () => {
    stopPreview()
    modal.hidden = true;
});

// 背景の範囲の中でも#modalArea上はイベントの伝播を止める（モーダルを閉じない）処理
modalArea.addEventListener("click", (e) => {
    e.stopPropagation();
});

// 集中のタイマーの1つを押したらモーダルを開く
focusTimerList.addEventListener("click", handleTimerClick);
otherTimerList.addEventListener("click", handleTimerClick);

// 集中のプラスボタンを押したらモーダルを開く
focusTimerAdd.addEventListener("click", () => {
    setModalMode("create", {category_value: "focus"});
});

// その他のプラスボタンを押したらモーダルを開く
otherTimerAdd.addEventListener("click", () => {
    setModalMode("create", {category_value: "break"})
});

// ロード時の処理
document.addEventListener("DOMContentLoaded", () => {
    // カテゴリとサウンドの選択肢を編集用モーダルにもコピー
    cloneSelectOptions(createCategorySelect, editCategory);
    cloneSelectOptions(createSoundSelect, editSound);
    // タイマーが0件の時に「タイマーが登録されていません」を出す
    ensureEmptyMessage(focusTimerList);
    ensureEmptyMessage(otherTimerList);
});

// サウンドのセレクトを変更した時に音を鳴らす処理
// ===== select変更で再生 =====
document.addEventListener("DOMContentLoaded", ()=>{

  if(createSoundSelect){
    createSoundSelect.addEventListener("change", e=>{
      playSoundPreview(e.target.value);
    });
  }

  if(editSound){
    editSound.addEventListener("change", e=>{
      playSoundPreview(e.target.value);
    });
  }

});
