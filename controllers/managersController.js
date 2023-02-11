const Manager = require('../models/managersModel');
const factory = require('./factoryHandler');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Client = require('../models/clientModel');
const Purchase = require('../models/purchaseModel');
const Report = require('../models/reportModel');

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

  const updatedUser = await Manager.findByIdAndUpdate(
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
  const doc = await Manager.findById(req.params.id).select(
    'name email passwordChangedAt photo role'
  );

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

exports.getAccountManagers = catchAsync(async (req, res, next) => {
  const accountmanager = await Manager.find({
    role: { $eq: 'Account' },
  }).select('name');

  res.status(200).json({
    status: 'Success',
    size: accountmanager.length,
    data: accountmanager,
  });
});

exports.getSourceManagers = catchAsync(async (req, res, next) => {
  const sourcemanager = await Manager.find({
    role: { $eq: 'Sourcing' },
  }).select('name');

  res.status(200).json({
    status: 'Success',
    size: sourcemanager.length,
    data: sourcemanager,
  });
});

exports.getAllManagers = factory.getAll(Manager);

////////////////////////Acount Manager Buisness API's

exports.allclients = catchAsync(async (req, res, next) => {
  const clients = await Client.find({ accountmanager: req.user.id });

  const clientdata = await Promise.all(
    clients.map(async (client) => {
      let totalsold = 0;
      let totalinv = 0;
      let sales = 0;
      let profit = 0;
      let profitMargin = 0;

      const reports = await Report.find({
        $and: [{ client: client.id }, { type: 'Order' }],
      });

      const reportfilter = reports.map(async (object) => {
        sales = sales + object.total * 1;

        const avgUnitCost = await Purchase.aggregate([
          {
            $match: { sku: object.sku },
          },
          {
            $group: {
              _id: null,
              avgUnitCost: { $avg: '$unitCost' },
            },
          },
        ]);
        totalcost = avgUnitCost[0].avgUnitCost * 1 * object.quantity * 1;
        let objprofit = object.total * 1 - totalcost * 1;
        profit = profit + objprofit;

        profitMargin = (profit / sales) * 100;
        // console.log(profit);
      });

      const purchases = await Purchase.find({ client: client.id });

      const purchasedata = purchases.map(async (purchase) => {
        totalinv = totalinv + purchase.remainingqty * 1;
        totalsold = totalsold + purchase.soldqty * 1;
      });
      // console.log(totalinv, totalsold, sales, profit);
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
    data: clientdata,
  });
});

// exports.allclients = catchAsync(async (req, res, next) => {
//   const clients = await Client.find({ accountmanager: req.user.id });

//   const clientdata = [];
//   for (const client of clients) {
//     let totalsold = 0;
//     let totalinv = 0;
//     let sales = 0;
//     let profit = 0;

//     const purchases = await Purchase.find({ client: client.id });
//     const purchasedata = [];
//     for (const purchase of purchases) {
//       totalinv += purchase.remainingqty * 1;
//       totalsold += purchase.soldqty * 1;

//       const reports = await Report.find({
//         $and: [{ client: client.id }, { type: 'Order' }],
//       });

//       console.log(reports.length);
//       const reportfilter = [];
//       for (const object of reports) {
//         sales += object.total * 1;

//         const avgUnitCost = await Purchase.aggregate([
//           {
//             $match: { sku: object.sku },
//           },
//           {
//             $group: {
//               _id: null,
//               avgUnitCost: { $avg: '$unitCost' },
//             },
//           },
//         ]);

//         let totalcost = 0;
//         if (avgUnitCost.length) {
//           totalcost = avgUnitCost[0].avgUnitCost * 1 * object.quantity * 1;
//         }

//         let objprofit = object.total * 1 - totalcost * 1;
//         profit += objprofit;
//       }
//     }

//     clientdata.push({
//       totalsold,
//       totalinv,
//       sales,
//       profit,
//     });
//   }

//   res.status(200).json({
//     status: 'Success',
//     data: clientdata,
//   });
// });
