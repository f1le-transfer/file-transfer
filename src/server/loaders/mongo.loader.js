import { MongoClient } from 'mongodb';
import UsersDAO from '../dao/users.dao';

const client = new MongoClient(process.env.db_uri, { useUnifiedTopology: true })

client.connect()
 .then( async (client) => {
   await UsersDAO.injectDB(client)
 })
 .catch(console.log)
