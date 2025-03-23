// Global variables
let socket;
let localStream;
let peerConnections = {};
let token = null;
let userId = null;
let currentRoom = null;
let isMuted = false;
let isVideoOff = false;
let isScreenSharing = false;

// DOM elements
const heroSection = document.getElementById('heroSection');
const authSection = document.getElementById('authSection');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const callSection = document.getElementById('callSection');
const roomInfo = document.getElementById('roomInfo');
const currentRoomIdSpan = document.getElementById('currentRoomId');
const localVideo = document.getElementById('localVideo');
const remoteVideos = document.getElementById('remoteVideos');
const roomIdInput = document.getElementById('roomId');
const joinRoomButton = document.getElementById('joinRoomButton');
const createRoomButton = document.getElementById('createRoomButton');
const leaveRoomButton = document.getElementById('leaveRoomButton');
const logoutButton = document.getElementById('logoutButton');
const getStartedBtn = document.getElementById('getStartedBtn');
const learnMoreBtn = document.getElementById('learnMoreBtn');
const micToggle = document.getElementById('micToggle');
const videoToggle = document.getElementById('videoToggle');
const screenShareToggle = document.getElementById('screenShareToggle');
const endCallBtn = document.getElementById('endCallBtn');
const copyRoomId = document.getElementById('copyRoomId');
const notificationContainer = document.getElementById('notificationContainer');

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize GSAP animations
  initAnimations();
  
  // Create particles for hero section
  createParticles();
  
  // Check if user is already logged in (token in localStorage)
  const savedToken = localStorage.getItem('token');
  const savedUserId = localStorage.getItem('userId');
  
  if (savedToken && savedUserId) {
    token = savedToken;
    userId = savedUserId;
    showCallSection();
    initWebRTC();
  }
});

// Hero button events
getStartedBtn.addEventListener('click', () => {
  heroSection.classList.add('hidden');
  authSection.classList.remove('hidden');
  
  // Animate auth form elements
  gsap.fromTo('.glass', 
    { opacity: 0, y: 50 }, 
    { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
  );
});

learnMoreBtn.addEventListener('click', () => {
  window.scrollTo({
    top: window.innerHeight,
    behavior: 'smooth'
  });
});

// GSAP Animations
function initAnimations() {
  // Hero section animations
  const heroTimeline = gsap.timeline();
  
  heroTimeline
    .to('.fade-in', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power2.out'
    });
  
  // ScrollTrigger for sections that come into view
  gsap.utils.toArray('.scale-in').forEach(element => {
    gsap.from(element, {
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
      },
      opacity: 0,
      scale: 0.9,
      duration: 0.6,
      ease: 'power2.out'
    });
  });
}

// Create floating particles in the background
function createParticles() {
  const particleContainer = document.getElementById('particleContainer');
  const particleCount = 30;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('hero-particle');
    particleContainer.appendChild(particle);
    
    // Random position
    const posX = Math.random() * window.innerWidth;
    const posY = Math.random() * window.innerHeight;
    
    // Random size
    const size = Math.random() * 4 + 2;
    
    // Set particle properties
    gsap.set(particle, {
      x: posX,
      y: posY,
      width: size,
      height: size,
      backgroundColor: i % 3 === 0 ? '#4f46e5' : i % 3 === 1 ? '#06b6d4' : '#ec4899'
    });
    
    // Animate particle
    animateParticle(particle);
  }
}

function animateParticle(particle) {
  const duration = Math.random() * 3 + 2;
  const delay = Math.random() * 2;
  
  gsap.to(particle, {
    opacity: 0.7,
    duration: 1,
    delay: delay
  });
  
  gsap.to(particle, {
    y: '-=100',
    x: '+=' + (Math.random() * 100 - 50),
    duration: duration,
    delay: delay,
    ease: 'none'
  });
  
  gsap.to(particle, {
    opacity: 0,
    duration: 1,
    delay: delay + duration - 1,
    onComplete: () => {
      // Reset position and start again
      gsap.set(particle, {
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 10,
        opacity: 0
      });
      
      animateParticle(particle);
    }
  });
}

// Show a notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = message;
  
  // Add color based on type
  if (type === 'success') {
    notification.style.backgroundColor = 'rgba(16, 185, 129, 0.9)';
  } else if (type === 'error') {
    notification.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
  } else if (type === 'warn') {
    notification.style.backgroundColor = 'rgba(245, 158, 11, 0.9)';
  }
  
  notificationContainer.appendChild(notification);
  
  // Animate in
  gsap.fromTo(notification, 
    { opacity: 0, x: 50 }, 
    { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }
  );
  
  // Animate out after delay
  setTimeout(() => {
    gsap.to(notification, {
      opacity: 0,
      x: 50,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        notification.remove();
      }
    });
  }, 3000);
}

