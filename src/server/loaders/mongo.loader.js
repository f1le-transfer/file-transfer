import { MongoClient } from 'mongodb';
import UsersDAO from '../dao/users.dao';
import TrackAFK_DAO from '../dao/TrackAFK.dao';

const {
  MONDO_PROTOCOL,
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_HOSTNAME,
  MONGO_PORT,
  MONGO_DB,
  MONGO_TEST_DB
} = process.env;

/**
 * Set default value.
 * @param {*} isempty 
 * @param {*} shoulbe 
 */
const default_val = (isempty, shoulbe) => !isempty ? '' : shoulbe;

const url = `${MONDO_PROTOCOL}://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}${default_val(MONGO_PORT, ':'+MONGO_PORT)}/${process.env.NODE_ENV==='test'? MONGO_TEST_DB:MONGO_DB}?authSource=admin`;  

// Set url for tests
process.env.TEST_DB_URI = url

const client = new MongoClient(url, { useUnifiedTopology: true })

client.connect()
 .then( async (client) => {
   console.log('\x1b[35m%s\x1b[0m', '\nConnecting to database...');

   await UsersDAO.injectDB(client)
   await TrackAFK_DAO.injectDB(client)
   console.log('\x1b[35m%s\x1b[0m', `The server is running on port ${process.env.PORT}\n`)
 })
 .catch(console.log)
