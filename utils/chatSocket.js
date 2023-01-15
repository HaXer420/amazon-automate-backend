const Chat = require('../models/chatModel');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected: ', socket.id);
    socket.on('joinChat', async ({ userId, chatId }) => {
      try {
        // Find the chat associated with the client and account manager
        console.log('User Joined Chat: ', userId);
        const chat = await Chat.findById(chatId);

        // console.log(`Client: ${chat.client} and usedId: ${userId}`);

        if (chat.client.id === userId) {
          chat.clientisSeen = true;
          // console.log('seen by client');
        }

        if (chat.accountmanager.id === userId) {
          chat.managerisSeen = true;
          // console.log('seen by manager');
        }

        chat.save();

        // Join the socket to the chat room
        socket.join(chat.id);
        // console.log(socket.rooms);

        // Send the chat history to the client
        socket.emit('chatHistory', chat.messages);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('sendMessage', async ({ userId, chatId, message }) => {
      try {
        let name;
        // Find the chat associated with the client and account manager
        const chat = await Chat.findById(chatId);

        if (chat.client.id === userId) {
          chat.managerisSeen = false;
          name = chat.client.name;
          // console.log('seen by client');
        }

        if (chat.accountmanager.id === userId) {
          chat.clientisSeen = false;
          name = chat.accountmanager.name;
          // console.log('seen by manager');
        }

        // Add the message to the chat's messages array
        chat.messages.push({
          name: name,
          message: message,
          createdAt: new Date(),
        });

        // Save the updated chat
        await chat.save();

        // console.log(socket.rooms);
        const messagelatest = {
          name: name,
          message: message,
          createdAt: new Date(),
        };
        // Send the message to all clients in the chat room
        socket.to(chat.id).emit('newMessage', messagelatest);
        // io.to(chat.id).emit('newMessage', messagelatest);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected: ', socket.id);
    });
  });

  //   io.on('connection', (socket) => {
  //     console.log('User connected: ', socket.id);

  //     socket.on('join-chat', (chatId) => {
  //       socket.join(chatId);
  //       console.log('User joined chat: ', chatId);
  //       // Mark the client as seen
  //       // Chat.findByIdAndUpdate(chatId, { clientisSeen: true }, (err, chat) => {
  //       //   if (err) throw err;
  //       io.to(chatId).emit('client-seen', chat);
  //       // }
  //       // );
  //     });

  //     socket.on('send-message', (data) => {
  //       io.to(data.chatId).emit('new-message', data);
  //       // Save message to database
  //       Chat.findById(data.chatId, (err, chat) => {
  //         if (err) throw err;
  //         chat.messages.push({
  //           name: data.name,
  //           message: data.message,
  //           createdAt: new Date(),
  //         });
  //         chat.save((err) => {
  //           if (err) throw err;
  //           // Mark the manager as seen
  //           if (data.name === 'Manager') {
  //             Chat.findByIdAndUpdate(
  //               chat._id,
  //               { managerisSeen: true },
  //               (err, updatedChat) => {
  //                 if (err) throw err;
  //                 io.to(data.chatId).emit('manager-seen', updatedChat);
  //               }
  //             );
  //           }
  //         });
  //       });
  //     });

  //     socket.on('disconnect', () => {
  //       console.log('User disconnected: ', socket.id);
  //     });
  //   });
};
