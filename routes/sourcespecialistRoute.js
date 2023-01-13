const express = require('express');
const AdminauthController = require('../controllers/adminauthController');
const SpecialistController = require('../controllers/sourcespecialistController');
const ManagersauthController = require('../controllers/managersauthController');
const SpecialistauthController = require('../controllers/sourcespecialistauthController');

const router = express.Router();

router
  .route('/create')
  .post(
    ManagersauthController.protect,
    ManagersauthController.restrictTo('Sourcing'),
    SpecialistauthController.signup
  );

router.post('/login', SpecialistauthController.login);

router.patch(
  '/updatepass',
  SpecialistauthController.protect,
  SpecialistauthController.updatePass
);

router.get(
  '/profile',
  SpecialistauthController.protect,
  SpecialistController.getMe,
  SpecialistController.getprofile
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
  SpecialistController.getAllSpecialists
);

router.get(
  '/allbysourcemanager',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Sourcing'),
  SpecialistController.getassignedspecialists
);

router.patch(
  '/assignspecialisttosourcemanager/:id',
  AdminauthController.protect,
  SpecialistController.assignspecialisttosourcemanager
);

module.exports = router;
