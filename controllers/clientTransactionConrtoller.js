const Transaction = require('../models/clientTransactionModel');
const Client = require('../models/clientModel');
const factory = require('./factoryHandler');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createTransaction = catchAsync(async (req, res, next) => {
  const client = await Client.findById(req.params.id);
  if (!client) return next(new AppError('Client not found', 400));

  //   console.log(client.accountmanager.id, req.user.id);
  if (client.accountmanager.id !== req.user.id)
    return next(
      new AppError(
        'Client is not yours. you can only make transaction of your clients!',
        400
      )
    );

  if (req.body.status === 'Deposit')
    req.body.remainingbalance = client.balance + req.body.amount;

  if (req.body.status === 'Withdraw')
    req.body.remainingbalance = client.balance - req.body.amount;

  const transac = {
    amount: req.body.amount,
    description: req.body.description,
    remainingbalance: req.body.remainingbalance,
    status: req.body.status,
    accountmanager: req.user.id,
    client: req.params.id,
  };

  const transaction = await Transaction.create(transac);

  client.balance = req.body.remainingbalance;
  client.save({ validateBeforeSave: false });

  res.status(201).json({
    status: 'Success',
    message: `${req.body.status} of amount ${req.body.amount} for Client ${client.name} has been successfully created new Balance is ${req.body.remainingbalance}`,
    data: transaction,
  });
});