// Toggle between login and signup forms
document.getElementById('showSignup').addEventListener('click', (e) => {
  e.preventDefault();
  
  gsap.to(loginForm, {
    opacity: 0,
    y: -20,
    duration: 0.3,
    onComplete: () => {
      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
      gsap.fromTo(signupForm, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.5 }
      );
    }
  });
});

document.getElementById('showLogin').addEventListener('click', (e) => {
  e.preventDefault();
  
  gsap.to(signupForm, {
    opacity: 0,
    y: -20,
    duration: 0.3,
    onComplete: () => {
      signupForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
      gsap.fromTo(loginForm, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.5 }
      );
    }
  });
});

// Sign up functionality
document.getElementById('signupButton').addEventListener('click', async () => {
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const errorElement = document.getElementById('signupError');
  
  if (!name || !email || !password) {
    errorElement.textContent = 'All fields are required';
    shakeElement(errorElement);
    return;
  }
  
  if (password.length < 6) {
    errorElement.textContent = 'Password must be at least 6 characters long';
    shakeElement(errorElement);
    return;
  }
  
  try {
    const response = await fetch('/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }
    
    // Show success notification
    showNotification('Signup successful! You can now login', 'success');
    
    // Switch to login form with animation
    gsap.to(signupForm, {
      opacity: 0,
      y: -20,
      duration: 0.3,
      onComplete: () => {
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        document.getElementById('loginEmail').value = email;
        gsap.fromTo(loginForm, 
          { opacity: 0, y: 20 }, 
          { opacity: 1, y: 0, duration: 0.5 }
        );
      }
    });
  } catch (error) {
    errorElement.textContent = error.message;
    shakeElement(errorElement);
  }
});

// Login functionality
document.getElementById('loginButton').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorElement = document.getElementById('loginError');
  
  if (!email || !password) {
    errorElement.textContent = 'Email and password are required';
    shakeElement(errorElement);
    return;
  }
  
  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Store token and user ID in localStorage for persistence
    token = data.token;
    userId = data.userId;
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    
    // Show call section with animation
    showCallSection();
    
    // Initialize WebRTC after successful login
    initWebRTC();
    
    // Show success notification
    showNotification('Login successful!', 'success');
  } catch (error) {
    errorElement.textContent = error.message;
    shakeElement(errorElement);
  }
});

