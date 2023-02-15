const mongoose = require('mongoose');
const Client = require('../models/clientModel');
const factory = require('./factoryHandler');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Manager = require('../models/managersModel');
const Product = require('../models/productsModel');
const Chat = require('../models/chatModel');
const Purchase = require('../models/purchaseModel');
const Report = require('../models/reportModel');
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
    .populate({ path: 'transactions', options: { sort: { updatedAt: -1 } } });

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

  const oldchat = await Chat.findOne({
    $and: [
      { client: req.params.id },
      { accountmanager: req.body.accountmanager },
    ],
  });

  turnoffold = await Chat.findOne({
    $and: [
      { client: req.params.id },
      { accountmanager: { $ne: req.body.accountmanager } },
      { isClosed: false },
    ],
  });

  if (turnoffold) {
    turnoffold.isClosed = true;
    await turnoffold.save();
  }

  if (oldchat) {
    oldchat.isClosed = false;
    await oldchat.save();
  }

  client.accountmanager = req.body.accountmanager;
  client.assignedAt = Date.now();
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
  product.assignedAt = Date.now();
  product.save();

  res.status(200).json({
    status: 'success',
    message: `Product ${product.productname} Successfully Assigned to Client ${client.name}`,
    data: Product,
  });
});

exports.deleteproductfromclient = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product || !product.client)
    return next(new AppError('Product Does not exist!', 400));
  if (product.isApproved === false || product.status === 'Rejected')
    return next(
      new AppError('Product is not approved yet or got Rejected', 400)
    );

  const client = await Client.findById(product.client);

  const purchase = await Purchase.find({
    $and: [
      { client: client.id },
      { accountmanager: req.user.id },
      { status: 'Inbound' },
      { inboundqty: { $gt: 0 } },
    ],
  });

  if (purchase.length > 0) {
    let amount = 0;

    const fitler = purchase.map(async (prod) => {
      const singleprod = await Purchase.findById(prod.id);

      singleprod.inboundqty = 0;
      singleprod.status = 'Received';

      amount = amount + singleprod.inboundqty * singleprod.unitCost;

      await singleprod.save();
    });

    client.balance = client.balance + amount;

    await client.save({ validateBeforeSave: false });

    const transac = {
      amount: amount,
      description: `Refund of amount: ${amount}. Reason: Product ${product.productname} has been removed from your account and its inbound quantity got refunded!`,
      remainingbalance: client.balance,
      status: 'Refund',
      accountmanager: req.user.id,
      client: client.id,
    };

    const trans = await Transaction.create(transac);
  }

  product.client = undefined;
  product.isAssigned = false;
  product.assignedAt = Date.now();
  product.save();

  res.status(200).json({
    status: 'success',
    message: `Product ${product.productname} Successfully Removed from Client ${client.name}`,
    data: product,
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

//////////// Client Buisness API's

exports.topsales = catchAsync(async (req, res, next) => {
  const data = await Report.aggregate([
    {
      $match: {
        type: 'Order',
        date_time: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 30)),
          $lt: new Date(),
        },
        client: mongoose.Types.ObjectId(req.user.id),
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

  res.status(200).json({
    status: 'Success',
    data,
  });
});

exports.currentunsoldinventory = catchAsync(async (req, res, next) => {
  const products = await Product.find({
    $and: [{ client: req.user.id }, { isAssigned: true }],
  });

  let unsoldinvvalue = 0;
  let unsoldinvvalueqty = 0;

  const productdata = await Promise.all(
    products.map(async (product) => {
      let unsoldtemp = 0;
      let unsoldtempqty = 0;

      const purchases = await Purchase.find({
        $and: [{ client: req.user.id }, { sku: product.sku }],
      });

      const purchasedata = purchases.map((purchase) => {
        unsoldtemp = unsoldtemp + purchase.remainingqty;
        unsoldtempqty = unsoldtempqty + purchase.remainingqty;
      });
      unsoldtemp = unsoldtemp * product.projectedsaleprice;
      unsoldinvvalueqty = unsoldinvvalueqty + unsoldtempqty;
      unsoldinvvalue = unsoldinvvalue + unsoldtemp;

      return {
        unsoldinvvalue,
        unsoldinvvalueqty,
      };
    })
  );

  res.status(200).json({
    status: 'Success',
    unsoldinvvalue,
    unsoldinvvalueqty,
  });
});

exports.clientinventorydata = catchAsync(async (req, res, next) => {
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

  const clients = await Client.find({ _id: req.user.id });

  const clientdata = await Promise.all(
    clients.map(async (client) => {
      let totalcost = 0;
      let totalsold = 0;
      let totalinv = 0;
      let sales = 0;
      let profit = 0;
      let profitMargin = 0;

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
            ...matchDateRangeSimple(query1, 'date_time', query2),
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
      totalcost = sales - profit;
      return {
        totalsold,
        totalinv,
        sales,
        totalcost: totalcost,
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

exports.clientsalesdata = catchAsync(async (req, res, next) => {
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

  const clients = await Client.find({ _id: req.user.id });

  const clientdata = await Promise.all(
    clients.map(async (client) => {
      let totalcost = 0;
      let totalsold = 0;
      let totalinv = 0;
      let sales = 0;
      let profit = 0;
      let mngmntshare = 0;
      let profitMargin = 0;

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
        // mngmntshare = mngmntshare +
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
      totalcost = sales - profit;
      return {
        totalsold,
        totalinv,
        sales,
        totalcost: totalcost,
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
