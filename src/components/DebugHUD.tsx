import React, { useState, useEffect } from 'react';
import { Settings, Smartphone, Monitor } from 'lucide-react';

interface DebugHUDProps {
  coords?: { x: number; y: number; z: number };
  fps?: number;
  lookingAt?: { x: number; y: number; z: number; type: string } | null;
  yaw?: number;
  biome?: string;
  isMobileMode: boolean;
  onToggleMobileMode: () => void;
  onOpenSettings?: () => void;
}

export const DebugHUD: React.FC<DebugHUDProps> = ({
  coords,
  fps,
  lookingAt,
  yaw = 0,
  biome = 'Равнины',
  isMobileMode,
  onToggleMobileMode,
  onOpenSettings,
}) => {
  // Debug menu is HIDDEN by default as requested by user! Can be toggled with F3 key.
  const [showF3Debug, setShowF3Debug] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'F3') {
        e.preventDefault();
        setShowF3Debug((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const normalizedYaw = ((yaw % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  let direction = 'Север (Z-)';
  if (normalizedYaw >= Math.PI * 0.25 && normalizedYaw < Math.PI * 0.75) {
    direction = 'Запад (X-)';
  } else if (normalizedYaw >= Math.PI * 0.75 && normalizedYaw < Math.PI * 1.25) {
    direction = 'Юг (Z+)';
  } else if (normalizedYaw >= Math.PI * 1.25 && normalizedYaw < Math.PI * 1.75) {
    direction = 'Восток (X+)';
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none', zIndex: 60 }}>
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '12px 16px',
        }}
      >
        {/* Left: Authentic Minecraft 1.0 Alpha Watermark */}
        <div style={{ pointerEvents: 'auto' }}>
          <div
            style={{
              color: '#ffffff',
              textShadow: '2px 2px 0px #000000',
              fontFamily: 'monospace',
              fontSize: '15px',
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              userSelect: 'none',
              padding: '2px 4px',
            }}
          >
            ProjectCraft 1.0 Alpha
          </div>

          {/* Optional F3 Debug (Hidden by default, toggled with F3) */}
          {showF3Debug && coords && (
            <div
              style={{
                marginTop: '6px',
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                color: '#eee',
                padding: '8px 12px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: 1.4,
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <div>FPS: <span style={{ color: (fps || 60) >= 50 ? '#4ade80' : '#facc15' }}>{fps || 60}</span></div>
              <div>XYZ: {coords.x.toFixed(1)} / {coords.y.toFixed(1)} / {coords.z.toFixed(1)}</div>
              <div>Биом: <span style={{ color: '#86efac' }}>{biome}</span></div>
              <div>Направление: <span style={{ color: '#93c5fd' }}>{direction}</span></div>
              {lookingAt && (
                <div style={{ color: '#fef08a' }}>
                  Цель: {lookingAt.type} ({lookingAt.x}, {lookingAt.y}, {lookingAt.z})
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Action buttons */}
        <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto' }}>
          {/* Settings Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              title="Настройки (Settings / Options)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#3f3f46',
                color: '#fff',
                borderTop: '2px solid #71717a',
                borderLeft: '2px solid #71717a',
                borderRight: '2px solid #18181b',
                borderBottom: '2px solid #18181b',
                padding: '6px 12px',
                fontSize: '13px',
                fontFamily: 'monospace',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
            >
              <Settings size={16} />
              <span>Настройки</span>
            </button>
          )}

          {/* Mobile Mode Toggle */}
          <button
            onClick={onToggleMobileMode}
            title={isMobileMode ? 'Режим ПК (мышь)' : 'Мобильный режим (джойстик)'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              backgroundColor: isMobileMode ? '#16a34a' : '#3f3f46',
              color: '#fff',
              borderTop: '2px solid #71717a',
              borderLeft: '2px solid #71717a',
              borderRight: '2px solid #18181b',
              borderBottom: '2px solid #18181b',
              cursor: 'pointer',
            }}
          >
            {isMobileMode ? <Smartphone size={16} /> : <Monitor size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};
