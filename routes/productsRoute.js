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

router.get(
  '/oneproduct/:id',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Sourcing'),
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
  ProductController.approvedandpendingasinstotal
);

module.exports = router;
