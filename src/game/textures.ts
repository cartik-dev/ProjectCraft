import * as THREE from 'three';
import { BLOCK_TYPE, type BlockType } from './constants';

function createPixelCanvas(width = 16, height = 16): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

function pseudoRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// 1. Dirt Texture
export function generateDirtCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  const rand = pseudoRand(42);
  const colors = ['#6e4624', '#7d522c', '#8d5f35', '#9c6c3f', '#ab7a49'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

// 2. Grass Top Texture
export function generateGrassTopCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  const rand = pseudoRand(101);
  const greenColors = ['#5fb026', '#6dc22e', '#7bd436', '#89e43e', '#98f248'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = greenColors[Math.floor(rand() * greenColors.length)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

// 3. Grass Side Texture
export function generateGrassSideCanvas(dirtCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  ctx.drawImage(dirtCanvas, 0, 0);

  const rand = pseudoRand(777);
  const greenColors = ['#5fb026', '#6dc22e', '#7bd436', '#89e43e', '#98f248'];
  const grassDepths = [3, 5, 4, 3, 5, 4, 3, 4, 5, 4, 3, 5, 4, 3, 4, 3];

  for (let x = 0; x < 16; x++) {
    const depth = grassDepths[x];
    for (let y = 0; y < depth; y++) {
      ctx.fillStyle = greenColors[Math.floor(rand() * greenColors.length)];
      ctx.fillRect(x, y, 1, 1);
    }
    if (rand() > 0.45 && depth + 1 < 16) {
      ctx.fillStyle = greenColors[Math.floor(rand() * greenColors.length)];
      ctx.fillRect(x, depth, 1, 1);
    }
  }
  return canvas;
}

// 4. Stone Texture
export function generateStoneCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  const rand = pseudoRand(255);
  const stoneColors = ['#686868', '#777777', '#868686', '#959595', '#a4a4a4'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = stoneColors[Math.floor(rand() * stoneColors.length)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

// 5. Coal Ore
export function generateCoalOreCanvas(stoneCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  ctx.drawImage(stoneCanvas, 0, 0);
  const coalClusters = [
    { x: 3, y: 4, w: 3, h: 2 },
    { x: 9, y: 3, w: 2, h: 3 },
    { x: 6, y: 8, w: 3, h: 3 },
    { x: 2, y: 11, w: 3, h: 2 },
    { x: 11, y: 10, w: 3, h: 3 },
  ];
  for (const c of coalClusters) {
    ctx.fillStyle = '#181818';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#333333';
    ctx.fillRect(c.x + 1, c.y, 1, 1);
  }
  return canvas;
}

// 6. Iron Ore
export function generateIronOreCanvas(stoneCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  ctx.drawImage(stoneCanvas, 0, 0);
  const ironClusters = [
    { x: 4, y: 3, w: 2, h: 2 },
    { x: 8, y: 4, w: 3, h: 2 },
    { x: 3, y: 9, w: 3, h: 2 },
    { x: 10, y: 9, w: 2, h: 3 },
    { x: 7, y: 12, w: 3, h: 2 },
  ];
  for (const c of ironClusters) {
    ctx.fillStyle = '#d8af93';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = '#bc8b6c';
    ctx.fillRect(c.x + 1, c.y + 1, 1, 1);
  }
  return canvas;
}

// 7. Oak Log Side
export function generateOakLogSideCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  const rand = pseudoRand(333);
  const barkColors = ['#5e3c1b', '#6f4722', '#80522a', '#915e33'];

  for (let x = 0; x < 16; x++) {
    const colBase = barkColors[Math.floor(rand() * barkColors.length)];
    for (let y = 0; y < 16; y++) {
      ctx.fillStyle = rand() > 0.3 ? colBase : barkColors[Math.floor(rand() * barkColors.length)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

// 8. Oak Log Top
export function generateOakLogTopCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  const barkColor = '#5e3c1b';
  const ring1 = '#8f6237';
  const ring2 = '#a77645';
  const centerColor = '#bd8953';

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const dx = x - 7.5;
      const dy = y - 7.5;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (x === 0 || x === 15 || y === 0 || y === 15) {
        ctx.fillStyle = barkColor;
      } else if (dist > 5.5) {
        ctx.fillStyle = ring1;
      } else if (dist > 3.0) {
        ctx.fillStyle = ring2;
      } else {
        ctx.fillStyle = centerColor;
      }
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

// 9. Oak Leaves
export function generateOakLeavesCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  const rand = pseudoRand(444);
  const leafColors = ['#4a9c1e', '#58ab28', '#66ba32', '#74c93c'];

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = leafColors[Math.floor(rand() * leafColors.length)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

// 10. Birch Log Side
export function generateBirchLogSideCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  const rand = pseudoRand(555);

  ctx.fillStyle = '#eaeaea';
  ctx.fillRect(0, 0, 16, 16);

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (rand() > 0.65) {
        ctx.fillStyle = '#dcdcdc';
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  const spots = [
    { x: 3, y: 3, w: 3 },
    { x: 9, y: 7, w: 4 },
    { x: 1, y: 11, w: 3 },
    { x: 12, y: 13, w: 2 },
  ];
  ctx.fillStyle = '#222222';
  for (const s of spots) {
    ctx.fillRect(s.x, s.y, s.w, 1);
  }
  return canvas;
}

// 11. Birch Log Top
export function generateBirchLogTopCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  const barkColor = '#e0e0e0';
  const ring1 = '#c2a87b';
  const ring2 = '#d9c298';
  const centerColor = '#ebd6b0';

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const dx = x - 7.5;
      const dy = y - 7.5;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (x === 0 || x === 15 || y === 0 || y === 15) {
        ctx.fillStyle = barkColor;
      } else if (dist > 5.5) {
        ctx.fillStyle = ring1;
      } else if (dist > 3.0) {
        ctx.fillStyle = ring2;
      } else {
        ctx.fillStyle = centerColor;
      }
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

// 12. Birch Leaves
export function generateBirchLeavesCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  const rand = pseudoRand(777);
  const birchLeafColors = ['#63b432', '#72c83c', '#81dc46', '#90f050'];

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = birchLeafColors[Math.floor(rand() * birchLeafColors.length)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

// 13. Oak Planks
export function generateOakPlanksCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  const rand = pseudoRand(888);
  const plankColors = ['#976d3c', '#a67b46', '#b58950', '#886032'];

  for (let y = 0; y < 16; y++) {
    const isSeam = y % 4 === 3;
    for (let x = 0; x < 16; x++) {
      if (isSeam) {
        ctx.fillStyle = '#5c3e1e';
      } else {
        ctx.fillStyle = plankColors[Math.floor(rand() * plankColors.length)];
      }
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.fillStyle = '#492f15';
  ctx.fillRect(2, 1, 1, 1);
  ctx.fillRect(13, 5, 1, 1);
  ctx.fillRect(4, 9, 1, 1);
  ctx.fillRect(11, 13, 1, 1);
  return canvas;
}

// 14. Birch Planks
export function generateBirchPlanksCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  const rand = pseudoRand(999);
  const plankColors = ['#c8b68a', '#d7c59a', '#e4d4aa', '#bbaa80'];

  for (let y = 0; y < 16; y++) {
    const isSeam = y % 4 === 3;
    for (let x = 0; x < 16; x++) {
      if (isSeam) {
        ctx.fillStyle = '#8e7f5e';
      } else {
        ctx.fillStyle = plankColors[Math.floor(rand() * plankColors.length)];
      }
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

// 15. Crafting Table Top
export function generateCraftingTableTopCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  ctx.fillStyle = '#a67b46';
  ctx.fillRect(0, 0, 16, 16);

  ctx.strokeStyle = '#5c3e1e';
  ctx.lineWidth = 1;
  ctx.strokeRect(2.5, 2.5, 11, 11);
  ctx.beginPath();
  ctx.moveTo(6.5, 2.5); ctx.lineTo(6.5, 13.5);
  ctx.moveTo(10.5, 2.5); ctx.lineTo(10.5, 13.5);
  ctx.moveTo(2.5, 6.5); ctx.lineTo(13.5, 6.5);
  ctx.moveTo(2.5, 10.5); ctx.lineTo(13.5, 10.5);
  ctx.stroke();
  return canvas;
}

// 16. Crafting Table Side
export function generateCraftingTableSideCanvas(): HTMLCanvasElement {
  const canvas = generateOakPlanksCanvas();
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b0b0b0';
  ctx.fillRect(3, 4, 10, 2);
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(2, 3, 2, 4);

  ctx.fillStyle = '#6e4624';
  ctx.fillRect(8, 8, 1, 6);
  ctx.fillStyle = '#909090';
  ctx.fillRect(6, 7, 5, 2);
  return canvas;
}

// 17. Stick Icon
export function generateStickCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  ctx.clearRect(0, 0, 16, 16);
  ctx.fillStyle = '#8d5f35';
  for (let i = 2; i < 14; i++) {
    ctx.fillRect(i, 15 - i, 2, 2);
  }
  ctx.fillStyle = '#5c3e1e';
  for (let i = 2; i < 14; i++) {
    ctx.fillRect(i, 16 - i, 1, 1);
  }
  return canvas;
}

// 18. Coal Piece
export function generateCoalCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  ctx.clearRect(0, 0, 16, 16);
  ctx.fillStyle = '#1e1e1e';
  ctx.fillRect(4, 5, 8, 7);
  ctx.fillRect(5, 4, 6, 9);
  ctx.fillStyle = '#363636';
  ctx.fillRect(6, 6, 2, 2);
  ctx.fillRect(9, 8, 2, 2);
  return canvas;
}

// 19. Iron Ingot
export function generateIronIngotCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  ctx.clearRect(0, 0, 16, 16);
  ctx.fillStyle = '#dcdcdc';
  ctx.fillRect(3, 6, 10, 5);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(3, 6, 10, 1);
  ctx.fillStyle = '#a0a0a0';
  ctx.fillRect(3, 10, 10, 1);
  return canvas;
}

// 20. Water
export function generateWaterCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(2, 3, 6, 2);
  ctx.fillRect(10, 7, 5, 2);
  ctx.fillRect(4, 11, 7, 2);
  ctx.fillStyle = '#60a5fa';
  ctx.fillRect(3, 4, 3, 1);
  ctx.fillRect(11, 8, 3, 1);
  return canvas;
}

// 21. Sand
export function generateSandCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  const rand = pseudoRand(777);
  const colors = ['#e0c88a', '#dbbf7d', '#ebd8a5', '#d4b870'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

// 22. Snow
export function generateSnowCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  const rand = pseudoRand(888);
  const colors = ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

// 23. Gold Ore
export function generateGoldOreCanvas(stoneCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  ctx.drawImage(stoneCanvas, 0, 0);
  const flecks = [
    [3, 4, 2, 2], [4, 5, 3, 2], [10, 3, 2, 2], [11, 4, 2, 2],
    [6, 9, 3, 2], [7, 10, 2, 2], [12, 11, 2, 2], [2, 12, 2, 2],
  ];
  ctx.fillStyle = '#fbbf24';
  for (const [x, y, w, h] of flecks) {
    ctx.fillRect(x, y, w, h);
  }
  ctx.fillStyle = '#fef08a';
  for (const [x, y] of flecks) {
    ctx.fillRect(x, y, 1, 1);
  }
  return canvas;
}

// 24. Gold Ingot
export function generateGoldIngotCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  ctx.clearRect(0, 0, 16, 16);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(3, 6, 10, 5);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(3, 6, 10, 1);
  ctx.fillStyle = '#d97706';
  ctx.fillRect(3, 10, 10, 1);
  return canvas;
}

// 25. Diamond Ore
export function generateDiamondOreCanvas(stoneCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  ctx.drawImage(stoneCanvas, 0, 0);
  const flecks = [
    [4, 3, 2, 2], [5, 4, 3, 2], [11, 5, 2, 2], [10, 6, 3, 2],
    [5, 10, 3, 2], [6, 11, 2, 2], [12, 12, 2, 2], [2, 8, 2, 2],
  ];
  ctx.fillStyle = '#38bdf8';
  for (const [x, y, w, h] of flecks) {
    ctx.fillRect(x, y, w, h);
  }
  ctx.fillStyle = '#e0f2fe';
  for (const [x, y] of flecks) {
    ctx.fillRect(x, y, 1, 1);
  }
  return canvas;
}

// 26. Diamond Gem
export function generateDiamondCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  ctx.clearRect(0, 0, 16, 16);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(5, 5, 6, 6);
  ctx.fillRect(6, 4, 4, 8);
  ctx.fillRect(4, 6, 8, 4);
  ctx.fillStyle = '#bae6fd';
  ctx.fillRect(6, 5, 4, 2);
  ctx.fillRect(5, 6, 2, 4);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(7, 9, 3, 2);
  ctx.fillRect(9, 7, 2, 3);
  return canvas;
}

// 20. Tools Generator (Pickaxe, Axe, Shovel, Sword)
export function generateToolCanvas(
  type: 'pickaxe' | 'axe' | 'shovel' | 'sword',
  mat: 'wood' | 'stone' | 'iron' | 'gold' | 'diamond'
): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  ctx.clearRect(0, 0, 16, 16);

  let headColor = '#a67b46';
  let darkHead = '#6f4722';

  if (mat === 'stone') {
    headColor = '#8a8a8a';
    darkHead = '#555555';
  } else if (mat === 'iron') {
    headColor = '#e2e8f0';
    darkHead = '#94a3b8';
  } else if (mat === 'gold') {
    headColor = '#fbbf24';
    darkHead = '#d97706';
  } else if (mat === 'diamond') {
    headColor = '#38bdf8';
    darkHead = '#0284c7';
  }

  const stickColor = '#7a5229';

  // Diagonal stick handle
  for (let i = 3; i < 12; i++) {
    ctx.fillStyle = stickColor;
    ctx.fillRect(i, 15 - i, 1, 1);
  }

  if (type === 'pickaxe') {
    ctx.fillStyle = headColor;
    ctx.fillRect(9, 2, 5, 2);
    ctx.fillRect(13, 3, 2, 3);
    ctx.fillRect(11, 4, 2, 2);
    ctx.fillStyle = darkHead;
    ctx.fillRect(8, 2, 1, 1);
    ctx.fillRect(14, 5, 1, 2);
  } else if (type === 'axe') {
    ctx.fillStyle = headColor;
    ctx.fillRect(9, 2, 4, 4);
    ctx.fillRect(10, 6, 2, 2);
    ctx.fillStyle = darkHead;
    ctx.fillRect(13, 3, 1, 3);
  } else if (type === 'shovel') {
    ctx.fillStyle = headColor;
    ctx.fillRect(11, 2, 3, 3);
    ctx.fillRect(10, 3, 1, 2);
  } else if (type === 'sword') {
    ctx.fillStyle = headColor;
    for (let i = 6; i < 14; i++) {
      ctx.fillRect(i, 15 - i, 2, 2);
    }
    // Crossguard
    ctx.fillStyle = darkHead;
    ctx.fillRect(5, 11, 3, 1);
    ctx.fillRect(4, 10, 1, 3);
  }

  return canvas;
}

export function generateFurnaceFrontCanvas(stoneCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  ctx.drawImage(stoneCanvas, 0, 0);

  ctx.fillStyle = '#222222';
  ctx.fillRect(3, 4, 10, 9);

  ctx.fillStyle = '#111111';
  ctx.fillRect(4, 5, 8, 7);

  ctx.fillStyle = '#b45309';
  ctx.fillRect(5, 9, 6, 2);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(6, 9, 4, 1);
  return canvas;
}

export function generateWoolCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  const rand = pseudoRand(654);
  const colors = ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

export function generateBedrockCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  const rand = pseudoRand(9991);
  const colors = ['#09090b', '#18181b', '#27272a', '#3f3f46', '#52525b', '#1c1917'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  for (let i = 0; i < 8; i++) {
    const cx = Math.floor(rand() * 14);
    const cy = Math.floor(rand() * 14);
    ctx.fillStyle = '#000000';
    ctx.fillRect(cx, cy, 2, 2);
  }
  return canvas;
}

export function generateRawPorkchopCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  ctx.clearRect(0, 0, 16, 16);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(4, 5, 7, 7);
  ctx.fillRect(5, 4, 7, 8);
  ctx.fillStyle = '#fecaca';
  ctx.fillRect(3, 5, 2, 6);
  ctx.fillRect(4, 4, 4, 1);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(7, 7, 2, 2);
  return canvas;
}

export function generateCookedPorkchopCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  ctx.clearRect(0, 0, 16, 16);
  ctx.fillStyle = '#92400e';
  ctx.fillRect(4, 5, 7, 7);
  ctx.fillRect(5, 4, 7, 8);
  ctx.fillStyle = '#d97706';
  ctx.fillRect(5, 6, 4, 4);
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(7, 7, 2, 2);
  return canvas;
}

export function generateRottenFleshCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  ctx.clearRect(0, 0, 16, 16);
  ctx.fillStyle = '#5c4033';
  ctx.fillRect(4, 5, 8, 7);
  ctx.fillStyle = '#3d6322';
  ctx.fillRect(5, 6, 3, 3);
  ctx.fillStyle = '#8b2500';
  ctx.fillRect(7, 8, 4, 3);
  return canvas;
}

export function generateBoneCanvas(): HTMLCanvasElement {
  const { canvas, ctx } = createPixelCanvas();
  ctx.clearRect(0, 0, 16, 16);
  ctx.fillStyle = '#e5e7eb';
  for (let i = 3; i < 13; i++) {
    ctx.fillRect(i, 15 - i, 2, 2);
  }
  ctx.fillRect(2, 13, 2, 2);
  ctx.fillRect(3, 14, 2, 2);
  ctx.fillRect(12, 1, 2, 2);
  ctx.fillRect(13, 2, 2, 2);
  return canvas;
}

function makePixelTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function generateBlockIsometricIcon(
  topCanvas: HTMLCanvasElement,
  sideCanvas: HTMLCanvasElement
): string {
  const size = 36;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(18, 2);
  ctx.lineTo(33, 10.5);
  ctx.lineTo(18, 19);
  ctx.lineTo(3, 10.5);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(topCanvas, 0, 0, size, size);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(3, 10.5);
  ctx.lineTo(18, 19);
  ctx.lineTo(18, 34);
  ctx.lineTo(3, 25.5);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(sideCanvas, 0, 0, size, size);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(18, 19);
  ctx.lineTo(33, 10.5);
  ctx.lineTo(33, 25.5);
  ctx.lineTo(18, 34);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(sideCanvas, 0, 0, size, size);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fill();
  ctx.restore();

  return canvas.toDataURL('image/png');
}

export interface BlockMaterials {
  materialsByBlock: Record<BlockType, THREE.Material | THREE.Material[]>;
  crackTextures: THREE.CanvasTexture[];
  blockIcons: Record<BlockType, string>;
}

export function createBlockMaterials(): BlockMaterials {
  const dirtCanvas = generateDirtCanvas();
  const grassTopCanvas = generateGrassTopCanvas();
  const grassSideCanvas = generateGrassSideCanvas(dirtCanvas);
  const stoneCanvas = generateStoneCanvas();

  const coalOreCanvas = generateCoalOreCanvas(stoneCanvas);
  const ironOreCanvas = generateIronOreCanvas(stoneCanvas);

  const oakLogSideCanvas = generateOakLogSideCanvas();
  const oakLogTopCanvas = generateOakLogTopCanvas();
  const oakLeavesCanvas = generateOakLeavesCanvas();

  const birchLogSideCanvas = generateBirchLogSideCanvas();
  const birchLogTopCanvas = generateBirchLogTopCanvas();
  const birchLeavesCanvas = generateBirchLeavesCanvas();

  const oakPlanksCanvas = generateOakPlanksCanvas();
  const birchPlanksCanvas = generateBirchPlanksCanvas();
  const craftingTableTopCanvas = generateCraftingTableTopCanvas();
  const craftingTableSideCanvas = generateCraftingTableSideCanvas();

  const stickCanvas = generateStickCanvas();
  const coalCanvas = generateCoalCanvas();
  const ironIngotCanvas = generateIronIngotCanvas();

  const woodPickaxeCanvas = generateToolCanvas('pickaxe', 'wood');
  const stonePickaxeCanvas = generateToolCanvas('pickaxe', 'stone');
  const woodAxeCanvas = generateToolCanvas('axe', 'wood');
  const stoneAxeCanvas = generateToolCanvas('axe', 'stone');
  const woodShovelCanvas = generateToolCanvas('shovel', 'wood');
  const woodSwordCanvas = generateToolCanvas('sword', 'wood');

  const dirtMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(dirtCanvas) });
  const grassTopMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(grassTopCanvas) });
  const grassSideMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(grassSideCanvas) });
  const stoneMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(stoneCanvas) });

  const coalOreMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(coalOreCanvas) });
  const ironOreMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(ironOreCanvas) });

  const oakLogSideMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(oakLogSideCanvas) });
  const oakLogTopMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(oakLogTopCanvas) });
  const oakLeavesMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(oakLeavesCanvas) });

  const birchLogSideMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(birchLogSideCanvas) });
  const birchLogTopMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(birchLogTopCanvas) });
  const birchLeavesMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(birchLeavesCanvas) });

  const oakPlanksMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(oakPlanksCanvas) });
  const birchPlanksMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(birchPlanksCanvas) });
  const craftingTableTopMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(craftingTableTopCanvas) });
  const craftingTableSideMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(craftingTableSideCanvas) });

  const grassMaterials: THREE.Material[] = [
    grassSideMat, grassSideMat, grassTopMat, dirtMat, grassSideMat, grassSideMat,
  ];

  const oakLogMaterials: THREE.Material[] = [
    oakLogSideMat, oakLogSideMat, oakLogTopMat, oakLogTopMat, oakLogSideMat, oakLogSideMat,
  ];

  const birchLogMaterials: THREE.Material[] = [
    birchLogSideMat, birchLogSideMat, birchLogTopMat, birchLogTopMat, birchLogSideMat, birchLogSideMat,
  ];

  const craftingTableMaterials: THREE.Material[] = [
    craftingTableSideMat, craftingTableSideMat, craftingTableTopMat, oakPlanksMat, craftingTableSideMat, craftingTableSideMat,
  ];

  // Authentic 5-stage progressive block destruction cracks
  const crackTextures: THREE.CanvasTexture[] = [];
  const linesPerStage = [
    [[7, 7, 9, 9], [7, 7, 5, 8], [8, 6, 8, 4]],
    [[7, 7, 9, 9], [7, 7, 5, 8], [8, 6, 8, 4], [9, 9, 13, 11], [5, 8, 3, 5], [5, 8, 4, 11]],
    [[7, 7, 9, 9], [7, 7, 5, 8], [8, 6, 8, 4], [9, 9, 13, 11], [5, 8, 3, 5], [5, 8, 4, 11], [7, 7, 8, 3], [8, 3, 12, 2], [7, 7, 6, 13], [13, 11, 15, 12]],
    [[7, 7, 9, 9], [7, 7, 5, 8], [8, 6, 8, 4], [9, 9, 13, 11], [5, 8, 3, 5], [5, 8, 4, 11], [7, 7, 8, 3], [8, 3, 12, 2], [7, 7, 6, 13], [13, 11, 15, 12], [6, 13, 2, 14], [13, 11, 14, 15], [3, 5, 1, 2], [4, 10, 11, 6], [10, 12, 14, 8]],
    [[7, 7, 9, 9], [7, 7, 5, 8], [8, 6, 8, 4], [9, 9, 13, 11], [5, 8, 3, 5], [5, 8, 4, 11], [7, 7, 8, 3], [8, 3, 12, 2], [7, 7, 6, 13], [13, 11, 15, 12], [6, 13, 2, 14], [13, 11, 14, 15], [3, 5, 1, 2], [4, 10, 11, 6], [10, 12, 14, 8], [2, 8, 6, 2], [0, 6, 3, 5], [11, 1, 15, 3], [1, 13, 6, 15], [10, 15, 14, 14], [3, 2, 8, 3]],
  ];

  for (let s = 0; s < 5; s++) {
    const { canvas, ctx } = createPixelCanvas();
    ctx.clearRect(0, 0, 16, 16);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.88)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of linesPerStage[s]) {
      ctx.moveTo(x1 + 0.5, y1 + 0.5);
      ctx.lineTo(x2 + 0.5, y2 + 0.5);
    }
    ctx.stroke();

    if (s >= 3) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.fillRect(6, 6, 4, 4);
    }
    if (s >= 4) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.fillRect(4, 4, 8, 8);
    }
    crackTextures.push(makePixelTexture(canvas));
  }

  const furnaceFrontCanvas = generateFurnaceFrontCanvas(stoneCanvas);
  const woolCanvas = generateWoolCanvas();
  const rawPorkchopCanvas = generateRawPorkchopCanvas();
  const cookedPorkchopCanvas = generateCookedPorkchopCanvas();
  const rottenFleshCanvas = generateRottenFleshCanvas();
  const boneCanvas = generateBoneCanvas();

  const waterCanvas = generateWaterCanvas();
  const sandCanvas = generateSandCanvas();
  const snowCanvas = generateSnowCanvas();
  const goldOreCanvas = generateGoldOreCanvas(stoneCanvas);
  const goldIngotCanvas = generateGoldIngotCanvas();
  const diamondOreCanvas = generateDiamondOreCanvas(stoneCanvas);
  const diamondCanvas = generateDiamondCanvas();

  const ironPickaxeCanvas = generateToolCanvas('pickaxe', 'iron');
  const ironAxeCanvas = generateToolCanvas('axe', 'iron');
  const ironSwordCanvas = generateToolCanvas('sword', 'iron');
  const ironShovelCanvas = generateToolCanvas('shovel', 'iron');

  const goldPickaxeCanvas = generateToolCanvas('pickaxe', 'gold');
  const goldSwordCanvas = generateToolCanvas('sword', 'gold');

  const diamondPickaxeCanvas = generateToolCanvas('pickaxe', 'diamond');
  const diamondAxeCanvas = generateToolCanvas('axe', 'diamond');
  const diamondSwordCanvas = generateToolCanvas('sword', 'diamond');

  const waterMat = new THREE.MeshLambertMaterial({
    map: makePixelTexture(waterCanvas),
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
  });
  const sandMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(sandCanvas) });
  const snowMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(snowCanvas) });
  const bedrockCanvas = generateBedrockCanvas();
  const bedrockMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(bedrockCanvas) });
  const goldOreMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(goldOreCanvas) });
  const diamondOreMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(diamondOreCanvas) });

  const furnaceFrontMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(furnaceFrontCanvas) });
  const woolMat = new THREE.MeshLambertMaterial({ map: makePixelTexture(woolCanvas) });

  // Dedicated 3D Drop Materials (Real colors for drops!)
  const coalDropMat = new THREE.MeshLambertMaterial({ color: 0x18181b }); // Charcoal black
  const ironIngotMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 }); // Silver steel
  const goldIngotMat = new THREE.MeshLambertMaterial({ color: 0xfbbf24 }); // Bright gold
  const diamondDropMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 }); // Cyan diamond
  const porkchopDropMat = new THREE.MeshLambertMaterial({ color: 0xef4444 }); // Fresh meat red
  const cookedPorkchopDropMat = new THREE.MeshLambertMaterial({ color: 0x92400e }); // Roasted brown
  const rottenFleshDropMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 }); // Zombie flesh
  const boneDropMat = new THREE.MeshLambertMaterial({ color: 0xf3f4f6 }); // Clean bone white

  const furnaceMaterials: THREE.Material[] = [
    stoneMat, stoneMat, stoneMat, stoneMat, furnaceFrontMat, stoneMat,
  ];

  const materialsByBlock: Record<BlockType, THREE.Material | THREE.Material[]> = {
    [BLOCK_TYPE.AIR]: dirtMat,
    [BLOCK_TYPE.WATER]: waterMat,
    [BLOCK_TYPE.SAND]: sandMat,
    [BLOCK_TYPE.SNOW]: snowMat,
    [BLOCK_TYPE.GRASS]: grassMaterials,
    [BLOCK_TYPE.DIRT]: dirtMat,
    [BLOCK_TYPE.STONE]: stoneMat,
    [BLOCK_TYPE.OAK_LOG]: oakLogMaterials,
    [BLOCK_TYPE.OAK_LEAVES]: oakLeavesMat,
    [BLOCK_TYPE.BIRCH_LOG]: birchLogMaterials,
    [BLOCK_TYPE.BIRCH_LEAVES]: birchLeavesMat,
    [BLOCK_TYPE.OAK_PLANKS]: oakPlanksMat,
    [BLOCK_TYPE.BIRCH_PLANKS]: birchPlanksMat,
    [BLOCK_TYPE.CRAFTING_TABLE]: craftingTableMaterials,
    [BLOCK_TYPE.FURNACE]: furnaceMaterials,
    [BLOCK_TYPE.WHITE_WOOL]: woolMat,
    [BLOCK_TYPE.COAL_ORE]: coalOreMat,
    [BLOCK_TYPE.IRON_ORE]: ironOreMat,
    [BLOCK_TYPE.GOLD_ORE]: goldOreMat,
    [BLOCK_TYPE.DIAMOND_ORE]: diamondOreMat,
    [BLOCK_TYPE.STICK]: oakPlanksMat,
    [BLOCK_TYPE.COAL]: coalDropMat,
    [BLOCK_TYPE.IRON_INGOT]: ironIngotMat,
    [BLOCK_TYPE.GOLD_INGOT]: goldIngotMat,
    [BLOCK_TYPE.DIAMOND]: diamondDropMat,
    [BLOCK_TYPE.WOODEN_PICKAXE]: oakPlanksMat,
    [BLOCK_TYPE.STONE_PICKAXE]: stoneMat,
    [BLOCK_TYPE.IRON_PICKAXE]: ironIngotMat,
    [BLOCK_TYPE.GOLDEN_PICKAXE]: goldIngotMat,
    [BLOCK_TYPE.DIAMOND_PICKAXE]: diamondDropMat,
    [BLOCK_TYPE.WOODEN_AXE]: oakPlanksMat,
    [BLOCK_TYPE.STONE_AXE]: stoneMat,
    [BLOCK_TYPE.IRON_AXE]: ironIngotMat,
    [BLOCK_TYPE.DIAMOND_AXE]: diamondDropMat,
    [BLOCK_TYPE.WOODEN_SHOVEL]: oakPlanksMat,
    [BLOCK_TYPE.IRON_SHOVEL]: ironIngotMat,
    [BLOCK_TYPE.WOODEN_SWORD]: oakPlanksMat,
    [BLOCK_TYPE.IRON_SWORD]: ironIngotMat,
    [BLOCK_TYPE.GOLDEN_SWORD]: goldIngotMat,
    [BLOCK_TYPE.DIAMOND_SWORD]: diamondDropMat,
    [BLOCK_TYPE.RAW_PORKCHOP]: porkchopDropMat,
    [BLOCK_TYPE.COOKED_PORKCHOP]: cookedPorkchopDropMat,
    [BLOCK_TYPE.ROTTEN_FLESH]: rottenFleshDropMat,
    [BLOCK_TYPE.BONE]: boneDropMat,
    [BLOCK_TYPE.BEDROCK]: bedrockMat,
  };

  const blockIcons: Record<BlockType, string> = {
    [BLOCK_TYPE.AIR]: '',
    [BLOCK_TYPE.WATER]: generateBlockIsometricIcon(waterCanvas, waterCanvas),
    [BLOCK_TYPE.SAND]: generateBlockIsometricIcon(sandCanvas, sandCanvas),
    [BLOCK_TYPE.SNOW]: generateBlockIsometricIcon(snowCanvas, snowCanvas),
    [BLOCK_TYPE.GRASS]: generateBlockIsometricIcon(grassTopCanvas, grassSideCanvas),
    [BLOCK_TYPE.DIRT]: generateBlockIsometricIcon(dirtCanvas, dirtCanvas),
    [BLOCK_TYPE.STONE]: generateBlockIsometricIcon(stoneCanvas, stoneCanvas),
    [BLOCK_TYPE.OAK_LOG]: generateBlockIsometricIcon(oakLogTopCanvas, oakLogSideCanvas),
    [BLOCK_TYPE.OAK_LEAVES]: generateBlockIsometricIcon(oakLeavesCanvas, oakLeavesCanvas),
    [BLOCK_TYPE.BIRCH_LOG]: generateBlockIsometricIcon(birchLogTopCanvas, birchLogSideCanvas),
    [BLOCK_TYPE.BIRCH_LEAVES]: generateBlockIsometricIcon(birchLeavesCanvas, birchLeavesCanvas),
    [BLOCK_TYPE.OAK_PLANKS]: generateBlockIsometricIcon(oakPlanksCanvas, oakPlanksCanvas),
    [BLOCK_TYPE.BIRCH_PLANKS]: generateBlockIsometricIcon(birchPlanksCanvas, birchPlanksCanvas),
    [BLOCK_TYPE.CRAFTING_TABLE]: generateBlockIsometricIcon(craftingTableTopCanvas, craftingTableSideCanvas),
    [BLOCK_TYPE.FURNACE]: generateBlockIsometricIcon(stoneCanvas, furnaceFrontCanvas),
    [BLOCK_TYPE.WHITE_WOOL]: generateBlockIsometricIcon(woolCanvas, woolCanvas),
    [BLOCK_TYPE.COAL_ORE]: generateBlockIsometricIcon(coalOreCanvas, coalOreCanvas),
    [BLOCK_TYPE.IRON_ORE]: generateBlockIsometricIcon(ironOreCanvas, ironOreCanvas),
    [BLOCK_TYPE.GOLD_ORE]: generateBlockIsometricIcon(goldOreCanvas, goldOreCanvas),
    [BLOCK_TYPE.DIAMOND_ORE]: generateBlockIsometricIcon(diamondOreCanvas, diamondOreCanvas),
    [BLOCK_TYPE.STICK]: stickCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.COAL]: coalCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.IRON_INGOT]: ironIngotCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.GOLD_INGOT]: goldIngotCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.DIAMOND]: diamondCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.WOODEN_PICKAXE]: woodPickaxeCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.STONE_PICKAXE]: stonePickaxeCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.IRON_PICKAXE]: ironPickaxeCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.GOLDEN_PICKAXE]: goldPickaxeCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.DIAMOND_PICKAXE]: diamondPickaxeCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.WOODEN_AXE]: woodAxeCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.STONE_AXE]: stoneAxeCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.IRON_AXE]: ironAxeCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.DIAMOND_AXE]: diamondAxeCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.WOODEN_SHOVEL]: woodShovelCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.IRON_SHOVEL]: ironShovelCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.WOODEN_SWORD]: woodSwordCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.IRON_SWORD]: ironSwordCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.GOLDEN_SWORD]: goldSwordCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.DIAMOND_SWORD]: diamondSwordCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.RAW_PORKCHOP]: rawPorkchopCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.COOKED_PORKCHOP]: cookedPorkchopCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.ROTTEN_FLESH]: rottenFleshCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.BONE]: boneCanvas.toDataURL('image/png'),
    [BLOCK_TYPE.BEDROCK]: generateBlockIsometricIcon(bedrockCanvas, bedrockCanvas),
  };

  return {
    materialsByBlock,
    crackTextures,
    blockIcons,
  };
}
