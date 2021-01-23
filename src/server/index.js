// Set env variables
import '../../config/index';
import express from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
const app = express();

import cors from 'cors';
app.use(cors()) // Cors for testing API

app.use(bodyParser.json())
app.use(compression())

const pino = require('pino-http')({
  prettyPrint: true,
  timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
  level: process.env.NODE_ENV === 'test' ? 'silent' : 'info'
})
app.use(pino)

app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>')
})

// Routes
import files from './routes/files.route';
import users from './routes/users.route';

app.use('/files', files)
app.use('/users', users)

// Handling invalid requests.
app.use((req, res) => res.sendStatus(404) )

export default app
