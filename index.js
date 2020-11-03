const app = require('express')()


app.get('/', (req, res) => {
  res.send('hi')
})

app.listen(8080)


process.stdin.on('data', (rawData) => {
  const command = rawData.toString().trim()

  console.log(command)
})