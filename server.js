// to fix dsn related error
const dns = require('node:dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Uncaught Exception: Shutting server down...');
  server.close(() => {
    process.exit(1);
  });
});

const app = require('./app');
const port = process.env.PORT || 8000;
const DB = process.env.DATABASE.replace(
  '<DB_PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose
  .connect(DB, {
    dbName: 'roamly',
  })
  .then(() => console.log('DB connection successfull -_-'))
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    process.exit(1); // fail fast, don't zombie
  });

const server = app.listen(port, () => {
  console.log(`app is running in port ${port}...`);
});

// Unhandled rejection
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection: Shutting server down...');
  server.close(() => {
    process.exit(1);
  });
});
