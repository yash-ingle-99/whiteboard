const mongoose = require('mongoose');

const drawingCommandSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['stroke', 'clear']
  },
  data: {
    type: Object,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  drawingData: [drawingCommandSchema]
});

// Clean up rooms inactive for more than 24 hours
roomSchema.statics.cleanupOldRooms = function() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.deleteMany({ lastActivity: { $lt: oneDayAgo } });
};

module.exports = mongoose.model('Room', roomSchema);