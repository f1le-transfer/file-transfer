import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UsersDAO from '../dao/users.dao';
import TrackAFK from '../subscribers/trackAFK.sub';

const hashPwd = async pwd => await bcrypt.hash(pwd, 12)

/**
 * TODO:
 *  1. Write tests for update pwd.
 *  2. Fix a bug with deleting an account when the user is not logged. Rewrite `delete` method with `authenticate`.
 *  3. In the future, add separate functions for changing user data with two-factor authentication.
 */

// Methods for managing user data.
class User {
  constructor({ username, pwd } = {}) {
    this.username = username
    this.pwd = pwd
  }

  /**
   * Return object in JSON format.
   * @return {Object}
   */
  toJSON() {
    return { username: this.username }
  }

  /**
   * Compare passwords.
   * @param plainText - The password to be compared with the real one
   * @return {Boolean}
   */
  async comparePassword(plainText) {
    return await bcrypt.compare(plainText, this.pwd)
  }

  /**
   * Create JSON Web Token.
   * @return {String}
   */
  encoded() {
    return jwt.sign({
      data: this.toJSON()
    }, process.env.SECRET_KEY, { expiresIn: '4h' });
  }

  /**
   * Get user data from jwt token.
   * @param userJwt - JSON Web Token
   * @return {Object}
   */
  static async decoded(userJwt) {
    return jwt.verify(userJwt, process.env.SECRET_KEY, (error, res) => {
      if (error) return { error };

      return new User(res.data)
    })
  }

  /**
   * Check is user login(user session exist).
   * @return {Boolean}
   */
  async isUserLogin() {
    return !!(await UsersDAO.getUserSession(this.username))
  }
}

/**
 * Checks password and login.
 * @param userFromBody - user object from request
 * @param errors - error logging object
 */
function validateCredential(userFromBody, errors) {
  /**
   * Password must be at least 8 characters and less than 65
   * Must include: lowercase letter, capital letter,
   * number, special character (!@#$%^&*)
   * Can include any unicode character.
   * @param pwd
   * @returns {boolean}
   */
  const isPwdSuitable = pwd => /^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*](.){8,64}$/u.test(pwd)

  /**
   * Login must be at least 3 characters and less than 16
   * Can include: A-Z, a-z, 0-9 and (-!@#$%^&*).
   * @param username
   * @returns {boolean}
   */
  const isUsrSuitable = username => /^[\w@$^&*]{3,15}$/.test(username)

  // When called without arguments, write internal functions to the prototype
  if (!userFromBody || !errors) return Object.setPrototypeOf(validateCredential, { isPwdSuitable, isUsrSuitable });

  switch(true) {
    case (!userFromBody?.username || !userFromBody?.pwd):
    case(!isPwdSuitable(userFromBody?.pwd)):
    case (!isUsrSuitable(userFromBody?.username)):
      errors.user = 'Password or username are not valid.'
      break
  }
}

/**
 * Logs out of the account and returns the updated user.
 * @param new_user - Data of new user.
 * @param old_username - Previous username to log out of account, by default current username.
 * @return {{user}|{error}}
 */
async function logoutAndUpdateUsr(new_user, old_username=new_user.username) {
  try {
    const logoutResult = await UsersDAO.logoutUser(old_username)
    if (logoutResult.error) return { error: logoutResult.error };

    const user = new User(new_user)

    const deleteTracker = await TrackAFK.deleteUsrTracker(old_username)
    if (deleteTracker.error) return { error: deleteTracker.error };

    return user.toJSON()
  } catch(error) {
    console.log(error)
    return { error }
  }
}

export default class UserController {
  static async get(req, res) {
    const username = req?.params?.username
    const userData = await UsersDAO.getUser(username)

    if (!userData || userData?.error) {
      res.status(401).json({ error: 'Verify that the user data is correct.' })
      return
    }

    const user = new User(userData)

    res.json(user)
  }

