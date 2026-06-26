function showToast(message, type="success"){
  const toast = document.getElementById("toast");
  if(!toast) return;

  toast.textContent = message;

  // 位置リセット
  toast.classList.remove("top","bottom");

  // success → 下
  if(type === "success"){
    toast.classList.add("bottom");
  }
  // error → 上
  else if(type === "error"){
    toast.classList.add("top");
  }

  toast.classList.add("show");

  clearTimeout(showToast._t);

  // errorは長め
  const duration = (type === "error") ? 5000 : 2200;

  showToast._t = setTimeout(()=>{
    toast.classList.remove("show");
  }, duration);
}


/* =========================
   Django messages受信
========================= */

if(window.__DJANGO_MESSAGES__?.length){

  const last = window.__DJANGO_MESSAGES__[window.__DJANGO_MESSAGES__.length - 1];

  // errorなら上、それ以外success扱い
  if(last.level.includes("error")){
    showToast(last.text, "error");
  }else{
    showToast(last.text, "success");
  }
}