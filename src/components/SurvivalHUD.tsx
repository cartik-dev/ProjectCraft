import React from 'react';

interface SurvivalHUDProps {
  health: number; // 0..20
  hunger: number; // 0..20
  isHurt?: boolean;
  isDead?: boolean;
  deathCause?: string;
  onRespawn?: () => void;
}

// --- AUTHENTIC MINECRAFT PIXEL-ART SVG ICONS ---

export const FullHeartSVG: React.FC = () => (
  <svg viewBox="0 0 9 9" width="18" height="18" style={{ shapeRendering: 'crispEdges' }}>
    {/* Outline */}
    <path d="M1,1 h2 v1 h-2 z M6,1 h2 v1 h-2 z M0,2 h1 v3 h-1 z M3,2 h1 v1 h-1 z M5,2 h1 v1 h-1 z M8,2 h1 v3 h-1 z M1,5 h1 v1 h-1 z M7,5 h1 v1 h-1 z M2,6 h1 v1 h-1 z M6,6 h1 v1 h-1 z M3,7 h1 v1 h-1 z M5,7 h1 v1 h-1 z M4,8 h1 v1 h-1 z" fill="#000000" />
    {/* Red Core */}
    <path d="M1,2 h2 v3 h-2 z M3,3 h3 v3 h-3 z M6,2 h2 v3 h-2 z M2,5 h5 v1 h-5 z M3,6 h3 v1 h-3 z M4,7 h1 v1 h-1 z" fill="#ef4444" />
    {/* Shadow */}
    <path d="M2,4 h1 v1 h-1 z M6,4 h1 v1 h-1 z M3,5 h1 v1 h-1 z M5,5 h1 v1 h-1 z M4,6 h1 v1 h-1 z" fill="#991b1b" />
    {/* Glint */}
    <rect x="1" y="2" width="1" height="1" fill="#ffffff" />
    <rect x="2" y="2" width="1" height="1" fill="#fecaca" />
  </svg>
);

export const HalfHeartSVG: React.FC = () => (
  <svg viewBox="0 0 9 9" width="18" height="18" style={{ shapeRendering: 'crispEdges' }}>
    {/* Outline */}
    <path d="M1,1 h2 v1 h-2 z M6,1 h2 v1 h-2 z M0,2 h1 v3 h-1 z M3,2 h1 v1 h-1 z M5,2 h1 v1 h-1 z M8,2 h1 v3 h-1 z M1,5 h1 v1 h-1 z M7,5 h1 v1 h-1 z M2,6 h1 v1 h-1 z M6,6 h1 v1 h-1 z M3,7 h1 v1 h-1 z M5,7 h1 v1 h-1 z M4,8 h1 v1 h-1 z" fill="#000000" />
    {/* Empty right half */}
    <path d="M5,3 h1 v3 h-1 z M6,2 h2 v3 h-2 z M5,5 h2 v1 h-2 z M5,6 h1 v1 h-1 z" fill="#374151" />
    <path d="M6,4 h1 v1 h-1 z M5,5 h1 v1 h-1 z" fill="#1f2937" />
    {/* Red left half */}
    <path d="M1,2 h2 v3 h-2 z M3,3 h2 v3 h-2 z M2,5 h3 v1 h-3 z M3,6 h2 v1 h-2 z M4,7 h1 v1 h-1 z" fill="#ef4444" />
    {/* Shadow */}
    <path d="M2,4 h1 v1 h-1 z M3,5 h1 v1 h-1 z M4,6 h1 v1 h-1 z" fill="#991b1b" />
    {/* Glint */}
    <rect x="1" y="2" width="1" height="1" fill="#ffffff" />
    <rect x="2" y="2" width="1" height="1" fill="#fecaca" />
  </svg>
);

export const EmptyHeartSVG: React.FC = () => (
  <svg viewBox="0 0 9 9" width="18" height="18" style={{ shapeRendering: 'crispEdges' }}>
    {/* Outline */}
    <path d="M1,1 h2 v1 h-2 z M6,1 h2 v1 h-2 z M0,2 h1 v3 h-1 z M3,2 h1 v1 h-1 z M5,2 h1 v1 h-1 z M8,2 h1 v3 h-1 z M1,5 h1 v1 h-1 z M7,5 h1 v1 h-1 z M2,6 h1 v1 h-1 z M6,6 h1 v1 h-1 z M3,7 h1 v1 h-1 z M5,7 h1 v1 h-1 z M4,8 h1 v1 h-1 z" fill="#000000" />
    {/* Dark background */}
    <path d="M1,2 h2 v3 h-2 z M3,3 h3 v3 h-3 z M6,2 h2 v3 h-2 z M2,5 h5 v1 h-5 z M3,6 h3 v1 h-3 z M4,7 h1 v1 h-1 z" fill="#374151" />
    {/* Dark shading */}
    <path d="M2,4 h1 v1 h-1 z M6,4 h1 v1 h-1 z M3,5 h1 v1 h-1 z M5,5 h1 v1 h-1 z M4,6 h1 v1 h-1 z" fill="#1f2937" />
  </svg>
);

