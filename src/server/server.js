import app from './index';
import fs from 'fs';
import https from 'https';
import path from 'path';

const prvtKey = fs.readFileSync(path.join(process.env.PWD, 'config', 'example.com+5-key.pem'), 'utf-8')
const cert = fs.readFileSync(path.join(process.env.PWD, 'config', 'example.com+5.pem'), 'utf-8')

const credentials = {
  key: prvtKey,
  cert: cert
}

const httpsServer = https.createServer(credentials, app)

// Connect mongoDB and run app (express server)
import('./loaders/mongo.loader').then(() => { 
    httpsServer.listen(process.env.PORT); /*app.listen(process.env.PORT)*/
    app.listen(process.env.HTTP_PORT);
  }
)
