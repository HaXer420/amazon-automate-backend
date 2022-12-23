const express = require('express');
const AdminauthController = require('../controllers/adminauthController');

const router = express.Router();

router.route('/create').post(AdminauthController.signup);

router.get('/login', AdminauthController.login);

module.exports = router;
