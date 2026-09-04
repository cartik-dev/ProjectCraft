import React, { useEffect, useMemo, useState } from 'react';
import { BLOCK_TYPE, type BlockType } from '../game/constants';
import { createBlockMaterials } from '../game/textures';
import { Inventory } from '../game/Inventory';

type ProjectCraftWindow = Window & { __projectcraftInventory?: Inventory };

const inventoryPrototype = Inventory.prototype as Inventory & { __projectCraftBookPatched?: boolean };
if (!inventoryPrototype.__projectCraftBookPatched) {
  const originalGetSelectedBlockType = inventoryPrototype.getSelectedBlockType;
  inventoryPrototype.getSelectedBlockType = function () {
    (window as ProjectCraftWindow).__projectcraftInventory = this as Inventory;
    return originalGetSelectedBlockType.call(this);
  };
  inventoryPrototype.__projectCraftBookPatched = true;
}

interface RecipeBookMobileProps {
  inventory?: Inventory;
  mode?: '2x2' | '3x3';
  blockIcons?: Record<BlockType, string>;
  onInventoryChange?: () => void;
  onRefreshInventory?: () => void;
}

interface Recipe {
  id: string;
  name: string;
  output: BlockType;
  count: number;
  ingredients: Array<{ type: BlockType | 'ANY_PLANK'; count: number }>;
  table: '2x2' | '3x3';
}

const PLANKS: Array<BlockType | 'ANY_PLANK'> = [BLOCK_TYPE.OAK_PLANKS, BLOCK_TYPE.BIRCH_PLANKS];

const RECIPES: Recipe[] = [
  { id: 'oak-planks', name: 'Дубовые доски', output: BLOCK_TYPE.OAK_PLANKS, count: 4, table: '2x2', ingredients: [{ type: BLOCK_TYPE.OAK_LOG, count: 1 }] },
  { id: 'birch-planks', name: 'Берёзовые доски', output: BLOCK_TYPE.BIRCH_PLANKS, count: 4, table: '2x2', ingredients: [{ type: BLOCK_TYPE.BIRCH_LOG, count: 1 }] },
  { id: 'crafting-table', name: 'Верстак', output: BLOCK_TYPE.CRAFTING_TABLE, count: 1, table: '2x2', ingredients: [{ type: 'ANY_PLANK', count: 4 }] },
  { id: 'sticks', name: 'Палки', output: BLOCK_TYPE.STICK, count: 4, table: '2x2', ingredients: [{ type: 'ANY_PLANK', count: 2 }] },
  { id: 'wood-pickaxe', name: 'Деревянная кирка', output: BLOCK_TYPE.WOODEN_PICKAXE, count: 1, table: '3x3', ingredients: [{ type: 'ANY_PLANK', count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'stone-pickaxe', name: 'Каменная кирка', output: BLOCK_TYPE.STONE_PICKAXE, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.STONE, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'iron-pickaxe', name: 'Железная кирка', output: BLOCK_TYPE.IRON_PICKAXE, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.IRON_INGOT, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'gold-pickaxe', name: 'Золотая кирка', output: BLOCK_TYPE.GOLDEN_PICKAXE, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.GOLD_INGOT, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'diamond-pickaxe', name: 'Алмазная кирка', output: BLOCK_TYPE.DIAMOND_PICKAXE, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.DIAMOND, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'wood-axe', name: 'Деревянный топор', output: BLOCK_TYPE.WOODEN_AXE, count: 1, table: '3x3', ingredients: [{ type: 'ANY_PLANK', count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'stone-axe', name: 'Каменный топор', output: BLOCK_TYPE.STONE_AXE, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.STONE, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'iron-axe', name: 'Железный топор', output: BLOCK_TYPE.IRON_AXE, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.IRON_INGOT, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'diamond-axe', name: 'Алмазный топор', output: BLOCK_TYPE.DIAMOND_AXE, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.DIAMOND, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'wood-shovel', name: 'Деревянная лопата', output: BLOCK_TYPE.WOODEN_SHOVEL, count: 1, table: '3x3', ingredients: [{ type: 'ANY_PLANK', count: 1 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'iron-shovel', name: 'Железная лопата', output: BLOCK_TYPE.IRON_SHOVEL, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.IRON_INGOT, count: 1 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'wood-sword', name: 'Деревянный меч', output: BLOCK_TYPE.WOODEN_SWORD, count: 1, table: '3x3', ingredients: [{ type: 'ANY_PLANK', count: 2 }, { type: BLOCK_TYPE.STICK, count: 1 }] },
  { id: 'iron-sword', name: 'Железный меч', output: BLOCK_TYPE.IRON_SWORD, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.IRON_INGOT, count: 2 }, { type: BLOCK_TYPE.STICK, count: 1 }] },
  { id: 'gold-sword', name: 'Золотой меч', output: BLOCK_TYPE.GOLDEN_SWORD, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.GOLD_INGOT, count: 2 }, { type: BLOCK_TYPE.STICK, count: 1 }] },
  { id: 'diamond-sword', name: 'Алмазный меч', output: BLOCK_TYPE.DIAMOND_SWORD, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.DIAMOND, count: 2 }, { type: BLOCK_TYPE.STICK, count: 1 }] },
  { id: 'furnace', name: 'Печь', output: BLOCK_TYPE.FURNACE, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.STONE, count: 8 }] },
];