export const FullHungerSVG: React.FC = () => (
  <svg viewBox="0 0 9 9" width="18" height="18" style={{ shapeRendering: 'crispEdges' }}>
    {/* Outline */}
    <path d="M3,0 h3 v1 h-3 z M2,1 h1 v2 h-1 z M6,1 h1 v3 h-1 z M1,3 h1 v3 h-1 z M7,4 h1 v1 h-1 z M8,5 h1 v2 h-1 z M2,6 h1 v1 h-1 z M3,7 h3 v1 h-3 z M6,7 h1 v1 h-1 z M7,8 h1 v1 h-1 z" fill="#000000" />
    {/* Roasted meat */}
    <path d="M3,1 h3 v1 h-3 z M2,3 h4 v3 h-4 z M3,2 h3 v4 h-3 z M4,6 h2 v1 h-2 z" fill="#b45309" />
    {/* Highlight */}
    <rect x="3" y="2" width="2" height="1" fill="#f59e0b" />
    <rect x="2" y="3" width="1" height="1" fill="#fef08a" />
    {/* Dark meat shadow */}
    <path d="M4,5 h2 v1 h-2 z M5,4 h1 v1 h-1 z M2,5 h1 v1 h-1 z" fill="#78350f" />
    {/* Bone */}
    <rect x="6" y="5" width="2" height="2" fill="#ffffff" />
    <rect x="7" y="7" width="1" height="1" fill="#e5e7eb" />
    <rect x="6" y="6" width="1" height="1" fill="#9ca3af" />
  </svg>
);

export const HalfHungerSVG: React.FC = () => (
  <svg viewBox="0 0 9 9" width="18" height="18" style={{ shapeRendering: 'crispEdges' }}>
    {/* Outline */}
    <path d="M3,0 h3 v1 h-3 z M2,1 h1 v2 h-1 z M6,1 h1 v3 h-1 z M1,3 h1 v3 h-1 z M7,4 h1 v1 h-1 z M8,5 h1 v2 h-1 z M2,6 h1 v1 h-1 z M3,7 h3 v1 h-3 z M6,7 h1 v1 h-1 z M7,8 h1 v1 h-1 z" fill="#000000" />
    {/* Empty right side */}
    <path d="M4,1 h2 v1 h-2 z M4,2 h2 v3 h-2 z M4,5 h2 v2 h-2 z" fill="#374151" />
    <path d="M5,4 h1 v2 h-1 z" fill="#1f2937" />
    {/* Roasted meat left */}
    <path d="M3,1 h1 v1 h-1 z M2,3 h2 v3 h-2 z M3,2 h1 v4 h-1 z" fill="#b45309" />
    <rect x="3" y="2" width="1" height="1" fill="#f59e0b" />
    <rect x="2" y="3" width="1" height="1" fill="#fef08a" />
    <path d="M2,5 h1 v1 h-1 z" fill="#78350f" />
    {/* Bone */}
    <rect x="6" y="5" width="2" height="2" fill="#ffffff" />
    <rect x="7" y="7" width="1" height="1" fill="#e5e7eb" />
    <rect x="6" y="6" width="1" height="1" fill="#9ca3af" />
  </svg>
);

export const EmptyHungerSVG: React.FC = () => (
  <svg viewBox="0 0 9 9" width="18" height="18" style={{ shapeRendering: 'crispEdges' }}>
    {/* Outline */}
    <path d="M3,0 h3 v1 h-3 z M2,1 h1 v2 h-1 z M6,1 h1 v3 h-1 z M1,3 h1 v3 h-1 z M7,4 h1 v1 h-1 z M8,5 h1 v2 h-1 z M2,6 h1 v1 h-1 z M3,7 h3 v1 h-3 z M6,7 h1 v1 h-1 z M7,8 h1 v1 h-1 z" fill="#000000" />
    {/* Empty container */}
    <path d="M3,1 h3 v1 h-3 z M2,3 h4 v3 h-4 z M3,2 h3 v4 h-3 z M4,6 h2 v1 h-2 z" fill="#374151" />
    <path d="M4,5 h2 v1 h-2 z M5,4 h1 v1 h-1 z M2,5 h1 v1 h-1 z" fill="#1f2937" />
    {/* Dim bone */}
    <rect x="6" y="5" width="2" height="2" fill="#6b7280" />
    <rect x="7" y="7" width="1" height="1" fill="#4b5563" />
    <rect x="6" y="6" width="1" height="1" fill="#374151" />
  </svg>
);

