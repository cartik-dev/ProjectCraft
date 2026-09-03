import React, { useState, useEffect } from 'react';
import { BLOCK_TYPE, type BlockType } from '../game/constants';
import type { Inventory, ItemStack } from '../game/Inventory';
import { soundManager } from '../game/SoundManager';

interface FurnaceGUIProps {
  inventory: Inventory;
  isOpen: boolean;
  onClose: () => void;
  blockIcons?: Record<BlockType, string>;
  onInventoryChange: () => void;
}

export const FurnaceGUI: React.FC<FurnaceGUIProps> = ({
  inventory,
  isOpen,
  onClose,
  blockIcons,
  onInventoryChange,
}) => {
  const [inputSlot, setInputSlot] = useState<ItemStack | null>(null);
  const [fuelSlot, setFuelSlot] = useState<ItemStack | null>(null);
  const [outputSlot, setOutputSlot] = useState<ItemStack | null>(null);

  const [burnTimeRemaining, setBurnTimeRemaining] = useState(0); // in seconds
  const [maxBurnTime, setMaxBurnTime] = useState(1);
  const [smeltProgress, setSmeltProgress] = useState(0); // 0 to 1

  const [cursorStack, setCursorStack] = useState<ItemStack | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isOpen) return;

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isOpen]);

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
  }, [isOpen, cursorStack, inputSlot, fuelSlot, outputSlot]);

  // Smelting loop (Ticks every 100ms)
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      // 1. Check if can smelt current input
      const getSmeltResult = (type: BlockType): BlockType | null => {
        if (type === BLOCK_TYPE.IRON_ORE) return BLOCK_TYPE.IRON_INGOT;
        if (type === BLOCK_TYPE.GOLD_ORE) return BLOCK_TYPE.GOLD_INGOT;
        if (type === BLOCK_TYPE.RAW_PORKCHOP) return BLOCK_TYPE.COOKED_PORKCHOP;
        return null;
      };

      const resultType = inputSlot ? getSmeltResult(inputSlot.type) : null;
      const canSmelt =
        resultType !== null &&
        (!outputSlot || (outputSlot.type === resultType && outputSlot.count < 64));

      // 2. Consume fuel if needed and can smelt
      if (canSmelt) {
        if (burnTimeRemaining <= 0 && fuelSlot && fuelSlot.count > 0) {
          let fuelDuration = 0;
          if (fuelSlot.type === BLOCK_TYPE.COAL) fuelDuration = 16;
          else if (fuelSlot.type === BLOCK_TYPE.OAK_LOG || fuelSlot.type === BLOCK_TYPE.BIRCH_LOG) fuelDuration = 6;
          else if (fuelSlot.type === BLOCK_TYPE.OAK_PLANKS || fuelSlot.type === BLOCK_TYPE.BIRCH_PLANKS) fuelDuration = 4;
          else if (fuelSlot.type === BLOCK_TYPE.STICK) fuelDuration = 2;

          if (fuelDuration > 0) {
            setBurnTimeRemaining(fuelDuration);
            setMaxBurnTime(fuelDuration);
            setFuelSlot((f) => {
              if (!f) return null;
              const remain = f.count - 1;
              return remain > 0 ? { ...f, count: remain } : null;
            });
          }
        }
      }

      // 3. Progress smelting if fire is burning
      if (burnTimeRemaining > 0) {
        setBurnTimeRemaining((t) => Math.max(0, t - 0.1));

        if (canSmelt && resultType !== null) {
          setSmeltProgress((p) => {
            const next = p + 0.1 / 3.5; // Takes 3.5 seconds per item
            if (next >= 1.0) {
              // Finished smelting 1 item!
              soundManager.playPlace();
              setInputSlot((inp) => {
                if (!inp) return null;
                const remain = inp.count - 1;
                return remain > 0 ? { ...inp, count: remain } : null;
              });
              setOutputSlot((out) => {
                if (!out) return { type: resultType, count: 1 };
                return { type: resultType, count: out.count + 1 };
              });
              return 0;
            }
            return next;
          });
        } else {
          setSmeltProgress(0);
        }
      } else {
        setSmeltProgress(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, inputSlot, fuelSlot, outputSlot, burnTimeRemaining]);

  if (!isOpen) return null;

  const handleClose = () => {
    // Return items from furnace slots and cursor to player inventory
    if (cursorStack) {
      inventory.addItem(cursorStack.type, cursorStack.count);
      setCursorStack(null);
    }
    if (inputSlot) {
      inventory.addItem(inputSlot.type, inputSlot.count);
      setInputSlot(null);
    }
    if (fuelSlot) {
      inventory.addItem(fuelSlot.type, fuelSlot.count);
      setFuelSlot(null);
    }
    if (outputSlot) {
      inventory.addItem(outputSlot.type, outputSlot.count);
      setOutputSlot(null);
    }
    onInventoryChange();
    onClose();
  };

  const handleSlotClick = (slotIdx: number, isRightClick = false) => {
    const slotItem = inventory.slots[slotIdx];

    if (!cursorStack) {
      if (!slotItem) return;
      if (isRightClick) {
        const take = Math.ceil(slotItem.count / 2);
        const remain = slotItem.count - take;
        setCursorStack({ type: slotItem.type, count: take });
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

  const handleFurnaceSlotClick = (
    current: ItemStack | null,
    setVal: React.Dispatch<React.SetStateAction<ItemStack | null>>,
    isOutput = false
  ) => {
    if (isOutput) {
      if (!current) return;
      if (!cursorStack) {
        setCursorStack(current);
        setVal(null);
      } else if (cursorStack.type === current.type && cursorStack.count + current.count <= 64) {
        cursorStack.count += current.count;
        setVal(null);
      }
    } else {
      if (!cursorStack) {
        if (!current) return;
        setCursorStack(current);
        setVal(null);
      } else {
        if (!current) {
          setVal({ ...cursorStack });
          setCursorStack(null);
        } else if (current.type === cursorStack.type) {
          const space = 64 - current.count;
          const toAdd = Math.min(space, cursorStack.count);
          current.count += toAdd;
          const remain = cursorStack.count - toAdd;
          setCursorStack(remain > 0 ? { type: cursorStack.type, count: remain } : null);
        } else {
          setVal({ ...cursorStack });
          setCursorStack({ ...current });
        }
      }
    }
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
            alt="slot icon"
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

  const flameHeightPercent = maxBurnTime > 0 ? (burnTimeRemaining / maxBurnTime) * 100 : 0;

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
          width: '430px',
          maxWidth: '96vw',
          fontFamily: 'monospace',
          color: '#373737',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '15px', textShadow: '1px 1px #eee' }}>Печь (Furnace)</span>
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

        {/* Smelting Area */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', marginBottom: '18px' }}>
          {/* Input & Fuel Column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '11px', color: '#555', fontWeight: 'bold' }}>Руда / Мясо</div>
            {renderSlotBox(inputSlot, () => handleFurnaceSlotClick(inputSlot, setInputSlot))}

            {/* Burning Flame Graphic */}
            <div
              style={{
                width: '18px',
                height: '18px',
                backgroundColor: '#333',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${flameHeightPercent}%`,
                  backgroundColor: '#f97316',
                  transition: 'height 0.1s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                🔥
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#555', fontWeight: 'bold' }}>Уголь / Топливо</div>
            {renderSlotBox(fuelSlot, () => handleFurnaceSlotClick(fuelSlot, setFuelSlot))}
          </div>

          {/* Smelting Progress Arrow */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: '40px',
                height: '12px',
                backgroundColor: '#555',
                position: 'relative',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${smeltProgress * 100}%`,
                  height: '100%',
                  backgroundColor: '#ffffff',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#444' }}>➔</div>
          </div>

          {/* Output Slot */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '11px', color: '#555', fontWeight: 'bold' }}>Результат</div>
            {renderSlotBox(outputSlot, () => handleFurnaceSlotClick(outputSlot, setOutputSlot, true), 48, true)}
          </div>
        </div>

        <div style={{ fontSize: '10px', color: '#555', marginBottom: '10px' }}>
          💡 <b>Плавка:</b> Железная руда ➔ Слиток железа &bull; Сырое мясо ➔ Жареное мясо (Топливо: уголь/дерево)
        </div>

        {/* 27 Backpack Slots */}
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
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#444' }}>Панель быстрого доступа</div>
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
