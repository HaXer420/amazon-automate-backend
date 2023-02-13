const Admin = require('../models/adminModel');
const mongoose = require('mongoose');
const factory = require('./factoryHandler');
const catchAsync = require('../utils/catchAsync');
const Report = require('../models/reportModel');
const Product = require('../models/productsModel');
const Purchase = require('../models/purchaseModel');
const AppError = require('../utils/appError');
const Manager = require('../models/managersModel');
const Specialist = require('../models/sourcespecialistModel');
const Client = require('../models/clientModel');
const {
  matchDateRangeSimple,
  matchDateRangeAggregation,
} = require('../utils/datesFilter');

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

  const updatedUser = await Admin.findByIdAndUpdate(req.user.id, filterObject, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: updatedUser,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getUser = factory.getOne(Admin);

exports.resetPassManager = factory.resetPasswordGlobal(Manager);

exports.resetPassSpecialist = factory.resetPasswordGlobal(Specialist);

exports.resetPassClient = factory.resetPasswordGlobal(Client);

//////////////// buisness APIs

exports.acmanagersdata = catchAsync(async (req, res, next) => {
  if (!req.query.dateRange && !(req.query.startDate && req.query.endDate)) {
    req.query.dateRange = 'all';
  }

  let query1 = '';
  let query2 = '';

  if (req.query.startDate && req.query.endDate) {
    query1 = req.query.startDate;
    query2 = req.query.endDate;
  }

  if (req.query.dateRange) {
    query1 = req.query.dateRange;
  }

  // console.log(query1, query2);

  const managers = await Manager.find({ role: 'Account' });

  const managerdata = await Promise.all(
    managers.map(async (manager) => {
      const clients = await Client.find({ accountmanager: manager._id });

      let mtotalsold = 0;
      let mtotalinv = 0;
      let masin = 0;
      let msales = 0;
      let mprofit = 0;
      let mprofitMargin = 0;

      const clientdata = await Promise.all(
        clients.map(async (client) => {
          let totalsold = 0;
          let totalinv = 0;
          let sales = 0;
          let profit = 0;
          let profitMargin = 0;

          const asins = await Product.countDocuments({ client: client.id });

          const reports = await Report.find({
            $and: [
              { client: client.id },
              { type: 'Order' },
              ...matchDateRangeSimple(query1, 'date_time', query2),
            ],
          });

          const reportfilter = reports.map(async (object) => {
            sales = sales + object.total * 1;

            const avgUnitCost = await Purchase.aggregate([
              {
                $match: {
                  sku: object.sku,
                  client: mongoose.Types.ObjectId(client.id),
                  ...matchDateRangeAggregation(query1, 'updateAt', query2),
                },
              },
              {
                $group: {
                  _id: null,
                  avgUnitCost: { $avg: '$unitCost' },
                },
              },
            ]);
            avgUnitCost.length > 0
              ? (totalcost =
                  avgUnitCost[0].avgUnitCost * 1 * object.quantity * 1)
              : (totalcost = 0);
            let objprofit = object.total * 1 - totalcost * 1;
            profit = profit + objprofit;

            // console.log(profit);
          });

          const purchases = await Purchase.find({
            $and: [
              { client: client.id },
              ...matchDateRangeSimple(query1, 'updateAt', query2),
            ],
          });

          const purchasedata = purchases.map(async (purchase) => {
            totalinv = totalinv + purchase.remainingqty * 1;
            totalsold = totalsold + purchase.soldqty * 1;
          });

          const pipeline = [
            {
              $match: {
                type: { $ne: 'Order' },
                client: mongoose.Types.ObjectId(client.id),
                ...matchDateRangeAggregation(query1, 'date_time', query2),
              },
            },
            {
              $group: {
                _id: null,
                sumTotal: { $sum: '$total' },
              },
            },
          ];

          const result = await Report.aggregate(pipeline);
          // console.log(result[0].sumTotal);
          // console.log(result);
          result.length != 0 ? (profit = profit + result[0].sumTotal) : '';
          // console.log(totalinv, totalsold, sales, profit);
          profitMargin = (profit / sales) * 100;

          mtotalsold = mtotalsold + totalsold;
          mtotalinv = mtotalinv + totalinv;
          masin = masin + asins;
          msales = msales + sales;
          mprofit = mprofit + profit;
          mprofitMargin = mprofitMargin + profitMargin;

          return {
            id: client.id,
            name: client.name,
            asins,
            totalsold,
            totalinv,
            sales,
            profitval: profit,
            profit: profitMargin,
          };
        })
      );
      // mprofitMargin = mprofitMargin / clientdata.length;
      return {
        id: manager.id,
        name: manager.name,
        masin,
        mtotalsold,
        mtotalinv,
        msales,
        mprofit,
        mprofitMargin: mprofitMargin / clientdata.length,
        clients: clientdata,
      };
    })
  );

  res.status(200).json({
    status: 'Success',
    data: managerdata,
  });
});

/// for later

exports.allproductsofclient = catchAsync(async (req, res, next) => {
  if (!req.query.dateRange && !(req.query.startDate && req.query.endDate)) {
    req.query.dateRange = 'all';
  }

  let query1 = '';
  let query2 = '';

  if (req.query.startDate && req.query.endDate) {
    query1 = req.query.startDate;
    query2 = req.query.endDate;
  }

  if (req.query.dateRange) {
    query1 = req.query.dateRange;
  }

  const products = await Product.find({ client: req.params.id });

  const productdata = await Promise.all(
    products.map(async (product) => {
      let totalsold = 0;
      let totalinv = 0;
      let sales = 0;
      let profit = 0;
      let profitMargin = 0;

      const reports = await Report.find({
        $and: [
          { client: req.params.id },
          { type: 'Order' },
          { product: product.id },
          ...matchDateRangeSimple(query1, 'date_time', query2),
        ],
      });

      const reportfilter = reports.map(async (object) => {
        sales = sales + object.total * 1;

        const avgUnitCost = await Purchase.aggregate([
          {
            $match: {
              sku: object.sku,
              client: mongoose.Types.ObjectId(req.params.id),
              ...matchDateRangeAggregation(query1, 'updateAt', query2),
            },
          },
          {
            $group: {
              _id: null,
              avgUnitCost: { $avg: '$unitCost' },
            },
          },
        ]);
        avgUnitCost.length > 0
          ? (totalcost = avgUnitCost[0].avgUnitCost * 1 * object.quantity * 1)
          : (totalcost = 0);
        let objprofit = object.total * 1 - totalcost * 1;
        profit = profit + objprofit;

        // console.log(profit);
      });

      const purchases = await Purchase.find({
        $and: [
          { client: req.params.id },
          { product: product.id },
          ...matchDateRangeSimple(query1, 'updateAt', query2),
        ],
      });

      const purchasedata = purchases.map(async (purchase) => {
        totalinv = totalinv + purchase.remainingqty * 1;
        totalsold = totalsold + purchase.soldqty * 1;
      });

      // const pipeline = [
      //   {
      //     $match: {
      //       $expr: {
      //         $and: [
      //           { $ne: ['$type', 'Order'] },
      //           { $eq: ['$client', mongoose.Types.ObjectId(client.id)] },
      //         ],
      //       },
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: null,
      //       sumTotal: { $sum: '$total' },
      //     },
      //   },
      // ];

      // const result = await Report.aggregate(pipeline);
      // // console.log(result[0].sumTotal);
      // // console.log(result);
      // result.length != 0 ? (profit = profit + result[0].sumTotal) : '';
      // console.log(totalinv, totalsold, sales, profit);
      profitMargin = (profit / sales) * 100;
      return {
        totalsold,
        totalinv,
        sales,
        profit: profitMargin,
      };
    })
  );

  res.status(200).json({
    status: 'Success',
    data: productdata,
  });
});
