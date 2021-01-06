module.exports = {
  globalSetup: "./setup",
  globalTeardown: "./teardown",
  testEnvironment: "./mongoEnv",
  roots: [ process.env.PWD ],
}
