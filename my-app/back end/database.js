require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGODB_URI;
const dbName = 'TriviaWars'
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function getDataFromDatabase() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    const db = client.db(dbName)
    const collection = db.collection('questions')
     const documents = await collection.find({}).toArray();
    return documents
    
  } 
  catch{console.log('error')}
}
getDataFromDatabase().catch(console.dir);

module.exports = { getDataFromDatabase };
