// // Server-side (server.js)

// // ... other code ...

// let userCount = 0; // Keep track of users in a room
// const roomUserCounts = {}; // Store user counts per room

// io.on("connection", socket => {
//     socket.on("join-room", (roomId, userId) => {
//         console.log(`User joined room: ${roomId}`);

//         if (!roomUserCounts[roomId]) {
//             roomUserCounts[roomId] = 0;
//         }

//         roomUserCounts[roomId]++;
//         const userNumber = roomUserCounts[roomId];
//         const assignedUserId = `user-${userNumber}`;  // Create user-1, user-2, etc.

//         socket.join(roomId);

//         // Store the assignedUserId on the socket object for later use
//         socket.data.assignedUserId = assignedUserId;


//         // Instead of broadcasting the raw userId, send the assignedUserId
//         socket.broadcast.to(roomId).emit("user-connected", assignedUserId);


//         // Tell the new user their assigned ID as well
//         socket.emit("assigned-user-id", assignedUserId);



//     });


//     // Handle disconnects to decrement user count
//     socket.on("disconnect", () => {
//         const roomId = Object.keys(socket.rooms).find(room => room !== socket.id); // Get the room ID
//         if(roomId && roomUserCounts[roomId]){
//             roomUserCounts[roomId]--;
//         }
//     });
// });

// // ... rest of server code ...




// // Client-side (script.js)
// let myAssignedUserId; // Variable to store the assigned user ID


// // ... other code ...


// peer.on('open', id => {
//     socket.emit('join-room', ROOM_ID, id);
// });



// socket.on('user-connected', (userId) => {  // Now receives assignedUserId
//     connectToNewUser(userId, myVideoStream);
// });

// socket.on('assigned-user-id', (assignedId) => {
//     myAssignedUserId = assignedId;
//     console.log("My assigned ID:", myAssignedUserId); // Log the assigned ID

//     // Now use myAssignedUserId when appropriate (e.g., displaying on the video)
//     const myVideoLabel = document.createElement('div');
//     myVideoLabel.textContent = myAssignedUserId;
//     myVideo.parentNode.insertBefore(myVideoLabel, myVideo.nextSibling);



// });



// // ... rest of client code ...

// const connectToNewUser = (userId, stream) => { // Now receives assignedUserId
//     console.log('New user connected:', userId);
//     const call = peer.call(userId, stream);  // Use assignedUserId for the call


//     const video = document.createElement('video');

//     // Add a label for the new user
//     const videoLabel = document.createElement('div');
//     videoLabel.textContent = userId;  // Display assignedUserId


//     call.on('stream', userVideoStream => {
//         addVideoStream(video, userVideoStream);

//         video.parentNode.insertBefore(videoLabel, video.nextSibling);  // Add underneath


//     });

// // Add video Label in add video Stream
// // ... (rest of the code)

// const addVideoStream = (video, stream) => {

//     // ... (Existing Code)

// }