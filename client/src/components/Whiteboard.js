import React, { useRef, useEffect, useState } from 'react';
import DrawingCanvas from './DrawingCanvas';
import Toolbar from './Toolbar';
import UserCursors from './UserCursors';

const Whiteboard = ({ socket, roomId }) => {
  const canvasRef = useRef(null);
  const [drawingColor, setDrawingColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [cursors, setCursors] = useState(new Map());

  useEffect(() => {
    if (!socket) return;

    // Handle cursor movements from other users
    const handleCursorMove = (data) => {
      setCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.set(data.userId, { x: data.x, y: data.y });
        return newCursors;
      });
    };

    // Handle user leaving
    const handleUserLeft = (userId) => {
      setCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.delete(userId);
        return newCursors;
      });
    };

    // Handle loading existing drawing data
    const handleLoadDrawingData = (drawingData) => {
      if (canvasRef.current) {
        canvasRef.current.loadDrawingData(drawingData);
      }
    };

    socket.on('cursor-move', handleCursorMove);
    socket.on('user-left', handleUserLeft);
    socket.on('load-drawing-data', handleLoadDrawingData);

    return () => {
      socket.off('cursor-move', handleCursorMove);
      socket.off('user-left', handleUserLeft);
      socket.off('load-drawing-data', handleLoadDrawingData);
    };
  }, [socket]);

  const handleClearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
      socket.emit('clear-canvas');
    }
  };

  return (
    <div className="whiteboard">
      <div className="whiteboard-canvas">
        <DrawingCanvas
          ref={canvasRef}
          socket={socket}
          color={drawingColor}
          strokeWidth={strokeWidth}
          onCursorMove={(x, y) => {
            if (socket) {
              socket.emit('cursor-move', { x, y });
            }
          }}
        />
        <UserCursors cursors={cursors} />
      </div>
      
      <Toolbar
        color={drawingColor}
        strokeWidth={strokeWidth}
        onColorChange={setDrawingColor}
        onStrokeWidthChange={setStrokeWidth}
        onClearCanvas={handleClearCanvas}
      />
    </div>
  );
};

export default Whiteboard;