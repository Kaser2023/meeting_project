// -----------------   Frontend   ---------------

// Import socket.io
const socket = io('/');


// Get the video grid element
const videoGrid = document.getElementById('video-grid');
console.log(videoGrid);



// Import PeerJS
const peer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '443'
});

let myVideoStream;

// Create a video element for the local user
const myVideo = document.createElement('video');
myVideo.muted = true;
const peers = {}



// Access user media (camera and microphone)
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    // Save the local video stream
    myVideoStream = stream;

    // Add the local video stream to the video grid
    addVideoStream(myVideo, stream);

    // Handle incoming calls
    peer.on('call', call => {
        // Answer the call and send the local stream
        call.answer(stream);

        // Create a video element for the caller
        const video = document.createElement('video');

        // When a user video stream is received, add it to the video grid
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
        });
    });

    // Listen for 'user-connected' event from the server
    socket.on('user-connected', (userId) => {
        connectToNewUser(userId, stream);
    });

    // input value
    let text = $('input')
// console.log(text.val())

$('html').keydown((e) => {
    console.log(text.val())
    // [ 13 ] --> is the Key Code for "Enter Key" 
    if(e.which == 13 && text.val().length !== 0){
        socket.emit('message', text.val());
        text.val('');
    }
})



socket.on('createMessage', (message, userId) => {
    // const userId = 1;
    console.log('This is coming from Server: ',message);
    $("ul").append(`<li class="message"><b>user </b><br/>${message}</li>`);
    
    // For later to Make the numbers for each user.
    // $("ul").append(`<li class="message"><b>user ${userId} </b><br/>${message}</li>`);

    scrollToBottom()

})


});


socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
  })


// When the peer connection is opened, emit 'join-room' to the server
peer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id);
    // console.log("The id --> ", id);
});

// Function to connect to a new user
function connectToNewUser (userId, stream) {
    console.log('new user');
    // console.log(userId);

    // Call the new user and send the local stream
    const call = peer.call(userId, stream);

    // Create a video element for the new user
    const video = document.createElement('video');

    // When the new user's video stream is received, add it to the video grid
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
    });

    call.on('close', () => {
        video.remove()
      })
    
      peers[userId] = call


};

// Function to add a video stream to the video grid
function addVideoStream (video, stream) {
    video.srcObject = stream;

    // Play the video once metadata is loaded
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });

    // Append the video to the video grid
    videoGrid.append(video);
};


const scrollToBottom = () => {
    var d = $('.main__chat_window');
    d.scrollTop(d.prop("scrollHeight"));
  }

  
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
      <i class="fas fa-microphone"></i>
      <span>Mute</span>
    `
    document.querySelector('.main__mute_button').innerHTML = html;
  }
  
  const setUnmuteButton = () => {
    // <i class="unmute fas fa-microphone-slash"></i>
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
      <i class="fas fa-video"></i>
      <span>Stop Video</span>
    `
    document.querySelector('.main__video_button').innerHTML = html;
  }
  
  const setPlayVideo = () => {
    const html = `
    <i class="stop fas fa-video-slash"></i>
      <span>Play Video</span>
    `
    document.querySelector('.main__video_button').innerHTML = html;
  }