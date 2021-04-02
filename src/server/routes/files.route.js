/**
 * Express router to mount files related functions on.
 * @module FileRoutes
 * @author [lusm554]{@link https://github.com/lusm554}
 * @requires Router
 * @requires FileController
 */
import { Router } from 'express';
import FileController from '../controllers/files.controller';
import UserCtrl from '../controllers/users.controller';
const _Router = Router()

_Router.get('/', (req, res) => res.redirect('/files_main.html'))

// Authenticate every request
_Router.use(UserCtrl.authenticate)
_Router.post('/', (req, res) => {
  res.send('echo from file route - POST /file')
})

export default _Router
