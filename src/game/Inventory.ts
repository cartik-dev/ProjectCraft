import { BLOCK_TYPE, type BlockType, TOOL_DURABILITY } from './constants';
import { soundManager } from './SoundManager';

export interface ItemStack {
  type: BlockType;
  count: number;
  durability?: number;
  maxDurability?: number;
}

export class Inventory {
  // 36 inventory slots: 0-8 Hotbar, 9-35 Backpack (empty starter)
  public slots: (ItemStack | null)[] = Array(36).fill(null);
  public selectedIndex = 0; // Active hotbar slot: 0 to 8

  // Pocket 2x2 Crafting Grid
  public craftGrid: (ItemStack | null)[] = [null, null, null, null];
  public craftResult: ItemStack | null = null;

  // 3x3 Crafting Table Grid
  public craftGrid3x3: (ItemStack | null)[] = Array(9).fill(null);
  public craftResult3x3: ItemStack | null = null;

  constructor() {
    // Pure vanilla survival start: completely empty inventory!
  }

  public getSelectedBlockType(): BlockType {
    const slot = this.slots[this.selectedIndex];
    return slot ? slot.type : BLOCK_TYPE.AIR;
  }

  public getSelectedItem(): ItemStack | null {
    return this.slots[this.selectedIndex];
  }

  public addItem(type: BlockType, count = 1, durability?: number, maxDurability?: number): boolean {
    if (type === BLOCK_TYPE.AIR) return false;

    const toolMax = maxDurability ?? TOOL_DURABILITY[type];

    // 1. Stackable items: merge into existing incomplete stacks
    if (!toolMax) {
      for (let i = 0; i < 36; i++) {
        const slot = this.slots[i];
        if (slot && slot.type === type && slot.count < 64) {
          const space = 64 - slot.count;
          const toAdd = Math.min(space, count);
          slot.count += toAdd;
          count -= toAdd;
          if (count === 0) return true;
        }
      }
    }

    // 2. Place remaining into first empty slot
    while (count > 0) {
      const emptyIdx = this.slots.findIndex((s) => s === null);
      if (emptyIdx === -1) return false;

      const toAdd = toolMax ? 1 : Math.min(64, count);
      this.slots[emptyIdx] = {
        type,
        count: toAdd,
        durability: toolMax ? (durability ?? toolMax) : undefined,
        maxDurability: toolMax,
      };
      count -= toAdd;
    }

    return true;
  }

  public consumeSelected(): boolean {
    const slot = this.slots[this.selectedIndex];
    if (!slot) return false;

    slot.count--;
    if (slot.count <= 0) {
      this.slots[this.selectedIndex] = null;
    }
    return true;
  }

  public damageHeldTool(): boolean {
    const slot = this.slots[this.selectedIndex];
    if (!slot || slot.durability === undefined) return false;

    slot.durability -= 1;
    if (slot.durability <= 0) {
      this.slots[this.selectedIndex] = null;
      soundManager.playBreak();
      return true; // Broke!
    }
    return false;
  }

  public clearAllCraftingGrids(): void {
    for (let i = 0; i < 4; i++) {
      const item = this.craftGrid[i];
      if (item) {
        this.addItem(item.type, item.count);
        this.craftGrid[i] = null;
      }
    }
    this.craftResult = null;

    for (let i = 0; i < 9; i++) {
      const item = this.craftGrid3x3[i];
      if (item) {
        this.addItem(item.type, item.count);
        this.craftGrid3x3[i] = null;
      }
    }
    this.craftResult3x3 = null;
  }

  // --- 2x2 POCKET CRAFTING RECIPES ---

