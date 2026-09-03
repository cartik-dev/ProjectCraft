import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowUp, Zap, Hammer, Plus } from 'lucide-react';
import { InputManager } from '../game/InputManager';

interface TouchControlsProps {
  inputManager: InputManager;
  onStartMining: () => void;
  onStopMining: () => void;
  onPlaceBlock: () => void;
  onStartPlaceOrEat?: () => void;
  onStopPlaceOrEat?: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  inputManager,
  onStartMining,
  onStopMining,
  onPlaceBlock,
  onStartPlaceOrEat,
  onStopPlaceOrEat,
}) => {
  // Joystick visual state
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickTouchIdRef = useRef<number | null>(null);
  const joystickCenterRef = useRef({ x: 0, y: 0 });
  const joystickBaseRef = useRef<HTMLDivElement>(null);

  // Look area touch tracking
  const lookTouchIdRef = useRef<number | null>(null);
  const lastLookPosRef = useRef({ x: 0, y: 0 });

  // Sprint toggle state
  const [isSprinting, setIsSprinting] = useState(false);

  // Maximum joystick travel radius
  const MAX_RADIUS = 45;

  // 1. Joystick Touch Handlers
  const handleJoystickStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (joystickTouchIdRef.current !== null) return;

    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;

    if (joystickBaseRef.current) {
      const rect = joystickBaseRef.current.getBoundingClientRect();
      joystickCenterRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    setIsJoystickActive(true);
  }, []);

  const handleJoystickMove = useCallback((e: TouchEvent) => {
    if (joystickTouchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        const deltaX = touch.clientX - joystickCenterRef.current.x;
        const deltaY = touch.clientY - joystickCenterRef.current.y;

        const distance = Math.hypot(deltaX, deltaY);
        const clampedDist = Math.min(distance, MAX_RADIUS);
        const angle = Math.atan2(deltaY, deltaX);

        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;

        setKnobPos({ x: knobX, y: knobY });

        // Normalize values to [-1, 1]
        // Note: Y inverted because up on screen is forward (-Y screen coords)
        const normalizedX = knobX / MAX_RADIUS;
        const normalizedY = -knobY / MAX_RADIUS;

        inputManager.joystickVector.x = normalizedX;
        inputManager.joystickVector.y = normalizedY;
        break;
      }
    }
  }, [inputManager, MAX_RADIUS]);

  const handleJoystickEnd = useCallback((e: TouchEvent) => {
    if (joystickTouchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setIsJoystickActive(false);
        setKnobPos({ x: 0, y: 0 });
        inputManager.joystickVector.x = 0;
        inputManager.joystickVector.y = 0;
        break;
      }
    }
  }, [inputManager]);

  // 2. Look Touch Handlers (Right half of the screen)
  const handleLookStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (lookTouchIdRef.current !== null) return;

    const touch = e.changedTouches[0];
    lookTouchIdRef.current = touch.identifier;
    lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleLookMove = useCallback((e: TouchEvent) => {
    if (lookTouchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        const deltaX = touch.clientX - lastLookPosRef.current.x;
        const deltaY = touch.clientY - lastLookPosRef.current.y;

        lastLookPosRef.current = { x: touch.clientX, y: touch.clientY };

        inputManager.addTouchLookDelta(deltaX, deltaY);
        break;
      }
    }
  }, [inputManager]);

  const handleLookEnd = useCallback((e: TouchEvent) => {
    if (lookTouchIdRef.current === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        break;
      }
    }
  }, []);

  // Global touchmove / touchend listeners for seamless drag beyond element borders
  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      handleJoystickMove(e);
      handleLookMove(e);
    };

    const onTouchEnd = (e: TouchEvent) => {
      handleJoystickEnd(e);
      handleLookEnd(e);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [handleJoystickMove, handleLookMove, handleJoystickEnd, handleLookEnd]);

  const toggleSprint = () => {
    const next = !isSprinting;
    setIsSprinting(next);
    inputManager.mobileSprint = next;
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 40,
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Right-Side Look Zone (Swiping rotates camera) */}
      <div
        onTouchStart={handleLookStart}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '55%',
          height: '100%',
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
      />

      {/* Left Virtual Joystick Base */}
      <div
        ref={joystickBaseRef}
        onTouchStart={handleJoystickStart}
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '40px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: isJoystickActive
            ? 'rgba(255, 255, 255, 0.25)'
            : 'rgba(255, 255, 255, 0.15)',
          border: '2px solid rgba(255, 255, 255, 0.35)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          touchAction: 'none',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        }}
      >
        {/* Joystick Thumb Knob */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: isJoystickActive
              ? '#3b82f6'
              : 'rgba(255, 255, 255, 0.8)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            transition: isJoystickActive ? 'none' : 'transform 0.15s ease-out',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Right Action Buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: '36px',
          right: '30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          pointerEvents: 'auto',
          zIndex: 50,
        }}
      >
        {/* Secondary Action Row: Break & Place & Sprint */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Sprint Toggle */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              toggleSprint();
            }}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: isSprinting
                ? '#eab308'
                : 'rgba(20, 20, 20, 0.65)',
              color: isSprinting ? '#000' : '#fff',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
            title="Спринт"
          >
            <Zap size={22} />
          </button>

          {/* Break / Mine Block */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onStartMining();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              onStopMining();
            }}
            onTouchCancel={(e) => {
              e.stopPropagation();
              onStopMining();
            }}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'rgba(220, 38, 38, 0.8)',
              color: '#fff',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
            title="Разрушить блок"
          >
            <Hammer size={24} />
          </button>

          {/* Place Block / Eat Food */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              if (onStartPlaceOrEat) {
                onStartPlaceOrEat();
              } else {
                onPlaceBlock();
              }
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              if (onStopPlaceOrEat) {
                onStopPlaceOrEat();
              }
            }}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'rgba(22, 163, 74, 0.8)',
              color: '#fff',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
            title="Поставить блок"
          >
            <Plus size={26} />
          </button>
        </div>

        {/* Primary Jump Button (Large) */}
        <button
          onTouchStart={(e) => {
            e.stopPropagation();
            inputManager.mobileJump = true;
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            inputManager.mobileJump = false;
          }}
          style={{
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            color: '#fff',
            border: '3px solid rgba(255, 255, 255, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
          }}
          title="Прыжок"
        >
          <ArrowUp size={36} />
        </button>
      </div>
    </div>
  );
};
