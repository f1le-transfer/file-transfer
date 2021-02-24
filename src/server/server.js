import app from './index';

// Connect mongoDB and run app (express server)
import('./loaders/mongo.loader').then(() => app.listen(process.env.PORT))
