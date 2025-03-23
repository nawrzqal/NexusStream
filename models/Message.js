// models/Message.js - Mongoose schema for chat messages
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  system: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Create a compound index for efficient queries
messageSchema.index({ roomId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema); 