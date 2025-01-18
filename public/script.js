const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(undefined, {  // Renamed 'peer' to 'myPeer' for clarity
    path: '/peerjs',
    host: '/',
    port: '443'
});

let myVideoStream;
const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {};


let userId; // Declare userId here
let userName; // Declare userName outside getMediaStream


let screenSharing = false;  // Flag to track screen sharing status
let screenSharingStream;    // Variable to store the screen sharing stream
let screenSharingPeer;      // Separate Peer for screen sharing


// ---Error handling for getUserMedia---
async function getMediaStream() { // Make it an async function
    try {

      const storedUserName = localStorage.getItem(`userName-${ROOM_ID}`);

      if (storedUserName) {
          userName = storedUserName;
      } else {
          userName = prompt('Please enter your name'); // Ask only if not stored.
          if (userName) {
              localStorage.setItem(`userName-${ROOM_ID}`, userName); // Store in local storage
          }
          else {
            // Handle the case where the user cancels the prompt or enters an empty name
            userName = "Anonymous"; // Or any default name you prefer
          }
      }
      
        myVideoStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        // addVideoStream(myVideo, myVideoStream);
        addVideoStream(myVideo, myVideoStream, userName);


        myPeer.on('call', call => {
            call.answer(myVideoStream);
            const video = document.createElement('video');

            call.on('stream', userVideoStream => {
                // addVideoStream(video, userVideoStream);
                addVideoStream(video, userVideoStream, userName);

            });

            call.on('close', () => {
                video.remove();
            });

            call.on('error', err => {
                console.error("Error on call:", err);
                alert("An error occurred during the call: " + err.message);
            });
  

            peers[call.peer] = call; // Use call.peer for consistency
        });

        socket.on('user-connected', userId => {
            connectToNewUser(userId, myVideoStream);
        });


    } catch (error) {
        console.error("Error accessing media devices:", error);
        // Improved error message with device information if available
        let errorMessage = "Unable to access your camera and microphone.";
        if (error.name === "NotAllowedError") {
            errorMessage = "Please grant permission to access your camera and microphone.";
        } else if (error.name === "NotFoundError") {
            errorMessage = "No camera or microphone found. Please check your device settings.";
        } else if (error.message) {
            errorMessage += " | | " + error.message; // Add specific error message
        }
        alert(errorMessage); // Display a specific error message

    }
}

getMediaStream(); // Call the function to get media stream





async function shareScreen() {
    if (!screenSharing) {  // Start screen sharing

        try {
            screenSharingStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true // Include audio if needed
            });


            // Create new Peer connection for screen sharing
            screenSharingPeer = new Peer(undefined, { // Same config as the video call peer
                path: '/peerjs',
                host: '/',
                port: '443'
            });


            screenSharingPeer.on('open', screenSharingId => {  // Handle successful screen share PeerJS connection
                socket.emit('screen-share-started', ROOM_ID, userId, screenSharingId); // Signal screen share start
                // addVideoStream(myVideo, screenSharingStream, true);  // Add the stream to our video grid (true for screen share)
                addVideoStream(myVideo, screenSharingStream, userName, true);

            });

            screenSharingPeer.on('call', call => {  // Answer calls when someone else wants to receive the screen sharing stream
                call.answer(screenSharingStream);
            });


            //Listen for screen sharing stop events for other users:
            socket.on('user-screen-share-stopped', (stoppingUserId) => {
                if(stoppingUserId in peers){
                    peers[stoppingUserId].close(); // Close the connection if they stopped sharing.
                }

            });




            socket.on('screen-share-received', (sharingUserId, screenSharingId) => {
                connectToScreenSharingUser(sharingUserId, screenSharingId, myVideoStream);
            });


            // Function to make a call and receive screen sharing stream:
            const connectToScreenSharingUser = (sharingUserId, screenSharingId, stream) => {
                // Call the sharing user with your screenSharingPeer
                const call = screenSharingPeer.call(screenSharingId, stream);
                const video = document.createElement('video');
            
                call.on('stream', userVideoStream => {
                //   addVideoStream(video, userVideoStream);
                  addVideoStream(video, userVideoStream, userName);

                });
                call.on('close', () => {
                  video.remove();
                });
            
                peers[sharingUserId] = call; // Store the call
              };


            screenSharing = true; // Update the flag

        } catch (err) {
            console.error("Error getting screen share stream:", err);
            alert("Error sharing your screen. Please check your browser settings and permissions.");
        }
    } else {
        // Stop screen sharing

        socket.emit('screen-share-stopped', ROOM_ID, userId); // Signal screen share stop
        screenSharingStream.getTracks().forEach(track => track.stop()); // Stop tracks
        myVideo.remove(); // Remove video element
        screenSharingPeer.destroy(); // Close the screen sharing peer connection


        screenSharing = false; // Reset the flag
    }
}


myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id, userName); // Send userName to the server
});

