document.addEventListener('DOMContentLoaded', init, false);
const pwa_log = (info) => console.log(`%c[Service Worker] ${info}`, `color: green;`)
let CURRENT_FILES;

function init() {
  if ('serviceWorker' in navigator && navigator.onLine) {
    Promise.all([navigator.serviceWorker.register('/sw.js'), navigator.serviceWorker.register('/tcp_conn.js')])
      .then(values => values.forEach((v, i) => pwa_log(`Registered ${i+1}`, v)))
      .then(getFilesList)
      .catch(err => console.error('Not registered ->', err))
  }
}

function getFilesList() {
  const broadcast = new BroadcastChannel('tcp_channel')
  broadcast.addEventListener('message', ({ data }) => {
    if (!data.listAvailableFiles) return;
    data.listAvailableFiles.forEach(file => {
      document.getElementById('files').innerHTML += (`<p>${file}</p>`)
    })
    CURRENT_FILES = data.listAvailableFiles
  })

  broadcast.postMessage({ getListAvailableFiles: true })
}