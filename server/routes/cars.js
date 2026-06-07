const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { ObjectId } = require('mongodb');
const { getCollection } = require('../config/db');

const router = express.Router();
const uploadDirectory = path.join(__dirname, '..', '..', 'uploads');

fs.mkdirSync(uploadDirectory, { recursive: true });

const extensionByMimeType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (req, file, callback) => {
    const extension = extensionByMimeType[file.mimetype];
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!extensionByMimeType[file.mimetype]) {
      return callback(new Error('JPG, PNG, WEBP, GIF 이미지 파일만 업로드할 수 있습니다.'));
    }

    callback(null, true);
  },
});

function removeUploadedFile(file) {
  if (file) {
    fs.unlink(file.path, () => {});
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 입력된 검색 조건만 MongoDB 쿼리에 추가해 복합 검색합니다.
router.get('/search', async (req, res) => {
  const {
    keyword,
    company,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
  } = req.query;

  const numericMinPrice = minPrice ? Number(minPrice) : null;
  const numericMaxPrice = maxPrice ? Number(maxPrice) : null;
  const numericMinYear = minYear ? Number(minYear) : null;
  const numericMaxYear = maxYear ? Number(maxYear) : null;

  const numericValues = [
    numericMinPrice,
    numericMaxPrice,
    numericMinYear,
    numericMaxYear,
  ];

  if (numericValues.some((value) => value !== null && !Number.isFinite(value))) {
    return res.status(400).json({ message: '가격과 연식은 숫자로 입력해 주세요.' });
  }

  if (
    (numericMinPrice !== null && numericMaxPrice !== null && numericMinPrice > numericMaxPrice)
    || (numericMinYear !== null && numericMaxYear !== null && numericMinYear > numericMaxYear)
  ) {
    return res.status(400).json({ message: '최소값은 최대값보다 클 수 없습니다.' });
  }

  const query = {};

  if (keyword && keyword.trim()) {
    query.name = {
      $regex: escapeRegExp(keyword.trim()),
      $options: 'i',
    };
  }

  if (company && company.trim()) {
    query.company = company.trim().toUpperCase();
  }

  if (numericMinPrice !== null || numericMaxPrice !== null) {
    query.price = {};

    if (numericMinPrice !== null) {
      query.price.$gte = numericMinPrice;
    }

    if (numericMaxPrice !== null) {
      query.price.$lte = numericMaxPrice;
    }
  }

  if (numericMinYear !== null || numericMaxYear !== null) {
    query.year = {};

    if (numericMinYear !== null) {
      query.year.$gte = numericMinYear;
    }

    if (numericMaxYear !== null) {
      query.year.$lte = numericMaxYear;
    }
  }

  try {
    const cars = await getCollection('cars')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.json(cars);
  } catch (error) {
    console.error('[GET /api/cars/search] 검색 실패:', error);
    res.status(500).json({ message: '차량 검색에 실패했습니다.' });
  }
});

// ObjectId로 차량 상세 정보를 조회합니다.
router.get('/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: '올바르지 않은 차량 ID입니다.' });
  }

  try {
    const car = await getCollection('cars').findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!car) {
      return res.status(404).json({ message: '차량을 찾을 수 없습니다.' });
    }

    res.json(car);
  } catch (error) {
    console.error('[GET /api/cars/:id] 상세 조회 실패:', error);
    res.status(500).json({ message: '차량 상세 정보를 불러오지 못했습니다.' });
  }
});

// ObjectId로 차량 정보를 수정합니다.
router.put('/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: '올바르지 않은 차량 ID입니다.' });
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
      return res.status(404).json({ message: '차량을 찾을 수 없습니다.' });
    }

    const updatedCar = await carsCollection.findOne({ _id: id });
    res.json(updatedCar);
  } catch (error) {
    console.error('[PUT /api/cars/:id] 수정 실패:', error);
    res.status(500).json({ message: '차량 수정에 실패했습니다.' });
  }
});

// ObjectId로 차량을 삭제합니다.
router.delete('/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: '올바르지 않은 차량 ID입니다.' });
  }

  try {
    const carsCollection = getCollection('cars');
    const id = new ObjectId(req.params.id);
    const car = await carsCollection.findOne({ _id: id });

    if (!car) {
      return res.status(404).json({ message: '차량을 찾을 수 없습니다.' });
    }

    const result = await carsCollection.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: '차량을 찾을 수 없습니다.' });
    }

    res.json(car);
  } catch (error) {
    console.error('[DELETE /api/cars/:id] 삭제 실패:', error);
    res.status(500).json({ message: '차량 삭제에 실패했습니다.' });
  }
});


router.get('/', async (req, res) => {
  try {
    const cars = await getCollection('cars')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.json(cars);
  } catch (error) {
    console.error('[GET /api/cars] 조회 실패:', error);
    res.status(500).json({ message: '차량 목록을 불러오지 못했습니다.' });
  }
});

// 차량 정보와 사진을 함께 받아 MongoDB에 저장합니다.
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const {
      name,
      company,
      price,
      year,
      type,
      fuel,
      mileage,
      location,
      description,
      dealerId,
      dealerName,
    } = req.body;

    if (
      !name
      || !company
      || !price
      || !year
      || !type
      || !fuel
      || mileage === undefined
      || mileage === ''
      || !location
      || !dealerId
      || !dealerName
    ) {
      removeUploadedFile(req.file);
      return res.status(400).json({ message: '필수 차량 정보와 딜러 정보를 모두 입력해 주세요.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: '차량 사진을 선택해 주세요.' });
    }

    const numericPrice = Number(price);
    const numericYear = Number(year);
    const numericMileage = Number(mileage);

    if (
      !Number.isFinite(numericPrice)
      || !Number.isInteger(numericYear)
      || !Number.isFinite(numericMileage)
      || numericPrice < 0
      || numericMileage < 0
    ) {
      removeUploadedFile(req.file);
      return res.status(400).json({ message: '가격, 연식, 주행거리는 숫자로 입력해 주세요.' });
    }

    const now = new Date();
    const car = {
      name: name.trim(),
      company: company.trim().toUpperCase(),
      price: numericPrice,
      year: numericYear,
      type: type.trim(),
      fuel: fuel.trim(),
      mileage: numericMileage,
      location: location.trim(),
      description: description ? description.trim() : '',
      imageUrl: `/uploads/${req.file.filename}`,
      dealerId: dealerId.trim(),
      dealerName: dealerName.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const result = await getCollection('cars').insertOne(car);

    res.status(201).json({
      ...car,
      _id: result.insertedId,
    });
  } catch (error) {
    removeUploadedFile(req.file);
    console.error('[POST /api/cars] 차량 등록 실패:', error);
    res.status(500).json({
      message: '차량 등록에 실패했습니다.',
      error: error.message,
    });
  }
});

module.exports = router;
