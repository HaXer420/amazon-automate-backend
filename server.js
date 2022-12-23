const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION.... Shutting Down.....');
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const db = process.env.DATABASE;

mongoose.set('strictQuery', false);
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Server connected with DB Successfully'))
  .catch(() => {
    console.log('Connection Failed');
  });

const port = process.env.PORT || 4000;

console.log(`Server running in ${process.env.NODE_ENV} Mode`);

const server = app.listen(port, () => {
  console.log(`Server is listening on Port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION..... Shutting Down.....');
  server.close(() => {
    process.exit(1);
  });
});
