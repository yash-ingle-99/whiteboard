import React, { useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';

// Throttle function for cursor updates (~60fps = ~16ms intervals)
const throttle = (func, limit) => {
  let lastFunc;
  let lastRan;
  return function() {
    const context = this;
    const args = arguments;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

const DrawingCanvas = forwardRef(({ socket, color, strokeWidth, onCursorMove }, ref) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef(null);
  const cursorInactivityTimer = useRef(null);
  const isMouseInCanvas = useRef(false);

  // Clear canvas function
  const clearCanvasLocal = useCallback(() => {
    if (contextRef.current && canvasRef.current) {
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, []);

  // Throttled cursor move function (60fps = ~16ms)
  const throttledCursorMove = useCallback(
    throttle((x, y) => {
      if (socket && isMouseInCanvas.current) {
        onCursorMove(x, y);
        socket.emit('cursor-move', { x, y });
        
        // Reset inactivity timer
        clearTimeout(cursorInactivityTimer.current);
        cursorInactivityTimer.current = setTimeout(() => {
          if (socket) {
            socket.emit('cursor-inactive');
          }
        }, 2000); // Hide cursor after 2 seconds of inactivity
      }
    }, 16),
    [socket, onCursorMove]
  );

  // Get coordinates from event
  const getCoordinates = useCallback((event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    
    if (event.touches) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  // Compress drawing data (simple compression for large paths)
  const compressDrawingData = useCallback((data) => {
    // Round coordinates to reduce precision and data size
    return {
      ...data,
      x: Math.round(data.x * 10) / 10,
      y: Math.round(data.y * 10) / 10
    };
  }, []);

  // Load drawing data from server
  const loadDrawingData = useCallback((drawingData) => {
    if (!contextRef.current || !canvasRef.current) return;
    
    clearCanvasLocal();
    
    drawingData.forEach(command => {
      if (command.type === 'clear') {
        clearCanvasLocal();
      } else if (command.type === 'stroke') {
        const { data } = command;
        
        if (data.action === 'start') {
          contextRef.current.strokeStyle = data.color || '#000000';
          contextRef.current.lineWidth = data.strokeWidth || 2;
          contextRef.current.beginPath();
          contextRef.current.moveTo(data.x, data.y);
        } else if (data.action === 'move') {
          contextRef.current.lineTo(data.x, data.y);
          contextRef.current.stroke();
        } else if (data.action === 'end') {
          contextRef.current.closePath();
        }
      }
    });
  }, [clearCanvasLocal]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      const context = canvas.getContext('2d');
      context.scale(1, 1);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.imageSmoothingEnabled = true;
      context.strokeStyle = color;
      context.lineWidth = strokeWidth;
      contextRef.current = context;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearTimeout(cursorInactivityTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update drawing properties when color or strokeWidth changes
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = strokeWidth;
    }
  }, [color, strokeWidth]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleDrawStart = (data) => {
      if (contextRef.current) {
        contextRef.current.strokeStyle = data.color;
        contextRef.current.lineWidth = data.strokeWidth;
        contextRef.current.beginPath();
        contextRef.current.moveTo(data.x, data.y);
      }
    };

    const handleDrawMove = (data) => {
      if (contextRef.current) {
        contextRef.current.lineTo(data.x, data.y);
        contextRef.current.stroke();
      }
    };

    const handleDrawEnd = () => {
      if (contextRef.current) {
        contextRef.current.closePath();
      }
    };

    const handleClearCanvas = () => {
      clearCanvasLocal();
    };

    socket.on('draw-start', handleDrawStart);
    socket.on('draw-move', handleDrawMove);
    socket.on('draw-end', handleDrawEnd);
    socket.on('clear-canvas', handleClearCanvas);

    return () => {
      socket.off('draw-start', handleDrawStart);
      socket.off('draw-move', handleDrawMove);
      socket.off('draw-end', handleDrawEnd);
      socket.off('clear-canvas', handleClearCanvas);
    };
  }, [socket, clearCanvasLocal]);

  // Drawing event handlers
  const startDrawing = useCallback((event) => {
    event.preventDefault();
    if (!contextRef.current) return;

    const coords = getCoordinates(event);
    isDrawing.current = true;
    lastPoint.current = coords;

    contextRef.current.beginPath();
    contextRef.current.moveTo(coords.x, coords.y);

    if (socket) {
      const compressedData = compressDrawingData({
        x: coords.x,
        y: coords.y,
        color,
        strokeWidth
      });
      socket.emit('draw-start', compressedData);
    }
  }, [socket, color, strokeWidth, getCoordinates, compressDrawingData]);

  const draw = useCallback((event) => {
    event.preventDefault();
    if (!isDrawing.current || !contextRef.current) return;

    const coords = getCoordinates(event);
    
    contextRef.current.lineTo(coords.x, coords.y);
    contextRef.current.stroke();
    
    lastPoint.current = coords;

    if (socket) {
      const compressedData = compressDrawingData({
        x: coords.x,
        y: coords.y
      });
      socket.emit('draw-move', compressedData);
    }
  }, [socket, getCoordinates, compressDrawingData]);

  const finishDrawing = useCallback((event) => {
    if (!isDrawing.current) return;
    
    isDrawing.current = false;
    contextRef.current?.closePath();
    lastPoint.current = null;

    if (socket) {
      socket.emit('draw-end', {});
    }
  }, [socket]);

  // Enhanced mouse movement handler
  const handleMouseMove = useCallback((event) => {
    const coords = getCoordinates(event);
    
    // Use throttled cursor movement
    throttledCursorMove(coords.x, coords.y);
    
    // Handle drawing
    if (isDrawing.current) {
      draw(event);
    }
  }, [draw, getCoordinates, throttledCursorMove]);

  // Mouse enter/leave handlers for cursor tracking
  const handleMouseEnter = useCallback(() => {
    isMouseInCanvas.current = true;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isMouseInCanvas.current = false;
    finishDrawing();
    
    // Send cursor inactive event
    if (socket) {
      socket.emit('cursor-inactive');
    }
    
    clearTimeout(cursorInactivityTimer.current);
  }, [finishDrawing, socket]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    clearCanvas: clearCanvasLocal,
    loadDrawingData
  }), [clearCanvasLocal, loadDrawingData]);

  return (
    <canvas
      ref={canvasRef}
      className="drawing-canvas"
      onMouseDown={startDrawing}
      onMouseMove={handleMouseMove}
      onMouseUp={finishDrawing}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={finishDrawing}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;