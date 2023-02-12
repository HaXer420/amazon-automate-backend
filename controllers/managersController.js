const mongoose = require('mongoose');
const Manager = require('../models/managersModel');
const factory = require('./factoryHandler');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Client = require('../models/clientModel');
const Product = require('../models/productsModel');
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
            $match: {
              sku: object.sku,
              client: mongoose.Types.ObjectId(client.id),
            },
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

        // console.log(profit);
      });

      const purchases = await Purchase.find({ client: client.id });

      const purchasedata = purchases.map(async (purchase) => {
        totalinv = totalinv + purchase.remainingqty * 1;
        totalsold = totalsold + purchase.soldqty * 1;
      });

      const pipeline = [
        {
          $match: {
            type: { $ne: 'Order' },
            client: mongoose.Types.ObjectId(client.id),
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
      return {
        totalsold,
        totalinv,
        sales,
        profitval: profit,
        profit: profitMargin,
      };
    })
  );

  res.status(200).json({
    status: 'Success',
    data: clientdata,
  });
});

exports.allproductsofclient = catchAsync(async (req, res, next) => {
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
        ],
      });

      const reportfilter = reports.map(async (object) => {
        sales = sales + object.total * 1;

        const avgUnitCost = await Purchase.aggregate([
          {
            $match: {
              sku: object.sku,
              client: mongoose.Types.ObjectId(req.params.id),
            },
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

        // console.log(profit);
      });

      const purchases = await Purchase.find({
        $and: [{ client: req.params.id }, { product: product.id }],
      });

      const purchasedata = purchases.map(async (purchase) => {
        totalinv = totalinv + purchase.remainingqty * 1;
        totalsold = totalsold + purchase.soldqty * 1;
      });

      //// for - of other reports !Orders
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
        asin: product.asin,
        name: product.productname,
        product: product.id,
        totalsold,
        totalinv,
        sales,
        profitval: profit,
        profit: profitMargin,
      };
    })
  );

  const filterproductdata = await Promise.all(
    productdata.map(async (product) => {
      const id = product.product;
      let thirtydayssaleqty = 0;

      const reports = await Report.find({
        $and: [
          { client: req.params.id },
          { product: id },
          {
            date_time: {
              $gte: new Date(new Date().setDate(new Date().getDate() - 30)),
            },
          },
          { date_time: { $lt: new Date() } },
          { type: 'Order' },
        ],
      });

      const reportmap = reports.map((report) => {
        thirtydayssaleqty = thirtydayssaleqty + report.quantity;
      });

      const sevendayssale = await Report.aggregate([
        {
          $match: {
            product: mongoose.Types.ObjectId(id),
            date_time: {
              $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
              $lt: new Date(),
            },
            client: mongoose.Types.ObjectId(req.params.id),
            type: { $eq: 'Order' },
          },
        },
        {
          $group: {
            _id: null,
            current: { $sum: '$quantity' },
          },
        },
      ]);

      // console.log(sevendayssale);

      const currentInventory = await Purchase.aggregate([
        {
          $match: {
            product: mongoose.Types.ObjectId(id),
            client: mongoose.Types.ObjectId(req.params.id),
          },
        },
        {
          $group: {
            _id: null,
            current: { $sum: '$remainingqty' },
          },
        },
      ]);

      const sevendayssalevalue =
        sevendayssale[0]?.current === undefined ? 0 : sevendayssale[0]?.current;

      // console.log(sevendayssalevalue);

      return {
        asin: product.asin,
        name: product.name,
        thirtydayssalesqty: thirtydayssaleqty,
        product: id,
        status:
          sevendayssalevalue > product.totalinv
            ? 'Good Product'
            : 'Average Product',
        totalsold: product.totalsold,
        totalinv: product.totalinv,
        sales: product.sales,
        profitval: product.profitval,
        profit: product.profit,
      };
    })
  );

  res.status(200).json({
    status: 'Success',
    data: filterproductdata,
  });
});

///// for later

// exports.allproductsofclient = catchAsync(async (req, res, next) => {
//   const products = await Product.find({ client: req.params.id });

//   const productdata = await Promise.all(
//     products.map(async (product) => {
//       let totalsold = 0;
//       let totalinv = 0;
//       let sales = 0;
//       let profit = 0;
//       let profitMargin = 0;

//       const reports = await Report.find({
//         $and: [
//           { client: req.params.id },
//           { type: 'Order' },
//           { product: product.id },
//         ],
//       });

//       const reportfilter = reports.map(async (object) => {
//         sales = sales + object.total * 1;

//         const avgUnitCost = await Purchase.aggregate([
//           {
//             $match: {
//               sku: object.sku,
//               client: mongoose.Types.ObjectId(req.params.id),
//             },
//           },
//           {
//             $group: {
//               _id: null,
//               avgUnitCost: { $avg: '$unitCost' },
//             },
//           },
//         ]);
//         totalcost = avgUnitCost[0].avgUnitCost * 1 * object.quantity * 1;
//         let objprofit = object.total * 1 - totalcost * 1;
//         profit = profit + objprofit;

//         // console.log(profit);
//       });

//       const purchases = await Purchase.find({
//         $and: [{ client: req.params.id }, { product: product.id }],
//       });

//       const purchasedata = purchases.map(async (purchase) => {
//         totalinv = totalinv + purchase.remainingqty * 1;
//         totalsold = totalsold + purchase.soldqty * 1;
//       });

//       // const pipeline = [
//       //   {
//       //     $match: {
//       //       $expr: {
//       //         $and: [
//       //           { $ne: ['$type', 'Order'] },
//       //           { $eq: ['$client', mongoose.Types.ObjectId(client.id)] },
//       //         ],
//       //       },
//       //     },
//       //   },
//       //   {
//       //     $group: {
//       //       _id: null,
//       //       sumTotal: { $sum: '$total' },
//       //     },
//       //   },
//       // ];

//       // const result = await Report.aggregate(pipeline);
//       // // console.log(result[0].sumTotal);
//       // // console.log(result);
//       // result.length != 0 ? (profit = profit + result[0].sumTotal) : '';
//       // console.log(totalinv, totalsold, sales, profit);
//       profitMargin = (profit / sales) * 100;
//       return {
//         totalsold,
//         totalinv,
//         sales,
//         profit: profitMargin,
//       };
//     })
//   );

//   res.status(200).json({
//     status: 'Success',
//     data: productdata,
//   });
// });
