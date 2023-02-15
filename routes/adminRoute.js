const express = require('express');
const AdminauthController = require('../controllers/adminauthController');
const AdminController = require('../controllers/adminController');
const ProductController = require('../controllers/productsController');

const router = express.Router();

router.route('/create').post(AdminauthController.signup);

router.post('/login', AdminauthController.login);

router.patch(
  '/updatepass',
  AdminauthController.protect,
  AdminauthController.updatePass
);

router.get(
  '/profile',
  AdminauthController.protect,
  AdminController.getMe,
  AdminController.getUser
);

router.patch(
  '/updateprofile',
  AdminauthController.protect,
  AdminController.updateMe
);

// managers pass reset

router.patch(
  '/resetmanagerpass/:id',
  AdminauthController.protect,
  AdminauthController.restrictTo('admin'),
  AdminController.resetPassManager
);

router.patch(
  '/resetspecialistpass/:id',
  AdminauthController.protect,
  AdminauthController.restrictTo('admin'),
  AdminController.resetPassSpecialist
);

router.patch(
  '/resetclientpass/:id',
  AdminauthController.protect,
  AdminauthController.restrictTo('admin'),
  AdminController.resetPassClient
);

/////////////////// Buisness Admin Routes

router.get(
  '/pendingasins',
  AdminauthController.protect,
  ProductController.adminpendingproducts
);

router.get(
  '/unassignedandapproved',
  AdminauthController.protect,
  ProductController.adminunassignedandapproved
);

router.get(
  '/pendingandunassignedcard',
  AdminauthController.protect,
  ProductController.pendingandunassignedcard
);

router.get(
  '/acmanagerdata',
  AdminauthController.protect,
  AdminController.acmanagersdata
);

router.get(
  '/clientsproductdata/:id',
  AdminauthController.protect,
  AdminController.allproductsofclient
);

router.get(
  '/top5products',
  AdminauthController.protect,
  AdminController.topsalesproducts
);

router.get(
  '/top5productsprofit',
  AdminauthController.protect,
  AdminController.topprofitproducts
);

router.get(
  '/top5managersprofit',
  AdminauthController.protect,
  AdminController.topprofitsacmanagersdata
);

router.get(
  '/top5clientsprofit',
  AdminauthController.protect,
  AdminController.topprofitsallclients
);

module.exports = router;
