// Set env variables
import '../../config/index';

module.exports = async function() {
  require('../../build/server/server')

  /*
  * Rewriting standard variables for tests.
  * This variables uses in
  * test/config/mongoEnv.js - process.env.db_uri,
  * src/server/loaders/mongo.loader.js - process.env.db_uri (This loader does not connect again if the connection already exists),
  * src/server/dao/users.dao.js - process.env.db_name
  * */
  process.env.db_name = process.env.db_name_test
  process.env.db_uri = process.env.db_uri_test

  console.log("\nSetup Mongo Connection\n")
}