  static async register(req, res) {
    try {
      const rawUserData = req.body
      let errors = {}

      validateCredential(rawUserData, errors)
      if (Object.keys(errors).length > 0) {
        res.status(400).json(errors)
        return
      }

      const { pwd, ...userInfo } = rawUserData;

      // User data with hash password.
      const userData = {
        ...userInfo,
        pwd: await hashPwd(pwd)
      }

      const insertUser = await UsersDAO.addUser(userData)
      if (!insertUser.success) {
        if (insertUser.error.startsWith('A user with the given')) {
          errors.user = insertUser.error
        } else {
          errors.user = 'Error while saving user.'
        }
      }

      const userFromDB = await UsersDAO.getUser(rawUserData.username)
      if (userFromDB === null) {
        errors.general = 'Internal error, try again later.'
      }

      if (Object.keys(errors).length > 0) {
        res.status(400).json(errors)
        return
      }

      const user = new User(userFromDB)
      res.json(user)
    } catch(error) {
      console.log(error)

      res.status(500).send('User registration failed.')
    }
  }

  static async login(req, res) {
    try {
      const { username, pwd } = req.body

      const userData = await UsersDAO.getUser(username)
      if (userData === null) {
        res.status(401).json({ error: 'Verify that the user data is correct.' })
        return
      }

      const user = new User(userData)

      if (!(await user.comparePassword(pwd))) {
        res.status(401).json({ error: 'Verify that the user data is correct.' })
        return
      }

      const loginResponse = await UsersDAO.loginUser(user.username, user.encoded())

      if (!loginResponse.success) {
        console.error('Error while login user.')
        console.log(loginResponse.error)

        res.status(500).json({ error: 'Internal server error.' })
        return
      }

      const time = new Date()

      const tracker = await TrackAFK.run(loginResponse?.insertedId, time, userData?.username)
      if (!tracker.success) {
        res.status(500).json({ error: 'Internal server error.' })
        return
      }
      
      res.json({ token: user.encoded(), info: user.toJSON() })
    } catch(error) {
      console.log(error)

      res.status(500).json({ error: 'Error while login user.' })
    }
  }

  static async logout(req, res) {
    try {
      const userJwt = req.get("Authorization").slice("Bearer ".length)
      const userObj = await User.decoded(userJwt)

      const { error: decode_err } = userObj
      if (decode_err) {
        res.status(401).json({ error: 'Error while logout user.' })
        return
      }

      const logoutResult = await UsersDAO.logoutUser(userObj.username)
      
      const { error: logout_err } = logoutResult
      if (logout_err) {
        console.log(logout_err)

        res.status(500).json({ error: 'Internal server error.' })
        return
      }

      const deleteTracker = await TrackAFK.deleteUsrTracker(userObj.username)
      if (deleteTracker.error) {
        res.status(500).json({ error: 'Failed to delete user.' })
        return
      }

      res.json(logoutResult)
    } catch(error) {
      console.log(error)

      res.sendStatus(500)
    }
  }

  static async delete(req, res) {
    try {
      const { pwd } = req.body
      if (!pwd || typeof pwd !== 'string') {
        res.status(400).json({ error: 'Verify that the user data is correct.' })
        return
      }

      const userJwt = req.get("Authorization")?.slice("Bearer ".length)
      const userClaim = await User.decoded(userJwt)
      const { error: jwt_err } = userClaim
      if (jwt_err) {
        res.status(401).json({ error: 'Verify that the user data is correct.' })
        return
      }

      const user = new User(await UsersDAO.getUser(userClaim.username))
      if (!(await user.comparePassword(pwd)) /*|| !(await user.isUserLogin())*/) {
        res.status(401).json({ error: 'Verify that the user data is correct.' })
        return
      }

      // Delete user's account
      const deleteRes = await UsersDAO.deleteUser(user.username)
      const { error: delete_err } = deleteRes
      if (delete_err) {
        console.log(delete_err)
        res.status(500).json({ error: 'Failed to delete user.' })
        return
      }

      // Delete user's afk tracker
      const deleteTracker = await TrackAFK.deleteUsrTracker(user.username)
      if (deleteTracker.error) {
        res.status(500).json({ error: 'Failed to delete user.' })
        return
      }

      res.json(deleteRes)
    } catch(error) {
      console.log(error)
      res.status(500).json({ error: 'Internal error while deleting user.' })
    }
  }

