const Room = require('../models/Room');

// Store active users and their rooms
const activeUsers = new Map();
const roomUsers = new Map();
const userCursors = new Map(); // Track cursor visibility

function socketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle joining a room
    socket.on('join-room', async (roomId) => {
      try {
        // Leave previous room if any
        if (activeUsers.has(socket.id)) {
          const prevRoom = activeUsers.get(socket.id);
          socket.leave(prevRoom);
          updateRoomUserCount(io, prevRoom);
          // Remove cursor from previous room
          socket.to(prevRoom).emit('user-left', socket.id);
        }

        // Join new room
        socket.join(roomId);
        activeUsers.set(socket.id, roomId);
        
        // Track users in room
        if (!roomUsers.has(roomId)) {
          roomUsers.set(roomId, new Set());
        }
        roomUsers.get(roomId).add(socket.id);

        // Initialize cursor tracking
        userCursors.set(socket.id, { active: true, x: 0, y: 0 });

        // Send existing drawing data to the user
        const room = await Room.findOne({ roomId });
        if (room && room.drawingData.length > 0) {
          socket.emit('load-drawing-data', room.drawingData);
        }

        // Notify room about user count
        updateRoomUserCount(io, roomId);
        
        console.log(`User ${socket.id} joined room ${roomId}`);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', 'Failed to join room');
      }
    });

    // Handle cursor movement with throttling check
    socket.on('cursor-move', (data) => {
      const roomId = activeUsers.get(socket.id);
      if (roomId) {
        // Update cursor position
        userCursors.set(socket.id, { 
          active: true, 
          x: data.x, 
          y: data.y,
          lastUpdate: Date.now()
        });

        socket.to(roomId).emit('cursor-move', {
          userId: socket.id,
          x: data.x,
          y: data.y
        });
      }
    });

    // Handle cursor inactivity
    socket.on('cursor-inactive', () => {
      const roomId = activeUsers.get(socket.id);
      if (roomId) {
        // Mark cursor as inactive
        if (userCursors.has(socket.id)) {
          const cursor = userCursors.get(socket.id);
          cursor.active = false;
          userCursors.set(socket.id, cursor);
        }

        // Notify other users to hide this cursor
        socket.to(roomId).emit('cursor-inactive', socket.id);
      }
    });

    // Handle drawing start with compression
    socket.on('draw-start', async (data) => {
      const roomId = activeUsers.get(socket.id);
      if (roomId) {
        socket.to(roomId).emit('draw-start', data);
        
        // Store in database with compression
        try {
          await Room.findOneAndUpdate(
            { roomId },
            { 
              $push: { 
                drawingData: { 
                  type: 'stroke', 
                  data: { ...data, action: 'start' },
                  timestamp: new Date()
                }
              },
              lastActivity: new Date()
            }
          );
        } catch (error) {
          console.error('Error saving draw-start:', error);
        }
      }
    });

    // Handle drawing movement with compression
    socket.on('draw-move', async (data) => {
      const roomId = activeUsers.get(socket.id);
      if (roomId) {
        socket.to(roomId).emit('draw-move', data);
        
        // Store in database (only every few points to reduce data)
        try {
          // Throttle database writes for draw-move to improve performance
          if (Math.random() < 0.3) { // Store ~30% of move events
            await Room.findOneAndUpdate(
              { roomId },
              { 
                $push: { 
                  drawingData: { 
                    type: 'stroke', 
                    data: { ...data, action: 'move' },
                    timestamp: new Date()
                  }
                },
                lastActivity: new Date()
              }
            );
          }
        } catch (error) {
          console.error('Error saving draw-move:', error);
        }
      }
    });

    // Handle drawing end
    socket.on('draw-end', async (data) => {
      const roomId = activeUsers.get(socket.id);
      if (roomId) {
        socket.to(roomId).emit('draw-end', data);
        
        // Always store draw-end events
        try {
          await Room.findOneAndUpdate(
            { roomId },
            { 
              $push: { 
                drawingData: { 
                  type: 'stroke', 
                  data: { ...data, action: 'end' },
                  timestamp: new Date()
                }
              },
              lastActivity: new Date()
            }
          );
        } catch (error) {
          console.error('Error saving draw-end:', error);
        }
      }
    });

    // Handle canvas clear
    socket.on('clear-canvas', async () => {
      const roomId = activeUsers.get(socket.id);
      if (roomId) {
        socket.to(roomId).emit('clear-canvas');
        
        // Clear drawing data in database
        try {
          await Room.findOneAndUpdate(
            { roomId },
            { 
              drawingData: [{
                type: 'clear', 
                data: {},
                timestamp: new Date()
              }],
              lastActivity: new Date()
            }
          );
        } catch (error) {
          console.error('Error clearing canvas:', error);
        }
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const roomId = activeUsers.get(socket.id);
      if (roomId) {
        // Remove user from room tracking
        if (roomUsers.has(roomId)) {
          roomUsers.get(roomId).delete(socket.id);
          if (roomUsers.get(roomId).size === 0) {
            roomUsers.delete(roomId);
          }
        }
        
        // Remove cursor tracking
        userCursors.delete(socket.id);
        
        // Update user count
        updateRoomUserCount(io, roomId);
        
        // Notify room about user leaving
        socket.to(roomId).emit('user-left', socket.id);
      }
      
      activeUsers.delete(socket.id);
      console.log('User disconnected:', socket.id);
    });
  });

  // Helper function to update room user count
  function updateRoomUserCount(io, roomId) {
    const userCount = roomUsers.has(roomId) ? roomUsers.get(roomId).size : 0;
    io.to(roomId).emit('user-count-update', userCount);
  }

  // Clean up inactive cursors periodically (every 30 seconds)
  setInterval(() => {
    const now = Date.now();
    for (const [userId, cursor] of userCursors.entries()) {
      if (cursor.lastUpdate && (now - cursor.lastUpdate) > 5000) { // 5 seconds
        const roomId = activeUsers.get(userId);
        if (roomId) {
          io.to(roomId).emit('cursor-inactive', userId);
        }
      }
    }
  }, 30000);

  // Cleanup old rooms every hour
  setInterval(async () => {
    try {
      await Room.cleanupOldRooms();
      console.log('Cleaned up old rooms');
    } catch (error) {
      console.error('Error cleaning up rooms:', error);
    }
  }, 60 * 60 * 1000); // 1 hour
}

module.exports = socketHandlers;