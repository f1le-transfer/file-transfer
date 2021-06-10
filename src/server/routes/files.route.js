/**
 * Express router to mount files related functions on.
 * @module FileRoutes
 * @author [lusm554]{@link https://github.com/lusm554}
 * @requires Router
 * @requires FileController
 */
import { Router } from 'express';
import FileMetadataController from '../controllers/files.controller';
import UserCtrl from '../controllers/users.controller';
const _Router = Router()

_Router.get('/', (req, res) => res.redirect('/'))

// Authenticate every request
_Router.use(UserCtrl.authenticate)
_Router.post('/add', FileMetadataController.add)
// _Router.get('/info', FileMetadataController.get) 
_Router.delete('/del', FileMetadataController.remove)

export default _Router
