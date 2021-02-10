import { ObjectID } from 'mongodb';

let users
let sessions

/* TODO:
    Add user creation date fields and last modified field,
    method for changing user data,
    user verification for specific requests.
 */

class UsersDAO {
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
  * */

  /**
   * Finds a user in `users` collection.
   * @param username - Login of the searched user
   * @returns {Object | null} - Returns either user object or nothing(null)
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
   * @param userInfo - The information about user
   * @returns {Object} - Returns either a "success" or an "error" Object
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
   * @param username - The username to login
   * @param jwt - A JSON web token representing the user's claims
   * @returns {Object} - Returns either a "success" or an "error" Object
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
   * @param username - The username of the user to delete
   * @returns {Object} - Returns either a "success" or an "error" Object
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
   * @param username - The username of the user to logout
   * @returns {Object} - Returns either a "success" or an "error" Object
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
   * @param usernameOrId - The username or ID of the user to search for in `sessions`.
   * @returns {Object | null} - Returns a user session Object, an "error" Object
   * if something went wrong, or null if user was not found.
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

}

export default UsersDAO
