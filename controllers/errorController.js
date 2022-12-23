const AppError = require('../utils/appError');

const handleCastError = (err) => {
  const message = `inavlid ${err.path} route`;

  return new AppError(message);
};

const handlesamenameError = (err) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
  const message = `inavlid ${value} you wrote already written name!`;

  return new AppError(message);
};

const handlesJWTErrorExpired = () =>
  new AppError('Your token is Expired please re-login!', 401);

const handlesDBError = (err) => {
  const errors = Object.values.apply(err.errors).map((el) => el.message);
  const message = `inavlid ${errors.join('. ')} `;

  return new AppError(message);
};

const errorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const handlesJWTError = () =>
  new AppError('Your token is invalid please re-login!', 401);

const errorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // console.log('ERROR is here guys', err);

    res.status(500).json({
      status: 'Failed',
      message: 'Some error occured',
    });
  }
};

module.exports = (err, req, res, next) => {
  //  console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'failed';

  if (process.env.NODE_ENV === 'development') {
    errorDev(err, res);
  }
  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (error.name === 'CastError') error = handleCastError(error);
    if (error.code === 11000) error = handlesamenameError(error);
    if (error.name === 'ValidationError') error = handlesDBError(error);
    if (error.name === 'JsonWebTokenError') error = handlesJWTError(error);
    if (error.name === 'TokenExpiredError')
      error = handlesJWTErrorExpired(error);

    errorProd(error, res);
  }
};
