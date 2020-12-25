module.exports = async function() {
  console.log("\nTeardown Mongo Connection")

  // Remove global variable
  delete global.fileTransferClient

  // Close server after all tests
  process.exit(0)
}
