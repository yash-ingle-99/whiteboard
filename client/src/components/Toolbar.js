import React from 'react';

const Toolbar = ({ color, strokeWidth, onColorChange, onStrokeWidthChange, onClearCanvas }) => {
  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'Red', value: '#f44336' },
    { name: 'Blue', value: '#2196f3' },
    { name: 'Green', value: '#4caf50' }
  ];

  const handleStrokeWidthChange = (event) => {
    onStrokeWidthChange(parseInt(event.target.value));
  };

  const handleClearClick = () => {
    if (window.confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
      onClearCanvas();
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h3>Colors</h3>
        <div className="color-picker">
          {colors.map((colorOption) => (
            <button
              key={colorOption.value}
              className={`color-option ${color === colorOption.value ? 'active' : ''}`}
              style={{ backgroundColor: colorOption.value }}
              onClick={() => onColorChange(colorOption.value)}
              title={colorOption.name}
              aria-label={`Select ${colorOption.name} color`}
            />
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <h3>Stroke Width</h3>
        <input
          type="range"
          min="1"
          max="20"
          value={strokeWidth}
          onChange={handleStrokeWidthChange}
          className="stroke-width-slider"
          aria-label="Stroke width"
        />
        <div className="stroke-width-preview">
          <div
            className="stroke-preview-circle"
            style={{
              width: `${strokeWidth * 2}px`,
              height: `${strokeWidth * 2}px`,
              backgroundColor: color
            }}
          />
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
            {strokeWidth}px
          </div>
        </div>
      </div>

      <div className="toolbar-section">
        <h3>Actions</h3>
        <button
          className="clear-btn"
          onClick={handleClearClick}
          aria-label="Clear canvas"
        >
          Clear Canvas
        </button>
      </div>
    </div>
  );
};

export default Toolbar;