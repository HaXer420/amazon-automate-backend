const Product = require('../models/productsModel');
const factory = require('./factoryHandler');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const Specialist = require('../models/sourcespecialistModel');

exports.checkexistingproducts = catchAsync(async (req, res, next) => {
  const product = await Product.findOne({ asin: `${req.body.asin}` });
  if (!product) next();
  if (product.projectedprofitmargin > req.body.projectedprofitmargin) {
    res.status(200).json({
      status: 'Already Exist Better Product',
      better: 'no',
      desc: `Profit Margin of Existing Product is: ${product.projectedprofitmargin}, While your Product Profit Margin is ${product.projectedprofitmargin}`,
      existingproduct: product,
      yourproduct: req.body,
    });
  }
  if (product.projectedprofitmargin < req.body.projectedprofitmargin) {
    res.status(200).json({
      status: 'Your Product has better Profit Margin',
      better: 'yes',
      desc: `Profit Margin of Existing Product is: ${product.projectedprofitmargin}, While your Product Profit Margin is ${product.projectedprofitmargin}`,
      existingproduct: product,
      yourproduct: req.body,
    });
  }
  next();
});

exports.createProduct = catchAsync(async (req, res, next) => {
  // const specialist = await Specialist.findById(req.user.id);

  req.body.sourcemanager = req.user.sourcemanager;

  // if (tempasin) return next(new AppError('ASIN Already Exist!'));

  if (!req.body.specialist) req.body.specialist = req.user.id;

  const product = await Product.create(req.body);

  res.status(201).json({
    status: 'Success',
    message: 'ASIN Created',
    data: product,
  });
});

exports.updateexistingProductbyspecialist = catchAsync(
  async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (product.status === 'Rejected') {
      product.status = 'Pending';
    }

    product.productname = req.body.productname;
    product.sourcename = req.body.sourcename;
    product.sourceurl = req.body.sourceurl;
    product.purchasecost = req.body.purchasecost;
    product.fbafee = req.body.fbafee;
    product.inboundfee = req.body.inboundfee;
    product.warehousefee = req.body.warehousefee;
    product.projectedsaleprice = req.body.projectedsaleprice;
    product.totalcost = req.body.totalcost;
    product.projectedprofitmargin = req.body.projectedprofitmargin;
    product.specialist = req.user.id;
    product.sourcemanager = req.user.sourcemanager;
    product.feedbackmanager = undefined;
    product.updatedAt = Date.now();
    product.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Product Successfully Updated',
    });
  }
);

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
  // const products = await Product.find({
  //   $and: [{ isApproved: { $eq: false } }, { status: { $eq: `Pending` } }],
  // });

  const features = new APIFeatures(
    Product.find({
      $and: [
        { isApproved: { $eq: false } },
        { status: { $eq: `Pending` } },
        { sourcemanager: { $eq: req.user.id } },
      ],
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
  const acceptedproducts = await Product.find({ status: { $ne: `Rejected` } });

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

exports.unassignedandapproved = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Product.find({
      $and: [{ isApproved: { $eq: true } }, { isAssigned: { $eq: false } }],
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
    message: 'Approved and Unassigned Products.',
    size: products.length,
    data: products,
  });
});

// exports.deleteSource = factory.deleteOne(Source);

exports.totalpurchasecostforeachspecialist = catchAsync(
  async (req, res, next) => {
    if (!req.query.dateRange && !(req.query.startDate && req.query.endDate))
      return next(new AppError('Must Send Query!', 400));

    // console.log(req.query);

    const matchStage =
      req.query.dateRange === 'thisMonth'
        ? {
            $match: {
              $expr: {
                $and: [
                  { $gte: ['$createdAt', new Date(new Date().setDate(1))] },
                  { $lt: ['$createdAt', new Date()] },
                  { $eq: ['$status', 'Approved'] },
                ],
              },
            },
          }
        : req.query.dateRange === 'lastYear'
        ? {
            $match: {
              $expr: {
                $and: [
                  {
                    $gte: [
                      '$createdAt',
                      new Date(new Date().getFullYear() - 1, 0, 1),
                    ],
                  },
                  {
                    $lt: [
                      '$createdAt',
                      new Date(new Date().getFullYear(), 0, 1),
                    ],
                  },
                  { $eq: ['$status', 'Approved'] },
                ],
              },
            },
          }
        : req.query.dateRange === 'lastMonth'
        ? {
            $match: {
              $expr: {
                $and: [
                  {
                    $gte: [
                      '$createdAt',
                      new Date(new Date().setMonth(new Date().getMonth() - 1)),
                    ],
                  },
                  { $lt: ['$createdAt', new Date(new Date().setDate(1))] },
                  { $eq: ['$status', 'Approved'] },
                ],
              },
            },
          }
        : req.query.dateRange === 'thisWeek'
        ? {
            $match: {
              $expr: {
                $and: [
                  {
                    $gte: [
                      '$createdAt',
                      new Date(
                        new Date().setDate(
                          new Date().getDate() - new Date().getDay()
                        )
                      ),
                    ],
                  },
                  { $lt: ['$createdAt', new Date()] },
                  { $eq: ['$status', 'Approved'] },
                ],
              },
            },
          }
        : req.query.dateRange === 'thisYear'
        ? {
            $match: {
              $expr: {
                $and: [
                  {
                    $gte: [
                      '$createdAt',
                      new Date(new Date().getFullYear(), 0, 1),
                    ],
                  },
                  { $lt: ['$createdAt', new Date()] },
                  { $eq: ['$status', 'Approved'] },
                ],
              },
            },
          }
        : req.query.dateRange === 'all'
        ? {
            $match: {
              $expr: {
                $and: [{ $eq: ['$status', 'Approved'] }],
              },
            },
          }
        : req.query.startDate && req.query.endDate
        ? {
            $match: {
              $expr: {
                $and: [
                  { $gte: ['$createdAt', new Date(req.query.startDate)] },
                  { $lt: ['$createdAt', new Date(req.query.endDate)] },
                  { $eq: ['$status', 'Approved'] },
                ],
              },
            },
          }
        : {};

    const product = await Product.aggregate([
      matchStage,
      {
        $lookup: {
          from: 'specialists',
          localField: 'specialist',
          foreignField: '_id',
          as: 'specialist',
        },
      },
      {
        $unwind: '$specialist',
      },
      {
        $group: {
          _id: '$specialist._id',
          specialistName: { $first: '$specialist.name' },
          totalPurchaseCost: { $sum: '$purchasecost' },
          docCount: { $sum: 1 },
        },
      },
    ]);

    let totalpurchasecost = 0;
    product.forEach((element) => {
      totalpurchasecost += element.totalPurchaseCost;
    });

    res.status(200).json({
      status: 'Success',
      TotalPurchaseCost: totalpurchasecost,
      data: product,
    });
  }
);
