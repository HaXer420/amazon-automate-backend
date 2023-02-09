const Chat = require('../models/chatModel');
const factory = require('./factoryHandler');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.createChat = catchAsync(async (req, res, next) => {
  if (req.user.role === 'Client') {
    const chat = await Chat.find({
      $and: [
        { client: { $eq: `${req.user.id}` } },
        { accountmanager: { $eq: `${req.user.accountmanager}` } },
      ],
    });

    if (chat) return next(new AppError('Chat Already Exist!', 400));

    const messages = [
      {
        message: req.body.message,
        name: req.user.name,
      },
    ];

    req.body.client = req.user.id;
    req.body.accountmanager = req.user.accountmanager;
    req.body.messages = messages;
  }

  if (req.user.role === 'Account') {
    const chat = await Chat.find({
      $and: [
        { client: { $eq: `${req.params.id}` } },
        { accountmanager: { $eq: `${req.user.id}` } },
      ],
    });

    if (chat) return next(new AppError('Chat Already Exist!', 400));

    const messages = [
      {
        message: req.body.message,
        name: req.user.name,
      },
    ];

    req.body.client = req.params.id;
    req.body.accountmanager = req.user.id;
    req.body.messages = messages;
  }

  const chatcreate = await Chat.create(req.body);

  res.status(201).json({
    status: 'Success',
    message: 'Chat Created',
    data: chatcreate,
  });
});

exports.getChats = catchAsync(async (req, res, next) => {
  let chat = [];

  if (req.user.role === 'Client') {
    chat = await Chat.find({
      $and: [
        { client: { $eq: req.user.id } },
        { accountmanager: { $eq: req.user.accountmanager } },
      ],
    });
  }
  if (req.user.role === 'Account') {
    chat = await Chat.find({ accountmanager: { $eq: req.user.id } });
  }

  if (!chat) return next(new AppError('No chat found', 404));

  res.status(200).json({
    status: 'success',
    data: chat,
  });
});

exports.addMessage = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (req.user.role === 'Account') {
      chat.clientisSeen = false;
    }

    if (req.user.role === 'Client') {
      chat.managerisSeen = false;
    }

    const messagess = [
      {
        message: req.body.message,
        name: req.user.name,
      },
    ];

    const chat2 = await Chat.updateOne(
      { _id: req.params.id },
      { $push: { messages: messagess } }
    );
    await chat.save();
    const chat3 = await Chat.findById(req.params.id);

    // chat.messages = messagess;
    // await chat.save();
    res.json({ data: chat3 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.clientSeen = catchAsync(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);

  chat.clientisSeen = true;
  chat.save();

  next();
});

exports.AccManagerSeen = catchAsync(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);

  chat.managerisSeen = true;
  chat.save();

  next();
});

const getOne = (Model, popOpt, popOpt2, popOpt3) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOpt) {
      query = query.populate(popOpt);
    }

    const doc = await query;
    // const doc = await Model.findById(req.params.id).populate('reviews');

    if (!doc) {
      // return res.status(404).json('id not found');
      return next(new AppError('No doc found with such id'));
    }

    res.status(200).json({
      status: 'success',
      ManagerSeen: doc.managerisSeen,
      ClientSeen: doc.clientisSeen,
      data: doc.messages,
    });
  });

exports.getChatbyId = getOne(Chat);

// exports.getallsources = factory.getAll(Source);

// exports.deleteSource = factory.deleteOne(Source);
