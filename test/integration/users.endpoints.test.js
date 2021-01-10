import fetch from 'node-fetch';
import UsersDAO from '../../build/server/dao/users.dao';

const root = `http://localhost:${process.env.PORT}`;

const toJSON = async (raw) => raw.json()
const options = (body, headers={}, method='POST') => ({
  method,
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json', ...headers },
})

const invalid_users = {
  pwd: [ 'Aa$1', 'ADFAsdlknf32l45🤡', '&$%^&$%^😁12341DQDAGS', 'ojnj$#!%!#513', 'aDa234^%&$🥴'.repeat(6) ],
  username: [ 'bb', 'COLCQOCLS🥐', '!#%@#%#EVR^%@', 'AaD'.repeat(6), 'hehe-nope' ]
}
const valid_user = {
  username: '2021_year_',
  pwd: '1123#2351@3423Rr%$^%'
}

describe('Users http requests', () => {
  beforeAll(async () => {
    await UsersDAO.injectDB(global.fileTransferClient)
  })

  describe('Register user', () => {
    test('it returns errors when register with invalid password or username', async () => {
      const expectedError = { user: 'Password or username are not valid.' }

      for (let i = 0; i < invalid_users.pwd.length; i++) {
        for (let j = 0; j < invalid_users.username.length; j++) {
          const user = {
            pwd: invalid_users.pwd[i],
            username: invalid_users.username[j]
          }
          
          await expect(fetch(root+'/users/register', options(user)).then(toJSON))
          .resolves
          .toEqual(expectedError)
        }
      }
    })

    test('it returns username after success register', async () => {
      const expected_res = {
        username: '2021_year_'
      }

      const res = await fetch(root+'/users/register', options(valid_user))
      
      expect(res.status).toBe(200)
      expect(await toJSON(res)).toEqual(expected_res)
    })

    test('it returns error duplicate user', async () => {
      const expectedError = { user: 'A user with the given username already exists.' }

      // Try register the same user
      await expect(fetch(root+'/users/register', options(valid_user)).then(toJSON))
      .resolves
      .toEqual(expectedError)
    })
  })

  describe('Login user', () => {
    const verifyError = { error: 'Verify that the user data is correct.' }

    test('it returns error login with non-existent user', async () => {
      const invalid_user = {
        username: 'ADF$#%32tQSFe13252Q',
        pwd: '$2b$12$4FD0.DanGMPhaFUD7F9wtufdG9iseNwtELrWnzCsgfqsZ4WBq0g5m'
      }

      const res = await fetch(root+'/users/login', options(invalid_user))

      expect(res.status).toBe(401)
      expect(await toJSON(res)).toEqual(verifyError)
    })

    test('it returns success after login valid user', async () => {
      const res = await fetch(root+'/users/login', options(valid_user))
      const res_json = await toJSON(res)

      expect(res.status).toBe(200)
      expect(res_json.info).toEqual({ username: valid_user.username })

      const auth_head = {
        'Authorization': `Bearer ${res_json.token}`
      }
      const valid_logout = await fetch(root+'/users/logout', options(valid_user, auth_head))
      expect(valid_logout.status).toBe(200)
      expect(await toJSON(valid_logout)).toEqual({ success: true })
    })

    test('it returns error login with invalid password', async () => {
      const invalid_password_user = {
        username: valid_user.username,
        pwd: valid_user.pwd.split('').reverse().join('')
      }

      const invalid_login = await fetch(root+'/users/login', options(invalid_password_user))

      expect(invalid_login.status).toBe(401)
      expect(await toJSON(invalid_login)).toEqual(verifyError)

      // Logout for the next test
      await UsersDAO.logoutUser(valid_user.username)
    })
  })

  describe('Logout user', () => {
    test('it returns success logout user', async () => {
      const valid_login = await fetch(root+'/users/login', options(valid_user))
      const { token } = await toJSON(valid_login)
      const auth_head = {
        'Authorization': `Bearer ${token}`
      }
      
      expect(valid_login.status).toBe(200)

      // Logout
      const valid_logout = await fetch(root+'/users/logout', options(valid_user, auth_head))
      
      expect(valid_logout.status).toBe(200)
      expect(await toJSON(valid_logout)).toEqual({ success: true })
    })

    test('it returns error logout with invalid token', async () => {
      // Login
      const valid_login = await fetch(root+'/users/login', options(valid_user))
      const { token } = await toJSON(valid_login)
      const auth_head = {
        'Authorization': `Bearer ${token.split('').reverse().join('')}`
      }

      // Logout error
      const valid_logout = await fetch(root+'/users/logout', options(valid_user, auth_head))

      expect(valid_logout.status).toBe(401)
      expect(await toJSON(valid_logout)).toEqual({ error: 'Error while logout user.' })
    })
  })

  describe('Delete user', () => {
    const verifyError = { error: 'Verify that the user data is correct.' }
    let login_res, token;

    test('it returns error deleting without password', async () => {
      const invalid_user = {
        username: valid_user.username,
      }

      // Get token
      login_res = await fetch(root+'/users/login', options(valid_user))
      expect(login_res.status).toBe(200)
      
      token = (await toJSON(login_res)).token
      const auth_head = {
        'Authorization': `Bearer ${token}`
      }

      const error_delete = await fetch(root+'/users/delete', options(invalid_user, auth_head, 'DELETE'))
      
      expect(error_delete.status).toBe(400)
      expect(await toJSON(error_delete)).toEqual(verifyError)
    })

    test('it returns error deleting with invalid token', async () => {
      const invalid_auth_head = {
        'Authorization': `Bearer ${token.split('').reverse().join('')}`
      }

      const error_delete = await fetch(root+'/users/delete', options(valid_user, invalid_auth_head, 'DELETE'))
      
      expect(error_delete.status).toBe(401)
      expect(await toJSON(error_delete)).toEqual(verifyError)
    })

    test('it returns error deleting with wrong password', async () => {
      const auth_head = {
        'Authorization': `Bearer ${token}`
      }
      const invalid_user_pwd = {
        username: valid_user.username,
        pwd: valid_user.pwd.split('').reverse().join('')
      }

      const error_delete = await fetch(root+'/users/delete', options(invalid_user_pwd, auth_head, 'DELETE'))

      expect(error_delete.status).toBe(401)
      expect(await toJSON(error_delete)).toEqual(verifyError)
    })

    test('it success delete user and session', async () => {
      const auth_head = {
        'Authorization': `Bearer ${token}`
      }

      const success_delete = await fetch(root+'/users/delete', options(valid_user, auth_head, 'DELETE'))

      expect(success_delete.status).toBe(200)
      expect(await toJSON(success_delete)).toEqual({ success: true })
    })
  })
})
