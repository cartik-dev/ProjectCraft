import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { BLOCK_TYPE, type BlockType } from '../game/constants';
import { Inventory } from '../game/Inventory';

type ProjectCraftWindow = Window & { __projectcraftInventory?: Inventory };

// Expose the actual game inventory to this UI-only helper without adding a second game control.
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
  onRefreshInventory: () => void;
}

interface Recipe {
  id: string;
  name: string;
  output: BlockType;
  count: number;
  table: '2x2' | '3x3';
  ingredients: Array<{ type: BlockType | 'ANY_PLANK'; count: number }>;
}

const RECIPES: Recipe[] = [
  { id: 'oak-planks', name: 'Дубовые доски', output: BLOCK_TYPE.OAK_PLANKS, count: 4, table: '2x2', ingredients: [{ type: BLOCK_TYPE.OAK_LOG, count: 1 }] },
  { id: 'birch-planks', name: 'Берёзовые доски', output: BLOCK_TYPE.BIRCH_PLANKS, count: 4, table: '2x2', ingredients: [{ type: BLOCK_TYPE.BIRCH_LOG, count: 1 }] },
  { id: 'crafting-table', name: 'Верстак', output: BLOCK_TYPE.CRAFTING_TABLE, count: 1, table: '2x2', ingredients: [{ type: 'ANY_PLANK', count: 4 }] },
  { id: 'sticks', name: 'Палки', output: BLOCK_TYPE.STICK, count: 4, table: '2x2', ingredients: [{ type: 'ANY_PLANK', count: 2 }] },
  { id: 'wood-pickaxe', name: 'Деревянная кирка', output: BLOCK_TYPE.WOODEN_PICKAXE, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.OAK_PLANKS, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'stone-pickaxe', name: 'Каменная кирка', output: BLOCK_TYPE.STONE_PICKAXE, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.STONE, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'iron-pickaxe', name: 'Железная кирка', output: BLOCK_TYPE.IRON_PICKAXE, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.IRON_INGOT, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'gold-pickaxe', name: 'Золотая кирка', output: BLOCK_TYPE.GOLDEN_PICKAXE, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.GOLD_INGOT, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'diamond-pickaxe', name: 'Алмазная кирка', output: BLOCK_TYPE.DIAMOND_PICKAXE, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.DIAMOND, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'wood-axe', name: 'Деревянный топор', output: BLOCK_TYPE.WOODEN_AXE, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.OAK_PLANKS, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'stone-axe', name: 'Каменный топор', output: BLOCK_TYPE.STONE_AXE, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.STONE, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'iron-axe', name: 'Железный топор', output: BLOCK_TYPE.IRON_AXE, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.IRON_INGOT, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'diamond-axe', name: 'Алмазный топор', output: BLOCK_TYPE.DIAMOND_AXE, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.DIAMOND, count: 3 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'wood-shovel', name: 'Деревянная лопата', output: BLOCK_TYPE.WOODEN_SHOVEL, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.OAK_PLANKS, count: 1 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'iron-shovel', name: 'Железная лопата', output: BLOCK_TYPE.IRON_SHOVEL, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.IRON_INGOT, count: 1 }, { type: BLOCK_TYPE.STICK, count: 2 }] },
  { id: 'wood-sword', name: 'Деревянный меч', output: BLOCK_TYPE.WOODEN_SWORD, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.OAK_PLANKS, count: 2 }, { type: BLOCK_TYPE.STICK, count: 1 }] },
  { id: 'iron-sword', name: 'Железный меч', output: BLOCK_TYPE.IRON_SWORD, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.IRON_INGOT, count: 2 }, { type: BLOCK_TYPE.STICK, count: 1 }] },
  { id: 'gold-sword', name: 'Золотой меч', output: BLOCK_TYPE.GOLDEN_SWORD, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.GOLD_INGOT, count: 2 }, { type: BLOCK_TYPE.STICK, count: 1 }] },
  { id: 'diamond-sword', name: 'Алмазный меч', output: BLOCK_TYPE.DIAMOND_SWORD, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.DIAMOND, count: 2 }, { type: BLOCK_TYPE.STICK, count: 1 }] },
  { id: 'furnace', name: 'Печь', output: BLOCK_TYPE.FURNACE, count: 1, table: '3x3', ingredients: [{ type: BLOCK_TYPE.STONE, count: 8 }] },
];

const emojiFor = (type: BlockType) => {
  switch (type) {
    case BLOCK_TYPE.OAK_PLANKS: return '🟫';
    case BLOCK_TYPE.BIRCH_PLANKS: return '🟨';
    case BLOCK_TYPE.CRAFTING_TABLE: return '🪚';
    case BLOCK_TYPE.STICK: return '🪵';
    case BLOCK_TYPE.WOODEN_PICKAXE: return '⛏️';
    case BLOCK_TYPE.STONE_PICKAXE: return '⛏️';
    case BLOCK_TYPE.IRON_PICKAXE: return '⛏️';
    case BLOCK_TYPE.GOLDEN_PICKAXE: return '⛏️';
    case BLOCK_TYPE.DIAMOND_PICKAXE: return '⛏️';
    case BLOCK_TYPE.WOODEN_AXE: return '🪓';
    case BLOCK_TYPE.STONE_AXE: return '🪓';
    case BLOCK_TYPE.IRON_AXE: return '🪓';
    case BLOCK_TYPE.DIAMOND_AXE: return '🪓';
    case BLOCK_TYPE.WOODEN_SHOVEL: return '🥄';
    case BLOCK_TYPE.IRON_SHOVEL: return '🥄';
    case BLOCK_TYPE.WOODEN_SWORD: return '⚔️';
    case BLOCK_TYPE.IRON_SWORD: return '⚔️';
    case BLOCK_TYPE.GOLDEN_SWORD: return '⚔️';
    case BLOCK_TYPE.DIAMOND_SWORD: return '⚔️';
    case BLOCK_TYPE.FURNACE: return '🔥';
    default: return '⬜';
  }
};

