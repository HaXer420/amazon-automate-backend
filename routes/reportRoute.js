const express = require('express');
const ReportController = require('../controllers/reportController');
const AdminauthController = require('../controllers/adminauthController');
const ManagersauthController = require('../controllers/managersauthController');

const router = express.Router();

router.post(
  '/create/:id',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Account'),
  ReportController.createReport
);

module.exports = router;
