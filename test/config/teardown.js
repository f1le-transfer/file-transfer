export default async function() {
  console.log("\nTeardown Mongo Connection\n")

  // Remove global variable
  delete global.fileTransferClient

  // Close server after tests
  process.exit(0)
}
