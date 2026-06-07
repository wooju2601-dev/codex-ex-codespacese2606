const { getCollection } = require('../config/db');

async function createAgentContext(room, userQuestion, currentMessageId) {
  const [car, previousMessages] = await Promise.all([
    getCollection('cars').findOne({ _id: room.carId }),
    getCollection('messages')
      .find({
        roomId: room._id,
        _id: { $ne: currentMessageId },
      })
      .sort({ createdAt: 1 })
      .toArray(),
  ]);

  // 나중에 OpenAI API에 전달할 상담 자료를 한 객체로 모읍니다.
  return {
    car,
    userQuestion,
    previousMessages,
  };
}

async function generateAgentReply(agentContext) {
  // TODO: 실제 AI Agent 호출 코드로 교체합니다.
  return null;
}

module.exports = {
  createAgentContext,
  generateAgentReply,
};
