/* Configure env variables */
import dotenv from 'dotenv'
import path from 'path'
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') })

/* Configure log system */
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
import pino_http from 'pino-http'
const pino = pino_http(process.env.SHORT_LOG==='false' ? opts : short_info_opts)

export { pino }
