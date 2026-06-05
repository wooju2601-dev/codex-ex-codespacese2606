const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const { MongoClient } = require('mongodb');



const DB_NAME = 'car_market';
const COLLECTIONS = {
  cars: 'cars',
  users: 'users',
  chatRooms: 'chat_rooms',
  messages: 'messages',
};

let client;
let db;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing. Add it to your .env file.');
  }

  if (uri.includes('username:password') || uri.includes('cluster0.example.mongodb.net')) {
    throw new Error('MONGODB_URI still has the example value. Replace it with your MongoDB Atlas connection string.');
  }

  if (db) {
    return db;
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(DB_NAME);

  await db.command({ ping: 1 });

  return db;
}

function getDB() {
  if (!db) {
    throw new Error('MongoDB is not connected. Call connectDB() before using getDB().');
  }

  return db;
}

function getCollection(name) {
  const collectionName = COLLECTIONS[name];

  if (!collectionName) {
    throw new Error(`Unknown collection key: ${name}`);
  }

  return getDB().collection(collectionName);
}

async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = {
  DB_NAME,
  COLLECTIONS,
  connectDB,
  getDB,
  getCollection,
  closeDB,
};
