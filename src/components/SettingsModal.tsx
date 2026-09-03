import React from 'react';

export type FogDistanceOption = 'tiny' | 'short' | 'normal' | 'far';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fogDistance: FogDistanceOption;
  onChangeFogDistance: (dist: FogDistanceOption) => void;
  isFogEnabled: boolean;
  onToggleFog: () => void;
  fov: number;
  onChangeFov: (fov: number) => void;
  sensitivity: number;
  onChangeSensitivity: (sens: number) => void;
  isMusicMuted: boolean;
  onToggleMusic: () => void;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  isMobileMode: boolean;
  onToggleMobileMode: () => void;
  onQuitToTitle?: () => void;
}

const FOG_LABELS: Record<FogDistanceOption, { label: string; desc: string }> = {
  tiny: { label: 'Очень близко (Tiny)', desc: '24 м - макс. FPS' },
  short: { label: 'Близко (Short)', desc: '42 м' },
  normal: { label: 'Нормально (Normal)', desc: '62 м - баланс' },
  far: { label: 'Далеко (Far)', desc: '92 м - атмосфера' },
};

const minecraftButtonStyle: React.CSSProperties = {
  backgroundColor: '#3f3f46',
  color: '#ffffff',
  padding: '10px 14px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: '13px',
  borderTop: '2px solid #71717a',
  borderLeft: '2px solid #71717a',
  borderRight: '2px solid #18181b',
  borderBottom: '2px solid #18181b',
  textShadow: '1px 1px 1px #000',
  transition: 'background-color 0.15s',
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  fogDistance,
  onChangeFogDistance,
  isFogEnabled,
  onToggleFog,
  fov,
  onChangeFov,
  sensitivity,
  onChangeSensitivity,
  isMusicMuted,
  onToggleMusic,
  isSoundMuted,
  onToggleSound,
  isMobileMode,
  onToggleMobileMode,
  onQuitToTitle,
}) => {
  if (!isOpen) return null;

  const cycleFogDistance = () => {
    const sequence: FogDistanceOption[] = ['tiny', 'short', 'normal', 'far'];
    const nextIdx = (sequence.indexOf(fogDistance) + 1) % sequence.length;
    onChangeFogDistance(sequence[nextIdx]);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(5px)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        userSelect: 'none',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#27272a',
          borderTop: '3px solid #71717a',
          borderLeft: '3px solid #71717a',
          borderRight: '3px solid #18181b',
          borderBottom: '3px solid #18181b',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85)',
          width: '520px',
          maxWidth: '92vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          color: '#ffffff',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              fontSize: '22px',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              textShadow: '2px 2px 0px #000',
              color: '#facc15',
            }}
          >
            Настройки
          </div>
          <div style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>
            ProjectCraft 1.0 Alpha
          </div>
        </div>

        {/* Options Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '24px' }}>
          {/* 1. Fog Distance */}
          <button
            onClick={cycleFogDistance}
            style={minecraftButtonStyle}
          >
            <span>🌫️ Дальность тумана:</span>
            <span style={{ color: '#67e8f9', fontWeight: 'bold' }}>
              {FOG_LABELS[fogDistance].label}
            </span>
          </button>

          {/* 2. Fog Toggle */}
          <button
            onClick={onToggleFog}
            style={minecraftButtonStyle}
          >
            <span>☁️ Атмосферный туман:</span>
            <span style={{ color: isFogEnabled ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
              {isFogEnabled ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}
            </span>
          </button>

          {/* 3. FOV Slider */}
          <div
            style={{
              backgroundColor: '#18181b',
              padding: '10px 14px',
              border: '2px solid #3f3f46',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>👁️ Угол обзора (FOV):</span>
              <span style={{ color: '#facc15', fontWeight: 'bold' }}>
                {fov}° {fov === 75 ? '(Обычный)' : fov >= 95 ? '(Quake Pro)' : ''}
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={100}
              step={1}
              value={fov}
              onChange={(e) => onChangeFov(parseInt(e.target.value, 10))}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#16a34a' }}
            />
          </div>

          {/* 4. Mouse Sensitivity Slider */}
          <div
            style={{
              backgroundColor: '#18181b',
              padding: '10px 14px',
              border: '2px solid #3f3f46',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>🎯 Чувствительность мыши:</span>
              <span style={{ color: '#facc15', fontWeight: 'bold' }}>
                {Math.round(sensitivity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={200}
              step={5}
              value={Math.round(sensitivity * 100)}
              onChange={(e) => onChangeSensitivity(parseInt(e.target.value, 10) / 100)}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#16a34a' }}
            />
          </div>

          {/* 5. Audio Settings */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={onToggleMusic}
              style={minecraftButtonStyle}
            >
              <span>🎵 Музыка:</span>
              <span style={{ color: !isMusicMuted ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                {!isMusicMuted ? 'ВКЛ' : 'ВЫКЛ'}
              </span>
            </button>

            <button
              onClick={onToggleSound}
              style={minecraftButtonStyle}
            >
              <span>🔊 Звуки:</span>
              <span style={{ color: !isSoundMuted ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                {!isSoundMuted ? 'ВКЛ' : 'ВЫКЛ'}
              </span>
            </button>
          </div>

          {/* 6. Controls Mode */}
          <button
            onClick={onToggleMobileMode}
            style={minecraftButtonStyle}
          >
            <span>📱 Управление:</span>
            <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>
              {isMobileMode ? 'Мобильное (Джойстик)' : 'ПК (Мышь + Клавиатура)'}
            </span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              ...minecraftButtonStyle,
              backgroundColor: '#15803d',
              borderColor: '#22c55e #14532d #14532d #22c55e',
              justifyContent: 'center',
              fontSize: '15px',
              padding: '12px',
              fontWeight: 'bold',
            }}
          >
            ✅ Готово (Вернуться в игру)
          </button>

          {onQuitToTitle && (
            <button
              onClick={onQuitToTitle}
              style={{
                ...minecraftButtonStyle,
                backgroundColor: '#991b1b',
                borderColor: '#ef4444 #450a0a #450a0a #ef4444',
                justifyContent: 'center',
                fontSize: '14px',
                padding: '10px',
              }}
            >
              🚪 Сохранить и выйти в главное меню
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
