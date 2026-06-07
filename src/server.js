require('dotenv').config();

const http = require('http');
const app = require('./app');
const { connectDB, DB_NAME, COLLECTIONS } = require('../server/config/db');
const { initializeSocket } = require('../server/socket/chat');

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();
    console.log(`[MongoDB] 연결 성공: ${DB_NAME}`);
    console.log(`[MongoDB] 사용 컬렉션: ${Object.values(COLLECTIONS).join(', ')}`);

    // Express와 Socket.io가 같은 HTTP 서버와 포트를 사용합니다.
    const httpServer = http.createServer(app);
    initializeSocket(httpServer);

    httpServer.listen(port, '0.0.0.0', () => {
      console.log(`[Express] 서버 실행 중: http://localhost:${port}`);
      console.log('[Socket.io] 실시간 채팅 서버 실행 중');
    });
  } catch (error) {
    console.error('[MongoDB] 연결 실패');
    console.error(`[MongoDB] 원인: ${error.message}`);

    if (error.cause) {
      console.error('[MongoDB] 상세 원인:', error.cause);
    }

    process.exit(1);
  }
}

startServer();
