// // -----------------   Backend   ---------------

// // Import required modules
// import express from 'express';
// import { Server } from 'http';
// import { Server as SocketIOServer } from "socket.io";
// import { ExpressPeerServer } from 'peer';
// import { v4 as uuidv4 } from 'uuid';

// // Initialize Express app and HTTP server
// const app = express();
// const server = Server(app);

// // Initialize Socket.IO server
// const io = new SocketIOServer(server);

// // Initialize PeerJS server with debugging enabled
// const peerServer = ExpressPeerServer(server, {
//     debug: true
// });

// // Use PeerJS server at the '/peerjs' route
// app.use('/peerjs', peerServer);

// // Set the view engine to EJS and serve static files from the 'public' directory
// app.set('view engine', 'ejs');
// app.use(express.static('public'));

// // -----------------   Routes   -----------------

// // Route to generate a new UUID and redirect to it
// app.get('/', (req, res) => {
//     const generatedUUID = uuidv4();
//     console.log("Generated UUID:", generatedUUID);
//     res.redirect(`/${generatedUUID}`);
// });

// // Route to render the room view with the given room ID
// app.get('/:room', (req, res) => {
//     res.render('room', { roomID: req.params.room });
// });

// // -----------------   Socket.IO Logic   -----------------

// io.on("connection", socket => {
//     // Listen for 'join-room' event from the frontend
//     socket.on("join-room", (roomId, userId) => {
//         console.log(`User joined room: ${roomId}`);
        
//         // Add the user to the specified room
//         socket.join(roomId);

//         // Broadcast the 'user-connected' event to other users in the room
//         // socket.to(roomId).emit("user-connected", userId);
//         io.to(roomId).emit("user-connected", userId);


//         // Alternatively: socket.broadcast.to(roomId).emit("user-connected", userId);
//     });
// });

// // -----------------   Start Server   -----------------

// // Start the server on port 3030
// server.listen(3030, () => {
//     console.log("Server is running on http://localhost:3030");
// });



// // -----------------   Backend   ---------------
import express from 'express';
const app = express();
import { Server } from 'http';
const server = Server(app);
import { Server as SocketIOServer } from "socket.io";
const io = new SocketIOServer(server); // Replace require with import syntax
import { ExpressPeerServer } from 'peer';
const peerServer = ExpressPeerServer(server, {
    debug: true
})
import { v4 as uuidv4} from 'uuid';

app.use('/peerjs', peerServer);

app.set('view engine', 'ejs')
app.use(express.static('public'));



app.get('/', (req, res) => {
    const generatedUUID = uuidv4();
    console.log("Generated UUID:", generatedUUID);
    res.redirect(`/${generatedUUID}`);
  });


app.get('/:room', (req, res) =>{
    res.render('room', { roomID: req.params.room});
})

// let nextUsserId = 1;
// [Recive / Listen --> Accept (on)] the 'join-room'(Event)  from the Fronted "script.js"
io.on("connection", socket => {

    socket.on("join-room", (roomId, userId) => {
    
      console.log(`User: ${userId} joined room: ${roomId}`);
      
      // Ensure the user joins the room
      socket.join(roomId);

    // Broadcast to everyone else in the room (excluding the sender)
      socket.to(roomId).emit("user-connected", userId);
    // socket.broadcast.to(roomId).emit("user-connected", userId);

    socket.on('message', message => {
        io.to(roomId).emit("createMessage", (message))

        // For later to Make the numbers for each user.
        // io.to(roomId).emit("createMessage", (message, userId))

        console.log(`FrontEnd: User ${userId} and Room: ${roomId}  Message: `,message)
    })

    socket.on('disconnect', () => {
        socket.to(roomId).emit('user-disconnected', userId)
      })

    });


  });



  
server.listen(process.env.PORT||3030)
// server.listen(3030);