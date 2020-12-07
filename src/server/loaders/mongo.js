const mongoose = require('mongoose')

mongoose.connect(process.env.MongoDB, { useUnifiedTopology: true, useNewUrlParser: true })
// Handle initial connection errors
.catch(console.error)

// Handle errors after initial connection was established
mongoose.connection.on('error', console.error)
