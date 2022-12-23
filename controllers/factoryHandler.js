const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const User = require('../models/userModel');
const Donation = require('../models/donationModel');
const Item = require('../models/itemModel');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('Document not found with the given Id', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('document with your given id not found!', 400));
    }
    res.status(201).json({
      status: 'success',
      data: doc,
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // console.log(req.body);
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: doc,
    });
  });

exports.getOne = (Model, popOpt, popOpt2, popOpt3) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOpt) {
      query = query.populate(popOpt);
    }

    if (popOpt2) {
      query = query.populate(popOpt2);
    }

    if (popOpt3) {
      query = query.populate(popOpt3);
    }

    const doc = await query;
    // const doc = await Model.findById(req.params.id).populate('reviews');

    if (!doc) {
      // return res.status(404).json('id not found');
      return next(new AppError('No doc found with such id'));
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res) => {
    let filter = {};
    if (req.params.itemid) filter = { item: req.params.itemid };
    if (req.params.postid) filter = { post: req.params.postid };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sorting()
      .field()
      .paging();

    // const doc = await features.query.explain();
    const doc = await features.query;

    res.status(200).json({
      datenow: req.requestBody,
      status: 'success',
      result: doc.length,
      data: doc,
    });
  });

exports.Aggregations = catchAsync(async (req, res, next) => {
  const needyusers = await User.aggregate([
    {
      $match: { role: 'needy' },
    },
  ]);

  const donatorusers = await User.aggregate([
    {
      $match: { role: 'donator' },
    },
  ]);

  const totalitem = await Item.aggregate([
    {
      $match: { available: true },
    },
  ]);

  const donation = await Donation.find().select('-__v -createdAt -user -_id');

  let totaldonation = 0;
  donation.forEach((element) => {
    totaldonation += element.amount;
  });
  // console.log(totaldonation);

  // let totaldonate = {};
  // totaldonation.map((item) => {
  //   totaldonate = +item.amount;
  // });

  // let newObj = {};
  // Object.keys(totaldonation).forEach((el) => {
  //   newObj[el] += totaldonation[el];
  // });
  // console.log(newObj);

  // User.aggregate([
  //   // {
  //   //   $match: {
  //   //     amount: {
  //   //       $gte: '1',
  //   //     },
  //   //   },
  //   // },
  //   // { $group: { _id: '$amount', count: { $sum: 1 } } },
  //   // {
  //   //   $unwind: '$amount',
  //   // },
  //   // {
  //   //   $group: {
  //   //     _id: '$amount',
  //   //     amount: { $push: '$amount' },
  //   //   },
  //   // },
  //   // {
  //   //   $project: {
  //   //     total: '$totaldonations',
  //   //   },
  //   // },
  // ]);

  res.status(200).json({
    message: 'Success',
    Needy: needyusers.length,
    Donators: donatorusers.length,
    DonatedItems: totalitem.length,
    Donation: totaldonation,
  });
});
