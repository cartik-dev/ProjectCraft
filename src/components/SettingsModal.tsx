import React, { useEffect, useState } from 'react';

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

const FOG_LABELS: Record<FogDistanceOption, { label: string }> = {
  tiny: { label: 'Очень близко (Tiny)' },
  short: { label: 'Близко (Short)' },
  normal: { label: 'Нормально (Normal)' },
  far: { label: 'Далеко (Far)' },
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#3f3f46',
  color: '#fff',
  minHeight: '44px',
  padding: '10px 14px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: '13px',
  borderTop: '2px solid #71717a',
  borderLeft: '2px solid #71717a',
  borderRight: '2px solid #18181b',
  borderBottom: '2px solid #18181b',
  textShadow: '1px 1px 1px #000',
  boxSizing: 'border-box',
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
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));
  const [isSmallScreen, setIsSmallScreen] = useState(() => window.innerWidth <= 700);

  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => setIsSmallScreen(window.innerWidth <= 700);
    const handleFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('resize', handleResize);
    document.addEventListener('fullscreenchange', handleFullscreen);
    handleResize();
    handleFullscreen();
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('fullscreenchange', handleFullscreen);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const cycleFogDistance = () => {
    const sequence: FogDistanceOption[] = ['tiny', 'short', 'normal', 'far'];
    onChangeFogDistance(sequence[(sequence.indexOf(fogDistance) + 1) % sequence.length]);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fullscreen can be unavailable in some embedded/mobile browsers.
    }
  };

  const panelStyle: React.CSSProperties = {
    backgroundColor: '#27272a',
    borderTop: '3px solid #71717a',
    borderLeft: '3px solid #71717a',
    borderRight: '3px solid #18181b',
    borderBottom: '3px solid #18181b',
    boxShadow: '0 12px 36px rgba(0,0,0,.85)',
    width: isSmallScreen ? 'calc(100vw - 20px)' : '520px',
    maxWidth: isSmallScreen ? 'calc(100vw - 20px)' : '92vw',
    maxHeight: isSmallScreen ? 'calc(100dvh - 20px)' : '90vh',
    overflowY: 'auto',
    padding: isSmallScreen ? '14px' : '24px',
    color: '#fff',
    boxSizing: 'border-box',
  };

  const settingButton = (label: React.ReactNode, value: React.ReactNode, onClick: () => void) => (
    <button onClick={onClick} style={{ ...buttonStyle, width: '100%' }}>
      <span style={{ minWidth: 0, textAlign: 'left' }}>{label}</span>
      <span style={{ color: '#38bdf8', fontWeight: 'bold', textAlign: 'right', flexShrink: 0 }}>{value}</span>
    </button>
  );

  return (
    <div
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,.72)', backdropFilter: 'blur(5px)',
        zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isSmallScreen ? '10px' : '20px', boxSizing: 'border-box', fontFamily: 'monospace', userSelect: 'none',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowCredits(false);
          onClose();
        }
      }}
    >
      {showCredits ? (
        <div style={panelStyle}>
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <div style={{ fontSize: isSmallScreen ? '18px' : '22px', fontWeight: 900, color: '#facc15', textShadow: '2px 2px #000' }}>
              📜 Титры и Авторы
            </div>
            <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: 4 }}>ProjectCraft 1.0 Alpha</div>
          </div>
          <div style={{ display: 'grid', gap: 10, fontSize: '13px' }}>
            <div style={{ background: '#27272a', padding: 12, borderLeft: '4px solid #3b82f6' }}><b>Разработка & Концепт</b><br />Cartik<br /><span style={{ color: '#9ca3af' }}>Главный разработчик, механики и геймплей</span></div>
            <div style={{ background: '#27272a', padding: 12, borderLeft: '4px solid #a855f7' }}><b>AI-Архитектура & Программирование</b><br />Gemini (Google DeepMind)<br /><span style={{ color: '#9ca3af' }}>Помощь в разработке воксельного движка, физики и логики</span></div>
            <div style={{ background: '#27272a', padding: 12, borderLeft: '4px solid #22c55e' }}><b>Визуальные и звуковые эффекты</b><br />Gemini & Three.js<br /><span style={{ color: '#9ca3af' }}>Шейдеры, частицы, освещение и интерфейс</span></div>
            <div style={{ background: '#27272a', padding: 12, borderLeft: '4px solid #f59e0b' }}><b>Оригинальный Саундтрек</b><br />C418 — Minecraft Volume Alpha<br /><span style={{ color: '#9ca3af' }}>Subwoofer Lullaby, Living Mice, Wet Hands, Sweden и др.</span></div>
            <div style={{ background: '#27272a', padding: 12, borderLeft: '4px solid #ec4899' }}><b>Оригинальная Концепция</b><br />Markus "Notch" Persson & Mojang Studios<br /><span style={{ color: '#9ca3af' }}>Minecraft Classic & Alpha (2009–2010)</span></div>
            <div style={{ background: '#27272a', padding: 12, borderLeft: '4px solid #64748b' }}><b>Движок & Лицензия</b><br />React 19 • Three.js • TypeScript • Vite<br /><span style={{ color: '#facc15' }}>Apache License 2.0</span></div>
          </div>
          <button onClick={() => setShowCredits(false)} style={{ ...buttonStyle, width: '100%', justifyContent: 'center', marginTop: 16, background: '#15803d', borderColor: '#22c55e #14532d #14532d #22c55e', fontWeight: 'bold' }}>
            ⬅️ Назад в настройки
          </button>
        </div>
      ) : (
        <div style={panelStyle}>
          <div style={{ textAlign: 'center', marginBottom: isSmallScreen ? 14 : 22 }}>
            <div style={{ fontSize: isSmallScreen ? '19px' : '22px', fontWeight: 900, color: '#facc15', textShadow: '2px 2px #000' }}>Настройки</div>
            <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: 4 }}>ProjectCraft 1.0 Alpha</div>
          </div>

          <div style={{ display: 'grid', gap: isSmallScreen ? 8 : 12, marginBottom: 18 }}>
            {settingButton('🌫️ Дальность тумана:', FOG_LABELS[fogDistance].label, cycleFogDistance)}
            {settingButton('☁️ Атмосферный туман:', isFogEnabled ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН', onToggleFog)}

            <div style={{ background: '#18181b', padding: '10px 14px', border: '2px solid #3f3f46' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: '13px' }}><span>👁️ Угол обзора (FOV):</span><b style={{ color: '#facc15' }}>{fov}°</b></div>
              <input type="range" min={60} max={100} step={1} value={fov} onChange={(e) => onChangeFov(Number(e.target.value))} style={{ width: '100%' }} />
            </div>

            <div style={{ background: '#18181b', padding: '10px 14px', border: '2px solid #3f3f46' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: '13px' }}><span>🎯 Чувствительность:</span><b style={{ color: '#facc15' }}>{Math.round(sensitivity * 100)}%</b></div>
              <input type="range" min={50} max={200} step={5} value={Math.round(sensitivity * 100)} onChange={(e) => onChangeSensitivity(Number(e.target.value) / 100)} style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isSmallScreen ? '1fr' : '1fr 1fr', gap: 8 }}>
              {settingButton('🎵 Музыка:', !isMusicMuted ? 'ВКЛ' : 'ВЫКЛ', onToggleMusic)}
              {settingButton('🔊 Звуки:', !isSoundMuted ? 'ВКЛ' : 'ВЫКЛ', onToggleSound)}
            </div>

            {settingButton('📱 Управление:', isMobileMode ? 'Мобильное' : 'ПК', onToggleMobileMode)}

            <button onClick={toggleFullscreen} style={{ ...buttonStyle, width: '100%', justifyContent: 'space-between', background: '#1e293b', borderColor: '#475569 #0f172a #0f172a #475569' }}>
              <span>⛶ Полный экран</span>
              <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{isFullscreen ? 'ВКЛ' : 'ВЫКЛ'}</span>
            </button>

            <button onClick={() => setShowCredits(true)} style={{ ...buttonStyle, width: '100%', justifyContent: 'center', color: '#facc15', fontWeight: 'bold', background: '#1e293b', borderColor: '#475569 #0f172a #0f172a #475569' }}>
              📜 Титры и авторы (Credits)
            </button>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <button onClick={onClose} style={{ ...buttonStyle, width: '100%', justifyContent: 'center', background: '#15803d', borderColor: '#22c55e #14532d #14532d #22c55e', fontSize: '14px', fontWeight: 'bold' }}>
              ✅ Готово (Вернуться в игру)
            </button>
            {onQuitToTitle && <button onClick={onQuitToTitle} style={{ ...buttonStyle, width: '100%', justifyContent: 'center', background: '#991b1b', borderColor: '#ef4444 #450a0a #450a0a #ef4444' }}>
              🚪 Сохранить и выйти в главное меню
            </button>}
          </div>
        </div>
      )}
    </div>
  );
};
