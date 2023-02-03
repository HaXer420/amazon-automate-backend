const express = require('express');
const PurchaseController = require('../controllers/purchaseConroller');
const AdminauthController = require('../controllers/adminauthController');
const ManagersauthController = require('../controllers/managersauthController');

const router = express.Router();

router.post(
  '/create/:cid/:pid',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Account'),
  PurchaseController.createPurchase
);

// router.delete(
//   '/delete/:id',
//   AdminauthController.protect,
//   AdminauthController.restrictTo('admin'),
//   SourceController.deleteSource
// );

// router.get('/all', SourceController.getallsources);

module.exports = router;
