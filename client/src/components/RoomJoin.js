import React, { useState } from 'react';

const RoomJoin = ({ onJoinRoom }) => {
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roomCode.trim() || isJoining) return;
    
    setIsJoining(true);
    try {
      await onJoinRoom(roomCode.trim().toUpperCase());
    } catch (error) {
      console.error('Error joining room:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const createNewRoom = async () => {
    setIsJoining(true);
    try {
      await onJoinRoom(''); // Empty string will create a new room
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 8) {
      setRoomCode(value);
    }
  };

  return (
    <div className="room-join">
      <div className="room-join-content">
        <h2>Join Whiteboard</h2>
        <p className="room-join-subtitle">
          Collaborate in real-time with your team
        </p>
        
        <form className="room-join-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="roomCode">Enter Room Code</label>
            <input
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={handleInputChange}
              placeholder="ABC123"
              maxLength="8"
              disabled={isJoining}
            />
          </div>
          
          <button 
            type="submit" 
            className="join-btn"
            disabled={!roomCode.trim() || isJoining}
          >
            {isJoining ? 'Joining...' : 'Join Room'}
          </button>
          
          <div className="create-new">
            <p>Don't have a room code?</p>
            <button 
              type="button" 
              className="create-btn"
              onClick={createNewRoom}
              disabled={isJoining}
            >
              {isJoining ? 'Creating...' : 'Create New Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomJoin;
