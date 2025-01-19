import express from 'express';
const app = express();
import {
    Server
} from 'http';
const server = Server(app);
import {
    Server as SocketIOServer
} from "socket.io";
const io = new SocketIOServer(server);
import {
    ExpressPeerServer
} from 'peer';
import {
    v4 as uuidv4
} from 'uuid';

const users = {}; // Object to store users per room

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
    res.render('room', {
        roomID: req.params.room
    });
});

io.on('connection', socket => {
    let roomId, userId, userName;

    socket.on('create-room', (_roomId, _userId, _userName) => { // Correct event name
        try {
            roomId = _roomId;
            userId = _userId;
            userName = _userName;


            socket.join(roomId);

            if (!users[roomId]) {
                users[roomId] = {};
            }

            users[roomId][userId] = userName;
            socket.to(roomId).emit('user-connected', userId);
            io.to(roomId).emit('update-participant-list', Object.values(users[roomId]));
            //io.to(roomId).emit('update-participant-list', Object.values(users[roomId]));

        } catch (createRoomError) {
            console.error('Error creating room:', createRoomError);

        }

    });



    // Handle joining a room
    socket.on('join-room', (_roomId, _userId, _userName) => {
        roomId = _roomId;
        userId = _userId;
        userName = _userName;

        if (!users[roomId]) {
            users[roomId] = [];
        }

        const userExists = users[roomId].some(user => user.userId === userId);
        if (!userExists) {
            users[roomId].push({
                userId,
                userName
            });
        }

        socket.join(roomId);

        // Notify others in the room about the new user
        socket.to(roomId).emit('user-connected', userId, userName);

        // Send the list of existing users to the new user
        const existingUsers = users[roomId].filter(user => user.userId !== userId);
        socket.emit('existing-users', existingUsers);

        if (!users[roomId][userId]) {
            users[roomId][userId] = userName;
            // socket.to(roomId).emit('user-connected', userId);
            socket.to(roomId).emit('user-connected', userId, userName);

            // io.to(roomId).emit('update-participant-list', Object.values(users[roomId]));
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



    });

    // Handle screen sharing start
    socket.on('screen-share-started', (roomId, userId, screenSharingId) => {
        try {
            console.log(`User ${userId} started screen sharing in room ${roomId} with Peer ID ${screenSharingId}`);
            socket.to(roomId).emit('screen-share-received', userId, screenSharingId);
        } catch (error) {
            console.error(`Error starting screen sharing in room ${roomId}:`, error);
        }
    });

    // Handle screen sharing stop
    socket.on('screen-share-stopped', (roomId, userId) => {
        try {
            console.log(`User ${userId} stopped screen sharing in room ${roomId}`);
            socket.to(roomId).emit('user-screen-share-stopped', userId);
        } catch (error) {
            console.error(`Error stopping screen sharing in room ${roomId}:`, error);
        }
    });

    // Handle chat messages
    socket.on('message', (message, userName) => {
        try {
            const timestampUTC = new Date().toISOString();
            io.to(roomId).emit('createMessage', {
                message,
                timestampUTC,
                userId,
                userName
            });
            console.log(`[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${userName}: ${message}`);
        } catch (error) {
            console.error(`Error sending message in room ${roomId}:`, error);
        }
    });


    // Handle user disconnect
    socket.on('disconnect', () => {
        if (users[roomId]) {
            users[roomId] = users[roomId].filter(user => user.userId !== userId);
            socket.to(roomId).emit('user-disconnected', userId);
        }
    });

    // Handle general errors
    socket.on('error', err => {
        console.error('Socket.IO error:', err);
    });
});


peerServer.on('error', errPeer => { //Error Handling for Peer Server Errors
    console.error('PeerJS Server error:', errPeer);

});


server.listen(process.env.PORT || 3030, () => { //Error Handling for the server listening
    console.log(`Server is running on port ${process.env.PORT || 3030 || 8080}`);
});