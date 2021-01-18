import { Router } from 'express';
import UserCtrl from '../controllers/users.controller'
const _Router = Router()

_Router.get('/:username', UserCtrl.get)
_Router.post('/register', UserCtrl.register)
_Router.post('/login', UserCtrl.login)
_Router.post('/logout', UserCtrl.logout)
_Router.delete('/delete', UserCtrl.delete)

export default _Router
