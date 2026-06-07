# Car Market

Node.js, Express, React를 학습하기 위한 자동차 거래 실습 프로젝트입니다.

Firebase Authentication으로 로그인한 사용자가 차량을 등록하고, MongoDB Atlas에 차량과 상담 데이터를 저장합니다. 차량 사진은 `uploads` 폴더에 저장하고, Socket.io로 상담방 실시간 채팅을 처리합니다.

## 프로젝트 개요

### 목적

- Express REST API와 React 화면 연동 연습
- MongoDB Atlas `MongoClient` 연결 연습
- Firebase 로그인 기반 사용자 흐름 연습
- `multipart/form-data` 파일 업로드 연습
- Socket.io 실시간 채팅 연습

### 주요 기능

- Firebase 이메일/비밀번호 로그인, 회원가입
- 차량 등록, 목록, 상세, 수정, 삭제
- 차량 사진 업로드
- 차량 복합 검색
- 차량 상세 화면
- 딜러 상담방 생성
- Socket.io 실시간 메시지 송수신
- MongoDB `cars`, `users`, `chat_rooms`, `messages` 컬렉션 사용

### 기술 스택

- Backend: Node.js, Express, MongoDB Driver, Multer, Socket.io
- Frontend: React, Vite, React Router, Tailwind CSS, Socket.io Client
- Auth: Firebase Authentication
- Database: MongoDB Atlas
- Deploy: Render

## 시스템 설계서

### 전체 구조

```text
React Client
  ├─ Firebase Auth 로그인
  ├─ 차량 목록 / 상세 / 등록 / 검색 화면
  └─ Socket.io 채팅 화면

Express Server
  ├─ REST API
  ├─ Multer 이미지 업로드
  ├─ Socket.io 실시간 채팅
  └─ MongoDB Atlas 연결

MongoDB Atlas
  ├─ cars
  ├─ users
  ├─ chat_rooms
  └─ messages
```

### 폴더 구조

```text
.
├── client
│   ├── index.html
│   ├── vite.config.js
│   └── src
│       ├── App.jsx
│       ├── main.jsx
│       ├── firebase.js
│       ├── config.js
│       ├── context
│       │   └── AuthContext.jsx
│       └── pages
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── CarDetail.jsx
│           └── ChatRoom.jsx
├── server
│   ├── config
│   │   └── db.js
│   ├── routes
│   │   ├── cars.js
│   │   └── chatRooms.js
│   └── socket
│       ├── chat.js
│       └── chatAgent.js
├── src
│   ├── app.js
│   └── server.js
├── uploads
├── scripts
│   └── smoke-test.js
├── render.yaml
├── package.json
└── server.js
```

## 명세서

### 환경 변수

루트 `.env`:

```env
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=car_market
CLIENT_URL=http://localhost:5173
```

