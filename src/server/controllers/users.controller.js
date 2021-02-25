/**
 * Controller for [UsersDAO]{@link https://github.com/lusm554/file-transfer/blob/main/src/server/dao/users.dao.js} class.
 * @module User_controller
 * @author [lusm554]{@link https://github.com/lusm554}
 * @requires bcrypt
 * @requires jwt
 * @requires UsersDAO
 * @requires TrackAFK
 */

/**
 * Returns a new ObjectId value.
 * @external bcrypt
 * @see {@link https://www.npmjs.com/package/bcrypt}
 */
import bcrypt from 'bcrypt';

/**
 * Returns a new ObjectId value.
 * @external jwt
 * @see {@link https://www.npmjs.com/package/jsonwebtoken}
 */
import jwt from 'jsonwebtoken';
import UsersDAO from '../dao/users.dao';
import TrackAFK from '../subscribers/trackAFK.sub';

/**
 * Hash password.
 * @param {String} pwd - password
 * @return {String}
 */
const hashPwd = async pwd => await bcrypt.hash(pwd, 12)

/**
 * Methods for managing user data.
 * @class
 */
class User {
  /**
   * Create user object.
   * @param {String} username - username
   * @param {String} pwd - password
   */
  constructor({ username, pwd } = {}) {
    this.username = username
    this.pwd = pwd
  }

  /**
   * Return user object in JSON format.
   * @return {Object}
   */
  toJSON() {
    return { username: this.username }
  }

  /**
   * Compares user password and raw password.
   * @param {String} plainText - the password to be compared with the real one
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
   * @param {String} userJwt - JSON Web Token
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
 * Checks password and login for characters and length. If something is wrong, write an error to the object. When called without arguments, returns the function with the written methods into the prototype.
 * @param {Object} userFromBody - raw user object
 * @param {Object} errors - error object
 * @return {undefined}
 */
function validateCredential(userFromBody, errors) {
  /**
   * Password must be at least 8 characters and less than 65.
   * Must include: lowercase letter, capital letter,
   * number, special character (!@#$%^&*)
   * Can include any unicode character.
   * @param pwd
   * @inner
   * @returns {boolean}
   */
  const isPwdSuitable = pwd => /^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*](.){8,64}$/u.test(pwd)

  /**
   * Login must be at least 3 characters and less than 16
   * Can include: A-Z, a-z, 0-9 and (-!@#$%^&*).
   * @param username - username
   * @inner
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
 * @param {Object} new_user - data of new user
 * @param {String} old_username - previous username to log out of account, by default username from `new_user` object
 * @return {Object}
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

/**
 * Manages the user routes.
 * @class
 */
class UserController {
  /**
   * Route for getting user.
   * @name GET /users/:username
   * @function
   * @param {String} req.params.username - username
   * @param {Object} req - request object
   * @param {Object} res - response object
   * @example
   curl --location --request GET 'http://localhost/users/lusm'
   */
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

  /**
   * Route for register user.
   * @name POST /users/register
   * @function
   * @param {Object} req.body - user data
   * @param {Object} req - request object
   * @param {Object} res - response object
   * @example
   curl --location --request POST 'http://localhost/users/register' \
   --header 'Content-Type: application/json' \
   --data-raw '{
      "username": "lusm",
      "pwd": "!%!@#$!@1231234Aa$11!"
   }'
   */
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

  /**
   * Route for login user.
   * @name POST /users/login
   * @function
   * @param {Object} req.body - user data
   * @param {Object} req - request object
   * @param {Object} res - response object
   * @example
   curl --location --request POST 'http://localhost/users/login' \
   --header 'Content-Type: application/json' \
   --data-raw '{
      "username": "lusm",
      "pwd": "!%!@#$!@1231234Aa$11!"
   }'
   */
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

  /**
   * Route for logout user.
   * @name POST /users/logout
   * @function
   * @param {String} req.header('Authorization') - JWT token
   * @param {Object} req - request object
   * @param {Object} res - response object
   * @example
   curl --location --request POST 'http://localhost/users/logout' \
   --header 'Authorization: Bearer J.W.T' \
   --data-raw ''
   */
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

  /**
   * Route for deleting user.
   * @name DELETE /users/delete
   * @function
   * @param {String} req.body.pwd - user password
   * @param {String} req.header('Authorization') - JWT token
   * @param {Object} req - request object
   * @param {Object} res - response object
   * @example
   curl --location --request DELETE 'http://localhost/users/delete' \
   --header 'Authorization: Bearer J.W.T' \
   --header 'Content-Type: application/json' \
   --data-raw '{
      "pwd": "!%!@#$!@1231234Aa$11!"
   }'
   */
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

  /**
   * Middleware for checking the user's token and password before request.
   * @name authenticate
   * @function
   * @param {String} req.header('Authorization') - JWT token
   * @param {String} req.params.username - username
   * @param {Object} req.body - user data
   * @param {Object} req - request object
   * @param {Object} res - response object
   * @param {Function} next - callback
   */
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

  /**
   * Updates all allowed user fields except the password.
   * @name PUT /users/update/:username
   * @function
   * @param {String} req.params.username - username
   * @param {Object} req.body - user data
   * @param {Object} req - request object
   * @param {Object} res - response object
   * @example
   curl --location --request PUT 'http://localhost/users/update/lusm' \
   --header 'Content-Type: application/json' \
   --header 'Authorization: Bearer J.W.T' \
   --data-raw '{
      "username": "lusm1"
    }'
   */
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

  /**
   * Update user password.
   * @name PUT /users/update/password/:username
   * @function
   * @param {Object} req.body - user data
   * @param {Object} req - request object
   * @param {Object} res - response object
   * @example
   curl --location --request PUT 'http://localhost/users/update/password/lusm' \
   --header 'Content-Type: application/json' \
   --header 'Authorization: Bearer J.W.T' \
   --data-raw '{
    "username": "lusm",
      "pwd": "!%!@#$!@1231234Aa$11!!!",
      "new_pwd": "!%!@#$!@1231234Aa$11!!3124!"
    }'
   */
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

export default UserController
