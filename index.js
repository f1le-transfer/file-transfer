const app = require('express')()
const bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  res.send('hi')
})

app.post('/exec', (req, res) => {
  let {body: data} = req
  
})

app.listen(8080)


process.stdin.on('data', (rawData) => {
  const command = rawData.toString().trim()

  console.log(command)
})