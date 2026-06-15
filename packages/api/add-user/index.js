const { MongoClient } = require('mongodb');

let cachedClient = null;

async function connectToDatabase(uri) {
    if (cachedClient) return cachedClient;
    const client = new MongoClient(uri);
    await client.connect();
    cachedClient = client;
    return client;
}

async function main(args) {
    // 1. Ensure it's a POST request
    const httpMethod = args.__ow_method || 'post'; 
    if (httpMethod.toLowerCase() !== 'post') {
        return { statusCode: 405, body: { error: 'Method Not Allowed.' } };
    }

    // 2. Extract POST body parameters
    const { name, email } = args;
    if (!name || !email) {
        return { statusCode: 400, body: { error: 'Missing fields.' } };
    }

    try {
        // Hardcoded URL for now as requested
        const dbUri = "mongodb+srv://doadmin:WOE4287S0Z5ajY19@db-mdb-blr1-26412-4db0910f.mongo.ondigitalocean.com/admin?tls=true&authSource=admin";
        const client = await connectToDatabase(dbUri);
        const db = client.db('admin');
        
        const result = await db.collection('users').insertOne({
            name,
            email,
            createdAt: new Date()
        });

        return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json' },
            body: { success: true, insertedId: result.insertedId }
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: { error: error.message }
        };
    }
}

module.exports.main = main;