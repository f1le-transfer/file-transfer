import { MongoClient } from 'mongodb';
import UsersDAO from '../dao/users.dao';
import TrackAFK_DAO from '../dao/TrackAFK.dao';

const client = new MongoClient(process.env.db_uri, { useUnifiedTopology: true })

client.connect()
 .then( async (client) => {
   console.log('\x1b[35m%s\x1b[0m', '\nConnecting to database...');

   await UsersDAO.injectDB(client)
   await TrackAFK_DAO.injectDB(client)
   console.log('\x1b[35m%s\x1b[0m', `The server is running on port ${process.env.PORT}\n`)
 })
 .catch(console.log)
