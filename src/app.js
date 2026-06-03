const express = require('express');
const fs = require('fs');
const path = require('path');

// Express 애플리케이션을 생성합니다.
const app = express();

// JSON 형식의 요청 body를 req.body로 읽을 수 있게 합니다.
app.use(express.json());

// 자동차 목록을 메모리에 저장합니다. 서버를 재시작하면 초기 데이터로 돌아갑니다.
let cars = [
  { _id: 1, name: 'Sonata', price: 2500, company: 'HYUNDAI', year: 2023 },
  { _id: 2, name: 'K5', price: 2700, company: 'KIA', year: 2024 },
  { _id: 3, name: 'SM6', price: 2300, company: 'RENAULT', year: 2022 },
];

// 서버 상태를 확인합니다.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 전체 자동차 목록을 JSON으로 응답합니다.
app.get('/cars', (req, res) => {
  res.json(cars);
});

// company 값으로 자동차 목록을 검색합니다. company가 없으면 전체 목록을 응답합니다.
app.get('/cars/search', (req, res) => {
  const company = req.query.company;

  if (!company) {
    return res.json(cars);
  }

  const filteredCars = cars.filter((item) => item.company === company);
  res.json(filteredCars);
});

// 가격 범위에 맞는 자동차 목록을 필터링합니다. 값이 없으면 해당 조건은 건너뜁니다.
app.get('/cars/filter', (req, res) => {
  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;

  const filteredCars = cars.filter((item) => {
    if (minPrice !== null && item.price < minPrice) {
      return false;
    }

    if (maxPrice !== null && item.price > maxPrice) {
      return false;
    }

    return true;
  });

  res.json(filteredCars);
});

// URL의 id와 일치하는 자동차 한 대를 조회합니다.
app.get('/cars/:id', (req, res) => {
  const id = Number(req.params.id);
  const car = cars.find((item) => item._id === id);

  if (!car) {
    return res.status(404).json({ message: 'Car not found' });
  }

  res.json(car);
});

// 요청 body로 받은 자동차 정보를 목록에 추가합니다.
app.post('/cars', (req, res) => {
  const newCar = req.body;

  if (!newCar._id) {
    newCar._id = Date.now();
  }

  cars.push(newCar);
  res.status(201).json(newCar);
});

// URL의 id와 일치하는 자동차 정보를 요청 body 내용으로 수정합니다.
app.put('/cars/:id', (req, res) => {
  const id = Number(req.params.id);
  const carIndex = cars.findIndex((item) => item._id === id);

  if (carIndex === -1) {
    return res.status(404).json({ message: 'Car not found' });
  }

  cars[carIndex] = { ...cars[carIndex], ...req.body, _id: id };
  res.json(cars[carIndex]);
});

// URL의 id와 일치하는 자동차를 목록에서 삭제합니다.
app.delete('/cars/:id', (req, res) => {
  const id = Number(req.params.id);
  const carIndex = cars.findIndex((item) => item._id === id);

  if (carIndex === -1) {
    return res.status(404).json({ message: 'Car not found' });
  }

  const deletedCar = cars.splice(carIndex, 1)[0];
  res.json(deletedCar);
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

module.exports = app;