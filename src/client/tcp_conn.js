const broadcast = new BroadcastChannel('tcp_channel')

broadcast.addEventListener('message', ({ data }) => {
  console.log(data)
})