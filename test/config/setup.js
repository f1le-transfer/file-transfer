require('dotenv').config({ path:  `${__dirname}/../../config/.env'`})

module.exports = async function() {
  require('../../build/server/server')

  /*
  * Overwritten the variable because this
  * variable is used to connect to collections(users, sessions) in src/server/dao/users.dao.js
  * */
  process.env.db_name = process.env.db_name_test

  console.log("\nSetup Mongo Connection\n")
}
