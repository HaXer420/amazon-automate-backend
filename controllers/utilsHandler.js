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
      Client.find(),
      Product.find({ status: { $ne: 'Rejected' } }),
      Product.find({
        $and: [{ isApproved: { $eq: true } }, { isAssigned: { $eq: false } }],
      }),
      Product.find({ isAssigned: { $eq: true } }),
      Product.find({ status: { $eq: 'Approved' } }),
      Product.find({ status: { $eq: 'Pending' } }),
      Manager.find({ role: { $eq: 'Sourcing' } }),
      Manager.find({ role: { $eq: 'Account' } }),
      Specialist.find(),
      Source.find(),
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
      totalclients: totalclients.length,
      totalproducts: totalproducts.length,
      approvedproducts: approvedproducts.length,
      unassignedproducts: unassignedproducts.length,
      assignedproducts: assignedproducts.length,
      pendingproducts: pendingproducts.length,
      sourcingmanagers: sourcingmanagers.length,
      accountmanagers: accountmanagers.length,
      specialists: specialists.length,
      sources: sources.length,
    });
  }
);
