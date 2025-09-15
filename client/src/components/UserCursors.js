import React, { useEffect, useState } from 'react';

const UserCursors = ({ cursors }) => {
  const [activeCursors, setActiveCursors] = useState(new Map());

  // Handle cursor inactivity
  useEffect(() => {
    if (!cursors) return;

    setActiveCursors(prevActive => {
      const newActive = new Map(prevActive);
      
      // Add or update active cursors
      for (const [userId, position] of cursors.entries()) {
        newActive.set(userId, {
          ...position,
          active: true,
          lastSeen: Date.now()
        });
      }

      return newActive;
    });
  }, [cursors]);

  // Generate consistent colors for each user
  const getUserColor = (userId) => {
    const colors = [
      '#ff4444', '#44ff44', '#4444ff', '#ffff44', 
      '#ff44ff', '#44ffff', '#ff8844', '#8844ff',
      '#44ff88', '#ff4488', '#88ff44', '#4488ff'
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Hide inactive cursors after timeout
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActiveCursors(prev => {
        const updated = new Map();
        for (const [userId, cursor] of prev.entries()) {
          if (now - cursor.lastSeen < 3000) { // Keep for 3 seconds
            updated.set(userId, cursor);
          }
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="user-cursors">
      {Array.from(activeCursors.entries()).map(([userId, cursor]) => (
        <div
          key={userId}
          className={`cursor ${cursor.active ? 'cursor-active' : 'cursor-inactive'}`}
          style={{
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
            backgroundColor: getUserColor(userId),
            opacity: cursor.active ? 1 : 0.5,
            transform: `translate(-10px, -10px) scale(${cursor.active ? 1 : 0.8})`,
            transition: 'all 0.1s ease-out'
          }}
        >
          {/* Optional: Add user indicator */}
          <div className="cursor-label">
            User {userId.slice(-3)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserCursors;