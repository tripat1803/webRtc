let localStream;
let remoteStream;
let peerConnection;
let videoTrack;
let audioTrack;

let servers = {
    iceServers: [
        {
            urls: ['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302']
        }
    ]
}

let audio = true;
let video = true;

async function init(video, audio) {
    if (video || audio) {
        localStream = await navigator.mediaDevices.getUserMedia({ video: video, audio: audio });
    } else {
        localStream = new MediaStream();
    }
    document.getElementById("user-1").srcObject = localStream;
}

let createPeerConnection = (sdpType) => {
    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream();
    document.getElementById("user-2").srcObject = remoteStream;

    localStream.getVideoTracks().forEach((track) => {
        videoTrack = peerConnection.addTrack(track, localStream);
    });
    localStream.getAudioTracks().forEach((track) => {
        audioTrack = peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = (event) => {
        event.streams[0].getVideoTracks().forEach((track) => {
            remoteStream.addTrack(track);
        })
        event.streams[0].getAudioTracks().forEach((track) => {
            remoteStream.addTrack(track);
        })
    }

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            document.getElementById(sdpType).value = JSON.stringify(peerConnection.localDescription);
        }
    }
}

let createOffer = async () => {
    createPeerConnection("offer-sdp");

    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    document.getElementById("offer-sdp").value = JSON.stringify(offer);
}

let createAnswer = async () => {
    createPeerConnection("answer-sdp");

    let offer = document.getElementById('offer-sdp').value;
    if (!offer) return alert('Retrieve offer from peer first...');

    offer = JSON.parse(offer);
    await peerConnection.setRemoteDescription(offer);

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    document.getElementById("answer-sdp").value = JSON.stringify(answer);
}

let addAnswer = async () => {
    let answer = document.getElementById('answer-sdp').value
    if (!answer) return alert('Retrieve answer from peer first...')

    answer = JSON.parse(answer)

    if (!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(answer)
    }
}

function toggleAudioTracks(audio) {
    if(audio){
        localStream.getAudioTracks().forEach((track) => {
            audioTrack = peerConnection.addTrack(track, localStream);
        });
    } else {
        peerConnection.removeTrack(audioTrack);
    }
}

function toggleVideoTracks(video) {
    if(video){
        localStream.getVideoTracks().forEach((track) => {
            videoTrack = peerConnection.addTrack(track, localStream);
        });
    } else {
        peerConnection.removeTrack(videoTrack);
    }
}

init(video, audio);
document.getElementById("audio-btn").addEventListener("click", () => {
    audio = !audio;
    document.getElementById("audio-btn").textContent = audio ? "Disable" : "Enable";
    init(video, audio);
    toggleAudioTracks(audio);
});
document.getElementById("video-btn").addEventListener("click", () => {
    video = !video;
    document.getElementById("video-btn").textContent = video ? "Disable" : "Enable";
    init(video, audio);
    toggleVideoTracks(video);
});

document.getElementById('create-offer').addEventListener('click', createOffer);
document.getElementById('create-answer').addEventListener('click', createAnswer);
document.getElementById('add-answer').addEventListener('click', addAnswer);
document.getElementById('end-call').addEventListener('click', () => {
    peerConnection.close();
});