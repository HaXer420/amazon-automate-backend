const express = require('express');
const AdminauthController = require('../controllers/adminauthController');
const ManagersauthController = require('../controllers/managersauthController');
const ClientsauthController = require('../controllers/clientauthController');
const ClientController = require('../controllers/clientController');

const router = express.Router();

router
  .route('/create')
  .post(
    AdminauthController.protect,
    AdminauthController.restrictTo('admin'),
    ClientsauthController.signup
  );

router.post('/login', ClientsauthController.login);

router.patch(
  '/updatepass',
  ClientsauthController.protect,
  ClientsauthController.updatePass
);

router.get(
  '/profile',
  ClientsauthController.protect,
  ClientController.getMe,
  ClientController.getprofile
);

// router.patch(
//   '/updateprofile',
//   AdminauthController.protect,
//   AdminController.updateMe
// );

router.get(
  '/all',
  AdminauthController.protect,
  AdminauthController.restrictTo('admin'),
  ClientController.getAllClients
);

router.get(
  '/allbyaccmanager',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Account'),
  ClientController.getAllClients
);

router.patch(
  '/assignclienttoaccmanager/:id',
  AdminauthController.protect,
  ClientController.assignclienttoaccmanager
);

router.patch(
  '/accmanagerassignproducttoclient/:id',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Account'),
  ClientController.assignproducttoclient
);

module.exports = router;
