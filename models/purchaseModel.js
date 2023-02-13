const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    description: {
      type: String,
    },
    quantity: Number,
    unitCost: Number,
    warehouseCost: Number,
    totalCost: Number,
    sku: String,
    supplier: String,
    soldqty: {
      type: Number,
      default: 0,
    },
    remainingqty: {
      type: Number,
      default: 0,
    },
    inboundqty: Number,
    canceledqty: {
      type: Number,
      default: 0,
    },
    receivedqty: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Inbound', 'Received', 'Sold'],
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
    sourcemanager: {
      type: mongoose.Schema.ObjectId,
      ref: 'Manager',
    },
    specialist: {
      type: mongoose.Schema.ObjectId,
      ref: 'Specialist',
    },
    client: {
      type: mongoose.Schema.ObjectId,
      ref: 'Client',
    },
    transaction: {
      type: mongoose.Schema.ObjectId,
      ref: 'Transaction',
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
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
