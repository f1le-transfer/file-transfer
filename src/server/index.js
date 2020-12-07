const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
require('dotenv').config({ path: path.join(__dirname, 'config', '.env') })
const app = express()

// Connect to mongodb
require('./loaders/mongo')

app.use(require('cors')()) // Cors for testing API
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>')
})

app.listen(process.env.PORT)
