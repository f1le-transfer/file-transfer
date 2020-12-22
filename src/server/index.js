import path from 'path';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', 'src', 'server', 'config', '.env') })
const app = express();

// Connect mongoDB
import('./loaders/mongo.loader')

import cors from 'cors';
app.use(cors()) // Cors for testing API

app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>')
})

// Routers
import fileRouter from './routes/files.route';

app.use('/file', fileRouter)

app.listen(process.env.PORT)
