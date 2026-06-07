const { MongoClient } = require('mongodb');

const DB_NAME = process.env.DB_NAME || 'car_market';
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
    throw new Error('MONGODB_URI가 없습니다. .env 파일에 연결 문자열을 추가해 주세요.');
  }

  if (uri.includes('username:password') || uri.includes('cluster0.example.mongodb.net')) {
    throw new Error('MONGODB_URI가 예시 값입니다. 실제 MongoDB Atlas 연결 문자열로 변경해 주세요.');
  }

  if (db) {
    return db;
  }

  // Atlas에 연결할 수 없을 때 너무 오래 기다리지 않고 에러를 확인합니다.
  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  await client.connect();
  db = client.db(DB_NAME);

  // 실제로 데이터베이스와 통신할 수 있는지 확인합니다.
  await db.command({ ping: 1 });

  return db;
}

function getDB() {
  if (!db) {
    throw new Error('MongoDB가 연결되지 않았습니다. 먼저 connectDB()를 호출해 주세요.');
  }

  return db;
}

function getCollection(name) {
  const collectionName = COLLECTIONS[name];

  if (!collectionName) {
    throw new Error(`등록되지 않은 컬렉션입니다: ${name}`);
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
