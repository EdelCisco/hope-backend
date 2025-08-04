// socket.js
const { Server } = require("socket.io");
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();



let io;
const connectedUsers = new Map();;
function Socket(server) {
   io = new Server(server, {
    cors: {
      origin:  ['http://localhost:5173','http://localhost:5174'], // à adapter selon tes besoins
      methods: ["GET", "POST"],
    },
  });







io.on('connection', (socket) => {
  console.log('User connected', socket.id);

  socket.on('register', (userId) => {
    connectedUsers.set(userId, socket.id);
    
  });


  socket.on('disconnect', () => {
    for (const [userId, id] of connectedUsers.entries()) {
      if (id === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
  });
});

return io;
}


function IO() {

  if(!io) { 
    console.log('erreur') }
  return io
}

module.exports = {Socket, IO, connectedUsers};
