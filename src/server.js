require('dotenv').config();

const app = require('./app');
const { connectDB, DB_NAME, COLLECTIONS } = require('../server/config/db');

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();
    console.log(`[MongoDB] Connected to database: ${DB_NAME}`);
    console.log(`[MongoDB] Collections ready: ${Object.values(COLLECTIONS).join(', ')}`);

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('[MongoDB] Connection failed.');
    console.error(error.message);

    if (error.cause) {
      console.error(error.cause);
    }

    process.exit(1);
  }
}

startServer();
