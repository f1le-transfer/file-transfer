document.addEventListener('DOMContentLoaded', init, false);

function init() {
  if ('serviceWorker' in navigator && navigator.onLine) {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[Service Worker] Registered ->', reg);
      }, (err) => {
        console.error('[Service Worker] Not registered ->', err);
      });
  }
}