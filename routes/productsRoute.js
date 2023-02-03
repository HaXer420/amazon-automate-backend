const express = require('express');
const ProductController = require('../controllers/productsController');
const AdminauthController = require('../controllers/adminauthController');
const ManagersauthController = require('../controllers/managersauthController');
const SpecialistauthController = require('../controllers/sourcespecialistauthController');

const router = express.Router();

router.post(
  '/create',
  SpecialistauthController.protect,
  SpecialistauthController.restrictTo('Specialist'),
  ProductController.checkexistingproducts,
  ProductController.createProduct
);

// router.delete(
//   '/delete/:id',
//   AdminauthController.protect,
//   AdminauthController.restrictTo('admin'),
//   SourceController.deleteSource
// );

router.get('/all', ProductController.getallproducts);

router.get(
  '/myproducts',
  SpecialistauthController.protect,
  SpecialistauthController.restrictTo('Specialist'),
  ProductController.myproducts
);

router.patch(
  '/updateproduct/:id',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Sourcing'),
  ProductController.updateProduct
);

router.patch(
  '/overwriteproduct/:id',
  SpecialistauthController.protect,
  SpecialistauthController.restrictTo('Specialist'),
  ProductController.updateexistingProductbyspecialist
);

router.get(
  '/oneproduct/:id',
  ManagersauthController.protect,
  ProductController.getOneProduct
);

router.get(
  '/oneproductbyspecialist/:id',
  SpecialistauthController.protect,
  SpecialistauthController.restrictTo('Specialist'),
  ProductController.getOneProduct
);

router.get(
  '/pendingasins',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Sourcing'),
  ProductController.pendingproducts
);

router.get(
  '/approvedorrejectedasins',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Sourcing'),
  ProductController.aprrovedorrejectedproducts
);

router.get(
  '/totalpendingandacceptedasin',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Sourcing'),
  ProductController.totalapprovedandpendingasinstotal
);

router.patch(
  '/feedbackandapprovebysmanager/:id',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Sourcing'),
  ProductController.feedbackbymanager
);

router.get(
  '/approvedandunassigned',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Account'),
  ProductController.unassignedandapproved
);

router.get(
  '/assigned',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Account'),
  ProductController.assignedproducts
);

router.get(
  '/totalpurcasecostforeachspecialist',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Sourcing'),
  ProductController.totalpurchasecostforeachspecialist
);

module.exports = router;
