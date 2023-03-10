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

//////////////// buisness APIs Account Managers and Clients

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
        asin: product.asin,
        name: product.productname,
        product: product.id,
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

exports.topsalesproducts = catchAsync(async (req, res, next) => {
  const dataproducts = await Report.aggregate([
    {
      $match: {
        type: 'Order',
        date_time: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          $lt: new Date(),
        },
      },
    },
    {
      $group: {
        _id: '$product',
        total_quantity_sold: { $sum: '$quantity' },
        total_sales: { $sum: '$total' },
      },
    },
    {
      $sort: {
        total_quantity_sold: -1,
        total_sales: -1,
      },
    },
    {
      $limit: 5,
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product_info',
      },
    },
    {
      $project: {
        _id: 0,
        name: '$product_info.productname',
        total_quantity_sold: 1,
        total_sales: 1,
      },
    },
  ]);

  const dataacmanagers = await Report.aggregate([
    {
      $match: {
        type: 'Order',
        date_time: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          $lt: new Date(),
        },
      },
    },
    {
      $group: {
        _id: '$accountmanager',
        total_quantity_sold: { $sum: '$quantity' },
        total_sales: { $sum: '$total' },
      },
    },
    {
      $sort: {
        total_quantity_sold: -1,
        total_sales: -1,
      },
    },
    {
      $limit: 5,
    },
    {
      $lookup: {
        from: 'managers',
        localField: '_id',
        foreignField: '_id',
        as: 'account_info',
      },
    },
    {
      $project: {
        _id: 0,
        name: '$account_info.name',
        total_quantity_sold: 1,
        total_sales: 1,
      },
    },
  ]);

  const dataclients = await Report.aggregate([
    {
      $match: {
        type: 'Order',
        date_time: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          $lt: new Date(),
        },
      },
    },
    {
      $group: {
        _id: '$client',
        total_quantity_sold: { $sum: '$quantity' },
        total_sales: { $sum: '$total' },
      },
    },
    {
      $sort: {
        total_quantity_sold: -1,
        total_sales: -1,
      },
    },
    {
      $limit: 5,
    },
    {
      $lookup: {
        from: 'clients',
        localField: '_id',
        foreignField: '_id',
        as: 'client_info',
      },
    },
    {
      $project: {
        _id: 0,
        name: '$client_info.name',
        total_quantity_sold: 1,
        total_sales: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'Success',
    dataproducts,
    dataacmanagers,
    dataclients,
  });
});

