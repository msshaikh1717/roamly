const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const mongoSanitize = require('@exortek/express-mongo-sanitize');
const hpp = require('hpp');

// const qs = require('qs');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const app = express();
app.set('query parser', 'extended');
// Set a custom query parser using qs
// app.set('query parser', (str) => qs.parse(str));

app.use(helmet());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  limit: 100,
  windowMs: 60 * 60 * 1000,
  message: 'too many requests from this IP, please try again in an hour',
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));

app.use(mongoSanitize());
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// fallback
app.all('/{*splat}', (req, res, next) => {
  next(new AppError(`cannot reach ${req.originalUrl} :(`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
