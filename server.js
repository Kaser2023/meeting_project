import express from 'express';
const app = express();
import { Server } from 'http';
const server = Server(app);
import { Server as SocketIOServer } from "socket.io";
const io = new SocketIOServer(server);
import { ExpressPeerServer } from 'peer';
import { v4 as uuidv4 } from 'uuid';

const users = {}; // Object to store users per room
const roomPasswords = {}; // Store room passwords
const rooms = {};           // roomId: { uuid, ownerId }



const peerServer = ExpressPeerServer(server, {
    debug: true
});


app.use('/peerjs', peerServer);
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    const generatedUUID = uuidv4();
    console.log("Generated UUID:", generatedUUID);
    res.redirect(`/${generatedUUID}`);
});

app.get('/:room', (req, res) => {
    res.render('room', { roomID: req.params.room });
});


io.on('connection', socket => {
  let roomId, userId, userName;



  socket.on('create-room', (_roomId, password, _userId, _userName) => {  // Correct event name
      try {
          roomId = _roomId;
          userId = _userId;
          userName = _userName;


          roomPasswords[roomId] = password;
          socket.join(roomId);

          if (!users[roomId]) {
              users[roomId] = {};
          }

          users[roomId][userId] = userName;
          socket.to(roomId).emit('user-connected', userId);
          io.to(roomId).emit('update-participant-list', Object.values(users[roomId]));



      } catch (createRoomError) {
          console.error('Error creating room:', createRoomError);

      }

  });




  socket.on('join-room', (_roomId, _userId, _userName, password) => {
      roomId = _roomId;
      userId = _userId;
      userName = _userName;




      try {

          // Check if the room has a password
          if (roomPasswords[roomId]) {
              if (password === roomPasswords[roomId]) { // Compare entered password
                  // Join the room
                  socket.join(roomId);

                  if (!users[roomId]) {
                      users[roomId] = {};
                  }
                  // Add the user to the room only if not already present
                  if (!users[roomId][userId]) {
                      users[roomId][userId] = userName;
                      socket.to(roomId).emit('user-connected', userId);
                      io.to(roomId).emit('update-participant-list', Object.values(users[roomId]));

                  }





                  socket.on('disconnect', () => {
                      try {
                          socket.to(roomId).emit('user-disconnected', userId);
                          delete users[roomId][userId];
                          io.to(roomId).emit('update-participant-list', Object.values(users[roomId]));

                      } catch (errorDisconnect) {
                          console.error('Error on disconnect:', errorDisconnect);
                      }
                  });

                  socket.on('message', (message, userName) => {
                      try {
                          const timestampUTC = new Date().toISOString();
                          io.to(roomId).emit('createMessage', { message: message, timestampUTC: timestampUTC, userId: userId, userName: userName });

                          console.log(`[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${userName}: ${message}`);

                      } catch (errorMsg) {
                          console.error(`Error sending message in room ${roomId}:`, errorMsg);
                      }
                  });

              } else {
                  // Incorrect password
                  socket.emit('wrong-password');
                  console.log(`Incorrect password attempt for room ${roomId}`);
              }
          } else {
              // Room does not have a password, allow joining
              socket.join(roomId);

              if (!users[roomId]) {
                  users[roomId] = {};
              }

              if (!users[roomId][userId]) {
                  users[roomId][userId] = userName;
                  socket.to(roomId).emit('user-connected', userId);
                  io.to(roomId).emit('update-participant-list', Object.values(users[roomId]));
              }

              //Set up disconnect and message handlers as before
              socket.on('disconnect', () => { // Handle disconnections
                  try {
                      socket.to(roomId).emit('user-disconnected', userId);
                      delete users[roomId][userId];
                      io.to(roomId).emit('update-participant-list', Object.values(users[roomId]));

                  } catch (errorDisconnect) {
                      console.error('Error on disconnect:', errorDisconnect);
                  }

              });

              socket.on('message', (message, userName) => {
                  try {
                      const timestampUTC = new Date().toISOString();
                      io.to(roomId).emit('createMessage', { message: message, timestampUTC: timestampUTC, userId: userId, userName: userName });
                      console.log(`[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${userName}: ${message}`);

                  } catch (errorMsg) {
                      console.error(`Error sending message in room ${roomId}:`, errorMsg);
                  }
              });


          }

      } catch (errJoin) {
          console.error('Error joining room:', errJoin);
      }

  });


  
  socket.on('screen-share-started', (roomId, userId, screenSharingId) => {  //Add the screen-share-started event handler.
    try {


        // Log the event
        console.log(`User ${userId} started screen sharing in room ${roomId} with Peer ID ${screenSharingId}`);

        // Tell everyone else in the room that user started sharing screen:
        socket.to(roomId).emit('screen-share-received', userId, screenSharingId);


    } catch (error) {
        console.error('Error starting screen sharing in room ${roomId}:', error);

    }


});

socket.on('screen-share-stopped', (roomId, userId) => { //Add the screen-share-stopped event handler.

    try {

        // Log the event.
        console.log(`User ${userId} stopped screen sharing in room ${roomId}`);

        // Tell everyone else in the room that user stopped sharing screen:
        socket.to(roomId).emit('user-screen-share-stopped', userId);

    } catch (error) {
        console.error('Error stopping screen sharing in room ${roomId}:', error);
    }




});



  socket.on('error', (errSocket) => {
      console.error('Socket.IO error:', errSocket);
  });

});

peerServer.on('error', errPeer => { //Error Handling for Peer Server Errors
    console.error('PeerJS Server error:', errPeer);

});





server.listen(process.env.PORT || 3030, () => { //Error Handling for the server listening
    console.log(`Server is running on port ${process.env.PORT || 3030}`);
});