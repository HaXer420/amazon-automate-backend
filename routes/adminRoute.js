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

module.exports = router;
