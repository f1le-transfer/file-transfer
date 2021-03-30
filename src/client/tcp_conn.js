const socket = new WebSocket("ws://127.0.0.1:5050")
const broadcast = new BroadcastChannel('tcp_channel')

broadcast.addEventListener('message', ({ data }) => {
  socket.send(JSON.stringify(data))
})

socket.onopen = function(e) {
  console.log("[TCP open] Connection open");
}

socket.onmessage = function(event) {
  console.log(`[TCP msg] ${event.data}`)
}

socket.onclose = function(event) {
  console.log(`[TCP close] Code: ${event.code} ${event.reason}`)
}

socket.onerror = function(error) {
  console.log(`[TCP error] ⬇️`);
  console.log(error)
}
