import React, { useState, useEffect } from 'react';
import { type BlockType } from '../game/constants';
import type { Inventory, ItemStack } from '../game/Inventory';

interface InventoryGUIProps {
  inventory: Inventory;
  isOpen: boolean;
  mode?: '2x2' | '3x3';
  onClose: () => void;
  blockIcons?: Record<BlockType, string>;
  onInventoryChange: () => void;
}

export const InventoryGUI: React.FC<InventoryGUIProps> = ({
  inventory,
  isOpen,
  mode = '2x2',
  onClose,
  blockIcons,
  onInventoryChange,
}) => {
  const [cursorStack, setCursorStack] = useState<ItemStack | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Track mouse coordinates for cursor item follower
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isOpen]);

  // Close on 'E' or 'Escape'
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' || e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, cursorStack]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (cursorStack) {
      inventory.addItem(cursorStack.type, cursorStack.count);
      setCursorStack(null);
    }
    inventory.clearAllCraftingGrids();
    onInventoryChange();
    onClose();
  };

  // Click handling for 36 storage slots
  const handleSlotClick = (slotIdx: number, isRightClick = false) => {
    const slotItem = inventory.slots[slotIdx];

    if (!cursorStack) {
      if (!slotItem) return;
      if (isRightClick) {
        const takeCount = Math.ceil(slotItem.count / 2);
        const remain = slotItem.count - takeCount;
        setCursorStack({ type: slotItem.type, count: takeCount });
        inventory.slots[slotIdx] = remain > 0 ? { type: slotItem.type, count: remain } : null;
      } else {
        setCursorStack({ ...slotItem });
        inventory.slots[slotIdx] = null;
      }
    } else {
      if (!slotItem) {
        if (isRightClick) {
          inventory.slots[slotIdx] = { type: cursorStack.type, count: 1 };
          const remain = cursorStack.count - 1;
          setCursorStack(remain > 0 ? { type: cursorStack.type, count: remain } : null);
        } else {
          inventory.slots[slotIdx] = { ...cursorStack };
          setCursorStack(null);
        }
      } else if (slotItem.type === cursorStack.type) {
        if (isRightClick) {
          if (slotItem.count < 64) {
            slotItem.count++;
            const remain = cursorStack.count - 1;
            setCursorStack(remain > 0 ? { type: cursorStack.type, count: remain } : null);
          }
        } else {
          const space = 64 - slotItem.count;
          const toAdd = Math.min(space, cursorStack.count);
          slotItem.count += toAdd;
          const remain = cursorStack.count - toAdd;
          setCursorStack(remain > 0 ? { type: cursorStack.type, count: remain } : null);
        }
      } else {
        inventory.slots[slotIdx] = { ...cursorStack };
        setCursorStack({ ...slotItem });
      }
    }
    onInventoryChange();
  };

  // 2x2 Crafting Grid Click
  const handleCraftGrid2x2Click = (craftIdx: number, isRightClick = false) => {
    const gridItem = inventory.craftGrid[craftIdx];

    if (!cursorStack) {
      if (!gridItem) return;
      if (isRightClick) {
        const take = Math.ceil(gridItem.count / 2);
        setCursorStack({ type: gridItem.type, count: take });
        gridItem.count -= take;
        if (gridItem.count <= 0) inventory.craftGrid[craftIdx] = null;
      } else {
        setCursorStack({ ...gridItem });
        inventory.craftGrid[craftIdx] = null;
      }
    } else {
      if (!gridItem) {
        if (isRightClick) {
          inventory.craftGrid[craftIdx] = { type: cursorStack.type, count: 1 };
          const remain = cursorStack.count - 1;
          setCursorStack(remain > 0 ? { type: cursorStack.type, count: remain } : null);
        } else {
          inventory.craftGrid[craftIdx] = { ...cursorStack };
          setCursorStack(null);
        }
      } else if (gridItem.type === cursorStack.type) {
        if (isRightClick) {
          if (gridItem.count < 64) {
            gridItem.count++;
            const remain = cursorStack.count - 1;
            setCursorStack(remain > 0 ? { type: cursorStack.type, count: remain } : null);
          }
        } else {
          const space = 64 - gridItem.count;
          const toAdd = Math.min(space, cursorStack.count);
          gridItem.count += toAdd;
          const remain = cursorStack.count - toAdd;
          setCursorStack(remain > 0 ? { type: cursorStack.type, count: remain } : null);
        }
      } else {
        inventory.craftGrid[craftIdx] = { ...cursorStack };
        setCursorStack({ ...gridItem });
      }
    }

    inventory.updateCrafting();
    onInventoryChange();
  };

  // 3x3 Crafting Table Grid Click
  const handleCraftGrid3x3Click = (craftIdx: number, isRightClick = false) => {
    const gridItem = inventory.craftGrid3x3[craftIdx];

    if (!cursorStack) {
      if (!gridItem) return;
      if (isRightClick) {
        const take = Math.ceil(gridItem.count / 2);
        setCursorStack({ type: gridItem.type, count: take });
        gridItem.count -= take;
        if (gridItem.count <= 0) inventory.craftGrid3x3[craftIdx] = null;
      } else {
        setCursorStack({ ...gridItem });
        inventory.craftGrid3x3[craftIdx] = null;
      }
    } else {
      if (!gridItem) {
        if (isRightClick) {
          inventory.craftGrid3x3[craftIdx] = { type: cursorStack.type, count: 1 };
          const remain = cursorStack.count - 1;
          setCursorStack(remain > 0 ? { type: cursorStack.type, count: remain } : null);
        } else {
          inventory.craftGrid3x3[craftIdx] = { ...cursorStack };
          setCursorStack(null);
        }
      } else if (gridItem.type === cursorStack.type) {
        if (isRightClick) {
          if (gridItem.count < 64) {
            gridItem.count++;
            const remain = cursorStack.count - 1;
            setCursorStack(remain > 0 ? { type: cursorStack.type, count: remain } : null);
          }
        } else {
          const space = 64 - gridItem.count;
          const toAdd = Math.min(space, cursorStack.count);
          gridItem.count += toAdd;
          const remain = cursorStack.count - toAdd;
          setCursorStack(remain > 0 ? { type: cursorStack.type, count: remain } : null);
        }
      } else {
        inventory.craftGrid3x3[craftIdx] = { ...cursorStack };
        setCursorStack({ ...gridItem });
      }
    }

    inventory.updateCrafting3x3();
    onInventoryChange();
  };

  // Take Crafting Result
  const handleResultClick = () => {
    if (mode === '3x3') {
      if (!inventory.craftResult3x3) return;
      if (!cursorStack) {
        const result = inventory.takeCraftResult3x3();
        setCursorStack(result);
      } else if (cursorStack.type === inventory.craftResult3x3.type && cursorStack.count + inventory.craftResult3x3.count <= 64) {
        const result = inventory.takeCraftResult3x3();
        if (result) cursorStack.count += result.count;
      }
    } else {
      if (!inventory.craftResult) return;
      if (!cursorStack) {
        const result = inventory.takeCraftResult();
        setCursorStack(result);
      } else if (cursorStack.type === inventory.craftResult.type && cursorStack.count + inventory.craftResult.count <= 64) {
        const result = inventory.takeCraftResult();
        if (result) cursorStack.count += result.count;
      }
    }
    onInventoryChange();
  };

  const renderSlotBox = (
    item: ItemStack | null,
    onClick: (e: React.MouseEvent) => void,
    size = 40,
    highlight = false
  ) => {
    const icon = item && blockIcons ? blockIcons[item.type] : undefined;
    return (
      <div
        onClick={onClick}
        onContextMenu={(e) => {
          e.preventDefault();
          onClick(e);
        }}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: '#8b8b8b',
          borderTop: '2px solid #373737',
          borderLeft: '2px solid #373737',
          borderRight: '2px solid #ffffff',
          borderBottom: '2px solid #ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: 'pointer',
          outline: highlight ? '2px solid #facc15' : 'none',
        }}
      >
        {icon && (
          <img
            src={icon}
            alt="icon"
            style={{ width: `${size - 10}px`, height: `${size - 10}px`, imageRendering: 'pixelated', pointerEvents: 'none' }}
          />
        )}
        {item && item.count > 1 && (
          <span
            style={{
              position: 'absolute',
              bottom: '1px',
              right: '2px',
              fontSize: '12px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              color: '#ffffff',
              textShadow: '1.5px 1.5px #111',
              pointerEvents: 'none',
            }}
          >
            {item.count}
          </span>
        )}
        {item && item.durability !== undefined && item.maxDurability !== undefined && item.durability < item.maxDurability && (
          <div
            style={{
              position: 'absolute',
              bottom: '2px',
              left: '3px',
              right: '3px',
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
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#c6c6c6',
          padding: '16px',
          borderTop: '3px solid #ffffff',
          borderLeft: '3px solid #ffffff',
          borderRight: '3px solid #555555',
          borderBottom: '3px solid #555555',
          boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
          width: mode === '3x3' ? '460px' : '420px',
          maxWidth: '96vw',
          fontFamily: 'monospace',
          color: '#373737',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '15px', textShadow: '1px 1px #eee' }}>
            {mode === '3x3' ? 'Верстак (Crafting Table 3x3)' : 'Инвентарь и крафт (2x2)'}
          </span>
          <button
            onClick={handleClose}
            style={{
              backgroundColor: '#e11d48',
              color: '#fff',
              border: '1px solid #000',
              fontWeight: 'bold',
              cursor: 'pointer',
              padding: '2px 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Upper Section: Crafting Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          {/* Avatar / Table info */}
          <div
            style={{
              width: '84px',
              height: mode === '3x3' ? '128px' : '96px',
              backgroundColor: '#000000',
              border: '2px solid #555555',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#86efac',
              fontSize: '11px',
              textAlign: 'center',
              padding: '4px',
            }}
          >
            <div style={{ fontSize: '32px' }}>{mode === '3x3' ? '🪚' : '🧑'}</div>
            <span>{mode === '3x3' ? 'Верстак' : 'Стив'}</span>
          </div>

          {/* Crafting Grid */}
          {mode === '3x3' ? (
            /* 3x3 Grid */
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: '#444' }}>Сетка 3x3</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 38px)', gap: '3px' }}>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i}>
                      {renderSlotBox(inventory.craftGrid3x3[i], (e) => handleCraftGrid3x3Click(i, e.button === 2), 38)}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#555' }}>➔</div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: '#444' }}>Итог</div>
                {renderSlotBox(inventory.craftResult3x3, handleResultClick, 44, true)}
              </div>
            </div>
          ) : (
            /* 2x2 Grid */
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: '#444' }}>Крафт (2x2)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 40px)', gap: '4px' }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                      {renderSlotBox(inventory.craftGrid[i], (e) => handleCraftGrid2x2Click(i, e.button === 2))}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#555' }}>➔</div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: '#444' }}>Итог</div>
                {renderSlotBox(inventory.craftResult, handleResultClick, 44, true)}
              </div>
            </div>
          )}
        </div>

        {/* Recipes Hint */}
        <div style={{ fontSize: '10px', color: '#555', marginBottom: '10px', lineHeight: 1.35 }}>
          {mode === '3x3' ? (
            <>
              💡 <b>Рецепты верстака:</b> 3 Доски (ряд) + 2 Палки ➔ <b>Кирка</b> &bull; 3 Доски (углом) + 2 Палки ➔ <b>Топор</b> &bull; 2 Доски + 1 Палка ➔ <b>Меч</b>
            </>
          ) : (
            <>
              💡 <b>Рецепты:</b> 1 Бревно ➔ 4 Доски &bull; 4 Доски ➔ <b>Верстак</b> (поставь и нажми ПКМ) &bull; 2 Доски ➔ 4 Палки
            </>
          )}
        </div>

        {/* 27 Main Inventory Backpack Slots */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#444' }}>Рюкзак</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 38px)', gap: '3px' }}>
            {Array.from({ length: 27 }).map((_, i) => {
              const slotIdx = 9 + i;
              return (
                <div key={slotIdx}>
                  {renderSlotBox(inventory.slots[slotIdx], (e) => handleSlotClick(slotIdx, e.button === 2), 38)}
                </div>
              );
            })}
          </div>
        </div>

        {/* 9 Hotbar Slots */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#444' }}>Панель быстрого доступа (1–9)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 38px)', gap: '3px' }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i}>
                {renderSlotBox(inventory.slots[i], (e) => handleSlotClick(i, e.button === 2), 38, inventory.selectedIndex === i)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Item Following Cursor */}
      {cursorStack && (
        <div
          style={{
            position: 'fixed',
            left: `${cursorPos.x - 18}px`,
            top: `${cursorPos.y - 18}px`,
            width: '36px',
            height: '36px',
            pointerEvents: 'none',
            zIndex: 150,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))',
          }}
        >
          {blockIcons && blockIcons[cursorStack.type] && (
            <img
              src={blockIcons[cursorStack.type]}
              alt="cursor item"
              style={{ width: '32px', height: '32px', imageRendering: 'pixelated' }}
            />
          )}
          {cursorStack.count > 1 && (
            <span
              style={{
                position: 'absolute',
                bottom: '0px',
                right: '1px',
                fontSize: '13px',
                fontFamily: 'monospace',
                fontWeight: '900',
                color: '#ffffff',
                textShadow: '2px 2px #000000',
              }}
            >
              {cursorStack.count}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