  public updateCrafting(): void {
    const g = this.craftGrid;
    const nonEmpty = g.filter((s) => s !== null && s.count > 0);

    const isPlank = (s: ItemStack | null) =>
      s !== null && (s.type === BLOCK_TYPE.OAK_PLANKS || s.type === BLOCK_TYPE.BIRCH_PLANKS);

    // 1. Single Oak Log -> 4 Oak Planks
    if (nonEmpty.length === 1 && nonEmpty[0]!.type === BLOCK_TYPE.OAK_LOG) {
      this.craftResult = { type: BLOCK_TYPE.OAK_PLANKS, count: 4 };
      return;
    }

    // 2. Single Birch Log -> 4 Birch Planks
    if (nonEmpty.length === 1 && nonEmpty[0]!.type === BLOCK_TYPE.BIRCH_LOG) {
      this.craftResult = { type: BLOCK_TYPE.BIRCH_PLANKS, count: 4 };
      return;
    }

    // 3. 4 Planks in 2x2 -> 1 Crafting Table
    if (nonEmpty.length === 4 && nonEmpty.every(isPlank)) {
      this.craftResult = { type: BLOCK_TYPE.CRAFTING_TABLE, count: 1 };
      return;
    }

    // 4. 2 Planks vertically -> 4 Sticks
    if (
      (isPlank(g[0]) && isPlank(g[2]) && !g[1] && !g[3]) ||
      (isPlank(g[1]) && isPlank(g[3]) && !g[0] && !g[2])
    ) {
      this.craftResult = { type: BLOCK_TYPE.STICK, count: 4 };
      return;
    }

    this.craftResult = null;
  }

  public takeCraftResult(): ItemStack | null {
    if (!this.craftResult) return null;
    const result = { ...this.craftResult };

    const maxDur = TOOL_DURABILITY[result.type];
    if (maxDur) {
      result.durability = maxDur;
      result.maxDurability = maxDur;
    }

    for (let i = 0; i < 4; i++) {
      const slot = this.craftGrid[i];
      if (slot && slot.count > 0) {
        slot.count--;
        if (slot.count <= 0) this.craftGrid[i] = null;
      }
    }

    this.updateCrafting();
    return result;
  }

  // --- 3x3 CRAFTING TABLE RECIPES ---

