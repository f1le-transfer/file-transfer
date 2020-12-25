const { MongoClient } = require("mongodb")
const NodeEnvironment = require("jest-environment-node")

class MongoEnvironment extends NodeEnvironment {
  async setup() {
    if (!this.global.fileTransferClient) {
      this.global.fileTransferClient = await new MongoClient(process.env.test_db, { useUnifiedTopology: true })
        .connect()
      await super.setup()
    }
  }

  async teardown() {
    await this.global.fileTransferClient.close()
    await super.teardown()
  }

  runScript(script) {
    return super.runScript(script)
  }
}

module.exports = MongoEnvironment
