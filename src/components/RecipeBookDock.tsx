import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { BLOCK_TYPE, type BlockType } from '../game/constants';
import type { Inventory } from '../game/Inventory';

interface RecipeBookDockProps {
  blockIcons?: Record<BlockType, string>;
  onInventoryChange: () => void;
}

interface Recipe {
  id: string;
  name: string;
  output: { type: BlockType; count: number };
  ingredients: Array<{ type: BlockType | 'ANY_PLANK'; count: number }>;
  table: '2x2' | '3x3';
}

const RECIPES: Recipe[] = [
  { id: 'oak-planks', name: 'Дубовые доски', output: { type: BLOCK_TYPE.OAK_PLANKS, count: 4 }, ingredients: [{ type: BLOCK_TYPE.OAK_LOG, count: 1 }], table: '2x2' },
  { id: 'birch-planks', name: 'Берёзовые доски', output: { type: BLOCK_TYPE.BIRCH_PLANKS, count: 4 }, ingredients: [{ type: BLOCK_TYPE.BIRCH_LOG, count: 1 }], table: '2x2' },
  { id: 'crafting-table', name: 'Верстак', output: { type: BLOCK_TYPE.CRAFTING_TABLE, count: 1 }, ingredients: [{ type: 'ANY_PLANK', count: 4 }], table: '2x2' },
  { id: 'sticks', name: 'Палки', output: { type: BLOCK_TYPE.STICK, count: 4 }, ingredients: [{ type: 'ANY_PLANK', count: 2 }], table: '2x2' },

  { id: 'wood-pickaxe', name: 'Деревянная кирка', output: { type: BLOCK_TYPE.WOODEN_PICKAXE, count: 1 }, ingredients: [{ type: BLOCK_TYPE.OAK_PLANKS, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }], table: '3x3' },
  { id: 'stone-pickaxe', name: 'Каменная кирка', output: { type: BLOCK_TYPE.STONE_PICKAXE, count: 1 }, ingredients: [{ type: BLOCK_TYPE.STONE, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }], table: '3x3' },
  { id: 'iron-pickaxe', name: 'Железная кирка', output: { type: BLOCK_TYPE.IRON_PICKAXE, count: 1 }, ingredients: [{ type: BLOCK_TYPE.IRON_INGOT, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }], table: '3x3' },
  { id: 'gold-pickaxe', name: 'Золотая кирка', output: { type: BLOCK_TYPE.GOLDEN_PICKAXE, count: 1 }, ingredients: [{ type: BLOCK_TYPE.GOLD_INGOT, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }], table: '3x3' },
  { id: 'diamond-pickaxe', name: 'Алмазная кирка', output: { type: BLOCK_TYPE.DIAMOND_PICKAXE, count: 1 }, ingredients: [{ type: BLOCK_TYPE.DIAMOND, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }], table: '3x3' },

  { id: 'wood-axe', name: 'Деревянный топор', output: { type: BLOCK_TYPE.WOODEN_AXE, count: 1 }, ingredients: [{ type: BLOCK_TYPE.OAK_PLANKS, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }], table: '3x3' },
  { id: 'stone-axe', name: 'Каменный топор', output: { type: BLOCK_TYPE.STONE_AXE, count: 1 }, ingredients: [{ type: BLOCK_TYPE.STONE, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }], table: '3x3' },
  { id: 'iron-axe', name: 'Железный топор', output: { type: BLOCK_TYPE.IRON_AXE, count: 1 }, ingredients: [{ type: BLOCK_TYPE.IRON_INGOT, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }], table: '3x3' },
  { id: 'diamond-axe', name: 'Алмазный топор', output: { type: BLOCK_TYPE.DIAMOND_AXE, count: 1 }, ingredients: [{ type: BLOCK_TYPE.DIAMOND, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }], table: '3x3' },

  { id: 'wood-shovel', name: 'Деревянная лопата', output: { type: BLOCK_TYPE.WOODEN_SHOVEL, count: 1 }, ingredients: [{ type: BLOCK_TYPE.OAK_PLANKS, count: 1 }, { type: BLOCK_TYPE.STICK, count: 2 }], table: '3x3' },
  { id: 'iron-shovel', name: 'Железная лопата', output: { type: BLOCK_TYPE.IRON_SHOVEL, count: 1 }, ingredients: [{ type: BLOCK_TYPE.IRON_INGOT, count: 1 }, { type: BLOCK_TYPE.STICK, count: 2 }], table: '3x3' },

  { id: 'wood-sword', name: 'Деревянный меч', output: { type: BLOCK_TYPE.WOODEN_SWORD, count: 1 }, ingredients: [{ type: BLOCK_TYPE.OAK_PLANKS, count: 2 }, { type: BLOCK_TYPE.STICK, count: 1 }], table: '3x3' },
  { id: 'iron-sword', name: 'Железный меч', output: { type: BLOCK_TYPE.IRON_SWORD, count: 1 }, ingredients: [{ type: BLOCK_TYPE.IRON_INGOT, count: 2 }, { type: BLOCK_TYPE.STICK, count: 1 }], table: '3x3' },
  { id: 'gold-sword', name: 'Золотой меч', output: { type: BLOCK_TYPE.GOLDEN_SWORD, count: 1 }, ingredients: [{ type: BLOCK_TYPE.GOLD_INGOT, count: 2 }, { type: BLOCK_TYPE.STICK, count: 1 }], table: '3x3' },
  { id: 'diamond-sword', name: 'Алмазный меч', output: { type: BLOCK_TYPE.DIAMOND_SWORD, count: 1 }, ingredients: [{ type: BLOCK_TYPE.DIAMOND, count: 2 }, { type: BLOCK_TYPE.STICK, count: 1 }], table: '3x3' },

  { id: 'furnace', name: 'Печь', output: { type: BLOCK_TYPE.FURNACE, count: 1 }, ingredients: [{ type: BLOCK_TYPE.STONE, count: 8 }], table: '3x3' },
];