export const SurvivalHUD: React.FC<SurvivalHUDProps> = ({
  health,
  hunger,
  isHurt = false,
  isDead = false,
  deathCause = 'Вы погибли!',
  onRespawn,
}) => {
  return (
    <>
      {/* Red Hurt Vignette Flash */}
      {isHurt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 90,
            boxShadow: 'inset 0 0 100px 30px rgba(220, 38, 38, 0.75)',
            backgroundColor: 'rgba(220, 38, 38, 0.25)',
            transition: 'opacity 0.2s',
          }}
        />
      )}

      {/* Health & Hunger Bars */}
      {!isDead && (
        <div
          style={{
            position: 'absolute',
            bottom: '76px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            justifyContent: 'space-between',
            width: '440px',
            maxWidth: '92vw',
            pointerEvents: 'none',
            zIndex: 54,
            animation: isHurt ? 'hudShake 0.25s ease-in-out' : 'none',
          }}
        >
          <style>{`
            @keyframes hudShake {
              0% { transform: translate(-50%, 0); }
              25% { transform: translate(calc(-50% - 4px), -2px); }
              50% { transform: translate(calc(-50% + 4px), 2px); }
              75% { transform: translate(calc(-50% - 2px), 1px); }
              100% { transform: translate(-50%, 0); }
            }
            @keyframes heartLowHop {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-3px); }
            }
            @keyframes hungerJitter {
              0%, 100% { transform: translate(0, 0); }
              25% { transform: translate(-1px, 1px); }
              75% { transform: translate(1px, -1px); }
            }
          `}</style>

          {/* 10 Health Hearts (Authentic Minecraft SVGs) */}
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            {Array.from({ length: 10 }).map((_, i) => {
              const heartValue = health - i * 2;
              return (
                <div
                  key={i}
                  style={{
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: health <= 4 ? `heartLowHop 0.5s ease-in-out infinite ${i * 0.06}s` : 'none',
                  }}
                >
                  {heartValue >= 2 ? (
                    <FullHeartSVG />
                  ) : heartValue === 1 ? (
                    <HalfHeartSVG />
                  ) : (
                    <EmptyHeartSVG />
                  )}
                </div>
              );
            })}
          </div>

          {/* 10 Hunger Drumsticks (Authentic Minecraft SVGs, fills right-to-left) */}
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center', flexDirection: 'row-reverse' }}>
            {Array.from({ length: 10 }).map((_, i) => {
              const hungerValue = hunger - i * 2;
              return (
                <div
                  key={i}
                  style={{
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: hunger === 0 ? 'hungerJitter 0.15s ease-in-out infinite' : 'none',
                  }}
                >
                  {hungerValue >= 2 ? (
                    <FullHungerSVG />
                  ) : hungerValue === 1 ? (
                    <HalfHungerSVG />
                  ) : (
                    <EmptyHungerSVG />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Authentic Minecraft Death Screen */}
      {isDead && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(127, 29, 29, 0.75)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            backdropFilter: 'blur(4px)',
            fontFamily: 'monospace',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              fontWeight: '900',
              color: '#ffffff',
              textShadow: '4px 4px 0px #000000',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            Вы погибли!
          </div>

          <div
            style={{
              fontSize: '18px',
              color: '#fecaca',
              textShadow: '2px 2px 0px #000',
              marginBottom: '32px',
            }}
          >
            {deathCause}
          </div>

          <button
            onClick={onRespawn}
            style={{
              backgroundColor: '#4e4e4e',
              color: '#ffffff',
              padding: '14px 28px',
              fontSize: '18px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              cursor: 'pointer',
              borderTop: '3px solid #dbdbdb',
              borderLeft: '3px solid #dbdbdb',
              borderRight: '3px solid #1e1e1e',
              borderBottom: '3px solid #1e1e1e',
              textShadow: '2px 2px #1e1e1e',
              boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
            }}
          >
            ⚔️ Возродиться
          </button>
        </div>
      )}
    </>
  );
};
