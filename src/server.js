const app = require('./app');

// Render는 PORT 환경 변수를 사용합니다. 로컬에서는 3000번을 사용합니다.
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log('Server is running on port ' + port);
});
