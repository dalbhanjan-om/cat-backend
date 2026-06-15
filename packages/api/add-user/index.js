let cachedClient = null;

async function connectToDatabase(uri) {
    if (cachedClient) return cachedClient;
    // Require dynamically so missing modules are caught by the try-catch block!
    const { MongoClient } = require('mongodb');
    
    // Add 5-second timeout so it fails gracefully instead of crashing the DO function container
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
    await client.connect();
    cachedClient = client;
    return client;
}

async function main(args) {
    // 1. Ensure it's a POST request
    const httpMethod = args.__ow_method || 'post';
    if (httpMethod.toLowerCase() !== 'post') {
        return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method Not Allowed.' }) };
    }

    // 2. Extract POST body parameters
    const { name, email } = args;
    if (!name || !email) {
        return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing fields.' }) };
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
            body: JSON.stringify({ success: true, insertedId: result.insertedId })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                error: error.message, 
                stack: error.stack,
                hint: "If this is a MongoServerSelectionError, your Database Trusted Sources firewall is blocking the connection. If MODULE_NOT_FOUND, mongodb isn't installed."
            })
        };
    }
}

module.exports.main = main;