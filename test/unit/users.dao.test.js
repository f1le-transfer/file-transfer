import UsersDAO from '../../build/server/dao/users.dao';

// Use getter because jest writes `_id`
// to the test user object after each test.
let _user = {
  get test() {
    return {
      username: 'ручной_абу',
      pwd: 'АбУ_бандинт_q#$@ty&$#092&^3'
    }
  },
  get wrong() {
    return {
      username: { field: 'wrong type of filed for username' },
      pwd: { field: 'wrong type of field for pwd' }
    }
  },
  get session_user() {
    return {
      username: 'session_user',
      pwd: '#%@fQFk%$-EwR@#$-f{^%#'
    }
  },
}

let _session = {
  get test() {
    return {
      username: _user.session_user.username,
      jwt: 'token...'
    }
  },
  get wrong() {
    return {
      username: { field: 'wrong type of filed for username' },
      jwt: { field: 'wrong type of field for jwt' }
    }
  },
}

describe('User DAO', () => {
  beforeAll(async () => {
    await UsersDAO.injectDB(global.fileTransferClient)
  })

  describe('Users', () => {
    test('it add user to `users` collection', async () => {
      /* It can add user to `users` collection */
      const user = await UsersDAO.addUser(_user.test)
      expect(user.success).toBeTruthy()

      // Add user for session testing
      const session_user = await UsersDAO.addUser(_user.session_user)
      expect(session_user.success).toBeTruthy()

      /* It returns an error when trying to register duplicate user */
      const duplicate_user = await UsersDAO.addUser(_user.test)
      const expectedError = "A user with the given username already exists."

      expect(duplicate_user.error).toBe(expectedError)
      expect(duplicate_user.success).toBeUndefined()

      /* It returns an error why trying to add user with another type of filed */
      const validation_test = await UsersDAO.addUser(_user.wrong)
      expect(validation_test.error.message).toBe('Document failed validation')
    })

    test('it returns user by username', async () => {
      /* It returns user by username */
      const { username } = _user.test

      const user_from_db = await UsersDAO.getUser(username)
      delete user_from_db['_id']

      expect(user_from_db).toEqual(_user.test)

      /* It returns `null` by searching a user not by username */
      const { pwd } = _user.test
      const null_from_db = await UsersDAO.getUser(pwd)

      expect(null_from_db).toBeNull()
    })
    
    test('it delete user from `users` collection', async () => {
      /* It should delete user */
      const { username } = _user.test
      const deletedUser = await UsersDAO.deleteUser(username)

      expect(deletedUser.success).toBeTruthy()

      /* It returns error by deleting a user not by username */
      const { pwd } = _user.test
      const not_deleted_user = await UsersDAO.deleteUser(pwd)
      const expectedError = 'Deletion unsuccessful.'

      expect(not_deleted_user.error).toBe(expectedError)
      expect(not_deleted_user.success).toBeUndefined()

      /* It returns error trying to add session with another type of filed */
      const validation_test = await UsersDAO.loginUser(_session.wrong)
      expect(validation_test.error.message).toBe('Document failed validation')
    })
  })

  describe('Sessions', () => {
    let last_session_time;

    test('it should add and update user session', async () => {
      /* Add user */
      const session = await UsersDAO.loginUser(_session.test)

      expect(session.success).toBeTruthy()
      expect(session.error).toBeUndefined()

      /* Returns an updated session instead of a new one */
      const is_session_updated = await UsersDAO.loginUser(_session.test)

      expect(is_session_updated.success).toBeTruthy()
      expect(is_session_updated.error).toBeUndefined()

      const updated_session = await UsersDAO.getUserSession(_session.test.username)
      expect(last_session_time).not.toBe(updated_session.updated_at)
    })

    test('it returns a user session', async () => {
      /* Returns a user session */
      const session = await UsersDAO.getUserSession(_session.test.username)

      expect(session).not.toBeNull()
      expect(session.error).toBeUndefined()

      last_session_time = session.updated_at

      /* It returns `null` by searching a session not by username */
      const null_session = await UsersDAO.getUserSession(_session.test.pwd)

      expect(null_session).toBeNull()
    })

    test('it should remove user session', async () => {
      /* It should remove user session from `sessions` */
      const is_session_removed = await UsersDAO.logoutUser(_session.test.username)
      expect(is_session_removed.success).toBeTruthy()

      /* It's should delete user with session */

      // Check if user exists
      const { username, pwd } = await UsersDAO.getUser(_user.session_user.username)
      expect({ username, pwd }).toEqual(_user.session_user)

      // Create new session
      const session = await UsersDAO.loginUser(_session.test)

      expect(session.success).toBeTruthy()
      expect(session.error).toBeUndefined()

      // Remove user
      const user = await UsersDAO.deleteUser(_user.session_user.username)

      expect(user.success).toBeTruthy()
      expect(user.error).toBeUndefined()

      // Check if the session has been deleted
      const deleted_session = await UsersDAO.getUserSession(_user.session_user.username)
      expect(deleted_session).toBeNull()
    })
  })
})