const getInventory = (): Inventory | null => {
  const candidate = (window as Window & { __projectcraftInventory?: Inventory }).__projectcraftInventory;
  return candidate ?? null;
};

const countIngredient = (inventory: Inventory, type: BlockType | 'ANY_PLANK') => {
  const accepted = type === 'ANY_PLANK'
    ? [BLOCK_TYPE.OAK_PLANKS, BLOCK_TYPE.BIRCH_PLANKS]
    : [type];
  return inventory.slots.reduce((sum, slot) => {
    if (slot && accepted.includes(slot.type)) return sum + slot.count;
    return sum;
  }, 0);
};

const hasIngredients = (inventory: Inventory, recipe: Recipe) =>
  recipe.ingredients.every((ingredient) => countIngredient(inventory, ingredient.type) >= ingredient.count);

const removeIngredients = (inventory: Inventory, recipe: Recipe) => {
  const removed: Array<{ type: BlockType; count: number }> = [];

  for (const ingredient of recipe.ingredients) {
    let need = ingredient.count;
    const accepted = ingredient.type === 'ANY_PLANK'
      ? [BLOCK_TYPE.OAK_PLANKS, BLOCK_TYPE.BIRCH_PLANKS]
      : [ingredient.type];

    for (let i = 0; i < inventory.slots.length && need > 0; i++) {
      const slot = inventory.slots[i];
      if (!slot || !accepted.includes(slot.type)) continue;

      const take = Math.min(need, slot.count);
      removed.push({ type: slot.type, count: take });
      slot.count -= take;
      if (slot.count <= 0) inventory.slots[i] = null;
      need -= take;
    }
  }

  return removed;
};