`client/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### MongoDB 컬렉션

`cars` 예시:

```json
{
  "_id": "ObjectId",
  "name": "Sonata Hybrid",
  "company": "HYUNDAI",
  "price": 2800,
  "year": 2023,
  "type": "sedan",
  "fuel": "hybrid",
  "mileage": 35000,
  "location": "서울",
  "description": "출퇴근용으로 적합한 하이브리드 세단",
  "imageUrl": "/uploads/sonata.jpg",
  "dealerId": "firebase-user-uid",
  "dealerName": "김딜러",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

`chat_rooms` 예시:

```json
{
  "_id": "ObjectId",
  "carId": "ObjectId",
  "carName": "Sonata Hybrid",
  "userId": "firebase-user-uid",
  "dealerId": "dealer-uid",
  "dealerName": "김딜러",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

`messages` 예시:

```json
{
  "_id": "ObjectId",
  "roomId": "ObjectId",
  "senderId": "firebase-user-uid",
  "senderName": "user@email.com",
  "text": "차량 상태가 궁금합니다.",
  "createdAt": "Date"
}
```

### API 명세

기본 상태 확인:

```http
GET /health
```

차량 CRUD:

```http
GET    /cars
GET    /cars/:id
POST   /cars
PUT    /cars/:id
DELETE /cars/:id
```

차량 사진 포함 등록:

```http
POST /api/cars
Content-Type: multipart/form-data
```

필드:

```text
name, company, price, year, type, fuel, mileage, location,
description, dealerId, dealerName, image
```

차량 상세:

```http
GET /api/cars/:id
```

차량 복합 검색:

```http
GET /api/cars/search?keyword=sonata&company=HYUNDAI&minPrice=1000&maxPrice=3000&minYear=2020&maxYear=2024
```

상담방:

```http
POST /api/chat-rooms
GET  /api/chat-rooms/:id
GET  /api/chat-rooms/:id/messages
```

Socket.io 이벤트:

```text
join-room
send-message
receive-message
```

`send-message` 데이터:

```json
{
  "roomId": "chat-room-object-id",
  "senderId": "firebase-user-uid",
  "senderName": "user@email.com",
  "text": "안녕하세요"
}
```

## 화면 흐름 설계서

### 1. 로그인 흐름

```text
접속
→ Firebase 설정 확인
→ 로그인 또는 회원가입
→ 로그인 성공
→ 차량 목록 화면
```

### 2. 차량 등록 흐름

```text
차량 목록 화면
→ 차량 추가 폼 입력
→ 사진 선택
→ POST /api/cars
→ uploads 폴더에 이미지 저장
→ MongoDB cars 컬렉션에 차량 정보 저장
→ 목록에 새 차량 표시
```

### 3. 차량 검색 흐름

```text
차량 목록 화면
→ 차량명 / 제조사 / 가격 / 연식 조건 입력
→ GET /api/cars/search
→ MongoDB 동적 쿼리 실행
→ 검색 결과 카드 출력
```

### 4. 차량 상세 흐름

```text
차량 카드의 상세 보기 클릭
→ /cars/:id 이동
→ GET /api/cars/:id
→ 사진, 차량 정보, 딜러 정보 출력
```

### 5. 상담 흐름

```text
차량 상세 화면
→ 딜러와 상담하기 클릭
→ POST /api/chat-rooms
→ 기존 상담방이 있으면 재사용
→ 없으면 새 상담방 생성
→ /chat/:roomId 이동
```

### 6. 실시간 채팅 흐름

```text
/chat/:roomId 진입
→ GET /api/chat-rooms/:id
→ GET /api/chat-rooms/:id/messages
→ Socket.io 연결
→ join-room 이벤트 전송
→ 메시지 입력 후 send-message 전송
→ 서버가 MongoDB messages에 저장
→ receive-message 이벤트로 같은 방 사용자에게 전달
```

## 개발 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 로컬 개발 서버 실행

```bash
npm run dev
```

주소:

```text
Express API: http://localhost:3000
React Client: http://localhost:5173
```

### 3. 배포 형태로 실행

```bash
npm run build
npm start
```

빌드 후 Express가 React 정적 파일도 함께 제공합니다.

## 검증 방법

### 빌드 검증

```bash
npm run build
```

### 통합 smoke test

```bash
npm run smoke
```

검증 내용:

- `/health` 상태 확인
- MongoDB 차량 CRUD
- 차량 상세 API
- 차량 복합 검색 API
- 상담방 생성과 조회
- Socket.io `join-room`, `send-message`, `receive-message`
- 메시지 MongoDB 저장

### 수동 확인

```bash
curl http://localhost:3000/health
```

차량 검색:

```bash
curl "http://localhost:3000/api/cars/search?keyword=sonata&company=HYUNDAI"
```

차량 상세:

```bash
curl http://localhost:3000/api/cars/차량ObjectId
```

## 배포 정리

### Render 배포

`render.yaml`에 서버와 클라이언트 배포 설정이 포함되어 있습니다.

서버:

```text
Build Command: npm ci
Start Command: npm start
Health Check Path: /health
```

클라이언트:

```text
Build Command: npm ci && npm run build
Publish Path: ./client/dist
```

### Render 환경 변수

서버 서비스:

```text
NODE_ENV=production
MONGODB_URI=MongoDB Atlas 연결 문자열
DB_NAME=car_market
CLIENT_URL=배포된 React 주소
```

클라이언트 서비스:

```text
VITE_API_BASE_URL=배포된 Express 서버 주소
VITE_FIREBASE_API_KEY=Firebase 값
VITE_FIREBASE_AUTH_DOMAIN=Firebase 값
VITE_FIREBASE_PROJECT_ID=Firebase 값
VITE_FIREBASE_STORAGE_BUCKET=Firebase 값
VITE_FIREBASE_MESSAGING_SENDER_ID=Firebase 값
VITE_FIREBASE_APP_ID=Firebase 값
```

### 배포 전 체크리스트

- MongoDB Atlas Network Access에 배포 서버 접근 허용
- Firebase Authentication Email/Password 활성화
- Render 서버 환경변수 설정
- Render 클라이언트 환경변수 설정
- `npm run check` 통과 확인

## 주의할 점

- 현재 Socket.io 메시지는 클라이언트가 보낸 `senderId`를 사용합니다.
- 실제 서비스에서는 Firebase ID 토큰을 Express와 Socket.io에서 검증해야 합니다.
- `uploads` 폴더는 로컬 저장 방식입니다. Render 무료 환경에서는 파일 영속성이 제한될 수 있으므로 실제 서비스에서는 S3, Cloudinary, Firebase Storage 같은 외부 저장소 사용이 좋습니다.