  public updateCrafting3x3(): void {
    const g = this.craftGrid3x3;
    const nonEmpty = g.filter((s) => s !== null && s.count > 0);

    const isPlank = (s: ItemStack | null) =>
      s !== null && (s.type === BLOCK_TYPE.OAK_PLANKS || s.type === BLOCK_TYPE.BIRCH_PLANKS);
    const isStone = (s: ItemStack | null) => s !== null && s.type === BLOCK_TYPE.STONE;
    const isIron = (s: ItemStack | null) => s !== null && s.type === BLOCK_TYPE.IRON_INGOT;
    const isGold = (s: ItemStack | null) => s !== null && s.type === BLOCK_TYPE.GOLD_INGOT;
    const isDiamond = (s: ItemStack | null) => s !== null && s.type === BLOCK_TYPE.DIAMOND;
    const isStick = (s: ItemStack | null) => s !== null && s.type === BLOCK_TYPE.STICK;

    // 1. Pickaxes: [Head, Head, Head] / [Empty, Stick, Empty] / [Empty, Stick, Empty]
    if (
      g[1] && g[4] && g[7] &&
      isStick(g[4]) && isStick(g[7]) &&
      !g[3] && !g[5] && !g[6] && !g[8]
    ) {
      if (isPlank(g[0]) && isPlank(g[1]) && isPlank(g[2])) {
        this.craftResult3x3 = { type: BLOCK_TYPE.WOODEN_PICKAXE, count: 1 };
        return;
      }
      if (isStone(g[0]) && isStone(g[1]) && isStone(g[2])) {
        this.craftResult3x3 = { type: BLOCK_TYPE.STONE_PICKAXE, count: 1 };
        return;
      }
      if (isIron(g[0]) && isIron(g[1]) && isIron(g[2])) {
        this.craftResult3x3 = { type: BLOCK_TYPE.IRON_PICKAXE, count: 1 };
        return;
      }
      if (isGold(g[0]) && isGold(g[1]) && isGold(g[2])) {
        this.craftResult3x3 = { type: BLOCK_TYPE.GOLDEN_PICKAXE, count: 1 };
        return;
      }
      if (isDiamond(g[0]) && isDiamond(g[1]) && isDiamond(g[2])) {
        this.craftResult3x3 = { type: BLOCK_TYPE.DIAMOND_PICKAXE, count: 1 };
        return;
      }
    }

    // 2. Axes: [Head, Head, Empty] / [Head, Stick, Empty] / [Empty, Stick, Empty]
    if (
      isStick(g[4]) && isStick(g[7]) && !g[2] && !g[5] && !g[6] && !g[8]
    ) {
      if (isPlank(g[0]) && isPlank(g[1]) && isPlank(g[3])) {
        this.craftResult3x3 = { type: BLOCK_TYPE.WOODEN_AXE, count: 1 };
        return;
      }
      if (isStone(g[0]) && isStone(g[1]) && isStone(g[3])) {
        this.craftResult3x3 = { type: BLOCK_TYPE.STONE_AXE, count: 1 };
        return;
      }
      if (isIron(g[0]) && isIron(g[1]) && isIron(g[3])) {
        this.craftResult3x3 = { type: BLOCK_TYPE.IRON_AXE, count: 1 };
        return;
      }
      if (isDiamond(g[0]) && isDiamond(g[1]) && isDiamond(g[3])) {
        this.craftResult3x3 = { type: BLOCK_TYPE.DIAMOND_AXE, count: 1 };
        return;
      }
    }

    // 3. Shovels: [Empty, Head, Empty] / [Empty, Stick, Empty] / [Empty, Stick, Empty]
    if (
      isStick(g[4]) && isStick(g[7]) &&
      !g[0] && !g[2] && !g[3] && !g[5] && !g[6] && !g[8]
    ) {
      if (isPlank(g[1])) {
        this.craftResult3x3 = { type: BLOCK_TYPE.WOODEN_SHOVEL, count: 1 };
        return;
      }
      if (isIron(g[1])) {
        this.craftResult3x3 = { type: BLOCK_TYPE.IRON_SHOVEL, count: 1 };
        return;
      }
    }

    // 4. Swords: [Empty, Blade, Empty] / [Empty, Blade, Empty] / [Empty, Stick, Empty]
    if (
      isStick(g[7]) &&
      !g[0] && !g[2] && !g[3] && !g[5] && !g[6] && !g[8]
    ) {
      if (isPlank(g[1]) && isPlank(g[4])) {
        this.craftResult3x3 = { type: BLOCK_TYPE.WOODEN_SWORD, count: 1 };
        return;
      }
      if (isIron(g[1]) && isIron(g[4])) {
        this.craftResult3x3 = { type: BLOCK_TYPE.IRON_SWORD, count: 1 };
        return;
      }
      if (isGold(g[1]) && isGold(g[4])) {
        this.craftResult3x3 = { type: BLOCK_TYPE.GOLDEN_SWORD, count: 1 };
        return;
      }
      if (isDiamond(g[1]) && isDiamond(g[4])) {
        this.craftResult3x3 = { type: BLOCK_TYPE.DIAMOND_SWORD, count: 1 };
        return;
      }
    }

    // 5. Single Oak Log -> 4 Planks
    if (nonEmpty.length === 1 && nonEmpty[0]!.type === BLOCK_TYPE.OAK_LOG) {
      this.craftResult3x3 = { type: BLOCK_TYPE.OAK_PLANKS, count: 4 };
      return;
    }

    // 6. Single Birch Log -> 4 Planks
    if (nonEmpty.length === 1 && nonEmpty[0]!.type === BLOCK_TYPE.BIRCH_LOG) {
      this.craftResult3x3 = { type: BLOCK_TYPE.BIRCH_PLANKS, count: 4 };
      return;
    }

    // 7. 2 Planks anywhere vertically -> 4 Sticks
    for (let c = 0; c < 3; c++) {
      if (isPlank(g[c]) && isPlank(g[c + 3]) && nonEmpty.length === 2) {
        this.craftResult3x3 = { type: BLOCK_TYPE.STICK, count: 4 };
        return;
      }
      if (isPlank(g[c + 3]) && isPlank(g[c + 6]) && nonEmpty.length === 2) {
        this.craftResult3x3 = { type: BLOCK_TYPE.STICK, count: 4 };
        return;
      }
    }

    // 8. 4 Planks in 2x2 -> 1 Crafting Table
    if (nonEmpty.length === 4 && nonEmpty.every(isPlank)) {
      this.craftResult3x3 = { type: BLOCK_TYPE.CRAFTING_TABLE, count: 1 };
      return;
    }

    // 9. 8 Stone in ring -> 1 Furnace
    if (
      nonEmpty.length === 8 &&
      !g[4] &&
      g.every((s, idx) => idx === 4 || isStone(s))
    ) {
      this.craftResult3x3 = { type: BLOCK_TYPE.FURNACE, count: 1 };
      return;
    }

    this.craftResult3x3 = null;
  }

