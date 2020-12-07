const Router = require('express').Router()
const { FileController } = require('../controllers/file')

Router.post('/', (req, res) => {
  new FileController(req, res).save()
})

exports.fileRouter = Router