const countType = (inventory: Inventory, type: BlockType | 'ANY_PLANK') => {
  const accepted = type === 'ANY_PLANK' ? [BLOCK_TYPE.OAK_PLANKS, BLOCK_TYPE.BIRCH_PLANKS] : [type];
  return inventory.slots.reduce((total, slot) => total + (slot && accepted.includes(slot.type) ? slot.count : 0), 0);
};

const canCraft = (inventory: Inventory, recipe: Recipe) =>
  recipe.ingredients.every((ingredient) => countType(inventory, ingredient.type) >= ingredient.count);

const removeIngredients = (inventory: Inventory, recipe: Recipe) => {
  const removed: Array<{ type: BlockType; count: number }> = [];

  for (const ingredient of recipe.ingredients) {
    const accepted = ingredient.type === 'ANY_PLANK' ? [BLOCK_TYPE.OAK_PLANKS, BLOCK_TYPE.BIRCH_PLANKS] : [ingredient.type];
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

export const RecipeBookMobile: React.FC<RecipeBookMobileProps> = ({ onRefreshInventory }) => {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [, rerender] = useState(0);

  useEffect(() => {
    const sync = () => {
      const mobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
      const text = document.body.textContent || '';
      const openInventory = text.includes('Рюкзак') && (text.includes('Инвентарь и крафт') || text.includes('Верстак (Crafting Table 3x3)'));
      setVisible(mobile && openInventory);
      if (!openInventory) setOpen(false);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', sync);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, []);

  const mode = (document.body.textContent || '').includes('Верстак (Crafting Table 3x3)') ? '3x3' : '2x2';
  const inventory = (window as ProjectCraftWindow).__projectcraftInventory;
  const recipes = useMemo(() => RECIPES.filter((recipe) => recipe.table === mode), [mode]);
  const shownRecipes = recipes.slice(page * 6, page * 6 + 6);
  const maxPage = Math.max(0, Math.ceil(recipes.length / 6) - 1);

  const craft = (recipe: Recipe) => {
    const current = (window as ProjectCraftWindow).__projectcraftInventory;
    if (!current || !canCraft(current, recipe)) return;

    const removed = removeIngredients(current, recipe);
    const added = current.addItem(recipe.output, recipe.count);
    if (!added) {
      for (const item of removed) current.addItem(item.type, item.count);
      return;
    }

    rerender((value) => value + 1);
    onRefreshInventory();
  };

  if (!visible) return null;

  return (
    <>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Открыть книгу рецептов"
        style={{
          position: 'fixed',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          border: '3px solid #1f2937',
          background: '#4b5563',
          color: '#fff',
          zIndex: 130,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(0,0,0,.5)',
          touchAction: 'manipulation',
        }}
      >
        <BookOpen size={24} />
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            right: '8px',
            transform: 'translateY(-50%)',
            width: 'min(290px, calc(100vw - 70px))',
            maxHeight: '78vh',
            background: '#c6c6c6',
            borderTop: '3px solid #fff',
            borderLeft: '3px solid #fff',
            borderRight: '3px solid #555',
            borderBottom: '3px solid #555',
            boxShadow: '0 8px 28px rgba(0,0,0,.75)',
            zIndex: 125,
            fontFamily: 'monospace',
          }}
        >
          <div style={{ padding: '9px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #8b8b8b' }}>
            <b style={{ fontSize: '13px' }}>📖 Книга крафтов</b>
            <span style={{ fontSize: '8px', color: '#555' }}>1 нажатие</span>
          </div>

          <div style={{ padding: '8px', maxHeight: 'calc(78vh - 82px)', overflowY: 'auto' }}>
            {shownRecipes.map((recipe) => {
              const available = inventory ? canCraft(inventory, recipe) : false;
              return (
                <button
                  key={recipe.id}
                  onClick={() => craft(recipe)}
                  disabled={!available}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '7px',
                    padding: '7px',
                    border: `2px solid ${available ? '#4b5563' : '#9ca3af'}`,
                    background: available ? '#e5e7eb' : '#b8b8b8',
                    color: available ? '#111827' : '#666',
                    textAlign: 'left',
                    opacity: available ? 1 : 0.6,
                    touchAction: 'manipulation',
                  }}
                >
                  <span style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#8b8b8b', border: '2px solid #555', fontSize: '22px', flexShrink: 0 }}>
                    {emojiFor(recipe.output)}
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: 'block', fontSize: '10px', fontWeight: 700 }}>{recipe.name} ×{recipe.count}</span>
                    <span style={{ display: 'block', fontSize: '8px', marginTop: '3px', color: available ? '#374151' : '#6b7280' }}>
                      {recipe.ingredients.map((ingredient) => `${ingredient.count} ${ingredient.type === 'ANY_PLANK' ? 'доски' : 'предм.'}`).join(' + ')}
                    </span>
                  </span>
                  <Check size={17} style={{ opacity: available ? 1 : 0.12, flexShrink: 0 }} />
                </button>
              );
            })}
          </div>

          <div style={{ padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #8b8b8b' }}>
            <button onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0} style={{ width: '38px', height: '30px' }}><ChevronLeft size={17} /></button>
            <span style={{ fontSize: '9px' }}>Стр. {page + 1}/{maxPage + 1}</span>
            <button onClick={() => setPage((value) => Math.min(maxPage, value + 1))} disabled={page === maxPage} style={{ width: '38px', height: '30px' }}><ChevronRight size={17} /></button>
          </div>
        </div>
      )}
    </>
  );
};