myPeer.on('open', id => {
    userId = id;
    socket.emit('create-room', ROOM_ID, id, userName); // Emit create-room
    // socket.emit('join-room', ROOM_ID, id, userName); // Send userName to the server
  });






myPeer.on('error', error => {
console.error('PeerJS error:', error);
// Handle the error appropriately, e.g., display an error message, retry connection, etc.

console.log('A PeerJS error occurred. Please try refreshing the page or check your internet connection. Error Details: ' + error.message);

// alert('Please try refreshing the page or check your internet connection. Error Details: ' + error.message);


});


// Listen for connection errors
myPeer.on('connection', conn => {
console.log('New peer connected:', conn.peer); //Log when a new peer connects
conn.on('error', err => {
    console.error('Error on peer connection:', err);
    alert('An error occurred while connecting to a peer: ' + err.message);


});
});


// ... (rest of your script.js code - muteUnmute, playStop, scrollToBottom, etc.)
// ... Put your existing code here to ensure that those functions are still available.


const connectionStatus = document.getElementById('connection-status'); // Get the element

socket.on('connect', () => {
    console.log('Connected to Socket.IO server');
    connectionStatus.textContent = "Connected"; // Update status
    connectionStatus.style.backgroundColor = "green";
});



socket.on('connect_error', (error) => {
  console.error('Socket.IO connection error:', error);

  connectionStatus.textContent = "Connection error"; // Update status
  connectionStatus.style.backgroundColor = "red";
});


socket.on('disconnect', (reason) => {
  console.warn('Disconnected from Socket.IO server:', reason);
  if (reason === 'io server disconnect') {
      socket.connect();
  }

  connectionStatus.textContent = "Disconnected"; // Update status
  connectionStatus.style.backgroundColor = "red";
});



socket.on('user-connected', userId => {
  try { //Error Handling for Socket.io User Connection Event
      connectToNewUser(userId, myVideoStream);
  } catch (error) {
      console.error("Error connecting to new user:", error);
      alert("Failed to connect to a new user: " + error.message);

  }
});


socket.on('reconnecting', (attemptNumber) => { //Add the 'reconnecting event'
  console.log(`Reconnecting to the server (attempt ${attemptNumber})...`);

  connectionStatus.textContent = "Reconnecting..."; // Update status
  connectionStatus.style.backgroundColor = "orange";


});

// *** Leave Meeting Button Functionality ***
document.querySelector('.leave_meeting').addEventListener('click', () => {
  localStorage.removeItem(`userName-${ROOM_ID}`); 
  connectionStatus.textContent = "Left";
  connectionStatus.style.backgroundColor = "grey";

  // Close the tab (or window)
  window.close(); // Or use a modal for confirmation 
});

// ***  beforeunload Event Listener ***
// window.addEventListener('beforeunload', (event) => {
  // Remove user from participant list (if needed) – See next step for details
  // localStorage.removeItem(`userName-${ROOM_ID}`);
  // connectionStatus.textContent = "Left";
  // connectionStatus.style.backgroundColor = "grey";



  // Optional: Display confirmation dialog (some browsers might ignore custom messages)
  // event.preventDefault();
  // event.returnValue = ''; // Legacy way for some older browsers
  // return ''; // For modern browsers (might not always be supported)
// });




// Listen for general Socket.IO errors 
socket.on('error', (error) => {
  console.error('General Socket.IO error:', error);
  // Handle error here
  alert("A Socket.IO error occurred: " + error.message);

});


socket.on('user-disconnected', userId => {
  if (peers[userId]) {
      peers[userId].close();
      delete peers[userId]; // Remove the call from the peers object


      // Optionally remove the username from localStorage
      // localStorage.removeItem(`userName-${ROOM_ID}`); // Or only remove on "Leave Meeting"
      // localStorage.removeItem(`userName-${userId}`); // Or only remove on "Leave Meeting"


  }
});



// ----------


let text = $('input')
// let userName = prompt('Please enter your name');  // Get the username

$('html').keydown((e) => {
  if (e.which == 13 && text.val().length !== 0) {
      socket.emit('message', text.val(), userName); // Include userName with the message
      text.val('');
  }
});

socket.on('createMessage', (data) => {
  const { message, timestampUTC, userName } = data;
  const timestampLocal = new Date(timestampUTC).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  $("#chat-messages").append(`<li class="message"><b>[${timestampLocal}]  ${userName}:</b><br/>${message}</li>`); // Append to #chat-messages
  scrollToBottom();
});

const scrollToBottom = () => {
  var d = $('.main__chat_window'); // The chat window container
  d.scrollTop(d.prop("scrollHeight"));
}


// const scrollToBottomVideo = () => {
//     const videoGrid = document.getElementById('video-grid');
//     videoGrid.scrollTop = videoGrid.scrollHeight;
// }


const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
}


