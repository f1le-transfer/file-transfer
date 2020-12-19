class FileController {
  constructor(req, res) {
    this.req = req
    this.res = res
  }

  save() {
    this.res.sendStatus(200)
  }
}

exports.FileController = FileController
