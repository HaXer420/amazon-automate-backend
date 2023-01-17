const Admin = require('../models/adminModel');
const Client = require('../models/clientModel');
const Transaction = require('../models/clientTransactionModel');
const Manager = require('../models/managersModel');
const Product = require('../models/productsModel');
const Source = require('../models/sourcesModel');
const Specialist = require('../models/sourcespecialistModel');
const factory = require('./factoryHandler');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.totalproductsclientsmanagersspecialists = catchAsync(
  async (req, res, next) => {
    const [
      totalclients,
      totalproducts,
      unassignedproducts,
      assignedproducts,
      approvedproducts,
      pendingproducts,
      sourcingmanagers,
      accountmanagers,
      specialists,
      sources,
    ] = await Promise.all([
      Client.countDocuments(),
      Product.countDocuments({ status: { $ne: 'Rejected' } }),
      Product.countDocuments({
        $and: [{ isApproved: { $eq: true } }, { isAssigned: { $eq: false } }],
      }),
      Product.countDocuments({ isAssigned: { $eq: true } }),
      Product.countDocuments({ status: { $eq: 'Approved' } }),
      Product.countDocuments({ status: { $eq: 'Pending' } }),
      Manager.countDocuments({ role: { $eq: 'Sourcing' } }),
      Manager.countDocuments({ role: { $eq: 'Account' } }),
      Specialist.countDocuments(),
      Source.countDocuments(),
    ]);

    // const totalclients = await Client.find();
    // const totalproducts = await Product.find({ status: { $ne: 'Rejected' } });
    // const unassignedproducts = await Product.find({
    //   $and: [{ isApproved: { $eq: true } }, { isAssigned: { $eq: false } }],
    // });
    // const assignedproducts = await Product.find({
    //   isAssigned: { $eq: true },
    // });
    // const approvedproducts = await Product.find({
    //   status: { $eq: 'Approved' },
    // });
    // const pendingproducts = await Product.find({ status: { $eq: 'Pending' } });
    // const sourcingmanagers = await Manager.find({ role: { $eq: 'Sourcing' } });
    // const accountmanagers = await Manager.find({ role: { $eq: 'Account' } });
    // const specialists = await Specialist.find();
    // const sources = await Source.find();

    res.status(200).json({
      totalclients: totalclients,
      totalproducts: totalproducts,
      approvedproducts: approvedproducts,
      unassignedproducts: unassignedproducts,
      assignedproducts: assignedproducts,
      pendingproducts: pendingproducts,
      sourcingmanagers: sourcingmanagers,
      accountmanagers: accountmanagers,
      specialists: specialists,
      sources: sources,
    });
  }
);
