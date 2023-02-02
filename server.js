const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION.... Shutting Down.....');
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

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

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://main.d445q1t59fkda.amplifyapp.com',
      'https://amazon-automation-services.vercel.app/',
    ],
    credentials: true,
  },
});

const server1 = server.listen(port, () => {
  console.log(`Server is listening on Port ${port}`);
});

// const io = require('socket.io')(server);

const socket = require('./utils/chatSocket');

socket(io);

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION..... Shutting Down.....');
  server1.close(() => {
    process.exit(1);
  });
});
