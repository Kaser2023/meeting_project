# Plan Of Action

# Server.js --> Backend.
# Script.js --> Frontend.

# 14.Rajab 1446 || 14-Jan-2025: Tuesday
1-Initialize our NodeJS Project --> Done! Saat: 3:00 AM
2-Initialize our first view --> Done! Saat: 3:20 AM
3-Create a room id --> Done! Saat: 3:51 AM
4-Add the ability to view our own Video --> Done! Saat: 4:25 AM
5-Add ability to allow others to stream their video --> Done! Saat: 11:12 PM

# 15.Rajab 1446 || 15-Jan-2025: Wednesday
6-Add styling --> Done! Saat: 2:32 AM
7-Add the ability to create mesages --> Done! Saat: 3:01 AM

8-Add mute button
9-Add Stop Video button
10-Deploy it to the Heroku



<!-- ----- -->


Let's break down these improvements into actionable steps. We'll address them sequentially, starting with the most straightforward ones:

**1. Error Handling (Frontend and Backend)**

*   **Algorithm:**
    1.  Identify potential points of failure (e.g., getUserMedia, PeerJS connections, Socket.IO events).
    2.  Wrap those sections in `try...catch` blocks.
    3.  Provide user-friendly error messages in the `catch` block, either through alerts, console logs, or UI elements.
    4.  On the backend, handle potential errors during socket connection or peer server interactions.  Log errors and potentially send error messages back to the client.

*   **Example (Frontend - getUserMedia):**

```javascript
try {
    myVideoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    // ... rest of your code
} catch (error) {
    console.error("Error accessing media devices:", error);
    alert("Unable to access your camera and microphone. Please check your permissions.");
}

```

**2. Chat Enhancements (Frontend and Backend)**

*   **Algorithm (Timestamps):**
    1.  On the backend, when a message is received, add a timestamp.
    2.  Include the timestamp in the message object sent to the frontend.
    3.  Display the timestamp along with the message in the chat window.

*   **Example (Backend - Node.js):**

```javascript
socket.on('message', message => {
    const timestamp = new Date().toLocaleTimeString(); // Get current time
    io.to(roomId).emit("createMessage", { message: message, timestamp: timestamp, userId: userId });
});
```

*   **Algorithm (User Identification):**
    1.  When a user joins, store their chosen username/ID on the server.
    2.  Include this ID with each message sent.
    3.  Display the user ID/name with each message on the frontend.  (You'll already be passing the `userId` from the client, so just display it).

**3. User Interface Enhancements (Frontend)**

*   **Algorithm (Connection Status):**
    1.  Use Socket.IO events to communicate connection status changes (e.g., connecting, connected, disconnected).
    2.  Display this status in a designated UI element.

*   **Algorithm (Participant List):**
    1.  Maintain a list of connected users in each room on the server.
    2.  Broadcast this list to all clients in the room when a user joins or leaves.
    3.  Display the participant list in the UI.

**4. Security and Participants Functionality (Frontend and Backend)**

*   **Algorithm (Basic Security - Room Passwords):**
    1.  Add a password field when creating/joining a room.
    2.  Store and check passwords on the server.

*   **Algorithm (Participants - Mute/Remove):**
    1.  Add controls to the participant list to mute/remove users (moderator controls).
    2.  Implement corresponding logic on the backend and send signals to affected users.

**5. Screen Sharing (Frontend and Backend - More Complex)**

*   **Algorithm:**
    1.  Use `navigator.mediaDevices.getDisplayMedia()` on the frontend to capture the screen.
    2.  Create a new PeerJS connection specifically for screen sharing.
    3.  Handle screen sharing streams similar to video streams.

**6. Scalability (Backend - Significant Changes)**
    **Scalability: The current implementation might not scale well for a large number of participants in a single room due to the peer-to-peer nature. Consider using a Selective Forwarding Unit (SFU) or Multipoint Conferencing Unit (MCU) for larger-scale deployments.


*   **Algorithm (Using an SFU - Conceptual):**
    1.  Choose a suitable SFU (e.g., Mediasoup, Jitsi Videobridge).
    2.  Integrate the SFU into your backend.
    3.  Clients connect to the SFU, which handles forwarding streams.

I suggest focusing on the first four steps initially as they are less complex.  We can address screen sharing and scalability later as they involve more significant architectural changes. Please let me know if you want to dive deeper into any of these steps or want help implementing specific code examples.
