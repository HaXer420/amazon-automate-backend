const Product = require('../models/productsModel');
const factory = require('./factoryHandler');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.createProduct = catchAsync(async (req, res, next) => {
  const tempasin = await Product.findOne({ asin: `${req.body.asin}` });

  if (tempasin) return next(new AppError('ASIN Already Exists!'));

  if (!req.body.specialist) req.body.specialist = req.user.id;

  const product = await Product.create(req.body);

  res.status(201).json({
    status: 'Success',
    message: 'ASIN Created',
    data: product,
  });
});

exports.getallproducts = factory.getAll(Product);

exports.myproducts = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Product.find({ specialist: req.user.id }),
    req.query
  )
    .filter()
    .sorting()
    .field()
    .paging();

  // const doc = await features.query.explain();
  const product = await features.query;

  // const product = await Product.find({ specialist: req.user.id });

  res.status(200).json({
    status: 'Success',
    length: product.length,
    data: product,
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  req.body.updatedAt = Date.now();

  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(201).json({
    status: 'Success',
    message: 'ASIN Cpdated',
    data: product,
  });
});

exports.getOneProduct = factory.getOne(Product);

exports.pendingproducts = catchAsync(async (req, res, next) => {
  const products = await Product.find({
    $and: [{ isApproved: { $eq: false } }, { status: { $eq: `Pending` } }],
  });

  res.status(200).json({
    status: 'Success',
    length: products.length,
    data: products,
  });
});

exports.aprrovedorrejectedproducts = catchAsync(async (req, res, next) => {
  // const products = await Product.find({
  //   $or: [{ status: { $eq: `Approved` } }, { status: { $eq: `Rejected` } }],
  // });

  const features = new APIFeatures(
    Product.find({
      $or: [{ status: { $eq: `Approved` } }, { status: { $eq: `Rejected` } }],
    }),
    req.query
  )
    .filter()
    .sorting()
    .field()
    .paging();

  // const doc = await features.query.explain();
  const products = await features.query;

  res.status(200).json({
    status: 'Success',
    length: products.length,
    data: products,
  });
});

exports.approvedandpendingasinstotal = catchAsync(async (req, res, next) => {
  const acceptedproducts = await Product.find({
    $and: [{ isApproved: { $eq: true } }, { status: { $eq: `Approved` } }],
  });

  const pendingproducts = await Product.find({
    $and: [{ isApproved: { $eq: false } }, { status: { $eq: `Pending` } }],
  });

  res.status(200).json({
    status: 'Success',
    accepted: acceptedproducts.length,
    pending: pendingproducts.length,
  });
});

exports.feedbackbymanager = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) return next(new AppError('No ASIN Found!', 400));

  if (!req.body.message)
    return next(
      new AppError('You Must Enter feedback before Accept or Reject!', 400)
    );

  const feedback = {
    manager: req.user.id,
    message: req.body.message,
  };

  if (req.body.approve === true) {
    product.status = 'Approved';
  }

  if (req.body.approve === false) {
    product.status = 'Rejected';
  }

  product.feedbackmanager = feedback;
  product.updatedAt = Date.now();
  product.isApproved = req.body.approve;
  product.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'Success',
    message: 'Product Updated!',
  });
});

// exports.deleteSource = factory.deleteOne(Source);
