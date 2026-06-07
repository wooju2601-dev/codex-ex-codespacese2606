const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollection } = require('../config/db');

const router = express.Router();

// 같은 차량과 사용자 사이의 상담방이 있으면 재사용하고, 없으면 새로 만듭니다.
router.post('/', async (req, res) => {
  const { carId, userId, dealerId, dealerName, carName } = req.body;

  if (!ObjectId.isValid(carId) || !userId || !dealerId) {
    return res.status(400).json({ message: '차량과 상담 참여자 정보가 필요합니다.' });
  }

  try {
    const chatRooms = getCollection('chatRooms');
    const roomQuery = {
      carId: new ObjectId(carId),
      userId,
      dealerId,
    };
    const existingRoom = await chatRooms.findOne(roomQuery);

    if (existingRoom) {
      return res.json(existingRoom);
    }

    const now = new Date();
    const room = {
      ...roomQuery,
      carName,
      dealerName,
      createdAt: now,
      updatedAt: now,
    };
    const result = await chatRooms.insertOne(room);

    res.status(201).json({
      ...room,
      _id: result.insertedId,
    });
  } catch (error) {
    console.error('[POST /api/chat-rooms] 상담방 생성 실패:', error);
    res.status(500).json({ message: '상담방을 만들지 못했습니다.' });
  }
});

// 채팅 화면에 필요한 상담방 정보를 조회합니다.
router.get('/:id/messages', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: '올바르지 않은 상담방 ID입니다.' });
  }

  try {
    const messages = await getCollection('messages')
      .find({ roomId: new ObjectId(req.params.id) })
      .sort({ createdAt: 1 })
      .toArray();

    res.json(messages);
  } catch (error) {
    console.error('[GET /api/chat-rooms/:id/messages] 메시지 조회 실패:', error);
    res.status(500).json({ message: '메시지 목록을 불러오지 못했습니다.' });
  }
});

// 채팅 화면에 필요한 상담방 정보를 조회합니다.
router.get('/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: '올바르지 않은 상담방 ID입니다.' });
  }

  try {
    const room = await getCollection('chatRooms').findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!room) {
      return res.status(404).json({ message: '상담방을 찾을 수 없습니다.' });
    }

    res.json(room);
  } catch (error) {
    console.error('[GET /api/chat-rooms/:id] 상담방 조회 실패:', error);
    res.status(500).json({ message: '상담방 정보를 불러오지 못했습니다.' });
  }
});

module.exports = router;