const findInventoryPanel = () => {
  const labels = ['Инвентарь и крафт (2x2)', 'Верстак (Crafting Table 3x3)'];
  for (const label of labels) {
    const node = Array.from(document.querySelectorAll('span')).find((element) => element.textContent?.trim() === label);
    const panel = node?.parentElement?.parentElement as HTMLElement | null;
    if (panel) return panel;
  }
  return null;
};

const getAcceptedTypes = (type: BlockType | 'ANY_PLANK') => type === 'ANY_PLANK' ? PLANKS.filter((value): value is BlockType => value !== 'ANY_PLANK') : [type];

const countIngredient = (inventory: Inventory, type: BlockType | 'ANY_PLANK') => {
  const accepted = getAcceptedTypes(type);
  return inventory.slots.reduce((sum, slot) => sum + (slot && accepted.includes(slot.type) ? slot.count : 0), 0);
};

const canCraft = (inventory: Inventory, recipe: Recipe) => recipe.ingredients.every((ingredient) => countIngredient(inventory, ingredient.type) >= ingredient.count);

const removeIngredients = (inventory: Inventory, recipe: Recipe) => {
  const removed: Array<{ type: BlockType; count: number }> = [];
  for (const ingredient of recipe.ingredients) {
    const accepted = getAcceptedTypes(ingredient.type);
    let remaining = ingredient.count;
    for (let i = 0; i < inventory.slots.length && remaining > 0; i++) {
      const slot = inventory.slots[i];
      if (!slot || !accepted.includes(slot.type)) continue;
      const take = Math.min(remaining, slot.count);
      removed.push({ type: slot.type, count: take });
      slot.count -= take;
      if (slot.count <= 0) inventory.slots[i] = null;
      remaining -= take;
    }
  }
  return removed;
};

const ingredientName = (type: BlockType | 'ANY_PLANK') => {
  if (type === 'ANY_PLANK') return 'Доски (дуб/берёза)';
  const names: Partial<Record<BlockType, string>> = {
    [BLOCK_TYPE.OAK_LOG]: 'Бревно дуба',
    [BLOCK_TYPE.BIRCH_LOG]: 'Бревно берёзы',
    [BLOCK_TYPE.OAK_PLANKS]: 'Дубовые доски',
    [BLOCK_TYPE.BIRCH_PLANKS]: 'Берёзовые доски',
    [BLOCK_TYPE.STONE]: 'Камень',
    [BLOCK_TYPE.STICK]: 'Палка',
    [BLOCK_TYPE.IRON_INGOT]: 'Железо',
    [BLOCK_TYPE.GOLD_INGOT]: 'Золото',
    [BLOCK_TYPE.DIAMOND]: 'Алмаз',
  };
  return names[type] ?? 'Предмет';
};

