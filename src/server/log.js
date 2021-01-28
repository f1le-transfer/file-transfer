const formatters = {
  bindings (bindings) {
    return {}
  },
  log (object) {
    return {}
  }
}
const hooks = {
  logMethod (inputArgs, method, level) {
    const statusCode = inputArgs[0].res.statusCode === 304 ? '200 (304)' : inputArgs[0].res.statusCode
    inputArgs[1] = `${inputArgs[0].res.req.method} ${inputArgs[0].res.req.originalUrl} ${statusCode}`
    return method.apply(this, inputArgs)
  }
}

const opts = {
  prettyPrint: true,
  timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
  level: process.env.NODE_ENV === 'test' ? 'silent' : 'info'
}
const short_info_opts = {
  ...opts,
  formatters,
  hooks,
  prettyPrint: {
    ignore: 'pid,hostname,req'
  }
}

const pino = require('pino-http')(process.env.SHORT_LOG==='false' ? opts : short_info_opts)

export default pino
