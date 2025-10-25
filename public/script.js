const socket = io();
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startBtn = document.getElementById("startBtn");

let localStream;
let peerConnection;

const servers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

startBtn.onclick = async () => {
  console.log("I am clicked!",startBtn)
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  peerConnection = new RTCPeerConnection(servers);

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("ice-candidate", event.candidate);
    }
  };
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", offer);
};
socket.on("offer", async (offer) => {
  if (!peerConnection) {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    peerConnection = new RTCPeerConnection(servers);

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = event => {
      remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        socket.emit("ice-candidate", event.candidate);
      }
    };
  }

  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", answer);
});
socket.on("answer", async (answer) => {
  await peerConnection.setRemoteDescription(answer);
});
socket.on("ice-candidate", async (candidate) => {
  try {
    await peerConnection.addIceCandidate(candidate);
  } catch (e) {
    console.error("Error adding ICE candidate", e);
  }
});
