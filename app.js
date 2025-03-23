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
const chatRoutes = require('./routes/chat');
const Message = require('./models/Message');
const User = require('./models/User');

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
app.use('/chat', chatRoutes);

// Track users in rooms
const rooms = {};
const userSocketMap = {}; // Maps socketId to userId (when authenticated)

// Socket.io for WebRTC signaling and chat
io.on('connection', socket => {
  console.log('User connected:', socket.id);
  
  // Store user identity when authenticated
  socket.on('authenticate', async (userData) => {
    try {
      const { userId, userName } = userData;
      userSocketMap[socket.id] = { userId, userName };
      console.log(`Socket ${socket.id} authenticated as user ${userName} (${userId})`);
    } catch (error) {
      console.error('Authentication error:', error);
    }
  });
  
  // Join a room
  socket.on('join-room', async (roomId) => {
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
    
    // Create and broadcast a system message for user join
    if (userSocketMap[socket.id]) {
      try {
        const { userName, userId } = userSocketMap[socket.id];
        
        const systemMessage = new Message({
          roomId,
          senderId: userId,
          senderName: 'System',
          content: `${userName} has joined the room.`,
          system: true
        });
        
        await systemMessage.save();
        
        // Broadcast to all users in the room including sender
        io.to(roomId).emit('chat-message', {
          ...systemMessage.toObject(),
          createdAt: new Date()
        });
      } catch (error) {
        console.error('Error creating system message:', error);
      }
    }
  });
  
  // Handle chat messages
  socket.on('send-message', async (messageData) => {
    try {
      const { roomId, content } = messageData;
      
      if (!socket.roomId || socket.roomId !== roomId) {
        console.error('Error: Socket not in the specified room');
        return;
      }
      
      if (!userSocketMap[socket.id]) {
        console.error('Error: Unauthenticated user cannot send messages');
        return;
      }
      
      const { userId, userName } = userSocketMap[socket.id];
      
      // Create and save message to MongoDB
      const message = new Message({
        roomId,
        senderId: userId,
        senderName: userName,
        content,
        system: false
      });
      
      await message.save();
      
      // Broadcast to all users in the room including sender
      io.to(roomId).emit('chat-message', message.toObject());
      
      console.log(`Message from ${userName} in room ${roomId}: ${content}`);
    } catch (error) {
      console.error('Error sending chat message:', error);
      socket.emit('chat-error', { message: 'Failed to send message' });
    }
  });
  
  // Leave a room
  socket.on('leave-room', async () => {
    await leaveRoom(socket);
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
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    await leaveRoom(socket);
    
    // Remove from user socket map
    delete userSocketMap[socket.id];
  });
  
  // Helper function to handle room leaving logic
  async function leaveRoom(socket) {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId]) {
      // Create and broadcast a system message for user leave
      if (userSocketMap[socket.id]) {
        try {
          const { userName, userId } = userSocketMap[socket.id];
          
          const systemMessage = new Message({
            roomId,
            senderId: userId,
            senderName: 'System',
            content: `${userName} has left the room.`,
            system: true
          });
          
          await systemMessage.save();
          
          // Broadcast to all users in the room
          socket.to(roomId).emit('chat-message', {
            ...systemMessage.toObject(),
            createdAt: new Date()
          });
        } catch (error) {
          console.error('Error creating system message:', error);
        }
      }
      
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
