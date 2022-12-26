const Product = require('../models/productsModel');
const factory = require('./factoryHandler');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createProduct = catchAsync(async (req, res, next) => {
  const tempasin = await Product.findOne({ asin: `${req.body.asin}` });

  if (tempasin) return next(new AppError('ASIN Already Exists!'));

  if (!req.body.specialist) req.body.specialist = req.user.id;

  req.body.totalcost =
    req.body.purchasecost +
    req.body.fbafee +
    req.body.inboundfee +
    req.body.warehousefee;

  req.body.projectedprofitmargin =
    req.body.projectedsaleprice / req.body.totalcost;

  const product = await Product.create(req.body);

  res.status(201).json({
    status: 'Success',
    message: 'ASIN Created',
    data: product,
  });
});

exports.getallproducts = factory.getAll(Product);

exports.myproducts = catchAsync(async (req, res, next) => {
  const product = await Product.find({ specialist: req.user.id });

  res.status(200).json({
    status: 'Success',
    length: product.length,
    data: product,
  });
});

// exports.deleteSource = factory.deleteOne(Source);
