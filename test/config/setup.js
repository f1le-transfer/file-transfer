// Set env variables
import '../../config/index.conf.js';

export default async function() {
  // Start server
  import('../../build/server/server')

  console.log("\nSetup Mongo Connection\n")
}
