/* Set config */
import { pino } from '../../build/index.conf.js';
import path from 'path';

import express from 'express';
import bodyParser from 'body-parser';
import compression from 'compression';
const app = express();

import cors from 'cors';
app.use(cors()) // Cors for testing API

app.use(bodyParser.json())
app.use(compression())

app.use((req, res, next) => {
  /**
   * Temporary stub for tests, rewrite tests to work with https in the future.
   */
  if (!req.secure && process.env.NODE_ENV !== 'test') {
    return res.redirect(308, 'https://' + req.headers.host + (req.url || ''))
  }
  next()
})

// Connect logs
app.use(pino)

app.use('/', express.static(path.join(process.env.PWD, 'src', 'client')))

// Routes
import files from './routes/files.route';
import users from './routes/users.route';

app.use('/files', files)
app.use('/users', users)

// Handling invalid requests.
app.use((req, res) => res.sendStatus(404))

export default app
