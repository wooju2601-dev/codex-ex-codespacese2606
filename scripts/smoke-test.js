require('dotenv').config();

const http = require('http');
const { io: createSocketClient } = require('socket.io-client');
const app = require('../src/app');
const { connectDB, getCollection, closeDB } = require('../server/config/db');
const { initializeSocket } = require('../server/socket/chat');

let server;
let socketServer;

async function runSmokeTest() {
  if (process.env.MONGODB_URI) {
    await connectDB();
  }

  server = http.createServer(app);
  socketServer = initializeSocket(server);

  server.listen(0, async () => {
    const { port } = server.address();
    const baseUrl = 'http://localhost:' + port;

    try {
      // 핵심 REST API가 실제 HTTP 요청으로 동작하는지 확인합니다.
      await expectJson(baseUrl + '/health', { status: 'ok' });

      if (!process.env.MONGODB_URI) {
        console.log('Smoke test passed (MongoDB CRUD skipped: MONGODB_URI is not set)');
        return;
      }

      const created = await requestJson(baseUrl + '/cars', 'POST', {
        name: 'SmokeCar',
        company: 'TEST',
        price: 2400,
        year: 2026,
        dealerId: 'smoke-dealer',
        dealerName: 'Smoke Dealer',
      });
      assert(typeof created._id === 'string', 'POST /cars should create an ObjectId');

      const detail = await getJson(baseUrl + '/api/cars/' + created._id);
      assert(detail._id === created._id, 'GET /api/cars/:id should return car details');

      const room = await requestJson(baseUrl + '/api/chat-rooms', 'POST', {
        carId: created._id,
        carName: created.name,
        userId: 'smoke-user',
        dealerId: created.dealerId,
        dealerName: created.dealerName,
      });
      const roomDetail = await getJson(baseUrl + '/api/chat-rooms/' + room._id);
      assert(roomDetail._id === room._id, 'chat room should be created and loaded');

      const socket = createSocketClient(baseUrl);
      await waitForSocketConnection(socket);
      const joinResult = await emitWithAck(socket, 'join-room', room._id);
      assert(joinResult.ok, 'join-room should join the chat room');

      const receivedMessage = new Promise((resolve) => {
        socket.once('receive-message', resolve);
      });
      const sendResult = await emitWithAck(socket, 'send-message', {
        roomId: room._id,
        senderId: 'smoke-user',
        senderName: 'Smoke User',
        text: 'Socket smoke message',
      });
      const socketMessage = await receivedMessage;

      assert(sendResult.ok, 'send-message should save the message');
      assert(socketMessage.text === 'Socket smoke message', 'receive-message should broadcast the saved message');
      socket.disconnect();

      const updated = await requestJson(baseUrl + '/cars/' + created._id, 'PUT', { price: 2600 });
      assert(updated.price === 2600, 'PUT /cars/:id should update a car');

      const searched = await getJson(baseUrl + '/cars/search?company=TEST');
      assert(searched.some((car) => car._id === created._id), 'GET /cars/search should filter by company');

      const combinedSearch = await getJson(
        baseUrl + '/api/cars/search?keyword=smoke&company=TEST&minPrice=2000&maxPrice=3000&minYear=2020',
      );
      assert(
        combinedSearch.some((car) => car._id === created._id),
        'GET /api/cars/search should combine search conditions',
      );

      const filtered = await getJson(baseUrl + '/cars/filter?minPrice=2500&maxPrice=2700');
      assert(filtered.every((car) => car.price >= 2500 && car.price <= 2700), 'GET /cars/filter should filter by price');

      const deleted = await requestJson(baseUrl + '/cars/' + created._id, 'DELETE');
      assert(deleted._id === created._id, 'DELETE /cars/:id should delete a car');

      await getCollection('chatRooms').deleteMany({ userId: 'smoke-user' });
      await getCollection('messages').deleteMany({ senderId: 'smoke-user' });

      console.log('Smoke test passed');
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    } finally {
      socketServer.close();
      server.close();
      await closeDB();
    }
  });
}

function waitForSocketConnection(socket) {
  return new Promise((resolve, reject) => {
    socket.once('connect', resolve);
    socket.once('connect_error', reject);
  });
}

function emitWithAck(socket, eventName, data) {
  return new Promise((resolve, reject) => {
    socket.timeout(5000).emit(eventName, data, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(result);
    });
  });
}

runSmokeTest().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

async function getJson(url) {
  const response = await fetch(url);
  assert(response.ok, url + ' should return 2xx');
  return response.json();
}

async function expectJson(url, expected) {
  const data = await getJson(url);
  assert(JSON.stringify(data) === JSON.stringify(expected), url + ' should return expected JSON');
}

async function requestJson(url, method, body) {
  const options = { method };

  if (body) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  assert(response.ok, method + ' ' + url + ' should return 2xx');
  return response.json();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