export const RecipeBookMobile: React.FC<RecipeBookMobileProps> = ({ inventory: inventoryProp, mode: modeProp, blockIcons, onInventoryChange }) => {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [, refresh] = useState(0);
  const [, setPanelVisible] = useState(false);

  const isMobile = typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);
  const generatedIcons = useMemo(() => blockIcons ?? (isMobile ? createBlockMaterials().blockIcons : undefined), [blockIcons, isMobile]);
  const inventory = inventoryProp ?? (window as ProjectCraftWindow).__projectcraftInventory;
  const mode = modeProp ?? ((document.body.textContent || '').includes('Верстак (Crafting Table 3x3)') ? '3x3' : '2x2');
  const recipes = useMemo(() => RECIPES.filter((recipe) => recipe.table === mode), [mode]);
  const shown = recipes.slice(page * 5, page * 5 + 5);
  const maxPage = Math.max(0, Math.ceil(recipes.length / 5) - 1);

  const updatePosition = () => {
    const panel = findInventoryPanel();
    setPanelVisible(!!panel);
    setAnchor(panel?.getBoundingClientRect() ?? null);
  };

  useEffect(() => {
    if (!isMobile) return;
    updatePosition();
    const observer = new MutationObserver(updatePosition);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isMobile, mode]);

  useEffect(() => setPage(0), [mode]);

  const craft = (recipe: Recipe) => {
    if (!inventory || !canCraft(inventory, recipe)) return;
    const removed = removeIngredients(inventory, recipe);
    if (!inventory.addItem(recipe.output, recipe.count)) {
      for (const item of removed) inventory.addItem(item.type, item.count);
      return;
    }
    refresh((value) => value + 1);
    onInventoryChange?.();
  };

  if (!isMobile || !anchor) return null;

  const buttonTop = Math.max(4, anchor.top + 7);
  const buttonLeft = Math.max(4, anchor.right - 82);
  const bookWidth = Math.min(270, window.innerWidth - 18);
  const gap = 8;
  const canOpenRight = anchor.right + gap + bookWidth <= window.innerWidth;
  const canOpenLeft = anchor.left - gap - bookWidth >= 0;
  const side = canOpenRight || !canOpenLeft ? 'right' : 'left';
  const panelLeft = side === 'right'
    ? Math.min(window.innerWidth - bookWidth - 9, anchor.right + gap)
    : Math.max(9, anchor.left - bookWidth - gap);

  return (
    <>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Книга рецептов"
        style={{
          position: 'fixed', left: `${buttonLeft}px`, top: `${buttonTop}px`, width: '34px', height: '34px',
          background: '#c6c6c6', color: '#373737', borderTop: '2px solid #fff', borderLeft: '2px solid #fff',
          borderRight: '2px solid #555', borderBottom: '2px solid #555', boxShadow: '0 3px 7px rgba(0,0,0,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', zIndex: 131,
          pointerEvents: 'auto', touchAction: 'manipulation',
        }}
      >📖</button>

      {open && (
        <div style={{
          position: 'fixed', left: `${panelLeft}px`, top: `${Math.max(8, anchor.top + anchor.height / 2)}px`, transform: 'translateY(-50%)',
          width: `${bookWidth}px`, maxHeight: '78vh', overflow: 'hidden', background: '#c6c6c6',
          borderTop: '3px solid #fff', borderLeft: '3px solid #fff', borderRight: '3px solid #555', borderBottom: '3px solid #555',
          boxShadow: '0 10px 28px rgba(0,0,0,.72)', fontFamily: 'monospace', color: '#373737', zIndex: 130,
        }}>
          <div style={{ padding: '9px 10px', fontWeight: 700, fontSize: '13px', borderBottom: '2px solid #8b8b8b', textShadow: '1px 1px #eee' }}>Книга рецептов</div>
          <div style={{ padding: '8px', maxHeight: 'calc(78vh - 84px)', overflowY: 'auto' }}>
            {shown.map((recipe) => {
              const available = !!inventory && canCraft(inventory, recipe);
              const icon = generatedIcons?.[recipe.output];
              return (
                <button key={recipe.id} onClick={() => craft(recipe)} disabled={!available} style={{
                  width: '100%', minHeight: '54px', marginBottom: '6px', padding: '5px', display: 'grid', gridTemplateColumns: '42px 1fr 26px',
                  alignItems: 'center', gap: '7px', textAlign: 'left', background: available ? '#d8d8d8' : '#b5b5b5', color: available ? '#222' : '#666',
                  borderTop: `2px solid ${available ? '#fff' : '#d0d0d0'}`, borderLeft: `2px solid ${available ? '#fff' : '#d0d0d0'}`,
                  borderRight: '2px solid #555', borderBottom: '2px solid #555', opacity: available ? 1 : 0.72, touchAction: 'manipulation',
                }}>
                  <span style={{ width: '38px', height: '38px', background: '#8b8b8b', borderTop: '2px solid #373737', borderLeft: '2px solid #373737', borderRight: '2px solid #fff', borderBottom: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {icon && <img src={icon} alt={recipe.name} style={{ width: '30px', height: '30px', imageRendering: 'pixelated', pointerEvents: 'none' }} />}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '10px', fontWeight: 700 }}>{recipe.name} ×{recipe.count}</span>
                    <span style={{ display: 'block', marginTop: '3px', fontSize: '8px' }}>{recipe.ingredients.map((ingredient) => `${ingredient.count}× ${ingredientName(ingredient.type)}`).join(' + ')}</span>
                  </span>
                  <span style={{ fontSize: '16px', textAlign: 'center' }}>{available ? '✓' : '×'}</span>
                </button>
              );
            })}
          </div>
          <div style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '2px solid #8b8b8b' }}>
            <button onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0} style={{ width: '42px', height: '30px', background: '#c6c6c6', borderTop: '2px solid #fff', borderLeft: '2px solid #fff', borderRight: '2px solid #555', borderBottom: '2px solid #555' }}>◀</button>
            <span style={{ fontSize: '9px' }}>{page + 1} / {maxPage + 1}</span>
            <button onClick={() => setPage((value) => Math.min(maxPage, value + 1))} disabled={page === maxPage} style={{ width: '42px', height: '30px', background: '#c6c6c6', borderTop: '2px solid #fff', borderLeft: '2px solid #fff', borderRight: '2px solid #555', borderBottom: '2px solid #555' }}>▶</button>
          </div>
        </div>
      )}
    </>
  );
};
