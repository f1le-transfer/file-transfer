/**
 * Data access object for [TrackAFK]{@link https://github.com/lusm554/file-transfer/blob/main/src/server/subscribers/trackAFK.sub.js} class.
 * @module TrackAFK_SUB
 * @author [lusm554]{@link https://github.com/lusm554}
 * @requires TrackAFK_DAO
 */

import TrackAFK_DAO from '../dao/TrackAFK.dao';

/**
 * Contains functions for managing user trackers.
 * @class
 */
class TrackAFK {
  /**
   * Launches the tracker after the user is logged in.
   * @param _id - user id from `users` collection
   * @param expireAt - the date after which the user will be logged out
   * @param username - username
   * @return {Object}
   */
  static async run(_id, expireAt, username) {
    try {
      return await TrackAFK_DAO.add(_id, expireAt, username)
    } catch(error) {
      console.log(error)

      return { error: 'Internal server error.' }
    }
  }

  /**
   * Removes the tracker object.
   * @param username - username
   * @return {Object}
   */
  static async deleteUsrTracker(username) {
    try {
      return await TrackAFK_DAO.deleteTracker(username)
    } catch(error) {
      console.log(error)

      return { error: 'Internal server error' }
    }
  }
}

export default TrackAFK