export const RecipeBookDock: React.FC<RecipeBookDockProps> = ({ blockIcons, onInventoryChange }) => {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [inventoryTick, setInventoryTick] = useState(0);

  useEffect(() => {
    const checkInventoryOpen = () => {
      const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
      const text = document.body.textContent || '';
      const isInventoryOpen = text.includes('Рюкзак') && text.includes('Инвентарь и крафт') || text.includes('Верстак (Crafting Table 3x3)');
      setVisible(isMobile && isInventoryOpen);
      if (!isInventoryOpen) setOpen(false);
    };

    checkInventoryOpen();
    const observer = new MutationObserver(checkInventoryOpen);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', checkInventoryOpen);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkInventoryOpen);
    };
  }, []);

  const recipes = useMemo(() => {
    const current = getInventory();
    return RECIPES.filter((recipe) => recipe.table === (document.body.textContent || '').includes('Верстак (Crafting Table 3x3)') ? '3x3' : '2x2').map((recipe) => ({
      recipe,
      available: current ? hasIngredients(current, recipe) : false,
    }));
  // inventoryTick intentionally refreshes availability after every craft.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventoryTick, visible]);

  const visibleRecipes = recipes.slice(page * 6, page * 6 + 6);
  const maxPage = Math.max(0, Math.ceil(recipes.length / 6) - 1);

  const craft = (recipe: Recipe) => {
    const inventory = getInventory();
    if (!inventory || !hasIngredients(inventory, recipe)) return;

    const removed = removeIngredients(inventory, recipe);
    const added = inventory.addItem(recipe.output.type, recipe.output.count);

    if (!added) {
      for (const item of removed) inventory.addItem(item.type, item.count);
      return;
    }

    setInventoryTick((tick) => tick + 1);
    onInventoryChange();
  };

  if (!visible) return null;

  return (
    <>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Книга рецептов"
        title="Книга рецептов"
        style={{
          position: 'fixed',
          top: '50%',
          right: open ? 'calc(50% - 310px)' : '10px',
          transform: 'translateY(-50%)',
          width: '50px',
          height: '50px',
          borderRadius: '8px',
          background: '#6b7280',
          color: '#fff',
          border: '3px solid #374151',
          boxShadow: '0 4px 14px rgba(0,0,0,0.55)',
          zIndex: 130,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'manipulation',
        }}
      >
        <BookOpen size={25} />
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            right: '8px',
            transform: 'translateY(-50%)',
            width: 'min(280px, calc(100vw - 72px))',
            maxHeight: '76vh',
            overflow: 'hidden',
            background: '#c6c6c6',
            borderTop: '3px solid #fff',
            borderLeft: '3px solid #fff',
            borderRight: '3px solid #555',
            borderBottom: '3px solid #555',
            boxShadow: '0 8px 30px rgba(0,0,0,0.75)',
            zIndex: 125,
            fontFamily: 'monospace',
            color: '#262626',
          }}
        >
          <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #8b8b8b' }}>
            <b style={{ fontSize: '14px' }}>📖 Рецепты</b>
            <span style={{ fontSize: '10px', color: '#555' }}>Нажми — готово</span>
          </div>

          <div style={{ padding: '8px', overflowY: 'auto', maxHeight: 'calc(76vh - 86px)' }}>
            {visibleRecipes.map(({ recipe, available }) => (
              <button
                key={recipe.id}
                onClick={() => craft(recipe)}
                disabled={!available}
                style={{
                  width: '100%',
                  marginBottom: '7px',
                  padding: '7px',
                  border: available ? '2px solid #4b5563' : '2px solid #9ca3af',
                  background: available ? '#e5e7eb' : '#b8b8b8',
                  color: available ? '#111827' : '#666',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'left',
                  opacity: available ? 1 : 0.62,
                }}
              >
                <div style={{ width: '40px', height: '40px', background: '#8b8b8b', border: '2px solid #555', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {blockIcons?.[recipe.output.type] && <img src={blockIcons[recipe.output.type]} alt={recipe.name} style={{ width: '31px', height: '31px', imageRendering: 'pixelated' }} />}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700 }}>{recipe.name} ×{recipe.output.count}</div>
                  <div style={{ fontSize: '9px', color: available ? '#374151' : '#6b7280', marginTop: '3px' }}>
                    {recipe.ingredients.map((ingredient) => `${ingredient.count} ${ingredient.type === 'ANY_PLANK' ? 'доски' : ingredient.type}`).join(' + ')}
                  </div>
                </div>
                <Check size={18} style={{ opacity: available ? 1 : 0.15, flexShrink: 0 }} />
              </button>
            ))}
          </div>

          <div style={{ padding: '7px 9px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #8b8b8b' }}>
            <button onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0} style={{ width: '40px', height: '32px' }}><ChevronLeft size={18} /></button>
            <span style={{ fontSize: '10px' }}>Стр. {page + 1}/{maxPage + 1}</span>
            <button onClick={() => setPage((value) => Math.min(maxPage, value + 1))} disabled={page === maxPage} style={{ width: '40px', height: '32px' }}><ChevronRight size={18} /></button>
          </div>
        </div>
      )}
    </>
  );
};
