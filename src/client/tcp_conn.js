const HEADER = 256
const BUF_SIZE = 4096
const PORT = 5050
const HOST = '127.0.0.1'

/**
 * To communicate between main window and worker we will use the BroadcastChannel.
 */

// Channel for communicate between window and worker
const broadcast = new BroadcastChannel('tcp_channel'); 

const connect = () => new WebSocket(`ws://${HOST}:${PORT}`)
const close = () => socket.close(1000)

const socket = new WebSocket('wss://127.0.0.1:5050')

function encode_utf8(s) {
  return unescape(encodeURIComponent(s));
}

function decode_utf8(s) {
  return decodeURIComponent(escape(s));
}

socket.addEventListener('open', () => {
  console.log('[TCP] Connection open')
});

// listen to messages
broadcast.addEventListener('message', ({ data }) => {
  if (data) {
    console.log('[tcp_conn Service Worker] ⬇')
    console.log(data)
  }
})

const send_msg_window = msg => broadcast.postMessage(msg)

function set_header(file_name, req_type='POST') {
  const header = `TCP ${req_type}\nChunk-name: ${file_name}.chunk\nContent-length: 0\n`

  return header += ' '.repeat(HEADER-header.length)
}