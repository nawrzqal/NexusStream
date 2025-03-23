// routes/chat.js - Routes for chat functionality
const express = require('express');
const chatController = require('../controllers/chat');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// GET /chat/room/:roomId - Get messages for a specific room
router.get('/room/:roomId', isAuth, chatController.getRoomMessages);

// POST /chat/message - Create a new message
router.post('/message', isAuth, chatController.createMessage);

// POST /chat/system-message - Create a system message (admin only)
router.post('/system-message', isAuth, chatController.createSystemMessage);

module.exports = router; 