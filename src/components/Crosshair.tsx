import React from 'react';

export const Crosshair: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '16px',
        height: '16px',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      {/* Horizontal bar */}
      <div
        style={{
          position: 'absolute',
          top: '7px',
          left: '0px',
          width: '16px',
          height: '2px',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          boxShadow: '0 0 1px #000',
        }}
      />
      {/* Vertical bar */}
      <div
        style={{
          position: 'absolute',
          top: '0px',
          left: '7px',
          width: '2px',
          height: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          boxShadow: '0 0 1px #000',
        }}
      />
    </div>
  );
};
