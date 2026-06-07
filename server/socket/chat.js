const { Server } = require('socket.io');
const { ObjectId } = require('mongodb');
const { getCollection } = require('../config/db');
const { createAgentContext, generateAgentReply } = require('./chatAgent');

async function saveMessage(roomId, senderId, senderName, text) {
  const message = {
    roomId,
    senderId,
    senderName,
    text,
    createdAt: new Date(),
  };
  const result = await getCollection('messages').insertOne(message);

  return {
    ...message,
    _id: result.insertedId,
  };
}

async function isDealerOnline(io, roomId, dealerId) {
  const connectedSockets = await io.in(roomId).fetchSockets();

  return connectedSockets.some((connectedSocket) => (
    connectedSocket.data.userId === dealerId
  ));
}

async function replyWithAgent(io, room, userMessage) {
  const agentContext = await createAgentContext(
    room,
    userMessage.text,
    userMessage._id,
  );
  const replyText = await generateAgentReply(agentContext);

  // 현재 generateAgentReply는 답변을 만들지 않으므로 여기서 종료됩니다.
  if (!replyText) {
    return;
  }

  const agentMessage = await saveMessage(
    room._id,
    'ai-agent',
    'AI 상담 Agent',
    replyText,
  );

  io.to(room._id.toString()).emit('receive-message', agentMessage);
}

async function handleChatMessage(io, messageData, callback) {
  const {
    roomId,
    senderId,
    senderName,
    text,
  } = messageData || {};

  if (!ObjectId.isValid(roomId) || !senderId || !text?.trim()) {
    callback?.({ ok: false, message: '상담방, 사용자, 메시지 내용이 필요합니다.' });
    return;
  }

  try {
    const roomObjectId = new ObjectId(roomId);
    const room = await getCollection('chatRooms').findOne({ _id: roomObjectId });

    if (!room) {
      callback?.({ ok: false, message: '상담방을 찾을 수 없습니다.' });
      return;
    }

    const savedMessage = await saveMessage(
      roomObjectId,
      senderId,
      senderName || '사용자',
      text.trim(),
    );

    // 현재 기본 동작: 같은 상담방의 딜러와 사용자에게 메시지를 전달합니다.
    io.to(roomId).emit('receive-message', savedMessage);
    callback?.({ ok: true, message: savedMessage });

    try {
      const sentByCustomer = senderId !== room.dealerId;
      const dealerOnline = await isDealerOnline(io, roomId, room.dealerId);

      // 딜러가 오프라인일 때만 AI Agent가 상담 자료를 준비합니다.
      if (sentByCustomer && !dealerOnline) {
        await replyWithAgent(io, room, savedMessage);
      }
    } catch (agentError) {
      // Agent 오류가 현재 딜러 채팅 기능을 막지 않도록 따로 처리합니다.
      console.error('[Socket.io] AI Agent 답변 준비 실패:', agentError);
    }
  } catch (error) {
    console.error('[Socket.io] 메시지 처리 실패:', error);
    callback?.({ ok: false, message: '메시지를 처리하지 못했습니다.' });
  }
}

function initializeSocket(httpServer) {
  const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  const io = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // roomId를 Socket.io 방 이름으로 사용합니다.
    socket.on('join-room', (roomData, callback) => {
      const roomId = typeof roomData === 'string' ? roomData : roomData?.roomId;
      const userId = typeof roomData === 'object' ? roomData?.userId : null;

      if (!ObjectId.isValid(roomId)) {
        callback?.({ ok: false, message: '올바르지 않은 상담방 ID입니다.' });
        return;
      }

      // 접속자의 ID를 저장해 담당 딜러의 온라인 여부를 확인합니다.
      socket.data.userId = userId;
      socket.join(roomId);
      callback?.({ ok: true });
    });

    socket.on('send-message', (messageData, callback) => {
      handleChatMessage(io, messageData, callback);
    });
  });

  return io;
}

module.exports = {
  initializeSocket,
  handleChatMessage,
};
