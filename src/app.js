const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { ObjectId } = require('mongodb');
const carRoutes = require('../server/routes/cars');
const chatRoomRoutes = require('../server/routes/chatRooms');
const { getCollection } = require('../server/config/db');

// Express 애플리케이션을 생성합니다.
const app = express();
const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

// 배포된 React 주소에서 오는 API 요청만 허용합니다.
app.use(cors({
  origin: clientUrl,
  credentials: true,
}));

// JSON 형식의 요청 body를 req.body로 읽을 수 있게 합니다.
app.use(express.json());

// 업로드한 이미지를 React에서 /uploads/파일명으로 표시할 수 있게 합니다.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// MongoDB를 사용하는 차량 API입니다.
app.use('/api/cars', carRoutes);
app.use('/api/chat-rooms', chatRoomRoutes);

// 서버 상태를 확인합니다.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// MongoDB cars 컬렉션의 전체 차량을 조회합니다.
app.get('/cars', async (req, res) => {
  try {
    const cars = await getCollection('cars').find({}).sort({ createdAt: -1 }).toArray();
    res.json(cars);
  } catch (error) {
    console.error('[GET /cars] 조회 실패:', error);
    res.status(500).json({ message: '자동차 목록을 불러오지 못했습니다.' });
  }
});

// company 값으로 자동차 목록을 검색합니다. company가 없으면 전체 목록을 응답합니다.
app.get('/cars/search', async (req, res) => {
  const company = req.query.company;

  try {
    const query = company
      ? { company: company.trim().toUpperCase() }
      : {};

    const cars = await getCollection('cars').find(query).sort({ createdAt: -1 }).toArray();
    res.json(cars);
  } catch (error) {
    console.error('[GET /cars/search] 검색 실패:', error);
    res.status(500).json({ message: '자동차 검색에 실패했습니다.' });
  }
});

// 가격 범위에 맞는 자동차 목록을 필터링합니다. 값이 없으면 해당 조건은 건너뜁니다.
app.get('/cars/filter', async (req, res) => {
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;

  if (
    (minPrice !== null && !Number.isFinite(minPrice))
    || (maxPrice !== null && !Number.isFinite(maxPrice))
  ) {
    return res.status(400).json({ message: '가격은 숫자로 입력해 주세요.' });
  }

  const query = {};

  if (minPrice !== null || maxPrice !== null) {
    query.price = {};

    if (minPrice !== null) {
      query.price.$gte = minPrice;
    }

    if (maxPrice !== null) {
      query.price.$lte = maxPrice;
    }
  }

  try {
    const cars = await getCollection('cars').find(query).sort({ createdAt: -1 }).toArray();
    res.json(cars);
  } catch (error) {
    console.error('[GET /cars/filter] 필터 실패:', error);
    res.status(500).json({ message: '가격 필터 조회에 실패했습니다.' });
  }
});

// URL의 id와 일치하는 자동차 한 대를 조회합니다.
app.get('/cars/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: '올바르지 않은 자동차 ID입니다.' });
  }

  try {
    const car = await getCollection('cars').findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!car) {
      return res.status(404).json({ message: '자동차를 찾을 수 없습니다.' });
    }

    res.json(car);
  } catch (error) {
    console.error('[GET /cars/:id] 조회 실패:', error);
    res.status(500).json({ message: '자동차 정보를 불러오지 못했습니다.' });
  }
});

// 요청 body로 받은 자동차 정보를 MongoDB에 추가합니다.
app.post('/cars', async (req, res) => {
  try {
    const now = new Date();
    const newCar = {
      ...req.body,
      createdAt: now,
      updatedAt: now,
    };

    // _id는 MongoDB가 ObjectId로 자동 생성합니다.
    delete newCar._id;

    const result = await getCollection('cars').insertOne(newCar);
    res.status(201).json({
      ...newCar,
      _id: result.insertedId,
    });
  } catch (error) {
    console.error('[POST /cars] 등록 실패:', error);
    res.status(500).json({ message: '자동차 등록에 실패했습니다.' });
  }
});

// URL의 id와 일치하는 자동차 정보를 요청 body 내용으로 수정합니다.
app.put('/cars/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: '올바르지 않은 자동차 ID입니다.' });
  }

  try {
    const carsCollection = getCollection('cars');
    const id = new ObjectId(req.params.id);
    const updates = {
      ...req.body,
      updatedAt: new Date(),
    };

    // MongoDB 식별자와 최초 등록일은 수정하지 않습니다.
    delete updates._id;
    delete updates.createdAt;

    const result = await carsCollection.updateOne(
      { _id: id },
      { $set: updates },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: '자동차를 찾을 수 없습니다.' });
    }

    const updatedCar = await carsCollection.findOne({ _id: id });
    res.json(updatedCar);
  } catch (error) {
    console.error('[PUT /cars/:id] 수정 실패:', error);
    res.status(500).json({ message: '자동차 수정에 실패했습니다.' });
  }
});

// URL의 id와 일치하는 자동차를 목록에서 삭제합니다.
app.delete('/cars/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: '올바르지 않은 자동차 ID입니다.' });
  }

  try {
    const carsCollection = getCollection('cars');
    const id = new ObjectId(req.params.id);
    const car = await carsCollection.findOne({ _id: id });

    if (!car) {
      return res.status(404).json({ message: '자동차를 찾을 수 없습니다.' });
    }

    const result = await carsCollection.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: '자동차를 찾을 수 없습니다.' });
    }

    res.json(car);
  } catch (error) {
    console.error('[DELETE /cars/:id] 삭제 실패:', error);
    res.status(500).json({ message: '자동차 삭제에 실패했습니다.' });
  }
});

// 배포 환경에서는 React 빌드 결과를 Express가 함께 제공합니다.
// Render / 로컬 환경에서 빌드 위치가 달라질 수 있어서 여러 후보 경로를 검사합니다.
const candidateDistPaths = [
  path.join(__dirname, '..', 'client', 'dist'),
  path.join(process.cwd(), 'client', 'dist'),
  path.join(process.cwd(), 'dist'),
  path.join(__dirname, '..', 'dist'),
  path.join(__dirname, '..', 'client', 'client', 'dist'),
];

const clientDistPath = candidateDistPaths.find((distPath) =>
  fs.existsSync(path.join(distPath, 'index.html'))
);

if (clientDistPath) {
  app.use(express.static(clientDistPath));
}

// API가 아닌 요청은 React 화면으로 연결합니다.
app.get('*', (req, res) => {
  if (!clientDistPath) {
    return res.status(404).json({
      message: 'React build not found. Run npm run build first.',
      checkedPaths: candidateDistPaths,
      cwd: process.cwd(),
      dirname: __dirname,
    });
  }

  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// multer 파일 크기 오류 등 라우트 처리 중 발생한 에러를 응답합니다.
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      message: error.code === 'LIMIT_FILE_SIZE'
        ? '이미지는 5MB 이하만 업로드할 수 있습니다.'
        : error.message,
    });
  }

  if (error) {
    console.error('[Express] 요청 처리 실패:', error);
    return res.status(400).json({ message: error.message });
  }

  next();
});

module.exports = app;
