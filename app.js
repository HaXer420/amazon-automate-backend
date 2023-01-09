const cors = require('cors');
const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const factory = require('./controllers/factoryHandler');
const adminRouter = require('./routes/adminRoute');
const managerRouter = require('./routes/managersRoute');
const clientRouter = require('./routes/clientRoute');
const specialistRouter = require('./routes/sourcespecialistRoute');
const sourceRouter = require('./routes/sourceRoute');
const ProductRouter = require('./routes/productsRoute');

dotenv.config({ path: './config.env' });

const app = express();

// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
//   next();
// });

app.use(
  cors({
    credentials: true,
    origin: [
      'http://localhost:3000',
      'https://main.d445q1t59fkda.amplifyapp.com',
    ],
  })
);

app.options('*', cors());

app.use(logger('dev'));
app.use(express.json());

app.use((req, res, next) => {
  req.requestBody = new Date().toISOString();
  next();
});

app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());

app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/manager', managerRouter);
app.use('/api/v1/client', clientRouter);
app.use('/api/v1/specialist', specialistRouter);
app.use('/api/v1/source', sourceRouter);
app.use('/api/v1/product', ProductRouter);

app.get('/logout/:id', factory.globalLogout);

app.all('*', (req, res, next) => {
  next(new AppError(`Couldn't fint the ${req.originalUrl} url`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
