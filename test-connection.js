const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://123alok2032:alok2005@expensetracker.7spt3nq.mongodb.net/?appName=expensetracker";

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB Atlas");
    await client.db("admin").command({ ping: 1 });
    console.log("Ping successful");
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await client.close();
  }
}

run();