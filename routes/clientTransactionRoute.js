const express = require('express');
const AdminauthController = require('../controllers/adminauthController');
const ManagersauthController = require('../controllers/managersauthController');
const TransactionController = require('../controllers/clientTransactionConrtoller');

const router = express.Router();

router
  .route('/create/:id')
  .post(
    ManagersauthController.protect,
    ManagersauthController.restrictTo('Account'),
    TransactionController.createTransaction
  );

module.exports = router;
