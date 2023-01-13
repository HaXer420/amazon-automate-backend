const Specialist = require('../models/sourcespecialistModel');
const factory = require('./factoryHandler');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Manager = require('../models/managersModel');

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

  const updatedUser = await Specialist.findByIdAndUpdate(
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
  const doc = await Specialist.findById(req.params.id)
    .select('name email passwordChangedAt photo role sourcemanager')
    .populate({
      path: 'products',
      match: {
        $and: [{ isApproved: { $eq: true } }, { status: { $eq: `Approved` } }],
      },
      select: '-feedbackmanager -client',
    });

  // const doc = await Model.findById(req.params.id).populate('reviews');

  if (!doc) {
    // return res.status(404).json('id not found');
    return next(new AppError('No doc found with such id'));
  }

  res.status(200).json({
    status: 'success',
    productssize: doc.products.length,
    data: doc,
  });
});

exports.assignspecialisttosourcemanager = catchAsync(async (req, res, next) => {
  const specialist = await Specialist.findById(req.params.id);

  if (!specialist) return next(new AppError('Specialist not found', 400));

  const manager = await Manager.findById(req.body.sourcemanager);

  if (!manager) return next(new AppError('Manager not found', 400));

  specialist.sourcemanager = req.body.sourcemanager;
  specialist.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: `Specialist Successfully Assigned to Manager ${manager.name}`,
    data: specialist,
  });
});

exports.getassignedspecialists = catchAsync(async (req, res, next) => {
  const specialists = await Specialist.find({
    sourcemanager: { $eq: req.user.id },
  });

  res.status(200).json({
    status: 'success',
    message: `Specialists ${specialists.length}`,
    data: specialists,
  });
});

exports.getAllSpecialists = factory.getAll(Specialist);
