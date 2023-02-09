const express = require('express');
const ManagersauthController = require('../controllers/managersauthController');
const ChatController = require('../controllers/chatController');
const ClientauthController = require('../controllers/clientauthController');

const router = express.Router();

router
  .route('/create')
  .post(ClientauthController.protect, ChatController.createChat);

router
  .route('/create/:id')
  .post(
    ManagersauthController.protect,
    ManagersauthController.restrictTo('Account'),
    ChatController.createChat
  );

router
  .route('/getchatclient')
  .get(ClientauthController.protect, ChatController.getChats);

router
  .route('/getchataccount')
  .get(
    ManagersauthController.protect,
    ManagersauthController.restrictTo('Account'),
    ChatController.getChats
  );

router
  .route('/addmessageaccmanager/:id')
  .post(
    ManagersauthController.protect,
    ManagersauthController.restrictTo('Account'),
    ChatController.addMessage
  );

router
  .route('/addmessageclient/:id')
  .post(ClientauthController.protect, ChatController.addMessage);

router.get(
  '/clientchatbyid/:id',
  ClientauthController.protect,
  ChatController.clientSeen,
  ChatController.getChatbyId
);
router.get(
  '/accmanagerchatbyid/:id',
  ManagersauthController.protect,
  ManagersauthController.restrictTo('Account'),
  ChatController.AccManagerSeen,
  ChatController.getChatbyId
);

// router.get(
//   '/clientseen/:id',
//   ClientauthController.protect,
//   ChatController.clientSeen
// );

// router.get(
//   '/managerseen/:id',
//   ManagersauthController.protect,
//   ManagersauthController.restrictTo('Account'),
//   ChatController.AccManagerSeen
// );

module.exports = router;
