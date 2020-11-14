const net = require('net')

const server = net.createServer((conn) => {
  console.log('**connection opened**')
  conn.on('data', (data) => {
    console.log(data.toString())
  })

  conn.on('close', () => {
    console.log('**connection closed**')
  })
})

server.listen(80);
