const express = require('express');
const AdminauthController = require('../controllers/adminauthController');
const ManagersauthController = require('../controllers/managersauthController');
const ManagerController = require('../controllers/managersController');

const router = express.Router();

router
  .route('/create')
  .post(
    AdminauthController.protect,
    AdminauthController.restrictTo('admin'),
    ManagersauthController.signup
  );

router.post('/login', ManagersauthController.login);

router.patch(
  '/updatepass',
  ManagersauthController.protect,
  ManagersauthController.updatePass
);

router.get(
  '/profile',
  ManagersauthController.protect,
  ManagerController.getMe,
  ManagerController.getprofile
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
  ManagerController.getAllManagers
);

router.get(
  '/accountmanagers',
  AdminauthController.protect,
  ManagerController.getAccountManagers
);

router.get(
  '/sourcemanagers',
  AdminauthController.protect,
  ManagerController.getSourceManagers
);

/////////////// Account Manager Buisness Routes

router.get(
  '/clientsdata',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Account'),
  ManagerController.allclients
);

router.get(
  '/productsdataclient/:id',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Account'),
  ManagerController.allproductsofclient
);

/////////////// Sourcin Manager Buisness Routes

router.get(
  '/specialistsdata',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Sourcing'),
  ManagerController.allspecialists
);

router.get(
  '/productsdataspecialist/:id',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Sourcing'),
  ManagerController.allproductsofspecialist
);

module.exports = router;
