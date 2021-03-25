document.addEventListener('DOMContentLoaded', init, false);
const log = (info) => console.log(`%c[Service Worker] ${info}`, `color: green;`)

function init() {
  if ('serviceWorker' in navigator && navigator.onLine) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => log('Registered', reg))
      .catch(err => console.error('Not registered ->', err))
    
    navigator.serviceWorker.register('/tcp_conn.js')
      .then(reg => log('Registered', reg))
      .catch(err => console.error('Not registered ->', err))
  }
}