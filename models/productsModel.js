const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
  {
    asin: {
      type: String,
      unique: [true, 'ASIN must be unique'],
      required: [true, 'must enter asin'],
    },
    productname: String,
    sourcename: String,
    sourceurl: String,
    purchasecost: Number,
    fbafee: Number,
    inboundfee: Number,
    warehousefee: Number,
    projectedsaleprice: Number,
    totalcost: Number,
    projectedprofitmargin: Number,
    isApproved: {
      type: Boolean,
      default: false,
    },
    isAssigned: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    feedbackmanager: {
      manager: {
        type: mongoose.Schema.ObjectId,
        ref: 'Manager',
      },
      message: String,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    specialist: {
      type: mongoose.Schema.ObjectId,
      ref: 'Specialist',
      required: [true, 'ASIN must belong to Specialist'],
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

productSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'specialist',
    select: '-sourcemanager name',
  });
  this.populate({
    path: 'feedbackmanager.manager',
    select: 'name',
  });
  this.populate({
    path: 'client',
    select: '-accountmanager name',
  });
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
