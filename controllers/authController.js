const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const { promisify } = require('util');
const crypto = require('crypto');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
function createSendToken(user, statusCode, res) {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);
  // user.password=undefined
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
}
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async function (req, res, next) {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError('plz provide email and password!', 400));

  if (typeof email !== 'string' || typeof password !== 'string') {
    return next(new AppError('Invalid credentials', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async function (req, res, next) {
  // get token and check if exist
  let token = '';
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  )
    token = req.headers.authorization.split(' ')[1];
  if (!token)
    return next(new AppError('You are not logged in! Plz login', 401));
  // verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // check if user exist
  const currentUser = await User.findById(decoded.id);

  if (!currentUser)
    return next(
      new AppError('user belonging to the token does not exist', 401),
    );
  // user changed pass after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(new AppError('user recently changed pass! plz relogin', 401));

  // Grant access to protected route
  req.user = currentUser;
  next();
});
exports.restrictTo = (...roles) => {
  return function (req, res, next) {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You dont have permission to perform this action', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('No user found for this email', 404));

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `forgot your password? submit a PATH req with ur new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password then ignore this msg`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'your password reset token (valid for 10mins)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'there was an error sending email, plz try again later',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // get user
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //if token not expired then set new pass
  if (!user) return next(new AppError('Token is invalid or expired', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  createSendToken(user, 200, res);
  //
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //get user
  const user = await User.findById(req.user.id).select('+password');
  // check currentPassowrd
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError('No user found', 401));

  //if correct, updatePassword
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  createSendToken(user, 200, res);
});
