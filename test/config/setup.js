require('dotenv').config({ path:  `${__dirname}/../../config/.env'`})

module.exports = async function() {
  require('../../build/server/server')
  process.env.db = 'test'
  console.log("\nSetup Mongo Connection\n")
}
