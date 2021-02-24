/* Set config */
import { pino } from '../../build/index.conf.js';

import express from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
const app = express();

import cors from 'cors';
app.use(cors()) // Cors for testing API

app.use(bodyParser.json())
app.use(compression())

// Connect logs
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
