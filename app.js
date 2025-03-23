// app.js - Main server entry file
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// CORS handling
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);

// Track users in rooms
const rooms = {};

// Socket.io for WebRTC signaling
io.on('connection', socket => {
  console.log('User connected:', socket.id);
  
  // Join a room
  socket.on('join-room', roomId => {
    // Leave any previous room
    if (socket.roomId) {
      leaveRoom(socket);
    }
    
    // Join the new room
    socket.join(roomId);
    socket.roomId = roomId;
    
    // Initialize room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    
    // Add user to room and send list of existing users
    rooms[roomId].push(socket.id);
    
    // Notify the new user about existing participants
    const existingUsers = rooms[roomId].filter(id => id !== socket.id);
    if (existingUsers.length > 0) {
      socket.emit('existing-users', existingUsers);
      console.log(`Notifying new user ${socket.id} about existing users:`, existingUsers);
    }
    
    // Notify others in the room that a new user has joined
    socket.to(roomId).emit('user-connected', socket.id);
    
    console.log(`User ${socket.id} joined room ${roomId}, current users:`, rooms[roomId]);
  });
  
  // Leave a room
  socket.on('leave-room', () => {
    leaveRoom(socket);
  });
  
  // Handle WebRTC signaling
  socket.on('offer', (offer, roomId, targetId) => {
    console.log(`Forwarding offer from ${socket.id} to ${targetId}`);
    socket.to(targetId).emit('offer', offer, socket.id);
  });
  
  socket.on('answer', (answer, roomId, targetId) => {
    console.log(`Forwarding answer from ${socket.id} to ${targetId}`);
    socket.to(targetId).emit('answer', answer, socket.id);
  });
  
  socket.on('ice-candidate', (candidate, roomId, targetId) => {
    socket.to(targetId).emit('ice-candidate', candidate, socket.id);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    leaveRoom(socket);
  });
  
  // Helper function to handle room leaving logic
  function leaveRoom(socket) {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId]) {
      // Remove user from room
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      
      // Notify others in the room
      socket.to(roomId).emit('user-disconnected', socket.id);
      
      // Clean up empty rooms
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
      
      socket.leave(roomId);
      socket.roomId = null;
      
      console.log(`User ${socket.id} left room ${roomId}`);
      if (rooms[roomId]) {
        console.log(`Remaining users in room ${roomId}:`, rooms[roomId]);
      }
    }
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message, data });
});

// Database connection and server startup
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