const setMuteButton = () => {
    const html = `
      <i class="bi bi-mic-fill"></i>
      <span>Mute</span>
    `
    document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
    const html = `
      <i class="unmute bi bi-mic-mute-fill"></i>
      <span>Unmute</span>
    `
    document.querySelector('.main__mute_button').innerHTML = html;
}


const playStop = () => {
    console.log('object')
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo()
    } else {
        setStopVideo()
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
}

const setStopVideo = () => {
    const html = `
      <i class="bi bi-camera-video-fill"></i>
      <span>Stop Video</span>
    `
    document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
    const html = `
    <i class="stop bi bi-camera-video-off-fill"></i>
      <span>Play Video</span>
    `
    document.querySelector('.main__video_button').innerHTML = html;
}





function connectToNewUser(userId, stream) {

    if(!peers[userId]){
  const call = myPeer.call(userId, stream);
  const video = document.createElement('video');

  call.on('stream', userVideoStream => {
    //   addVideoStream(video, userVideoStream);
      addVideoStream(video, userVideoStream, userName);

  });

  call.on('close', () => {
      video.remove();
  });

  call.on('error', err => {
      console.error("Error on call:", err);
      alert("An error occurred during the call: " + err.message);
  });

  peers[userId] = call;
}
}



// function addVideoStream(video, stream) {
//     video.srcObject = stream;
//     video.addEventListener('loadedmetadata', () => {
//         video.play();
//     });
//     videoGrid.append(video);
//     scrollToBottomVideo();
// }

// function addVideoStream(video, stream, userName = "",  isScreenSharing = false) {
//     video.srcObject = stream;
//     video.addEventListener('loadedmetadata', () => {
//         video.play();
//     });

//        // Add class if it is screen sharing stream:
//        if (isScreenSharing) {
//         video.classList.add('screen-share');
//     }

//     // Create a wrapper div for the video and name label
//     const videoWrapper = document.createElement('div');
//     videoWrapper.style.position = "relative";
//     videoWrapper.style.display = "inline-block";

//     // Create a label to display the user's name
//     const nameLabel = document.createElement('div');
//     nameLabel.textContent = userName;
//     nameLabel.style.position = "absolute";
//     nameLabel.style.top = "5px";
//     nameLabel.style.left = "5px";
//     nameLabel.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
//     nameLabel.style.color = "white";
//     nameLabel.style.padding = "2px 5px";
//     nameLabel.style.borderRadius = "5px";
//     nameLabel.style.fontSize = "12px";

//     // Append the video and name label to the wrapper
//     videoWrapper.appendChild(video);
//     videoWrapper.appendChild(nameLabel);

//     // Append the wrapper to the video grid
//     videoGrid.append(videoWrapper);
//     // videoWrapper.append(videoWrapper);

    
// }

// Add user name display functionality
function addVideoStream(video, stream, userName = "") {
    // Avoid duplication by checking if a video for the user already exists
    const existingVideo = document.querySelector(`[data-username='${userName}']`);
    if (existingVideo) {
        console.warn(`Video for user ${userName} already exists.`);
        return; // Exit to prevent duplication
    }

    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });

    // Create a wrapper div for the video and name label
    const videoWrapper = document.createElement('div');
    videoWrapper.style.position = "relative";
    videoWrapper.style.display = "inline-block";
    videoWrapper.setAttribute('data-username', userName); // Add an identifier for the user

    // Create a label to display the user's name
    const nameLabel = document.createElement('div');
    nameLabel.textContent = userName;
    nameLabel.style.position = "absolute";
    nameLabel.style.top = "5px";
    nameLabel.style.left = "5px";
    nameLabel.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    nameLabel.style.color = "white";
    nameLabel.style.padding = "2px 5px";
    nameLabel.style.borderRadius = "5px";
    nameLabel.style.fontSize = "12px";

    // Append the video and name label to the wrapper
    videoWrapper.appendChild(video);
    videoWrapper.appendChild(nameLabel);

    // Append the wrapper to the video grid
    videoGrid.append(videoWrapper);
}




const participantsList = document.getElementById('participants-list');
const chatHeader = document.getElementById('chat-header'); //get the element
const participantsHeader = document.getElementById('participants-header'); //get the element

const chatSection = document.getElementById('chat-section'); //get the element
const participantsSection = document.getElementById('participants-section'); //get the element




// ---------- Chat Toggle --------- //
chatHeader.addEventListener('click', () => {
    chatSection.style.display = 'block';
    participantsSection.style.display = 'none';

});



// -------- Participant List Toggle -------- //
participantsHeader.addEventListener('click', () => {
    participantsSection.style.display = 'block';
    chatSection.style.display = 'none';

});


// -------- Update Participant List  -------- //

socket.on('update-participant-list', (participants) => {
    participantsList.innerHTML = ''; // Clear the existing list

    for (const userId in participants) {
        const userName = participants[userId];
      
        const listItem = document.createElement('li');
        listItem.textContent = userName;
        
        participantsList.appendChild(listItem);
         
    }
});