function showCallSection() {
  authSection.classList.add('hidden');
  heroSection.classList.add('hidden');
  callSection.classList.remove('hidden');
  
  // Animate call section elements
  gsap.fromTo('#callSection > div > *', 
    { opacity: 0, y: 20 }, 
    { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
  );
}

// Shake animation for error feedback
function shakeElement(element) {
  gsap.fromTo(element, 
    { x: -10 }, 
    { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' }
  );
}

// Logout functionality
logoutButton.addEventListener('click', async () => {
  try {
    await fetch('/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Close connections and reset state
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localVideo.srcObject = null;
    }
    
    if (currentRoom) {
      leaveRoom();
    }
    
    if (socket) {
      socket.disconnect();
    }
    
    // Reset state variables
    token = null;
    userId = null;
    currentRoom = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    
    // Show auth section with animation
    callSection.classList.add('hidden');
    heroSection.classList.remove('hidden');
    
    // Reinitialize hero animations
    gsap.fromTo('.fade-in', 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
    );
    
    showNotification('Logged out successfully', 'info');
  } catch (error) {
    console.error('Logout error:', error);
    showNotification('Error during logout', 'error');
  }
});

// WebRTC initialization
async function initWebRTC() {
  try {
    // Connect to socket.io server
    socket = io();
    
    // Get local media stream
    localStream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    
    // Display local video
    localVideo.srcObject = localStream;
    
    // Socket event listeners for WebRTC signaling
    socket.on('user-connected', (userId) => {
      showNotification(`User connected: ${userId.substring(0, 6)}...`, 'info');
      createPeerConnection(userId, true); // We initiate the connection as we're already in the room
    });
    
    // Handle existing users in the room
    socket.on('existing-users', (userIds) => {
      showNotification(`Found ${userIds.length} existing user(s) in the room`, 'info');
      userIds.forEach(userId => {
        createPeerConnection(userId, false); // We don't initiate as we just joined
      });
    });
    
    socket.on('user-disconnected', (userId) => {
      showNotification(`User disconnected: ${userId.substring(0, 6)}...`, 'warn');
      closePeerConnection(userId);
    });
    
    socket.on('offer', async (offer, fromUserId) => {
      try {
        console.log('Received offer from:', fromUserId);
        if (!peerConnections[fromUserId]) {
          await createPeerConnection(fromUserId, false);
        }
        
        const pc = peerConnections[fromUserId];
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('answer', answer, currentRoom, fromUserId);
        console.log('Sent answer to:', fromUserId);
      } catch (error) {
        console.error('Error handling offer:', error);
        showNotification('Error handling video call offer', 'error');
      }
    });
    
    socket.on('answer', async (answer, fromUserId) => {
      try {
        console.log('Received answer from:', fromUserId);
        if (peerConnections[fromUserId]) {
          await peerConnections[fromUserId].setRemoteDescription(new RTCSessionDescription(answer));
          console.log('Set remote description for:', fromUserId);
        }
      } catch (error) {
        console.error('Error handling answer:', error);
        showNotification('Error during call connection', 'error');
      }
    });
    
    socket.on('ice-candidate', async (candidate, fromUserId) => {
      try {
        console.log('Received ICE candidate from:', fromUserId);
        if (peerConnections[fromUserId]) {
          await peerConnections[fromUserId].addIceCandidate(new RTCIceCandidate(candidate));
          console.log('Added ICE candidate for:', fromUserId);
        }
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });
    
    // Set up room controls
    createRoomButton.addEventListener('click', () => {
      const randomRoomId = Math.random().toString(36).substring(2, 8);
      roomIdInput.value = randomRoomId;
      joinRoom(randomRoomId);
    });
    
    joinRoomButton.addEventListener('click', () => {
      const roomId = roomIdInput.value.trim();
      if (roomId) {
        joinRoom(roomId);
      } else {
        showNotification('Please enter a room ID', 'warn');
        shakeElement(roomIdInput);
      }
    });
    
    leaveRoomButton.addEventListener('click', () => {
      leaveRoom();
    });
    
    // Media control buttons
    micToggle.addEventListener('click', toggleMicrophone);
    videoToggle.addEventListener('click', toggleVideo);
    screenShareToggle.addEventListener('click', toggleScreenShare);
    endCallBtn.addEventListener('click', leaveRoom);
    
    // Copy room ID button
    copyRoomId.addEventListener('click', () => {
      navigator.clipboard.writeText(currentRoomIdSpan.textContent)
        .then(() => {
          showNotification('Room ID copied to clipboard!', 'success');
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
          showNotification('Failed to copy room ID', 'error');
        });
    });
  } catch (error) {
    console.error('WebRTC initialization error:', error);
    showNotification('Failed to access camera and microphone', 'error');
  }
}

// Create a peer connection with another user
async function createPeerConnection(remoteUserId, isInitiator) {
  try {
    console.log(`Creating ${isInitiator ? 'initiating' : 'receiving'} peer connection with:`, remoteUserId);
    
    // More comprehensive ICE servers configuration
    const iceServers = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    };
    
    // Create new RTCPeerConnection
    const pc = new RTCPeerConnection(iceServers);
    peerConnections[remoteUserId] = pc;
    
    // Log connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${remoteUserId}:`, pc.connectionState);
      if (pc.connectionState === 'connected') {
        showNotification(`Fully connected to user: ${remoteUserId.substring(0, 6)}...`, 'success');
      }
    };
    
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${remoteUserId}:`, pc.iceConnectionState);
    };
    
    // Add local tracks to the connection
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
      console.log(`Added local ${track.kind} track to peer connection`);
    });
    
    // Create remote video element
    const remoteVideoContainer = document.createElement('div');
    remoteVideoContainer.className = 'relative';
    remoteVideoContainer.id = `remote-container-${remoteUserId}`;
    
    const remoteVideo = document.createElement('video');
    remoteVideo.id = `remote-video-${remoteUserId}`;
    remoteVideo.className = 'w-full bg-gray-900';
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true; // Important for mobile
    remoteVideoContainer.appendChild(remoteVideo);
    
    // Add user label
    const userLabel = document.createElement('div');
    userLabel.className = 'absolute bottom-4 left-4 glass px-3 py-1 rounded-lg text-sm';
    userLabel.innerHTML = `<i class="fas fa-user mr-1"></i> User ${remoteUserId.substring(0, 6)}...`;
    remoteVideoContainer.appendChild(userLabel);
    
    remoteVideos.appendChild(remoteVideoContainer);
    
    // Animate the new video element
    gsap.fromTo(remoteVideoContainer, 
      { opacity: 0, scale: 0.8 }, 
      { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)' }
    );
    
    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log(`Received ${event.track.kind} track from ${remoteUserId}`);
      remoteVideo.srcObject = event.streams[0];
      // Show notification only once per connection
      if (event.track.kind === 'video') {
        showNotification(`Receiving video from: ${remoteUserId.substring(0, 6)}...`, 'success');
      }
    };
    
    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Sending ICE candidate to ${remoteUserId}`, event.candidate.type);
        socket.emit('ice-candidate', event.candidate, currentRoom, remoteUserId);
      }
    };
    
    // If we're the initiator, create and send an offer
    if (isInitiator) {
      try {
        console.log(`Creating offer for ${remoteUserId}`);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        
        await pc.setLocalDescription(offer);
        console.log(`Sending offer to ${remoteUserId}`);
        socket.emit('offer', offer, currentRoom, remoteUserId);
      } catch (error) {
        console.error('Error creating offer:', error);
        showNotification('Error establishing connection', 'error');
      }
    }
    
    return pc;
  } catch (error) {
    console.error('Error creating peer connection:', error);
    showNotification('Error connecting to remote user', 'error');
    return null;
  }
}

