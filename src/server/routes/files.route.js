import { Router } from 'express';
import FileController from '../controllers/files.controller';
const _Router = Router()

_Router.post('/', (req, res) => {
  res.send('echo from file route - POST /file')
})

export default _Router
