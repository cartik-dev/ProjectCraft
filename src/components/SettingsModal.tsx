import React, { useState } from 'react';

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
  const [showCredits, setShowCredits] = useState(false);

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
        if (e.target === e.currentTarget) {
          setShowCredits(false);
          onClose();
        }
      }}
    >
      {showCredits ? (
        /* Credits View */
        <div
          style={{
            backgroundColor: '#18181b',
            borderTop: '3px solid #71717a',
            borderLeft: '3px solid #71717a',
            borderRight: '3px solid #09090b',
            borderBottom: '3px solid #09090b',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85)',
            width: '540px',
            maxWidth: '92vw',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            color: '#ffffff',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
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
              📜 Титры и Авторы
            </div>
            <div style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>
              ProjectCraft 1.0 Alpha
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            {/* Developer */}
            <div style={{ backgroundColor: '#27272a', padding: '12px 14px', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ color: '#93c5fd', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Разработка & Концепт
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginTop: '2px' }}>
                Cartik
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                Главный разработчик, проектирование механик и геймплея
              </div>
            </div>

            {/* AI Assistant & Engine Architecture */}
            <div style={{ backgroundColor: '#27272a', padding: '12px 14px', borderLeft: '4px solid #a855f7' }}>
              <div style={{ color: '#d8b4fe', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                AI-Архитектура & Программирование
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginTop: '2px' }}>
                Gemini (Google DeepMind)
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                Помощь в разработке воксельного движка, физики, логики мобов и процедурной генерации
              </div>
            </div>

            {/* Audio & Visual Effects */}
            <div style={{ backgroundColor: '#27272a', padding: '12px 14px', borderLeft: '4px solid #22c55e' }}>
              <div style={{ color: '#86efac', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Визуальные и звуковые эффекты
              </div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff', marginTop: '2px' }}>
                Созданы при поддержке Gemini & Three.js
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                Синтез аудиоэффектов, шейдеры, частицы, освещение и пиксельный интерфейс
              </div>
            </div>

            {/* Original OST */}
            <div style={{ backgroundColor: '#27272a', padding: '12px 14px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ color: '#fde68a', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Оригинальный Саундтрек
              </div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff', marginTop: '2px' }}>
                C418 — Minecraft Volume Alpha
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                Легендарные композиции Daniel Rosenfeld (Subwoofer Lullaby, Living Mice, Wet Hands, Sweden и др.)
              </div>
            </div>

            {/* Original Game Concept */}
            <div style={{ backgroundColor: '#27272a', padding: '12px 14px', borderLeft: '4px solid #ec4899' }}>
              <div style={{ color: '#fbcfe8', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Оригинальная Концепция
              </div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff', marginTop: '2px' }}>
                Markus "Notch" Persson & Mojang Studios
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                Minecraft Classic & Alpha (2009–2010)
              </div>
            </div>

            {/* Engine & License */}
            <div style={{ backgroundColor: '#27272a', padding: '10px 14px', borderLeft: '4px solid #64748b' }}>
              <div style={{ color: '#cbd5e1', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Движок & Лицензия
              </div>
              <div style={{ fontSize: '13px', color: '#e2e8f0', marginTop: '2px' }}>
                React 19 &bull; Three.js &bull; TypeScript &bull; Vite
              </div>
              <div style={{ fontSize: '12px', color: '#facc15', marginTop: '2px' }}>
                Лицензия: Apache License 2.0
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowCredits(false)}
            style={{
              ...minecraftButtonStyle,
              backgroundColor: '#15803d',
              borderColor: '#22c55e #14532d #14532d #22c55e',
              justifyContent: 'center',
              fontSize: '15px',
              padding: '12px',
              fontWeight: 'bold',
              marginTop: '18px',
              width: '100%',
            }}
          >
            ⬅️ Назад в настройки
          </button>
        </div>
      ) : (
        /* Settings View */
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

            {/* 7. Credits Button */}
            <button
              onClick={() => setShowCredits(true)}
              style={{
                ...minecraftButtonStyle,
                backgroundColor: '#1e293b',
                borderColor: '#475569 #0f172a #0f172a #475569',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#facc15',
                padding: '12px',
              }}
            >
              📜 Титры и авторы (Credits)
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
      )}
    </div>
  );
};
