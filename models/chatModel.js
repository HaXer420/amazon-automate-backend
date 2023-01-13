const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.ObjectId,
      ref: 'Client',
    },
    accountmanager: {
      type: mongoose.Schema.ObjectId,
      ref: 'Manager',
    },
    clientisSeen: {
      type: Boolean,
      default: false,
    },
    managerisSeen: {
      type: Boolean,
      default: false,
    },
    messages: [
      {
        name: String,
        message: { type: String },
        createdAt: { type: Date, default: Date.now() },
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

chatSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'accountmanager',
    select: 'name',
  });
  this.populate({
    path: 'client',
    select: '-accountmanager name',
  });
  next();
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
