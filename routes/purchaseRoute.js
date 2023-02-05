const express = require('express');
const PurchaseController = require('../controllers/purchaseController');
const AdminauthController = require('../controllers/adminauthController');
const ManagersauthController = require('../controllers/managersauthController');

const router = express.Router();

router.post(
  '/create/:cid/:pid',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Account'),
  PurchaseController.createPurchase
);

router.get(
  '/inbound',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Account'),
  PurchaseController.inboundinventoryforaccmanager
);

router.get(
  '/received',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Account'),
  PurchaseController.receivedinventoryforaccmanager
);

router.patch(
  '/updateinventory/:id',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Account'),
  PurchaseController.updateInventory
);

router.patch(
  '/updateunitcost/:id',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Account'),
  PurchaseController.updateUnitCost
);

router.delete(
  '/delete/:id',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Account'),
  PurchaseController.deletePurchaseOrder
);

// router.get('/all', SourceController.getallsources);

module.exports = router;
