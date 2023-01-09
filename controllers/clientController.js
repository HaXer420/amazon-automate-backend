const Client = require('../models/clientModel');
const factory = require('./factoryHandler');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Manager = require('../models/managersModel');
const Product = require('../models/productsModel');

const currentObj = (obj, ...fieldsallowed) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (fieldsallowed.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password update please use update password route for that!',
        400
      )
    );
  }

  const filterObject = currentObj(req.body, 'name', 'email');

  if (req.file) filterObject.photo = req.file.filename;

  const updatedUser = await Client.findByIdAndUpdate(
    req.user.id,
    filterObject,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    data: updatedUser,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getprofile = catchAsync(async (req, res, next) => {
  const doc = await Client.findById(req.params.id)
    .select('name email passwordChangedAt photo role balance')
    .populate({ path: 'products', select: '-feedbackmanager -specialist' })
    .populate({ path: 'transactions' });

  // const doc = await Model.findById(req.params.id).populate('reviews');

  if (!doc) {
    // return res.status(404).json('id not found');
    return next(new AppError('No doc found with such id'));
  }

  res.status(200).json({
    status: 'success',
    productssize: doc.products.length,
    transactionssize: doc.transactions.length,
    data: doc,
  });
});

exports.assignclienttoaccmanager = catchAsync(async (req, res, next) => {
  const client = await Client.findById(req.params.id);

  if (!client) return next(new AppError('Client not found', 400));

  const manager = await Manager.findById(req.body.accountmanager);

  if (!manager) return next(new AppError('Manager not found', 400));

  client.accountmanager = req.body.accountmanager;
  client.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: `Client Successfully Assigned to Manager ${manager.name}`,
    data: client,
  });
});

exports.assignproducttoclient = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  const client = await Client.findById(req.body.client);

  if (!product || product.client)
    return next(
      new AppError('Product Does not exist or already Assigned to Client', 400)
    );
  if (product.isApproved === false || product.status === 'Rejected')
    return next(
      new AppError('Product is not approved yet or got Rejected', 400)
    );
  if (!client) return next(new AppError('Client not found', 400));

  product.client = req.body.client;
  product.isAssigned = true;
  product.save();

  res.status(200).json({
    status: 'success',
    message: `Product ${product.productname} Successfully Assigned to Client ${client.name}`,
    data: Product,
  });
});

exports.accgethisclients = catchAsync(async (req, res, next) => {
  const client = await Client.find({ accountmanager: { $eq: req.user.id } });

  if (!client) return next(new AppError('Clients not found', 400));

  res.status(200).json({
    status: 'Success',
    size: client.length,
    data: client,
  });
});

exports.getAllClients = factory.getAll(Client);
