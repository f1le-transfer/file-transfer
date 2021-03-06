let socket = set_socket(new WebSocket("ws://127.0.0.1:5050"))
const broadcast = new BroadcastChannel('tcp_channel')

broadcast.addEventListener('message', ({ data }) => {
  if (socket.readyState === 1) {
    socket.send(JSON.stringify(data))
  } else {
    new Promise((res, rej) => {
      socket.onopen = () => {
        socket.send(JSON.stringify(data))
        res()
      }
    })
  }
})

function set_socket(socket) {
  socket.onopen = function(e) {
    console.log("[TCP open] Connection open");
  }
  
  socket.onmessage = function(event) {
    const msg = JSON.parse(event.data)
    broadcast.postMessage(msg)
  }
  
  socket.onclose = function(event) {
    console.log(`[TCP close] Code: ${event.code} ${event.reason}`)
  }
  
  socket.onerror = function(error) {
    console.log(`[TCP error] ⬇️`);
    console.log(error)
  }
  return socket
}