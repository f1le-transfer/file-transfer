document.addEventListener('DOMContentLoaded', init, false);
const log = (info, color='green') => console.log(`%c${info}`, `color: ${color};`)

function init() {
  if ('serviceWorker' in navigator && navigator.onLine) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => log('[Service Worker sw.js] Registered', reg))
      .catch(err => console.error('[Service Worker sw.js] Not registered ->', err))
    
    // navigator.serviceWorker.register('/tcp_conn.js')
    //   .then(reg => log('[Service Worker] tcp_conn.js worker registered', reg))
    //   .catch(err => console.error('[Service Worker tcp_conn.js] Not registered ->', err))
  }
}