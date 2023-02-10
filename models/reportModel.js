const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.ObjectId,
      ref: 'Client',
    },
    sourcemanager: {
      type: mongoose.Schema.ObjectId,
      ref: 'Manager',
    },
    accountmanager: {
      type: mongoose.Schema.ObjectId,
      ref: 'Manager',
    },
    specialist: {
      type: mongoose.Schema.ObjectId,
      ref: 'Specialist',
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
    },
    date_time: Date,
    settlement_id: Number,
    type: String,
    order_id: String,
    sku: String,
    description: String,
    quantity: Number,
    marketplace: String,
    account_type: String,
    fulfillment: String,
    order_city: String,
    order_state: String,
    order_postal: String,
    tax_collection_model: String,
    product_sales: Number,
    product_sales_tax: Number,
    shipping_credits: Number,
    shipping_credits_tax: Number,
    gift_wrap_credits: Number,
    giftwrap_credits_tax: Number,
    Regulatory_Fee: Number,
    Tax_On_Regulatory_Fee: Number,
    promotional_rebates: Number,
    promotional_rebates_tax: Number,
    marketplace_withheld_tax: Number,
    selling_fees: Number,
    fba_fees: Number,
    other_transaction_fees: Number,
    other: Number,
    total: Number,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reportSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'accountmanager',
    select: 'name',
  });
  this.populate({
    path: 'product',
    select: 'productname',
  });
  this.populate({
    path: 'specialist',
    select: '-sourcemanager name',
  });
  this.populate({
    path: 'sourcemanager',
    select: 'name',
  });
  this.populate({
    path: 'client',
    select: '-accountmanager name',
  });

  next();
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
