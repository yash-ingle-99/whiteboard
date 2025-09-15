import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import RoomJoin from './components/RoomJoin';
import Whiteboard from './components/Whiteboard';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('user-count-update', (count) => {
      setUserCount(count);
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  const joinRoom = async (roomCode) => {
    try {
      const response = await fetch('http://localhost:5000/api/rooms/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId: roomCode }),
      });

      const data = await response.json();
      
      if (data.success) {
        setRoomId(data.roomId);
        socket.emit('join-room', data.roomId);
      } else {
        console.error('Failed to join room:', data.error);
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const leaveRoom = () => {
    setRoomId('');
    setUserCount(0);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Collaborative Whiteboard</h1>
        <div className="status-bar">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
          {roomId && (
            <div className="room-info">
              <span className="room-code">Room: {roomId}</span>
              <span className="user-count">Users: {userCount}</span>
              <button className="leave-btn" onClick={leaveRoom}>Leave Room</button>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        {!roomId ? (
          <RoomJoin onJoinRoom={joinRoom} />
        ) : (
          <Whiteboard socket={socket} roomId={roomId} />
        )}
      </main>
    </div>
  );
}

export default App;