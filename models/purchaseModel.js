const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    description: {
      type: String,
    },
    quantity: Number,
    unitCost: Number,
    totalCost: Number,
    sku: String,
    supplier: String,
    receivedqty: Number,
    status: {
      type: String,
      enum: ['Inbound', 'Received'],
      default: 'Inbound',
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    updateAt: {
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
    transaction: {
      type: mongoose.Schema.ObjectId,
      ref: 'Transaction',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

purchaseSchema.pre(/^find/, function (next) {
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

const Purchase = mongoose.model('Purchase', purchaseSchema);

module.exports = Purchase;
