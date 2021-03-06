/**
 * Data access object for [UsersDAO]{@link https://github.com/lusm554/file-transfer/blob/main/src/server/controllers/users.controller.js} class.
 *
 * @module UsersDAO
 * @author [lusm554]{@link https://github.com/lusm554}
 * @requires ObjectID
 */

/**
 * Returns a new ObjectId value.
 * @external ObjectID
 * @see {@link https://docs.mongodb.com/manual/reference/method/ObjectId/|ObjectID}
 */
import { ObjectID } from 'mongodb';

/**
 * Connection for `users` collection.
 * @member
 */
let users

/**
 * Connection for `sessions` collection.
 * @member
 */
let sessions

/* TODO:
    1. Add user verification for specific requests.
    2. Review the code and rewrite methods using findOneAndUpdate, findOneAndDelete, etc.
 */

/**
 * Manages the `users` and `sessions` collections.
 * @class
 */
class UsersDAO {
  /**
   * Connect `users` and `sessions` collections.
   * @param {Object} conn - client from mongodb cluster
   * @return {undefined}
   */
  static async injectDB(conn) {
    if (users && sessions) return;

    try {
      const db_name = process.env.db_name

      users = await conn.db(db_name).collection('users')
      sessions = await conn.db(db_name).collection('sessions')
      
      // Only creates an index if an index of the same specification
      // does not already exist.
      await users.createIndex({ username: 1 }, { unique: true })
      await sessions.createIndex({ username: 1 }, { unique: true })

      /**
       * At this point, do not need to check the existence of collections,
       * because they are created above when defining indexes.
       */

      /* Checking field types. */
      await conn.db(db_name).command({
        collMod: 'users',
        validator: {
          $jsonSchema: {
            required: [ 'username', 'pwd', 'created_at', 'updated_at' ],
            properties: {
              username: {
                bsonType: 'string',
                description: 'must be a string and is required',
              },
              pwd: {
                bsonType: 'string',
                description: 'must be a string and is required'
              },
              created_at: {
                bsonType: 'date',
                description: 'must be a date and is required'
              },
              updated_at: {
                bsonType: 'date',
                description: 'must be a date and is required'
              }
            }
          }
        }
      })

      await conn.db(db_name).command({
        collMod: 'sessions',
        validator: {
          $jsonSchema: {
            required: [ 'username', 'jwt', 'created_at', 'updated_at', 'last_activity' ],
            properties: {
              username: {
                bsonType: 'string',
                description: 'must be a string and is required'
              },
              jwt: {
                bsonType: 'string',
                description: 'must be a string and is required'
              },
              created_at: {
                bsonType: 'date',
                description: 'must be a date and is required'
              },
              updated_at: {
                bsonType: 'date',
                description: 'must be a date and is required'
              },
              last_activity: {
                bsonType: 'date',
                description: 'must be a date and is required'
              }
            }
          }
        }
      })
    } catch(error) {
      console.error('Unable to connect to database in users.dao.js')
      console.log(error)
    }
  }
  
 /**
  * Some of the methods below use {username: username} instead of {username}
  * to avoid specifying a user by other fields.
  */

  /**
   * Finds a user in `users` collection.
   * @param {String} username - login of the searched user
   * @returns {Object | null}
   */
  static async getUser(username) {
    try {
      return await users.findOne({ username: username })
    } catch(error) {
      console.log(error)

      return { error }
    }
  }

  /**
   * Adds a user to the `users` collection.
   * @param {Object} userInfo - user object
   * @returns {Object} - either a "success" or an "error" {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object|Object}
   */
  static async addUser(userInfo) {
    try {
      const time = new Date()
      userInfo.created_at = time
      userInfo.updated_at = time

      await users.insertOne(userInfo)
      return { success: true }
    } catch(error) {
      if (String(error).startsWith('MongoError: E11000 duplicate key error')) {
        return { error: 'A user with the given username already exists.' }
      }
      console.error('An error occurred while adding a new user.')
      console.log(error)
      
      return { error }
    }
  }

  /**
   * Adds a user to the `sessions` collection.
   * @param {String} username - the username to login
   * @param {String} jwt - JSON web token representing the user's claims
   * @returns {Object} - either a "success" or an "error" Object
   */
  static async loginUser(username, jwt) {
    try {
      const session = await this.getUserSession(username)
      if (session?.error) return { error: session.error }

      const time = new Date()
      let insertedId;

      // Check if the user already exists in the `session` collection.
      if (session === null) {
        let userSession = {
          jwt: jwt,
          username: username,
          created_at: time,
          updated_at: time,
          last_activity: time
        };
        ({ insertedId } = await sessions.insertOne(userSession));
      } else {
        await sessions.updateOne(
          { username: username },
          {
            $set: {
              jwt: jwt,
              updated_at: time,
              last_activity: time
            }
          }
        )
        insertedId = session._id
      }
      return { success: true, insertedId }
    } catch(error) {
      console.error('Error occurred while logging in user.')
      console.log(error)

      return { error }
    }
  }

  /**
   * Removes a user from the `sessions` and `users` collections.
   * @param {String} username - the username of the user to delete
   * @returns {Object} - either a "success" or an "error" {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object|Object}
   */
  static async deleteUser(username) {
    try {
      const { deletedCount: delUsers } = await users.deleteOne({ username: username })
      await sessions.deleteOne({ username: username })

      if (delUsers === 1 && !(await this.getUser(username)) && !(await this.getUserSession(username))) {
        return { success: true }
      } else {
        return { error: 'Deletion unsuccessful.' }
      }
    } catch (error) {
      console.error('Error occurred while deleting user.')
      console.log(error)
      
      return { error }
    }
  }

  /**
   * Removes a user from the `session` collection.
   * @param {String} username - the username of the user to logout
   * @returns {Object} - either a "success" or an "error" Object
   */
  static async logoutUser(username) {
    try {
      const { deletedCount } = await sessions.deleteOne({ username: username })
      if (deletedCount !== 1) {
        return { error: 'Session not found.' }
      }
      return { success: true }
    } catch(error) {
      console.error('Error occurred while logging out user.')
      console.log(error)

      return { error }
    }
  }

  /**
   * Gets a user session from the `sessions` collection.
   * @param {String|ObjectID} usernameOrId - the username or ID of the user to search for in `sessions`.
   * @returns {Object | null} - user session object, an "error" {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object|Object} if something went wrong, or {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/null|null} if user was not found.
   */
  static async getUserSession(usernameOrId) {
    try {
      // Checking for mongodb id
      if (ObjectID.isValid(usernameOrId) && /^[a-fA-F0-9]{24}$/.test(usernameOrId)) {
        return await sessions.findOne({ _id: usernameOrId })
      }
      
      return await sessions.findOne({ username: usernameOrId })
    } catch(error) {
      console.error('Error occurred while retrieving user session.')
      console.log(error)

      return { error }
    }
  }

  /**
   * Updates user data object.
   * @param {String} username - the username of the user update
   * @param {Object} fields - the fields to update
   * @returns {Object} - either a "success" or an "error" {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object|Object}
   */
  static async changeUserData(username, fields) {
    try {
      const time = new Date()

      const user = await users.findOneAndUpdate(
        { username: username },
        {
          $set: { updated_at: time, ...fields }
        },
        { returnOriginal: false }
      )

      return { success: true, user }
    } catch(error) {
      console.error('Error occurred while updating user.')
      console.log(error)

      return { error }
    }
  }
}

export default UsersDAO
