module.exports = function(app) {
  if(typeof app.channel !== 'function') {
    // If no real-time functionality has been configured just return
    return;
  }

  app.on('connection', connection => {
    // On a new real-time connection, add it to the chat channel
    app.channel('chat').join(connection);
  });

  // eslint-disable-next-line no-unused-vars
  app.publish((data, hook) => {
    // Publish event to all connected users
    return app.channel('chat');
  });
};
