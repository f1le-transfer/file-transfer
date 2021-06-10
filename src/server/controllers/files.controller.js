import FilesDAO from '../dao/files.dao';

class FileMetadataController {
  static async add(req, res) {
    let files = req.body
    let answer = await FilesDAO.add(files.data)
    if (!answer.success) {
      if (answer.error == 'Metadata file already exist') {
        return res.status(400).send(answer.error)
      } else {
        return res.status(500).send('Error while saving metadata file.')
      }
    }
    res.sendStatus(200)
  }

  static async remove(req, res) {
    let { chunks } = req.body
    let promises = []
    for (let chunk of chunks) {
      promises.push(FilesDAO.delete(chunk))
    }

    Promise.all(promises)
      .then(() => res.sendStatus(200))
      .catch(() => res.status(500).send('Error while deleting metadata file.'))
  }

  static async get(req, res) {}
}

export default FileMetadataController