const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'a user must have a name'],
    trim: true,
    minLength: [3, 'name should be >= 3 char'],
    maxLength: [40, 'name should be <= 40 char'],
  },
  email: {
    type: String,
    required: [true, 'a user must have an email'],
    unique: true,
    lowercase: true,
    trim: true,
    minLength: [3, 'name should be >= 3 char'],
    maxLength: [40, 'name should be <= 40 char'],
    validate: [validator.isEmail, 'plz provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'a user must have a password'],
    minLength: 3,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'plz confirm ur password'],
    minLength: [3, 'name should be >= 3 char'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// userSchema.pre('save', async function () {
//   if (!this.isModified('password')) return;
//   this.password = await bcrypt.hash(this.password, 12);
//   this.passwordConfirm = undefined;
// });

userSchema.pre('save', function () {
  if (!this.isModified('password') || this.isNew) return;
  this.passwordChangedAt = Date.now() - 1000;
});

userSchema.pre(/^find/, function () {
  this.find({ active: { $ne: false } });
});

userSchema.methods.correctPassword = async (candidatePassword, userPassword) =>
  await bcrypt.compare(candidatePassword, userPassword);

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.active;
    return ret;
  },
});

userSchema.methods.changedPasswordAfter = function (jwtTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000,
    );
    return changedTimeStamp > jwtTimeStamp;
  }
  return false; // false=not change
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
