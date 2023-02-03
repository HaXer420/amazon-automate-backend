const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const transactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Must Enter Amount'],
    },
    status: {
      type: String,
      enum: ['Deposit', 'Withdraw', 'Pending', 'Purchased', 'Refund'],
      required: [true, 'Must Enter Status'],
    },
    remainingbalance: Number,
    description: String,
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    accountmanager: {
      type: mongoose.Schema.ObjectId,
      ref: 'Manager',
    },
    client: {
      type: mongoose.Schema.ObjectId,
      ref: 'Client',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

transactionSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'accountmanager',
    select: 'name',
  });
  this.populate({
    path: 'client',
    select: '-accountmanager name',
  });
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
