import app from './index';

// Connect mongoDB
import('./loaders/mongo.loader')
.then(() => {
  app.listen(process.env.PORT)
})
