import { MongoClient } from 'mongodb';
import UsersDAO from '../dao/users.dao';
import TrackAFK from '../subscribers/trackAFK.sub';

const client = new MongoClient(process.env.db_uri, { useUnifiedTopology: true })

client.connect()
 .then( async (client) => {
   await UsersDAO.injectDB(client)
   await TrackAFK.injectDB(client)
 })
 .catch(console.log)
