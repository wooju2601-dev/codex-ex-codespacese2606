# codex-ex-codespacese2606

Express CRUD REST API와 React.js 화면을 함께 연습하는 프로젝트입니다. 백엔드는 자동차 API를 제공하고, 프론트엔드는 Tailwind CSS로 만든 자동차 관리 화면을 제공합니다.

## 주요 기능

- 자동차 목록 조회, 상세 조회, 추가, 수정, 삭제
- 회사명 검색: `GET /cars/search?company=HYUNDAI`
- 가격 필터: `GET /cars/filter?minPrice=2000&maxPrice=3000`
- React + Tailwind CSS 기반 관리 화면
- Render 배포 설정: `render.yaml`
- GitHub Actions CI/CD: `.github/workflows/ci-cd.yml`

## 프로젝트 구조

```text
.
├── client
│   ├── index.html
│   └── src
│       ├── App.jsx
│       ├── main.jsx
│       └── styles.css
├── src
│   ├── app.js
│   └── server.js
├── .github/workflows/ci-cd.yml
├── package.json
├── render.yaml
└── server.js
```

## 로컬 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

- Express API: `http://localhost:3000`
- React 화면: `http://localhost:5173`

### 3. 배포 형태로 실행

```bash
npm run build
npm start
```

빌드 후에는 Express가 React 화면까지 함께 제공합니다.

```bash
curl http://localhost:3000/health
```

## API 테스트

전체 목록 조회:

```bash
curl http://localhost:3000/cars
```

회사명 검색:

```bash
curl "http://localhost:3000/cars/search?company=HYUNDAI"
```

회사명을 전달하지 않으면 전체 목록을 조회합니다.

```bash
curl http://localhost:3000/cars/search
```

가격 범위 필터:

```bash
curl "http://localhost:3000/cars/filter?minPrice=2000&maxPrice=3000"
```

`minPrice` 또는 `maxPrice` 중 하나만 전달해도 동작합니다.

```bash
curl "http://localhost:3000/cars/filter?minPrice=2500"
curl "http://localhost:3000/cars/filter?maxPrice=2500"
```

자동차 추가:

```bash
curl -X POST http://localhost:3000/cars \
  -H "Content-Type: application/json" \
  -d '{"name":"Avante","company":"HYUNDAI","price":2200,"year":2024}'
```

자동차 수정:

```bash
curl -X PUT http://localhost:3000/cars/1 \
  -H "Content-Type: application/json" \
  -d '{"price":2600}'
```

자동차 삭제:

```bash
curl -X DELETE http://localhost:3000/cars/1
```

## Render 배포

`render.yaml`을 사용해 Render에서 Web Service를 만들 수 있습니다.

- Build Command: `npm ci && npm run build`
- Start Command: `npm start`
- Health Check Path: `/health`

Render 서비스 생성 후 GitHub 저장소와 연결하면 main 브랜치 push 시 자동 배포를 사용할 수 있습니다.

## GitHub Actions CI/CD

`.github/workflows/ci-cd.yml`은 다음 순서로 동작합니다.

1. `npm ci`로 의존성 설치
2. `npm run check`로 React 빌드와 REST API smoke test 검증
3. main 브랜치 push인 경우 Render deploy hook 호출

Render deploy hook을 사용하려면 GitHub 저장소 Secrets에 다음 값을 추가하세요.

```text
RENDER_DEPLOY_HOOK_URL=Render에서 발급한 Deploy Hook URL
```
