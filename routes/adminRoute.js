const express = require('express');
const AdminauthController = require('../controllers/adminauthController');
const AdminController = require('../controllers/adminController');

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

module.exports = router;
