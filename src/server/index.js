import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../../config/.env') })
const app = express();

// Connect mongoDB
import('./loaders/mongo.loader')
 .then(() => {
   app.listen(process.env.PORT)
 })

import cors from 'cors';
app.use(cors()) // Cors for testing API

app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>')
})

// Routes
import files from './routes/files.route';
import users from './routes/users.route';

app.use('/file', files)
app.use('/user', users)
