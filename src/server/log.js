const formatters = {
  bindings (bindings) {
    // return { pid: bindings.pid, hostname: bindings.hostname, 'HelloWorld': ' -hi' }
    return {}
  },
  log (object) {
    // return object
    return {}
  }
}
const hooks = {
  logMethod (inputArgs, method, level) {
    inputArgs[1] = `${inputArgs[0].res.req.method} ${inputArgs[0].res.req.originalUrl} ${inputArgs[0].res.statusCode}`
    return method.apply(this, inputArgs)
  }
}


const pino = require('pino-http')({
  hooks,
  formatters,
  prettyPrint: {
    ignore: 'pid,hostname,req'
  },
  timestamp: () => `,"time":"${new Date(Date.now()).toISOString()}"`,
  level: process.env.NODE_ENV === 'test' ? 'silent' : 'info'
})

export default pino
