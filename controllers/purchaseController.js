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

  const temppurorder = await Purchase.find({ sku: { $eq: product.sku } });
  // if (temppurorder)
  //   return next(
  //     new AppError(
  //       `Purchase/Inventory order for SKU: ${product.sku} Already Exists!`,
  //       404
  //     )
  //   );

  req.body.unitCost = req.body.unitCost + req.body.warehouseCost;

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
    warehouseCost: req.body.warehouseCost,
    totalCost: totalcost,
    sku: product.sku,
    supplier: req.body.supplier,
    inboundqty: req.body.quantity,
    accountmanager: req.user.id,
    client: req.params.cid,
    product: req.params.pid,
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

exports.inboundinventoryforaccmanager = catchAsync(async (req, res, next) => {
  const inventory = await Purchase.find({
    $and: [
      {
        $or: [{ status: { $eq: 'Inbound' } }, { inboundqty: { $ne: 0 } }],
      },
      { accountmanager: { $eq: req.user.id } },
    ],
  });

  res.status(200).json({
    status: 'Success',
    size: inventory.length,
    inventory,
  });
});

exports.receivedinventoryforaccmanager = catchAsync(async (req, res, next) => {
  const inventory = await Purchase.find({
    $and: [
      {
        receivedqty: { $ne: 0 },
      },
      { accountmanager: { $eq: req.user.id } },
    ],
  });

  res.status(200).json({
    status: 'Success',
    size: inventory.length,
    inventory,
  });
});

exports.updateInventory = catchAsync(async (req, res, next) => {
  const purchase = await Purchase.findById(req.params.id);

  const transaciton = await Transaction.findById(purchase.transaction);

  const product = await Product.findById(purchase.product);

  const client = await Client.findById(purchase.client);

  if (req.body.unitcost) {
    req.body.unitcost = undefined;
  }

  if (!req.body.receivedqty && req.body.canceledqty && req.body.unitcost)
    req.body.unitcost = undefined;

  if ((purchase.quantity || purchase.inboundqty) < req.body.receivedqty)
    return next(
      new AppError(
        `Received Qty: ${req.body.receivedqty} must be less than or equal to Current inbound Qty: ${purchase.inboundqty}`,
        400
      )
    );

  if (req.body.receivedqty || req.body.canceledqty) {
    if (
      req.body.canceledqty > purchase.inboundqty ||
      req.body.canceledqty + req.body.receivedqty > purchase.inboundqty ||
      req.body.receivedqty > purchase.inboundqty
    ) {
      return next(
        new AppError(
          `Cancel or Received Qty cannot be greater then Inbound Qty: ${purchase.inboundqty}`,
          400
        )
      );
    }
    if (req.body.canceledqty === purchase.quantity) {
      return next(
        new AppError(
          `You cannot cancel entire Purchase order Qty use Delete Button Instead`,
          400
        )
      );
    }
  }

  const unitcost = req.body.unitcost ? req.body.unitcost : purchase.unitCost;
  let newtotalcost = req.body.unitcost
    ? purchase.quantity * req.body.unitcost
    : purchase.totalCost;

  const receivedquantity = req.body.receivedqty
    ? req.body.receivedqty * 1 + purchase.receivedqty
    : purchase.receivedqty;
  let currentinboundqty = req.body.receivedqty
    ? purchase.inboundqty - req.body.receivedqty * 1
    : purchase.inboundqty;

  if (req.body.canceledqty) {
    currentinboundqty = currentinboundqty - req.body.canceledqty * 1;
    newtotalcost = newtotalcost - req.body.canceledqty * unitcost;
  }

  const desc = `For Product ${product.productname} and SKU ${product.sku},${
    req.body.receivedqty ? `, Quantity Received ${req.body.receivedqty}` : ''
  }   and ${
    req.body.unitcost
      ? `New Unit Cost ${req.body.unitcost}`
      : `Unit Cost ${unitcost} `
  } ${
    req.body.canceledqty ? `, Cancel Quantity ${req.body.canceledqty}` : ''
  } From Supplier ${
    purchase.supplier
  }, Remaining Inbound Qty : ${currentinboundqty}`;

  const newbalance = req.body.canceledqty
    ? client.balance + req.body.canceledqty * unitcost
    : client.balance;

  const transac = {
    amount: req.body.canceledqty ? req.body.canceledqty * unitcost : null,
    description: desc,
    remainingbalance: newbalance,
    status:
      currentinboundqty === 0
        ? 'Purchased'
        : req.body.canceledqty && !req.body.receivedqty
        ? 'Refund'
        : req.body.canceledqty && req.body.receivedqty
        ? 'Adjustment'
        : 'Pending',
    updatedAt: Date.now(),
  };

  const updatepurchase = {
    unitCost: unitcost,
    totalCost: newtotalcost,
    quantity: req.body.canceledqty
      ? purchase.quantity - req.body.canceledqty
      : purchase.quantity,
    inboundqty: currentinboundqty,
    receivedqty: receivedquantity,
    remainingqty: req.body.receivedqty
      ? purchase.remainingqty + req.body.receivedqty * 1
      : purchase.remainingqty,
    canceledqty: req.body.canceledqty
      ? purchase.canceledqty + req.body.canceledqty
      : purchase.canceledqty,
    status: currentinboundqty === 0 ? 'Received' : 'Inbound',
    updateAt: Date.now(),
  };

  client.balance = newbalance;

  await Promise.all([
    Transaction.findByIdAndUpdate(transaciton.id, transac),
    Purchase.findByIdAndUpdate(purchase.id, updatepurchase),
    client.save({ validateBeforeSave: false }),
  ]);

  // console.log(
  //   `desc:  ${JSON.stringify(desc)} \n transac: ${JSON.stringify(
  //     transac
  //   )} \n updatepurchase: ${JSON.stringify(updatepurchase)}`
  // );

  res.status(200).json({
    status: 'Success',
    desc,
    transac,
    updatepurchase,
  });
});

