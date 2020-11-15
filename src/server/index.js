const path = require('path')
const express = require('express')
require('dotenv').config({ path: path.join(__dirname, 'config', '.env') })
const app = express()

app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>')
})

app.listen(process.env.PORT)