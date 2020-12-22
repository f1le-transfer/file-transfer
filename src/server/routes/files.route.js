import { Router } from 'express';
import FileController from '../controllers/files.controller';
const _Router = Router()

_Router.post('/', (req, res) => {
  new FileController(req, res).save()
})

export default Router
