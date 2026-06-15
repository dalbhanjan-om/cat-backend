let cachedClient = null;

async function connectToDatabase(uri) {
    if (cachedClient) return cachedClient;
    // Require dynamically so missing modules are caught by the try-catch block!
    const { MongoClient } = require('mongodb');
    
    // Add 5-second timeout so it fails gracefully instead of crashing the DO function container
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected to MongoDB.");
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
        console.log("Authenticating and selecting database...");
        const db = client.db('acecat_dev');
        
        console.log("Inserting user...");
        const result = await db.collection('users').insertOne({
            name,
            email,
            createdAt: new Date()
        });

        console.log("Insert successful, closing client...");
        await client.close();
        cachedClient = null;

        return {
            statusCode: 201,
            body: { success: true, insertedId: result.insertedId.toString() }
        };
    } catch (error) {
        console.error("Function error:", error);
        if (cachedClient) {
            await cachedClient.close().catch(() => {});
            cachedClient = null;
        }
        return {
            statusCode: 500,
            body: { 
                error: error.message ? error.message.toString() : "Unknown error", 
                stack: error.stack ? error.stack.toString() : "",
                hint: "If this is a MongoServerSelectionError, your Database Trusted Sources firewall is blocking the connection. If MODULE_NOT_FOUND, mongodb isn't installed."
            }
        };
    }
}

module.exports.main = main;