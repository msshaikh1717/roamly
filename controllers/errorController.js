const AppError = require('./../utils/appError');
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};
const sendErrorProd = (err, res) => {
  // trusted
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // hide sensitive details
  } else {
    // 1. log error
    console.error(`ERROR 💥`, err);

    //2. show generic error msg
    res.status(err.statusCode).json({
      status: 'error',
      message: 'something went wrong',
    });
  }
};
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 404);
};
function handleDuplicateFieldsDB(err) {
  const value = Object.values(err.keyValue)[0];

  const message = `Duplicate Name: "${value}", Please use another name`;
  return new AppError(message, 400);
}
function handleValidatorError(err) {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;

  return new AppError(message, 400);
}
const handleJsonWebTokenError = () =>
  new AppError('Invalid token, Plz login again', 401);

const handleTokenExpiredError = () =>
  new AppError('Your token has expired, plz login again', 401);

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.name === 'ValidationError') error = handleValidatorError(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJsonWebTokenError();
    if (err.name === 'TokenExpiredError') error = handleTokenExpiredError();

    sendErrorProd(error, res);
  }
};
