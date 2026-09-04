import React, { useEffect, useMemo, useState } from 'react';
import { BLOCK_TYPE, type BlockType } from '../game/constants';
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

const ingredientName = (type: BlockType | 'ANY_PLANK') => {
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
  return type === 'ANY_PLANK' ? 'Доски' : names[type] ?? 'Предмет';
};

const countIngredient = (inventory: Inventory, type: BlockType | 'ANY_PLANK') => {
  const accepted = type === 'ANY_PLANK' ? [BLOCK_TYPE.OAK_PLANKS, BLOCK_TYPE.BIRCH_PLANKS] : [type];
  return inventory.slots.reduce((sum, slot) => sum + (slot && accepted.includes(slot.type) ? slot.count : 0), 0);
};

const canCraft = (inventory: Inventory, recipe: Recipe) =>
  recipe.ingredients.every((ingredient) => countIngredient(inventory, ingredient.type) >= ingredient.count);

const removeIngredients = (inventory: Inventory, recipe: Recipe) => {
  const removed: Array<{ type: BlockType; count: number }> = [];
  for (const ingredient of recipe.ingredients) {
    const accepted = ingredient.type === 'ANY_PLANK' ? [BLOCK_TYPE.OAK_PLANKS, BLOCK_TYPE.BIRCH_PLANKS] : [ingredient.type];
    let need = ingredient.count;
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

const isInventoryOpen = () => {
  const text = document.body.textContent || '';
  return text.includes('Рюкзак') && (text.includes('Инвентарь и крафт') || text.includes('Верстак (Crafting Table 3x3)'));
};

export const RecipeBookMobile: React.FC<RecipeBookMobileProps> = ({ onRefreshInventory }) => {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [, refresh] = useState(0);

  useEffect(() => {
    const sync = () => {
      const mobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
      const active = mobile && isInventoryOpen();
      setVisible(active);
      if (!active) setOpen(false);
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

  const inventory = (window as ProjectCraftWindow).__projectcraftInventory;
  const mode = (document.body.textContent || '').includes('Верстак (Crafting Table 3x3)') ? '3x3' : '2x2';
  const recipes = useMemo(() => RECIPES.filter((recipe) => recipe.table === mode), [mode]);
  const shown = recipes.slice(page * 5, page * 5 + 5);
  const maxPage = Math.max(0, Math.ceil(recipes.length / 5) - 1);

  const craft = (recipe: Recipe) => {
    const current = (window as ProjectCraftWindow).__projectcraftInventory;
    if (!current || !canCraft(current, recipe)) return;
    const removed = removeIngredients(current, recipe);
    if (!current.addItem(recipe.output, recipe.count)) {
      for (const item of removed) current.addItem(item.type, item.count);
      return;
    }
    refresh((value) => value + 1);
    onRefreshInventory();
  };

  if (!visible) return null;

  return (
    <>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label="Книга рецептов"
        style={{
          position: 'fixed',
          top: '50%',
          right: 'calc(50% - 226px)',
          transform: 'translateY(-50%)',
          width: '40px',
          height: '54px',
          background: '#c6c6c6',
          color: '#373737',
          borderTop: '3px solid #fff',
          borderLeft: '3px solid #fff',
          borderRight: '3px solid #555',
          borderBottom: '3px solid #555',
          zIndex: 130,
          fontSize: '22px',
          lineHeight: 1,
          touchAction: 'manipulation',
        }}
      >
        📖
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            right: 'calc(50% - 362px)',
            transform: 'translateY(-50%)',
            width: 'min(270px, calc(100vw - 18px))',
            maxHeight: '78vh',
            background: '#c6c6c6',
            borderTop: '3px solid #fff',
            borderLeft: '3px solid #fff',
            borderRight: '3px solid #555',
            borderBottom: '3px solid #555',
            boxShadow: '0 8px 24px rgba(0,0,0,.7)',
            zIndex: 125,
            fontFamily: 'monospace',
            color: '#373737',
          }}
        >
          <div style={{ padding: '9px 10px', fontWeight: 700, fontSize: '13px', borderBottom: '2px solid #8b8b8b', textShadow: '1px 1px #eee' }}>
            Книга рецептов
          </div>

          <div style={{ padding: '8px', maxHeight: 'calc(78vh - 85px)', overflowY: 'auto' }}>
            {shown.map((recipe) => {
              const available = inventory ? canCraft(inventory, recipe) : false;
              return (
                <button
                  key={recipe.id}
                  onClick={() => craft(recipe)}
                  disabled={!available}
                  style={{
                    width: '100%',
                    minHeight: '54px',
                    marginBottom: '6px',
                    padding: '5px',
                    display: 'grid',
                    gridTemplateColumns: '42px 1fr 28px',
                    alignItems: 'center',
                    gap: '7px',
                    textAlign: 'left',
                    background: available ? '#d8d8d8' : '#b5b5b5',
                    color: available ? '#222' : '#666',
                    borderTop: `2px solid ${available ? '#fff' : '#d0d0d0'}`,
                    borderLeft: `2px solid ${available ? '#fff' : '#d0d0d0'}`,
                    borderRight: '2px solid #555',
                    borderBottom: '2px solid #555',
                    opacity: available ? 1 : 0.72,
                    touchAction: 'manipulation',
                  }}
                >
                  <span style={{ width: '38px', height: '38px', background: '#8b8b8b', borderTop: '2px solid #373737', borderLeft: '2px solid #373737', borderRight: '2px solid #fff', borderBottom: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    {recipe.output === BLOCK_TYPE.WOODEN_PICKAXE || recipe.output === BLOCK_TYPE.STONE_PICKAXE || recipe.output === BLOCK_TYPE.IRON_PICKAXE || recipe.output === BLOCK_TYPE.GOLDEN_PICKAXE || recipe.output === BLOCK_TYPE.DIAMOND_PICKAXE ? '⛏️' : recipe.output === BLOCK_TYPE.WOODEN_AXE || recipe.output === BLOCK_TYPE.STONE_AXE || recipe.output === BLOCK_TYPE.IRON_AXE || recipe.output === BLOCK_TYPE.DIAMOND_AXE ? '🪓' : recipe.output === BLOCK_TYPE.WOODEN_SWORD || recipe.output === BLOCK_TYPE.IRON_SWORD || recipe.output === BLOCK_TYPE.GOLDEN_SWORD || recipe.output === BLOCK_TYPE.DIAMOND_SWORD ? '⚔️' : recipe.output === BLOCK_TYPE.FURNACE ? '🔥' : '▪'}
                  </span>
                  <span>
                    <span style={{ display: 'block', fontSize: '10px', fontWeight: 700 }}>{recipe.name} ×{recipe.count}</span>
                    <span style={{ display: 'block', marginTop: '3px', fontSize: '8px' }}>
                      {recipe.ingredients.map((ingredient) => `${ingredient.count}× ${ingredientName(ingredient.type)}`).join(' + ')}
                    </span>
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