exports.updateUnitCost = catchAsync(async (req, res, next) => {
  const order = await Purchase.findById(req.params.id);
  const client = await Client.findById(order.client);
  const product = await Product.findById(order.product);
  const trans = await Transaction.findById(order.transaction);

  if (order.totalCost === req.body.unitcost) {
    return next(new AppError(`Cannot enter same unit cost`, 400));
  }

  if (order.receivedqty > 0) {
    return next(
      new AppError(
        `Once a product is received Unit Cost cannot be changed, Current Received Qty: ${order.receivedqty}`,
        400
      )
    );
  }

  let unitcost = req.body.unitcost * 1;

  const totalcost = order.quantity * unitcost;

  const newdeduction =
    totalcost > order.totalCost
      ? totalcost - order.totalCost
      : order.totalCost - totalcost;

  const newbalance =
    totalcost > order.totalCost
      ? client.balance - newdeduction
      : client.balance + newdeduction;

  const desc = `For Order of Product ${product.productname} ${
    totalcost > order.totalCost
      ? `Deduction of ${newdeduction} made.`
      : `Refund of ${newdeduction} made.`
  }`;

  const transac = {
    amount: newdeduction,
    description: desc,
    remainingbalance: newbalance,
    status: 'Adjustment',
    updatedAt: Date.now(),
  };

  const updatepurchase = {
    unitCost: unitcost,
    totalCost: totalcost,
    updateAt: Date.now(),
  };

  client.balance = newbalance;

  await Promise.all([
    Transaction.findByIdAndUpdate(trans.id, transac),
    Purchase.findByIdAndUpdate(order.id, updatepurchase),
    client.save({ validateBeforeSave: false }),
  ]);

  res.status(200).json({
    status: 'Success',
    message: desc,
  });
});

exports.deletePurchaseOrder = catchAsync(async (req, res, next) => {
  const purchase = await Purchase.findById(req.params.id);
  const client = await Client.findById(purchase.client);
  const product = await Product.findById(purchase.product);

  if (!purchase) {
    return next(new AppError(`Order not found`, 400));
  }

  const trans = await Transaction.findById(purchase.transaction);

  if (purchase.receivedqty > 0) {
    return next(
      new AppError(
        `Order can only be deleted if no Product is received yet, Current Received Products: ${purchase.receivedqty}`,
        400
      )
    );
  }

  const desc = `For Product ${product.name} Purchase order of ${purchase.quantity} products got deleted and Amount ${purchase.totalCost} refunded.`;

  client.balance = client.balance + purchase.totalCost;

  const transac = {
    amount: purchase.totalCost,
    description: desc,
    remainingbalance: client.balance,
    status: 'Refund',
    updatedAt: Date.now(),
  };

  await Promise.all([
    Purchase.findByIdAndDelete(req.params.id),
    Transaction.findByIdAndUpdate(transaciton.id, transac),
    client.save({ validateBeforeSave: false }),
  ]);

  res.status(200).json({
    status: 'Success',
    message: desc,
  });
});
