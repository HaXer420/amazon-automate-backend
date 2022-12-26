const Source = require('../models/sourcesModel');
const factory = require('./factoryHandler');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createSource = catchAsync(async (req, res, next) => {
  const source = await Source.create({ name: req.body.name });

  res.status(201).json({
    status: 'Success',
    message: 'Source Created',
    data: source,
  });
});

exports.getallsources = factory.getAll(Source);

exports.deleteSource = factory.deleteOne(Source);
