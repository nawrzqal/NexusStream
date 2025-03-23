// controllers/chat.js - Controller for chat functionality
const Message = require('../models/Message');
const User = require('../models/User');

// Get chat messages for a specific room
exports.getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;
    
    let query = { roomId };
    
    // If 'before' is specified, get messages before that timestamp
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
    
    // Return messages in chronological order
    res.status(200).json({
      messages: messages.reverse(),
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

// Create a new message
exports.createMessage = async (req, res, next) => {
  try {
    const { roomId, content } = req.body;
    const userId = req.userId;
    
    // Find user to get name
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    const message = new Message({
      roomId,
      senderId: userId,
      senderName: user.name,
      content,
      system: false
    });
    
    const savedMessage = await message.save();
    
    res.status(201).json({
      message: 'Message created successfully',
      data: savedMessage
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

// Create a system message (admin only)
exports.createSystemMessage = async (req, res, next) => {
  try {
    const { roomId, content } = req.body;
    
    const message = new Message({
      roomId,
      senderId: req.userId,
      senderName: 'System',
      content,
      system: true
    });
    
    const savedMessage = await message.save();
    
    res.status(201).json({
      message: 'System message created successfully',
      data: savedMessage
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
}; 