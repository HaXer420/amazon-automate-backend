const Product = require('../models/productsModel');
const factory = require('./factoryHandler');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Client = require('../models/clientModel');
const Transaction = require('../models/clientTransactionModel');
const Purchase = require('../models/purchaseModel');

exports.createPurchase = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.pid);
  if (!product) return next(new AppError('Product not found', 404));

  const client = await Client.findById(req.params.cid);
  if (!client) return next(new AppError('Client not found', 404));

  const totalcost = req.body.quantity * req.body.unitCost;

  if (client.balance < totalcost)
    return next(
      new AppError(
        `Client balance is less then Cost of Purchasing: ${totalcost}`,
        404
      )
    );

  const remainingbalance = client.balance - totalcost;

  const desc = `For Product ${product.productname} and SKU ${product.sku}, Quantity Purschased ${req.body.quantity} and Unit Cost ${req.body.unitCost} From Supplier ${req.body.supplier}.`;

  const transac = {
    amount: totalcost,
    description: desc,
    remainingbalance: remainingbalance,
    status: 'Pending',
    accountmanager: req.user.id,
    client: req.params.cid,
  };

  const trans = await Transaction.create(transac);

  const purchase = {
    description: desc,
    quantity: req.body.quantity,
    unitCost: req.body.unitCost,
    totalCost: totalcost,
    sku: product.sku,
    supplier: req.body.supplier,
    inboundqty: req.body.quantity,
    accountmanager: req.user.id,
    client: req.params.cid,
    product: req.body.pid,
    transaction: trans.id,
  };

  const purchaseOrder = await Purchase.create(purchase);

  client.balance = remainingbalance * 1;
  client.save({ validateBeforeSave: false });

  res.status(201).json({
    status: 'Success',
    message: `Purchase Order of ${product.sku} created with Unit Cost ${req.body.unitCost} and Quanitity: ${req.body.quantity} for Client ${client.name}`,
    order: purchaseOrder,
    transaction: trans,
  });
});

// exports.getallsources = factory.getAll(Source);

// exports.deleteSource = factory.deleteOne(Source);
