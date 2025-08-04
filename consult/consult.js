import { protectPage, db } from '../auth/auth.js';
import { doc, getDoc, collection, addDoc, onSnapshot, updateDoc, deleteDoc, getDocs, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Global State & Elements ---
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const placeholder = document.getElementById('placeholder');
const callWithInfo = document.getElementById('call-with-info');
const remoteUserName = document.getElementById('remote-user-name');
const endCallBtn = document.getElementById('end-call');
const toggleMicBtn = document.getElementById('toggle-mic');
const toggleCameraBtn = document.getElementById('toggle-camera');
const toggleChatBtn = document.getElementById('toggle-chat');
const chatPanel = document.getElementById('chat-panel');
const messageArea = document.getElementById('message-area');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

let localStream, remoteStream;
let peerConnection;
let user, userRole, appointmentId;
let dataChannel;
let unsubscribeMessages = null;

// --- WebRTC Configuration ---
const servers = {
    iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }],
    iceCandidatePoolSize: 10,
};

// --- Main Logic ---
protectPage(async (loggedInUser, userData) => {
    user = loggedInUser;
    userRole = userData.role;
    const urlParams = new URLSearchParams(window.location.search);
    appointmentId = urlParams.get('id');

    if (!appointmentId) {
        alert("No appointment specified.");
        window.location.href = userRole === 'patient' ? '../patient/patient.html' : '../doctor/dr2.html';
        return;
    }

    await setupMedia();
    await setupPeerConnection();
    await handleSignaling();
    setupChat();
});

// --- Media & Peer Connection Setup ---
async function setupMedia() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
        remoteStream = new MediaStream();
        remoteVideo.srcObject = remoteStream;
    } catch (e) { console.error("Error accessing media devices.", e); }
}

async function setupPeerConnection() {
    peerConnection = new RTCPeerConnection(servers);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    peerConnection.ontrack = event => {
        event.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));
        placeholder.classList.add('hidden');
    };
}

// --- Signaling Logic using Firestore ---
async function handleSignaling() {
    const callDoc = doc(db, 'calls', appointmentId);
    const offerCandidates = collection(callDoc, 'offerCandidates');
    const answerCandidates = collection(callDoc, 'answerCandidates');

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            const candidatesCollection = userRole === 'doctor' ? offerCandidates : answerCandidates;
            addDoc(candidatesCollection, event.candidate.toJSON());
        }
    };

    if (userRole === 'doctor') {
        const offerDescription = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offerDescription);
        const offer = { sdp: offerDescription.sdp, type: offerDescription.type };
        await setDoc(callDoc, { offer });

        onSnapshot(callDoc, (snapshot) => {
            const data = snapshot.data();
            if (!peerConnection.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                peerConnection.setRemoteDescription(answerDescription);
            }
        });

        onSnapshot(answerCandidates, snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    peerConnection.addIceCandidate(candidate);
                }
            });
        });

    } else if (userRole === 'patient') {
        onSnapshot(callDoc, async (snapshot) => {
            const data = snapshot.data();
            if (data?.offer && !peerConnection.currentRemoteDescription) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answerDescription = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answerDescription);
                const answer = { type: answerDescription.type, sdp: answerDescription.sdp };
                await updateDoc(callDoc, { answer });
            }
        });

        onSnapshot(offerCandidates, snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    peerConnection.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                }
            });
        });
    }
}

// --- Chat Logic ---
function setupChat() {
    const messagesRef = collection(db, 'calls', appointmentId, 'messages');
    const q = query(messagesRef, orderBy('timestamp'));

    unsubscribeMessages = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                renderMessage(change.doc.data());
            }
        });
    });

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (text) {
            await addDoc(messagesRef, {
                senderId: user.uid,
                text: text,
                timestamp: serverTimestamp()
            });
            messageInput.value = '';
            messageArea.scrollTop = messageArea.scrollHeight;
        }
    });
}

function renderMessage(data) {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.classList.add(data.senderId === user.uid ? 'sent' : 'received');
    bubble.textContent = data.text;
    messageArea.appendChild(bubble);
    messageArea.scrollTop = messageArea.scrollHeight;
}

// --- Controls ---
toggleMicBtn.addEventListener('click', () => {
    localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        toggleMicBtn.classList.toggle('toggled', !track.enabled);
        toggleMicBtn.innerHTML = `<i class="fas ${track.enabled ? 'fa-microphone' : 'fa-microphone-slash'}"></i>`;
    });
});

toggleCameraBtn.addEventListener('click', () => {
    localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        toggleCameraBtn.classList.toggle('toggled', !track.enabled);
        toggleCameraBtn.innerHTML = `<i class="fas ${track.enabled ? 'fa-video' : 'fa-video-slash'}"></i>`;
    });
});

toggleChatBtn.addEventListener('click', () => {
    chatPanel.classList.toggle('hidden');
});

endCallBtn.addEventListener('click', async () => {
    if (peerConnection) {
        peerConnection.close();
    }
    if (unsubscribeMessages) {
        unsubscribeMessages();
    }
    // Clean up signaling data
    const callDoc = doc(db, 'calls', appointmentId);
    const offerCandidates = await getDocs(collection(callDoc, 'offerCandidates'));
    offerCandidates.forEach(async (doc) => await deleteDoc(doc.ref));
    const answerCandidates = await getDocs(collection(callDoc, 'answerCandidates'));
    answerCandidates.forEach(async (doc) => await deleteDoc(doc.ref));
    await deleteDoc(callDoc);
    
    window.location.href = userRole === 'patient' ? '../patient/patient.html' : '../doctor/dr2.html';
});
