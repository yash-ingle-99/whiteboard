const express = require('express');
const Room = require('../models/Room');
const router = express.Router();

// Generate a random room ID
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Join or create a room
router.post('/join', async (req, res) => {
  try {
    let { roomId } = req.body;
    
    // If no roomId provided, generate a new one
    if (!roomId) {
      do {
        roomId = generateRoomId();
      } while (await Room.findOne({ roomId }));
    }

    // Find existing room or create new one
    let room = await Room.findOne({ roomId });
    
    if (!room) {
      room = new Room({ roomId });
      await room.save();
    } else {
      // Update last activity
      room.lastActivity = new Date();
      await room.save();
    }

    res.json({ 
      success: true, 
      roomId: room.roomId,
      drawingData: room.drawingData 
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get room information
router.get('/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    res.json({ 
      success: true, 
      room: {
        roomId: room.roomId,
        createdAt: room.createdAt,
        drawingData: room.drawingData
      }
    });
  } catch (error) {
    console.error('Error getting room:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;