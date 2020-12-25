require('dotenv').config({ path:  `${__dirname}/../../config/.env'`})

module.exports = async function() {
  require('../../build/server/server')
  console.log("\nSetup Mongo Connection")
}