// Close peer connection with a user
function closePeerConnection(userId) {
  if (peerConnections[userId]) {
    console.log(`Closing peer connection with ${userId}`);
    
    // Close the connection properly
    try {
      // Clean up all tracks
      const senders = peerConnections[userId].getSenders();
      senders.forEach(sender => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      
      peerConnections[userId].ontrack = null;
      peerConnections[userId].onicecandidate = null;
      peerConnections[userId].oniceconnectionstatechange = null;
      peerConnections[userId].onconnectionstatechange = null;
      peerConnections[userId].close();
    } catch (err) {
      console.error('Error during peer connection cleanup:', err);
    }
    
    delete peerConnections[userId];
    
    // Remove remote video element with animation
    const remoteContainer = document.getElementById(`remote-container-${userId}`);
    if (remoteContainer) {
      gsap.to(remoteContainer, {
        opacity: 0,
        scale: 0.8,
        duration: 0.5,
        onComplete: () => {
          remoteContainer.remove();
        }
      });
    }
  }
}

// Join a room
function joinRoom(roomId) {
  if (currentRoom) {
    leaveRoom();
  }
  
  // Clear any existing connections first
  Object.keys(peerConnections).forEach(userId => {
    closePeerConnection(userId);
  });
  
  currentRoom = roomId;
  console.log(`Joining room: ${roomId}`);
  socket.emit('join-room', roomId);
  
  // Update UI
  currentRoomIdSpan.textContent = roomId;
  roomInfo.classList.remove('hidden');
  leaveRoomButton.classList.remove('hidden');
  
  // Animate room info
  gsap.fromTo(roomInfo, 
    { opacity: 0, y: -20 }, 
    { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
  );
  
  showNotification(`Joined room: ${roomId}`, 'success');
}

// Leave the current room
function leaveRoom() {
  if (currentRoom) {
    console.log(`Leaving room: ${currentRoom}`);
    socket.emit('leave-room', currentRoom);
    
    // Close all peer connections
    Object.keys(peerConnections).forEach(userId => {
      closePeerConnection(userId);
    });
    
    // Reset screen sharing if active
    if (isScreenSharing) {
      stopScreenSharing();
    }
    
    // Update UI
    currentRoom = null;
    roomInfo.classList.add('hidden');
    leaveRoomButton.classList.add('hidden');
    
    // Clear remote videos container
    while (remoteVideos.firstChild) {
      remoteVideos.removeChild(remoteVideos.firstChild);
    }
    
    showNotification('Left the room', 'info');
  }
}

// Toggle microphone
function toggleMicrophone() {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      isMuted = !isMuted;
      audioTrack.enabled = !isMuted;
      
      // Update UI
      if (isMuted) {
        micToggle.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        micToggle.classList.remove('bg-primary');
        micToggle.classList.add('bg-red-500');
        showNotification('Microphone muted', 'info');
      } else {
        micToggle.innerHTML = '<i class="fas fa-microphone"></i>';
        micToggle.classList.add('bg-primary');
        micToggle.classList.remove('bg-red-500');
        showNotification('Microphone unmuted', 'info');
      }
    }
  }
}

