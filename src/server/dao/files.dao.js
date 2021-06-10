let files;

class FilesDAO {
  static async injectDB(conn) {
    try {
      if (files) return;
      files = await conn.db(process.env.db_name).collection('files_metadata')
      await files.createIndex({ chunk_id: 1 }, { unique: true })
    } catch (error) {
      console.error('Unable to connect to database in files.dao.js')
      console.log(error)
    }
  }

  static async add(meta_files) {
    try {
      const time = new Date()
      const docs = [] 
      meta_files.forEach(file => {
        file.created_at = file.updated_at = time
        docs.push(file)
      })

      const options = { ordered: true }
      await files.insertMany(docs, options)

      return { success: true }
    } catch(error) {
      if (/E11000 duplicate key error collection/.test(String(error))) {
        return { error: 'Metadata file already exist' }
      }
      console.error('An error occurred while adding a new file.')
      console.log(error)
      return { error }
    }      
  }
  
  static async get() {}

  static async delete(chunk_id) {
    try {
      await files.deleteMany({ chunk_id });
      return { success: true }
    } catch (error) {
      console.log(error)
      throw { error }
    }
  }
  
  static async put() {}
}

export default FilesDAO