import React, { useEffect } from 'react';
import { type BlockType } from '../game/constants';
import type { ItemStack } from '../game/Inventory';

interface HotbarProps {
  slots: (ItemStack | null)[];
  selectedIndex: number;
  onSelectSlot: (index: number) => void;
  blockIcons?: Record<BlockType, string>;
  onOpenInventory?: () => void;
}

export const Hotbar: React.FC<HotbarProps> = ({
  slots,
  selectedIndex,
  onSelectSlot,
  blockIcons,
  onOpenInventory,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Keys 1 to 9
      if (e.code >= 'Digit1' && e.code <= 'Digit9') {
        const idx = parseInt(e.code.replace('Digit', ''), 10) - 1;
        if (idx >= 0 && idx < 9) {
          onSelectSlot(idx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectSlot]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: '#8f8f8f',
        padding: '3px',
        borderTop: '2px solid #dbdbdb',
        borderLeft: '2px solid #dbdbdb',
        borderRight: '2px solid #373737',
        borderBottom: '2px solid #373737',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        zIndex: 55,
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      {/* 9 Minecraft Hotbar Slots */}
      {Array.from({ length: 9 }).map((_, idx) => {
        const item = slots[idx];
        const isSelected = selectedIndex === idx;
        const iconUrl = item && blockIcons ? blockIcons[item.type] : undefined;

        return (
          <button
            key={idx}
            onClick={() => onSelectSlot(idx)}
            style={{
              position: 'relative',
              width: '46px',
              height: '46px',
              backgroundColor: '#8b8b8b',
              borderTop: isSelected ? '3px solid #ffffff' : '2px solid #373737',
              borderLeft: isSelected ? '3px solid #ffffff' : '2px solid #373737',
              borderRight: isSelected ? '3px solid #ffffff' : '2px solid #dbdbdb',
              borderBottom: isSelected ? '3px solid #ffffff' : '2px solid #dbdbdb',
              outline: isSelected ? '2px solid #000000' : 'none',
              transform: isSelected ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 0.1s',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              zIndex: isSelected ? 2 : 1,
            }}
          >
            {/* Slot Number Label (1-9) */}
            <span
              style={{
                position: 'absolute',
                top: '2px',
                left: '3px',
                fontSize: '9px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                textShadow: '1px 1px #000000',
                pointerEvents: 'none',
              }}
            >
              {idx + 1}
            </span>

            {/* 3D Isometric Item Icon */}
            {iconUrl && (
              <img
                src={iconUrl}
                alt="slot icon"
                style={{
                  width: '32px',
                  height: '32px',
                  imageRendering: 'pixelated',
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Item Stack Count */}
            {item && item.count > 1 && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '3px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  fontWeight: '900',
                  color: '#ffffff',
                  textShadow: '1.5px 1.5px #222222',
                  pointerEvents: 'none',
                }}
              >
                {item.count}
              </span>
            )}

            {/* Tool Durability Bar */}
            {item && item.durability !== undefined && item.maxDurability !== undefined && item.durability < item.maxDurability && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  left: '4px',
                  right: '4px',
                  height: '3px',
                  backgroundColor: '#000000',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(0, Math.min(100, (item.durability / item.maxDurability) * 100))}%`,
                    backgroundColor:
                      item.durability / item.maxDurability > 0.6
                        ? '#22c55e'
                        : item.durability / item.maxDurability > 0.25
                        ? '#eab308'
                        : '#ef4444',
                  }}
                />
              </div>
            )}
          </button>
        );
      })}

      {/* Mobile Inventory Button (E / Backpack) */}
      {onOpenInventory && (
        <button
          onClick={onOpenInventory}
          title="Открыть инвентарь (E)"
          style={{
            width: '42px',
            height: '46px',
            marginLeft: '4px',
            backgroundColor: '#6b7280',
            borderTop: '2px solid #dbdbdb',
            borderLeft: '2px solid #dbdbdb',
            borderRight: '2px solid #373737',
            borderBottom: '2px solid #373737',
            color: '#fff',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          🎒
        </button>
      )}
    </div>
  );
};
