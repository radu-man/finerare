require('dotenv').config()

const { MongoClient, ServerApiVersion } = require("mongodb");

// const uri = process.env.DB_URI;
const uri = process.env.DB_LOCAL;

const client = new MongoClient(uri,  {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
        useUnifiedTopology: true
    }
});

async function run() {
    try {
        await client.connect();

        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
}

const connectDB = async() => run().catch(console.dir);

module.exports = {
    connectDB,
    client
}
