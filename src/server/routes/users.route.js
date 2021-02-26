/**
 * Express router to mount user related functions on.
 * @module UserRoutes
 * @author [lusm554]{@link https://github.com/lusm554}
 * @requires Router
 * @requires UserCtrl
 */
import { Router } from 'express';

import UserCtrl from '../controllers/users.controller'
const _Router = Router()

_Router.get('/:username', UserCtrl.get)
_Router.post('/register', UserCtrl.register)
_Router.post('/login', UserCtrl.login)
_Router.post('/logout', UserCtrl.logout)
_Router.delete('/delete', UserCtrl.delete)
_Router.put('/update/password/:username', UserCtrl.authenticate, UserCtrl.update_pwd)
_Router.put('/update/:username', UserCtrl.authenticate, UserCtrl.update_user)

export default _Router
