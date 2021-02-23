/**
 * Data access object for [TrackAFK]{@link https://github.com/lusm554/file-transfer/blob/main/src/server/subscribers/trackAFK.sub.js} class.
 * 
 * @module TrackAFK_DAO
 * @author [lusm554]{@link https://github.com/lusm554}
 * @requires ObjectID
 * @requires UsersDAO
 */

/**
 * Returns a new ObjectId value.
 * @external ObjectID
 * @see {@link https://docs.mongodb.com/manual/reference/method/ObjectId/|ObjectID}
 */
import { ObjectID } from 'mongodb';
import UsersDAO from './users.dao';

/**
 * Connection for timeoutAFK collection.
 * @member
 */
let AFK

/**
 * [Change stream cursor]{@link https://docs.mongodb.com/manual/changeStreams/#changestreams} for timeoutAFK collection.
 * @member
 */
let ChangeStream

/**
 * Manages the timeoutAFK collection.
 * @class
 */
class TrackAFK_DAO {
  /**
   * Connect `timeoutAFK` collection.
   * @param conn - [client]{@link https://mongodb.github.io/node-mongodb-native/api-generated/mongoclient.html} from mongodb cluster
   * @return {undefined}
   */
  static async injectDB(conn) {
    if (AFK) return;

    try {
      const db_name = process.env.db_name

      AFK = await conn.db(db_name).collection('timeoutAFK')

      // Create an index for the ability to set TTL (time to live)
      await AFK.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 })

      // Checking field types.
      await conn.db(db_name).command({
        collMod: 'timeoutAFK',
        validator: {
          $jsonSchema: {
            required: [ 'expireAt', 'username' ],
            properties: {
              expireAt: {
                bsonType: 'date',
                description: 'must be a date and is required'
              },
              username: {
                bsonType: 'string',
                description: 'must be a string and is required'
              }
            }
          }
        }
      })

      const pipeline = [{ $match: { operationType: 'delete' } }]
      ChangeStream = AFK.watch(pipeline)

      ChangeStream.on('change', async ({ documentKey: { _id: doc_id } }) => {
        try {
          const fullDocument = await UsersDAO.getUserSession(doc_id)
          if (fullDocument === null) return;

          await UsersDAO.logoutUser(fullDocument?.username)
        } catch(error) {
          console.error('Error checking last user activity.')
          console.log(error)
        }
      })
    } catch(error) {
      console.error('Unable to start tracking last user activity in trackAFK.sub.js')
      console.log(error)
    }
  }

  /**
   * Add afk tracker to the `timeoutAFK` collection.
   * @param _id - user id in the collection `users`
   * @param expireAt - the date after which the user will be logged out
   * @param username - username
   * @return {Object}
   */
  static async add(_id, expireAt, username) {
    try {
      // Compose the expiry time of the document for 12 hours
      expireAt = new Date(expireAt.setHours(expireAt.getHours() + 12))

      const doc = {
        expireAt,
        username
      }

      /**
       * Set or update the last user activity.
       * The index of the document `last activity` is the same as the index of the session.
       */

      if (await this.getTracker(username, _id)) {
        const filter = { _id: new ObjectID(_id) }
        const updateDoc = {
          $set: {
            expireAt,
            username
          }
        }

        // upsert - creates a new document if no document matches the query.
        await AFK.updateOne(filter, updateDoc, { upsert: true, bypassDocumentValidation: true })
      } else {
        await AFK.insertOne({ _id, ...doc })
      }

      return { success: true }
    } catch(error) {
      console.log(error)

      return { error }
    }
  }

  /**
   * Get tracker object from collection `timeoutAFK`.
   * @param username - username from `users` collection
   * @return {Object}
   */
  static async getTracker(username) {
    try {
      return await AFK.findOne({ username })
    } catch(error) {
      console.log(error)

      return { error }
    }
  }

  /**
   * Remove tracker object from collection `timeoutAFK`.
   * @param username - username from `users` collection
   * @return {Object}
   */
  static async deleteTracker(username) {
    try {
      await AFK.deleteOne({ username: username })

      return { success: true }
    } catch(error) {
      console.log(error)

      return { error }
    }
  }
}

export default TrackAFK_DAO
