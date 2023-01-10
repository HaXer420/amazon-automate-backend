const express = require('express');
const utilsController = require('../controllers/utilsHandler');
const AdminauthController = require('../controllers/adminauthController');

const router = express.Router();

router.get(
  '/totals',
  AdminauthController.protect,
  utilsController.totalproductsclientsmanagersspecialists
);

module.exports = router;
