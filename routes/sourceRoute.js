const express = require('express');
const SourceController = require('../controllers/sourceController');
const AdminauthController = require('../controllers/adminauthController');
const ManagersauthController = require('../controllers/managersauthController');
const SpecialistauthController = require('../controllers/sourcespecialistauthController');

const router = express.Router();

router.post(
  '/create',
  AdminauthController.protect,
  AdminauthController.restrictTo('admin'),
  SourceController.createSource
);

router.delete(
  '/delete/:id',
  AdminauthController.protect,
  AdminauthController.restrictTo('admin'),
  SourceController.deleteSource
);

router.get('/all', SourceController.getallsources);

module.exports = router;
