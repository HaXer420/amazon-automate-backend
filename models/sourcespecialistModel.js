const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Manager = require('./managersModel');

const specialistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      minlength: [3, 'must have greater or equal to 3 length'],
      maxlength: [50, 'must have less or equal to 50 length'],
      required: [true, 'Must have a name'],
    },
    email: {
      type: String,
      required: [true, 'Must have a email'],
      unique: [true, 'Email must not be used before'],
      lowercase: true,
      validate: [validator.isEmail, 'Enter valid email'],
    },
    password: {
      type: String,
      required: [true, 'Must have a password'],
      minlength: [8, 'must have >8 length'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Must have a confirm password'],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not same',
      },
    },
    passwordChangedAt: {
      type: Date,
    },
    sourcemanager: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Manager',
        required: [true, 'Specialist must belong to Manager'],
      },
    ],
    photo: {
      type: String,
      default:
        'https://res.cloudinary.com/x-haxer/image/upload/v1662200068/defaultimage_yosliq.png',
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    role: {
      type: String,
      enum: ['Specialist'],
      default: 'Specialist',
    },
    passResetToken: String,
    passTokenExpire: Date,
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

specialistSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'sourcemanager',
    select: 'name',
  });
  next();
});

specialistSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});

specialistSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

specialistSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

specialistSchema.methods.correctPassword = async function (
  candPassword,
  userPassword
) {
  return await bcrypt.compare(candPassword, userPassword);
};

specialistSchema.methods.changedPasswordAfter = function (JWTTimesstamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(changedTimeStamp, JWTTimesstamp)
    return JWTTimesstamp < changedTimeStamp;
  }
};

specialistSchema.methods.passwordResetToken = function () {
  const ResetToken = crypto.randomBytes(32).toString('hex');

  this.passResetToken = crypto
    .createHash('sha256')
    .update(ResetToken)
    .digest('hex');

  // console.log({ ResetToken }, this.passResetToken);

  this.passTokenExpire = Date.now() + 10 * 60 * 1000;

  return ResetToken;
};

const Specialist = mongoose.model('Specialist', specialistSchema);

module.exports = Specialist;
