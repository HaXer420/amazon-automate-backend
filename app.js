const cors = require('cors');
const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const adminRouter = require('./routes/adminRoute');
const managerRouter = require('./routes/managersRoute');
const specialistRouter = require('./routes/sourcespecialistRoute');
const sourceRouter = require('./routes/sourceRoute');
const ProductRouter = require('./routes/productsRoute');

dotenv.config({ path: './config.env' });

const app = express();

// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   next();
// });

app.use(
  cors({
    credentials: true,
  })
);

// app.options('*', cors());

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
app.use('/api/v1/specialist', specialistRouter);
app.use('/api/v1/source', sourceRouter);
app.use('/api/v1/product', ProductRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Couldn't fint the ${req.originalUrl} url`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
