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

router.get('/sales', ReportController.totalsales);
router.get('/profits', ReportController.totalprofit);

// router.get(
//   '/testing',
//   ManagersauthController.protect,
//   ManagersauthController.restrictTo('Account'),
//   ReportController.testing
// );

module.exports = router;
