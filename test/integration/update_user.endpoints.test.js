import fetch from 'node-fetch';
import UsersDAO from '../../build/server/dao/users.dao';
import TrackAFK_DAO from '../../build/server/dao/TrackAFK.dao';

const root = `http://localhost:${process.env.HTTP_PORT}`;

const toJSON = async (raw) => raw.json()
const options = (body, headers={}, method='POST') => ({
  method,
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json', ...headers },
})

const user = {
  username: 'hii',
  pwd: '1123#2351@3423Rr%$^%'
}

describe('Update user data', () => {
  beforeAll(async () => {
    await UsersDAO.injectDB(global.fileTransferClient)
    await TrackAFK_DAO.injectDB(global.fileTransferClient)
  })

  describe('Change username', () => {
    let auth_head;
    
    test('it returns error change data without login', async () => {
      // Create account
      const reg_res = await fetch(root+'/users/register', options(user))
      expect(reg_res?.status).toBe(200)

      const new_username = { username: 'HelloWorld', pwd: user.pwd }

      const update_res = await fetch(root+`/users/update/${user.username}`, options(new_username, {}, 'PUT'))
      expect(update_res.status).toBe(401)
    })

    test('it returns error change data with no auth', async () => {
      // Login
      const log_res = await fetch(root+'/users/login', options(user))
      const res_json = await toJSON(log_res)
      expect(log_res.status).toBe(200)

      auth_head = {
        'Authorization': `Bearer ${res_json.token}`
      }

      // Bad password
      expect(
        (await fetch(root+`/users/update/${user.username}`, options({ username: 'aaaB', pwd: user.pwd+'nope' }, auth_head, 'PUT'))).status
      ).toBe(401)

      // Bad username
      expect(
        (await fetch(root+`/users/update/${user.username+'nope'}`, options({ username: 'aaaB', pwd: user.pwd }, auth_head, 'PUT'))).status
      ).toBe(401)

      // Bad token
      expect(
        (await fetch(root+`/users/update/${user.username}`, options(user, auth_head['Authorization'].split('').reverse().join(), 'PUT'))).status
      ).toBe(401)
    })

    test('it change only allowed fields', async () => {
      // External not allowed field
      expect(
        (await fetch(root+`/users/update/${user.username}`, options({ very_bad_field: 'gg wp security', ...user }, auth_head, 'PUT'))).status
      ).toBe(400)
      expect((await UsersDAO.getUser(user.username))['very_bad_field']).toBeUndefined()

      // Internal not allowed field
      expect(
        (await fetch(root+`/users/update/${user.username}`, options({ _id: 'gg wp security', ...user }, auth_head, 'PUT'))).status
      ).toBe(400)
      expect((await UsersDAO.getUser(user.username))['_id']).not.toBe('gg wp security')

      expect(
        (await fetch(root+`/users/update/${user.username}`, options({ updated_at: 'gg wp security', ...user }, auth_head, 'PUT'))).status
      ).toBe(400)
      expect((await UsersDAO.getUser(user.username))['pwd']).not.toBe('gg wp security')
    })

    test('it change username and auto logout', async () => {
      // Success change username
      const new_username = 'newU'
      expect(
        (await fetch(root+`/users/update/${user.username}`, options({ username: new_username, pwd: user.pwd }, auth_head, 'PUT'))).status
      ).toBe(200)
      expect((await UsersDAO.getUser(new_username))['username']).toBe(new_username)
      expect((await UsersDAO.getUserSession(new_username))).toBeNull()
      expect((await TrackAFK_DAO.getTracker(new_username))).toBeNull()

      // Login
      const log_res = await fetch(root+'/users/login', options({ username: new_username, pwd: user.pwd }))
      const res_json = await toJSON(log_res)
      expect(log_res.status).toBe(200)

      auth_head = {
        'Authorization': `Bearer ${res_json.token}`
      }

      // Delete user
      await fetch(root+'/users/delete', options({ username: new_username, pwd: user.pwd }, auth_head, 'DELETE'))
    })
  })
})
