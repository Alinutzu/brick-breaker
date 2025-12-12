// pwa.js — service worker registration & install prompt
(function(){
  if('serviceWorker' in navigator){ window.addEventListener('load', ()=>{ navigator.serviceWorker.register('./service-worker.js'); }); }
  let deferredPrompt; const installBtn=document.getElementById('installBtn');
  window.addEventListener('beforeinstallprompt', (e)=>{ e.preventDefault(); deferredPrompt=e; if(installBtn) installBtn.style.display='inline-block'; });
  installBtn?.addEventListener('click', async ()=>{ if(!deferredPrompt) return; deferredPrompt.prompt(); const { outcome }=await deferredPrompt.userChoice; deferredPrompt=null; installBtn.style.display='none'; });
})();
