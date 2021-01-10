import TrackAFK_DAO from '../dao/TrackAFK.dao';

class TrackAFK {
  static async run(_id, expireAt, username) {
    try {
      return await TrackAFK_DAO.add(_id, expireAt, username)
    } catch(error) {
      console.log(error)

      return { error: 'Internal server error.' }
    }
  }

  static async delete(username) {
    try {
      return await TrackAFK_DAO.deleteTracker(username)
    } catch(error) {
      console.log(error)

      return { error: 'Internal server error' }
    }
  }
}

export default TrackAFK