  // Middleware for checking the user's token and password before request.
  static async authenticate(req, res, next) {
    try {
      const userJwt = req.get("Authorization")?.slice("Bearer ".length)
      const url_username = req?.params?.username
      const { pwd } = req.body

      if (!pwd || typeof pwd !== 'string') {
        res.status(400).json({ error: 'Verify that the user data is correct.' })
        return
      }

      // User data from token
      const userClaim = await User.decoded(userJwt)
      if (userClaim.error) {
        res.status(401).json({ error: 'Verify that the user data is correct.' })
        return
      }

      // Is user exist
      const userData = await UsersDAO.getUser(userClaim?.username)
      if (!userData || userClaim?.username !== url_username) {
        res.status(401).json({ error: 'Verify that the user data is correct.' })
        return
      } else if (userData.error) {
        res.status(500).json({ error: 'Internal error while update user.' })
        return
      }

      const user = new User(userData)
      if (!(await user.comparePassword(pwd)) || !(await user.isUserLogin())) {
        res.status(401).json({ error: 'Verify that the user data is correct.' })
        return
      }

      // Add `userData` to the `req` for next requests.
      req.user = userData
      next()
    } catch(error) {
      console.log(error)
      res.status(500).json({ error: 'Internal error while deleting user.' })
    }
  }
  
  static async update_user(req, res) {
    try {
      const username = req?.params?.username
      const rawUserData = req.body

      if (Object.keys(rawUserData).length > 5) {
        res.status(401).json({ error: 'Verify that the user data is correct.' })
        return
      }

      const { user } = req

      // Is raw data contain bad fields
      let doesUserHaveUnresolvedFields = Object.keys(rawUserData).every(key => !!user[key] && !['_id', 'created_at', 'updated_at'].includes(key))
      if (!doesUserHaveUnresolvedFields) {
          res.status(400).json({ error: 'BAD REQUEST' })
          return
      }

      // Fields that can be changed by the user.
      const rawUserDataEntries = Object.entries(rawUserData).filter(([key]) => !['_id', 'pwd', 'created_at', 'updated_at'].includes(key) && !!user[key])

      // Check is username correct
      if (rawUserData?.username && rawUserData.username !== user.username) {
        // Is user already exists
        if ((await UsersDAO.getUser(rawUserData.username)) !== null) {
          res.status(400).json({ error: 'A user with the given username already exists.' })
          return
        }
        if (!validateCredential().isUsrSuitable(rawUserData.username)) {
          res.status(401).json({ error: 'Verify that the user data is correct.' })
          return
        }
      }

      const newUser = await UsersDAO.changeUserData(username, Object.fromEntries(rawUserDataEntries))
      if (!newUser.success || newUser.error) {
        res.status(500).json({ error: 'Internal error while update user.' })
        return
      }

      const updatedUser = await logoutAndUpdateUsr(newUser.user.value, user.username)
      if (updatedUser.error) {
        res.status(500).json({ error: 'Internal error while deleting user.' })
        return
      }

      res.status(200).json(updatedUser)
    } catch(error) {
      console.log(error)
      res.status(500).json({ error: 'Internal error while deleting user.' })
    }
  }

  static async update_pwd(req, res) {
    try {
      const { new_pwd } = req?.body
      const { user } = req

      if (!new_pwd || typeof new_pwd !== 'string') {
        res.status(400).json({ error: 'Verify that the user data is correct.' })
        return
      }

      if (!validateCredential().isPwdSuitable(new_pwd)) {
        res.status(401).json({ error: 'Verify that the user data is correct.' })
        return
      }

      const updated_pwd = {
        pwd: await hashPwd(new_pwd)
      }

      const newUser = await UsersDAO.changeUserData(user.username, updated_pwd)
      if (!newUser.success || newUser.error) {
        res.status(500).json({ error: 'Internal error while update user.' })
        return
      }

      const updatedUser = await logoutAndUpdateUsr(user)
      res.status(200).json(updatedUser)
    } catch(error) {
      console.log(error)
      res.status(500).json({ error: 'Internal error while deleting user.' })
    }
  }
}
