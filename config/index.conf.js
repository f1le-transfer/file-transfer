/* Configure env variables */
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '..', 'config', '.env') })

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

const pino = require('pino-http')(process.env.SHORT_LOG==='false' ? opts : short_info_opts)

/* documentation config swagger  */
// import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hello World',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes*.js'], // files containing annotations as above
};
const openapiSpecification = 1/*swaggerJsdoc(options);*/

// exports.pino = pino
// exports.openapiSpecification = openapiSpecification
export { pino, openapiSpecification }
