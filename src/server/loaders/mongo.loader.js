import mongo_pkg from 'mongodb';
const { MongoClient } = mongo_pkg;
import UsersDAO from '../dao/users.dao.js';
import TrackAFK_DAO from '../dao/TrackAFK.dao.js';

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
 * @param {*} should_be
 */
const default_val = (isempty, should_be) => !isempty ? '' : should_be;

const url = `${MONDO_PROTOCOL}://\
${MONGO_USERNAME}:\
${MONGO_PASSWORD}@\
${MONGO_HOSTNAME}\
${default_val(MONGO_PORT, ':'+MONGO_PORT)}/\
${process.env.NODE_ENV==='test'? MONGO_TEST_DB:MONGO_DB}?authSource=admin`;

// Set url for tests
process.env.TEST_DB_URI = url

const client = new MongoClient(url, { useUnifiedTopology: true })

client.connect()
 .then( async (client) => {
   console.log('\x1b[35m%s\x1b[0m', '\nConnecting to database...');

   await UsersDAO.injectDB(client)
   await TrackAFK_DAO.injectDB(client)
   console.log('\x1b[35m%s\x1b[0m', `The https server is running on port ${process.env.PORT} and http ${process.env.HTTP_PORT}\n`)
 })
 .catch(console.log)
