module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected: ', socket.id);

    socket.on('join-chat', (chatId) => {
      socket.join(chatId);
      console.log('User joined chat: ', chatId);
      // Mark the client as seen
      Chat.findByIdAndUpdate(chatId, { clientisSeen: true }, (err, chat) => {
        if (err) throw err;
        io.to(chatId).emit('client-seen', chat);
      });
    });

    socket.on('send-message', (data) => {
      io.to(data.chatId).emit('new-message', data);
      // Save message to database
      Chat.findById(data.chatId, (err, chat) => {
        if (err) throw err;
        chat.messages.push({
          name: data.name,
          message: data.message,
          createdAt: new Date(),
        });
        chat.save((err) => {
          if (err) throw err;
          // Mark the manager as seen
          if (data.name === 'Manager') {
            Chat.findByIdAndUpdate(
              chat._id,
              { managerisSeen: true },
              (err, updatedChat) => {
                if (err) throw err;
                io.to(data.chatId).emit('manager-seen', updatedChat);
              }
            );
          }
        });
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected: ', socket.id);
    });
  });
};