// Toggle video
function toggleVideo() {
  if (localStream) {
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      isVideoOff = !isVideoOff;
      videoTrack.enabled = !isVideoOff;
      
      // Update UI
      if (isVideoOff) {
        videoToggle.innerHTML = '<i class="fas fa-video-slash"></i>';
        videoToggle.classList.remove('bg-primary');
        videoToggle.classList.add('bg-red-500');
        showNotification('Camera turned off', 'info');
      } else {
        videoToggle.innerHTML = '<i class="fas fa-video"></i>';
        videoToggle.classList.add('bg-primary');
        videoToggle.classList.remove('bg-red-500');
        showNotification('Camera turned on', 'info');
      }
    }
  }
}

// Toggle screen sharing
async function toggleScreenShare() {
  if (isScreenSharing) {
    await stopScreenSharing();
  } else {
    await startScreenSharing();
  }
}

// Start screen sharing
async function startScreenSharing() {
  try {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
      video: { cursor: 'always' },
      audio: false 
    });
    
    // Save original video track to restore later
    const originalVideoTrack = localStream.getVideoTracks()[0];
    
    // Replace video track with screen share
    const screenTrack = displayStream.getVideoTracks()[0];
    
    // Replace track in all peer connections
    Object.values(peerConnections).forEach(pc => {
      const senders = pc.getSenders();
      const videoSender = senders.find(sender => 
        sender.track && sender.track.kind === 'video'
      );
      if (videoSender) {
        console.log('Replacing video track with screen share in peer connection');
        videoSender.replaceTrack(screenTrack);
      }
    });
    
    // Replace local video preview
    if (originalVideoTrack) {
      originalVideoTrack.stop(); // Stop the camera track
      localStream.removeTrack(originalVideoTrack);
    }
    
    localStream.addTrack(screenTrack);
    localVideo.srcObject = localStream;
    
    // Update UI
    isScreenSharing = true;
    screenShareToggle.innerHTML = '<i class="fas fa-stop"></i>';
    screenShareToggle.classList.remove('bg-accent');
    screenShareToggle.classList.add('bg-red-500');
    
    showNotification('Screen sharing started', 'success');
    
    // Handle the screen share ending
    screenTrack.onended = () => {
      stopScreenSharing();
    };
  } catch (error) {
    console.error('Error starting screen share:', error);
    showNotification('Failed to start screen sharing', 'error');
  }
}

// Stop screen sharing
async function stopScreenSharing() {
  if (!isScreenSharing) return;
  
  try {
    console.log('Stopping screen sharing');
    // Get a new video stream from camera
    const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const newVideoTrack = newStream.getVideoTracks()[0];
    
    // Replace tracks in all peer connections
    Object.values(peerConnections).forEach(pc => {
      const senders = pc.getSenders();
      const videoSender = senders.find(sender => 
        sender.track && sender.track.kind === 'video'
      );
      if (videoSender) {
        console.log('Replacing screen share with camera video in peer connection');
        videoSender.replaceTrack(newVideoTrack);
      }
    });
    
    // Replace local stream's video track
    const oldVideoTrack = localStream.getVideoTracks()[0];
    if (oldVideoTrack) {
      localStream.removeTrack(oldVideoTrack);
      oldVideoTrack.stop();
    }
    
    localStream.addTrack(newVideoTrack);
    localVideo.srcObject = localStream;
    
    // Update UI
    isScreenSharing = false;
    screenShareToggle.innerHTML = '<i class="fas fa-desktop"></i>';
    screenShareToggle.classList.remove('bg-red-500');
    screenShareToggle.classList.add('bg-accent');
    
    showNotification('Screen sharing stopped', 'info');
  } catch (error) {
    console.error('Error stopping screen share:', error);
    showNotification('Failed to stop screen sharing', 'error');
    
    // Fallback recovery in case of error
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const fallbackTrack = fallbackStream.getVideoTracks()[0];
      
      // Clean up existing video tracks
      localStream.getVideoTracks().forEach(track => {
        track.stop();
        localStream.removeTrack(track);
      });
      
      localStream.addTrack(fallbackTrack);
      localVideo.srcObject = localStream;
      
      isScreenSharing = false;
      screenShareToggle.innerHTML = '<i class="fas fa-desktop"></i>';
      screenShareToggle.classList.remove('bg-red-500');
      screenShareToggle.classList.add('bg-accent');
    } catch (fallbackError) {
      console.error('Critical error recovering from screen share:', fallbackError);
    }
  }
}
