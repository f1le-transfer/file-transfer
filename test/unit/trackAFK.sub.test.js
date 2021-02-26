import fetch from 'node-fetch';

const root = `http://localhost:${process.env.PORT}`;

const toJSON = async (raw) => raw.json()
const options = (body, headers={}, method='POST') => ({
  method,
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json', ...headers },
})

// Test user for trackAFK
const _user = {
  username: "Somerogm89",
  pwd: "123456aA&*"
}

describe('TrackAFK', () => {
  const timeoutAFK = global.fileTransferClient.db(process.env.db_name).collection('timeoutAFK')
  let last_timeout, token;
  
  test('Add timeout', async () => {
    // Register user
    expect((await fetch(root + '/users/register', options(_user))).status).toBe(200)

    // Login
    const login_res = await fetch(root + '/users/login', options(_user))
    expect(login_res.status).toBe(200)
    const json_res = await toJSON(login_res)

    token = json_res.token
    const { info: { username } } = json_res

    last_timeout = await timeoutAFK.findOne({ username })
    expect(last_timeout?.username).toBe(username)
  })

  test('Update timeout tracker trackAFK', async () => {
    // Login again
    const login_res = await fetch(root + '/users/login', options(_user))
    expect(login_res.status).toBe(200)
    token = (await toJSON(login_res)).token

    expect((await timeoutAFK.findOne({ username: _user.username })).expireAt).not.toBe(last_timeout.expireAt)
  })

  test('Auto deleting tracker trackAFK after logout', async () => {
    const auth_head = {
      'Authorization': `Bearer ${token}`
    }

    const logout = await fetch(root+'/users/logout', options(_user, auth_head))
    expect(logout.status).toBe(200)
    expect(await toJSON(logout)).toEqual({ success: true })
    
    expect(await timeoutAFK.findOne({ username: _user.username })).toBeNull()
  })

  test('Auto deleting tracker trackAFK after deleting user', async () => {
    const login_res = await fetch(root + '/users/login', options(_user))
    expect(login_res.status).toBe(200)
    token = (await toJSON(login_res)).token

    const auth_head = {
      'Authorization': `Bearer ${token}`
    }

    const success_delete = await fetch(root+'/users/delete', options(_user, auth_head, 'DELETE'))
    expect(success_delete.status).toBe(200)
    expect(await toJSON(success_delete)).toEqual({ success: true })

    expect(await timeoutAFK.findOne({ username: _user.username })).toBeNull()
  })
})
