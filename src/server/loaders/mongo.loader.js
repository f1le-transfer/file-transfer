const { MongoClient } = require('mongodb')

const client = new MongoClient(process.env.MongoDB, { useUnifiedTopology: true })

client.connect().catch(console.log)
