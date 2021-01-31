import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UsersDAO from '../dao/users.dao';
import TrackAFK from '../subscribers/trackAFK.sub';

// Todo: Authentication and Session Management

const hashPwd = async pwd => await bcrypt.hash(pwd, 12)

class User {
  constructor({ username, pwd } = {}) {
    this.username = username
    this.pwd = pwd
  }

  toJSON() {
    return { username: this.username }
  }

  async comparePassword(plainText) {
    return await bcrypt.compare(plainText, this.pwd)
  }

  encoded() {
    return jwt.sign({
      data: this.toJSON()
    }, process.env.SECRET_KEY, { expiresIn: '4h' });
  }

  static async decoded(userJwt) {
    return jwt.verify(userJwt, process.env.SECRET_KEY, (error, res) => {
      if (error) return { error };

      return new User(res.data)
    })
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
   * Can include: A-Z, a-z, 0-9 and (-!@#$%^&*)
   * @param username
   * @returns {boolean}
   */
  const isUsrSuitable = username => /^[\w@$^&*]{3,15}$/.test(username)

  switch(true) {
    case (!userFromBody?.username || !userFromBody?.pwd):
    case(!isPwdSuitable(userFromBody?.pwd)):
    case (!isUsrSuitable(userFromBody?.username)):
      errors.user = 'Password or username are not valid.'
      break
  }
}

export default class UserController {
  static async get(req, res) {
    const username = req?.params?.username
    const userData = await UsersDAO.getUser(username)

    if (!userData || userData?.error) {
      res.status(400).send('Username not valid.')
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

      const userJwt = req.get("Authorization").slice("Bearer ".length)
      const userClaim = await User.decoded(userJwt)
      const { error: jwt_err } = userClaim
      if (jwt_err) {
        res.status(401).json({ error: 'Verify that the user data is correct.' })
        return
      }

      const user = new User(await UsersDAO.getUser(userClaim.username))
      if (!(await user.comparePassword(pwd))) {
        res.status(401).json({ error: 'Verify that the user data is correct.' })
        return
      }
      
      const deleteRes = await UsersDAO.deleteUser(user.username)
      const { error: delete_err } = deleteRes
      if (delete_err) {
        console.log(delete_err)
        res.status(500).json({ error: 'Failed to delete user.' })
        return
      }

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
}