exports.topprofitproducts = catchAsync(async (req, res, next) => {
  req.query.dateRange = 'lastThirtyDays';

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

  const products = await Product.find({ isApproved: true });

  const productdata = await Promise.all(
    products.map(async (product) => {
      let totalsold = 0;
      let totalinv = 0;
      let sales = 0;
      let profit = 0;
      let profitMargin = 0;

      const reports = await Report.find({
        $and: [
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
        // totalcost = avgUnitCost[0].avgUnitCost * 1 * object.quantity * 1;
        let objprofit = object.total * 1 - totalcost * 1;
        profit = profit + objprofit;

        // console.log(profit);
      });

      const purchases = await Purchase.find({
        $and: [
          { product: product.id },
          ...matchDateRangeSimple(query1, 'updateAt', query2),
        ],
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
            ...matchDateRangeAggregation(query1, 'updateAt', query2),
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

  function getTopFiveByProfitVal(data) {
    // Sort the array by profitval in descending order

    const filteredData = data.filter((obj) => obj.profitval !== 0);

    // Sort the remaining objects by profitval in descending order

    const sortedData = filteredData.sort((a, b) => b.profitval - a.profitval);

    // Return the top 5 objects
    return sortedData.slice(0, 5);
  }

  res.status(200).json({
    status: 'Success',
    data: getTopFiveByProfitVal(filterproductdata),
  });
});

exports.topprofitsacmanagersdata = catchAsync(async (req, res, next) => {
  req.query.dateRange = 'lastThirtyDays';

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
      };
    })
  );

  function getTopFiveByProfitVal(data) {
    // Sort the array by profitval in descending order

    const filteredData = data.filter((obj) => obj.mprofit !== 0);

    // Sort the remaining objects by profitval in descending order

    const sortedData = filteredData.sort((a, b) => b.mprofit - a.mprofit);

    // Return the top 5 objects
    return sortedData.slice(0, 5);
  }

  res.status(200).json({
    status: 'Success',
    data: getTopFiveByProfitVal(managerdata),
  });
});

exports.topprofitsallclients = catchAsync(async (req, res, next) => {
  req.query.dateRange = 'lastThirtyDays';

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

  const clients = await Client.find();

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
          ? (totalcost = avgUnitCost[0].avgUnitCost * 1 * object.quantity * 1)
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

  function getTopFiveByProfitVal(data) {
    // Sort the array by profitval in descending order

    const filteredData = data.filter((obj) => obj.profitval !== 0);

    // Sort the remaining objects by profitval in descending order

    const sortedData = filteredData.sort((a, b) => b.profitval - a.profitval);

    // Return the top 5 objects
    return sortedData.slice(0, 5);
  }

  res.status(200).json({
    status: 'Success',
    data: getTopFiveByProfitVal(clientdata),
  });
});

//////////////// buisness APIs Account Managers and Clients

exports.sourcemanagersdata = catchAsync(async (req, res, next) => {
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

  const managers = await Manager.find({ role: 'Sourcing' });

  const managerdata = await Promise.all(
    managers.map(async (manager) => {
      const specialists = await Specialist.find({ sourcemanager: manager._id });

      let mtotalsold = 0;
      let mtotalinv = 0;
      let masin = 0;
      let mpendingasins = 0;
      let msales = 0;
      let mprofit = 0;
      let mprofitMargin = 0;

      const specialistdata = await Promise.all(
        specialists.map(async (specialist) => {
          let totalsold = 0;
          let totalinv = 0;
          let sales = 0;
          let profit = 0;
          let profitMargin = 0;

          const asins = await Product.countDocuments({
            $and: [
              { specialist: specialist.id },
              { status: { $ne: 'Rejected' } },
            ],
          });

          const pendingasins = await Product.countDocuments({
            $and: [
              { specialist: specialist.id },
              { status: { $eq: 'Pending' } },
            ],
          });

          const reports = await Report.find({
            $and: [
              { specialist: specialist.id },
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
                  specialist: mongoose.Types.ObjectId(specialist.id),
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
              { specialist: specialist.id },
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
                specialist: mongoose.Types.ObjectId(specialist.id),
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
          mpendingasins = mpendingasins + pendingasins;
          msales = msales + sales;
          mprofit = mprofit + profit;
          mprofitMargin = mprofitMargin + profitMargin;

          return {
            id: specialist.id,
            name: specialist.name,
            asins,
            pendingasins,
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
        mpendingasins,
        mtotalsold,
        mtotalinv,
        msales,
        mprofit,
        mprofitMargin: mprofitMargin / specialistdata.length,
        specialists: specialistdata,
      };
    })
  );

  res.status(200).json({
    status: 'Success',
    data: managerdata,
  });
});

exports.allproductsofspecilist = catchAsync(async (req, res, next) => {
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

  const products = await Product.find({
    $and: [{ specialist: req.params.id }, { status: { $eq: 'Approved' } }],
  });

  const productdata = await Promise.all(
    products.map(async (product) => {
      let totalsold = 0;
      let totalinv = 0;
      let sales = 0;
      let profit = 0;
      let profitMargin = 0;

      const reports = await Report.find({
        $and: [
          { specialist: req.params.id },
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
              specialist: mongoose.Types.ObjectId(req.params.id),
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
          { specialist: req.params.id },
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
        asin: product.asin,
        name: product.productname,
        product: product.id,
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

exports.topprofitssourcingmanagersdata = catchAsync(async (req, res, next) => {
  req.query.dateRange = 'lastThirtyDays';

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

  const managers = await Manager.find({ role: 'Sourcing' });

  const managerdata = await Promise.all(
    managers.map(async (manager) => {
      const specialists = await Specialist.find({ sourcemanager: manager._id });

      let mtotalsold = 0;
      let mtotalinv = 0;
      let masin = 0;
      let msales = 0;
      let mprofit = 0;
      let mprofitMargin = 0;

      const specialistdata = await Promise.all(
        specialists.map(async (specialist) => {
          let totalsold = 0;
          let totalinv = 0;
          let sales = 0;
          let profit = 0;
          let profitMargin = 0;

          const asins = await Product.countDocuments({
            $and: [
              { specialist: specialist.id },
              { status: { $ne: 'Rejected' } },
            ],
          });

          // const pendingasins = await Product.countDocuments({
          //   $and: [
          //     { specialist: specialist.id },
          //     { status: { $eq: 'Pending' } },
          //   ],
          // });

          const reports = await Report.find({
            $and: [
              { specialist: specialist.id },
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
                  specialist: mongoose.Types.ObjectId(specialist.id),
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
              { specialist: specialist.id },
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
                specialist: mongoose.Types.ObjectId(specialist.id),
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
            id: specialist.id,
            name: specialist.name,
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
        mprofitMargin: mprofitMargin / specialistdata.length,
      };
    })
  );

  function getTopFiveByProfitVal(data) {
    // Sort the array by profitval in descending order

    const filteredData = data.filter((obj) => obj.mprofit !== 0);

    // Sort the remaining objects by profitval in descending order

    const sortedData = filteredData.sort((a, b) => b.mprofit - a.mprofit);

    // Return the top 5 objects
    return sortedData.slice(0, 5);
  }

  res.status(200).json({
    status: 'Success',
    data: getTopFiveByProfitVal(managerdata),
  });
});

exports.topprofitsallspecialists = catchAsync(async (req, res, next) => {
  req.query.dateRange = 'lastThirtyDays';

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

  const specialists = await Specialist.find();

  const specialistdata = await Promise.all(
    specialists.map(async (specialist) => {
      let totalsold = 0;
      let totalinv = 0;
      let sales = 0;
      let profit = 0;
      let profitMargin = 0;

      const asins = await Product.countDocuments({
        $and: [{ specialist: specialist.id }, { status: { $ne: 'Rejected' } }],
      });

      // const pendingasins = await Product.countDocuments({
      //   $and: [
      //     { specialist: specialist.id },
      //     { status: { $eq: 'Pending' } },
      //   ],
      // });

      const reports = await Report.find({
        $and: [
          { specialist: specialist.id },
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
              specialist: mongoose.Types.ObjectId(specialist.id),
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
          { specialist: specialist.id },
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
            specialist: mongoose.Types.ObjectId(specialist.id),
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
      return {
        id: specialist.id,
        name: specialist.name,
        asins,
        totalsold,
        totalinv,
        sales,
        profitval: profit,
        profit: profitMargin,
      };
    })
  );

  function getTopFiveByProfitVal(data) {
    // Sort the array by profitval in descending order

    const filteredData = data.filter((obj) => obj.profitval !== 0);

    // Sort the remaining objects by profitval in descending order

    const sortedData = filteredData.sort((a, b) => b.profitval - a.profitval);

    // Return the top 5 objects
    return sortedData.slice(0, 5);
  }

  res.status(200).json({
    status: 'Success',
    data: getTopFiveByProfitVal(specialistdata),
  });
});