  public takeCraftResult3x3(): ItemStack | null {
    if (!this.craftResult3x3) return null;
    const result = { ...this.craftResult3x3 };

    const maxDur = TOOL_DURABILITY[result.type];
    if (maxDur) {
      result.durability = maxDur;
      result.maxDurability = maxDur;
    }

    for (let i = 0; i < 9; i++) {
      const slot = this.craftGrid3x3[i];
      if (slot && slot.count > 0) {
        slot.count--;
        if (slot.count <= 0) this.craftGrid3x3[i] = null;
      }
    }

    this.updateCrafting3x3();
    return result;
  }

  public getMiningSpeedMultiplier(blockType: BlockType): number {
    const selected = this.getSelectedBlockType();

    // Pickaxes on stone & ores
    if (
      blockType === BLOCK_TYPE.STONE ||
      blockType === BLOCK_TYPE.FURNACE ||
      blockType === BLOCK_TYPE.COAL_ORE ||
      blockType === BLOCK_TYPE.IRON_ORE ||
      blockType === BLOCK_TYPE.GOLD_ORE ||
      blockType === BLOCK_TYPE.DIAMOND_ORE
    ) {
      if (selected === BLOCK_TYPE.DIAMOND_PICKAXE) return 7.5;
      if (selected === BLOCK_TYPE.GOLDEN_PICKAXE) return 9.0;
      if (selected === BLOCK_TYPE.IRON_PICKAXE) return 5.0;
      if (selected === BLOCK_TYPE.STONE_PICKAXE) return 3.5;
      if (selected === BLOCK_TYPE.WOODEN_PICKAXE) return 2.5;
      return 1.0;
    }

    // Axes on logs, planks, crafting table
    if (
      blockType === BLOCK_TYPE.OAK_LOG ||
      blockType === BLOCK_TYPE.BIRCH_LOG ||
      blockType === BLOCK_TYPE.OAK_PLANKS ||
      blockType === BLOCK_TYPE.BIRCH_PLANKS ||
      blockType === BLOCK_TYPE.CRAFTING_TABLE
    ) {
      if (selected === BLOCK_TYPE.DIAMOND_AXE) return 7.0;
      if (selected === BLOCK_TYPE.IRON_AXE) return 5.0;
      if (selected === BLOCK_TYPE.STONE_AXE) return 3.5;
      if (selected === BLOCK_TYPE.WOODEN_AXE) return 2.5;
      return 1.0;
    }

    // Shovels on dirt, grass, sand, snow
    if (
      blockType === BLOCK_TYPE.DIRT ||
      blockType === BLOCK_TYPE.GRASS ||
      blockType === BLOCK_TYPE.SAND ||
      blockType === BLOCK_TYPE.SNOW
    ) {
      if (selected === BLOCK_TYPE.IRON_SHOVEL) return 5.0;
      if (selected === BLOCK_TYPE.WOODEN_SHOVEL) return 2.5;
      return 1.0;
    }

    return 1.0;
  }

  public static isFood(type: BlockType): boolean {
    return (
      type === BLOCK_TYPE.RAW_PORKCHOP ||
      type === BLOCK_TYPE.COOKED_PORKCHOP ||
      type === BLOCK_TYPE.ROTTEN_FLESH
    );
  }

  public static getFoodNutrition(type: BlockType): number {
    if (type === BLOCK_TYPE.COOKED_PORKCHOP) return 8;
    if (type === BLOCK_TYPE.RAW_PORKCHOP) return 4;
    if (type === BLOCK_TYPE.ROTTEN_FLESH) return 2;
    return 0;
  }
}
