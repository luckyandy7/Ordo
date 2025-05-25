const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  chatRoom: {
    type: String,
    required: true,
    default: 'general'
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// 인덱스 설정 (성능 최적화)
messageSchema.index({ chatRoom: 1, timestamp: -1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', messageSchema); 