import * as THREE from 'three';
import { BLOCK_TYPE, type BlockType, WORLD_CONFIG } from './constants';
import type { SimplexNoise } from './noise';
import type { BlockMaterials } from './textures';
import type { World } from './World';

export type BiomeType = 'plains' | 'dense_forest' | 'forest' | 'canyon';

export class Chunk {
  public cx: number;
  public cz: number;
  public worldStartX: number;
  public worldStartZ: number;

  public blocks: Uint8Array;
  public group: THREE.Group;
  private instancedMeshes: THREE.InstancedMesh[] = [];
  public isDirty = false;
  public primaryBiome: BiomeType = 'plains';

  private static sharedGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1);
  private static dummy: THREE.Object3D = new THREE.Object3D();

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
    this.worldStartX = cx * WORLD_CONFIG.CHUNK_SIZE_X;
    this.worldStartZ = cz * WORLD_CONFIG.CHUNK_SIZE_Z;

    const totalBlocks =
      WORLD_CONFIG.CHUNK_SIZE_X *
      WORLD_CONFIG.CHUNK_HEIGHT *
      WORLD_CONFIG.CHUNK_SIZE_Z;

    this.blocks = new Uint8Array(totalBlocks);
    this.group = new THREE.Group();
  }

  public getIndex(lx: number, ly: number, lz: number): number {
    if (
      lx < 0 ||
      lx >= WORLD_CONFIG.CHUNK_SIZE_X ||
      ly < 0 ||
      ly >= WORLD_CONFIG.CHUNK_HEIGHT ||
      lz < 0 ||
      lz >= WORLD_CONFIG.CHUNK_SIZE_Z
    ) {
      return -1;
    }
    return (
      lx * (WORLD_CONFIG.CHUNK_HEIGHT * WORLD_CONFIG.CHUNK_SIZE_Z) +
      ly * WORLD_CONFIG.CHUNK_SIZE_Z +
      lz
    );
  }

  public getLocalBlock(lx: number, ly: number, lz: number): BlockType {
    const idx = this.getIndex(lx, ly, lz);
    if (idx === -1) return BLOCK_TYPE.AIR;
    return this.blocks[idx] as BlockType;
  }

  public setLocalBlock(lx: number, ly: number, lz: number, type: BlockType): boolean {
    const idx = this.getIndex(lx, ly, lz);
    if (idx === -1) return false;
    this.blocks[idx] = type;
    this.isDirty = true;
    return true;
  }

  private chunkRandom(offset: number): number {
    let s = (this.cx * 73856093) ^ (this.cz * 19349663) ^ (offset * 83492791);
    s = (s * 1664525 + 1013904223) % 4294967296;
    return (s >>> 0) / 4294967296;
  }

  /**
   * Generate terrain height, Canyons, 3D Caves, and Dense Forests
   */
  public generate(noise: SimplexNoise): void {
    const heightMap: number[][] = [];
    const isCanyonColumn: boolean[][] = [];

    // Biome determination for this chunk
    const biomeVal = noise.fbm2D(this.cx * 0.08, this.cz * 0.08, 2);
    if (biomeVal > 0.06) {
      this.primaryBiome = 'dense_forest';
    } else if (biomeVal < -0.12) {
      this.primaryBiome = 'plains';
    } else {
      this.primaryBiome = 'forest';
    }

    let hasCanyon = false;

    // 1. Initial Heightmap & Canyon Ravine Carving
    for (let lx = 0; lx < WORLD_CONFIG.CHUNK_SIZE_X; lx++) {
      heightMap[lx] = [];
      isCanyonColumn[lx] = [];

      for (let lz = 0; lz < WORLD_CONFIG.CHUNK_SIZE_Z; lz++) {
        const wx = this.worldStartX + lx;
        const wz = this.worldStartZ + lz;

        // Base gentle rolling terrain
        const n = noise.fbm2D(wx * 0.012, wz * 0.012, 3, 2.0, 0.45);
        let surfaceY = Math.floor(WORLD_CONFIG.TERRAIN_BASE_HEIGHT + n * WORLD_CONFIG.TERRAIN_AMPLITUDE);

        // Mountain Ridges (high elevation peaks)
        const mountainNoise = noise.fbm2D((wx + 200) * 0.009, (wz + 200) * 0.009, 3, 2.0, 0.5);
        if (mountainNoise > 0.18) {
          const mountainBoost = Math.floor((mountainNoise - 0.18) * 42);
          surfaceY += mountainBoost;
        }

        surfaceY = Math.max(4, Math.min(WORLD_CONFIG.CHUNK_HEIGHT - 6, surfaceY));

        // Canyon / Ravine carving: narrow winding chasms cutting through terrain
        const canyonVal = Math.abs(noise.noise2D(wx * 0.007, wz * 0.007));
        const inCanyon = canyonVal < 0.032 && surfaceY > WORLD_CONFIG.SEA_LEVEL;
        isCanyonColumn[lx][lz] = inCanyon;

        if (inCanyon) {
          hasCanyon = true;
          const ratio = canyonVal / 0.032;
          const cutDepth = Math.floor((1 - ratio) * 14) + 3;
          surfaceY = Math.max(5, surfaceY - cutDepth);
        }

        heightMap[lx][lz] = surfaceY;

        // Block Layer assignment: Water, Beach, Snow Peaks, or Plains/Forest
        const seaLevel = WORLD_CONFIG.SEA_LEVEL;

        if (surfaceY < seaLevel) {
          // Underwater bed: Sand
          this.setLocalBlock(lx, surfaceY, lz, BLOCK_TYPE.SAND);
          // Water fill from bed up to sea level
          for (let y = surfaceY + 1; y <= seaLevel; y++) {
            this.setLocalBlock(lx, y, lz, BLOCK_TYPE.WATER);
          }
          // Subsurface below water bed
          for (let y = surfaceY - 1; y >= surfaceY - 3; y--) {
            this.setLocalBlock(lx, y, lz, BLOCK_TYPE.SAND);
          }
        } else if (surfaceY <= seaLevel + 1) {
          // Sandy beach near coastline
          this.setLocalBlock(lx, surfaceY, lz, BLOCK_TYPE.SAND);
          for (let y = surfaceY - 1; y >= surfaceY - 2; y--) {
            this.setLocalBlock(lx, y, lz, BLOCK_TYPE.SAND);
          }
        } else if (surfaceY >= 28) {
          // Snow-capped mountain peak!
          this.setLocalBlock(lx, surfaceY, lz, BLOCK_TYPE.SNOW);
          this.setLocalBlock(lx, surfaceY - 1, lz, BLOCK_TYPE.SNOW);
          for (let y = surfaceY - 2; y >= surfaceY - 4; y--) {
            this.setLocalBlock(lx, y, lz, BLOCK_TYPE.STONE);
          }
        } else if (surfaceY >= 22) {
          // Rocky steep mountain slope
          this.setLocalBlock(lx, surfaceY, lz, BLOCK_TYPE.STONE);
          for (let y = surfaceY - 1; y >= surfaceY - 3; y--) {
            this.setLocalBlock(lx, y, lz, BLOCK_TYPE.STONE);
          }
        } else if (inCanyon) {
          // Stratified Canyon walls & floor
          this.setLocalBlock(lx, surfaceY, lz, BLOCK_TYPE.STONE);
          for (let y = surfaceY - 1; y >= surfaceY - 3; y--) {
            this.setLocalBlock(lx, y, lz, y % 2 === 0 ? BLOCK_TYPE.DIRT : BLOCK_TYPE.STONE);
          }
        } else {
          // Normal Grass and Dirt
          this.setLocalBlock(lx, surfaceY, lz, BLOCK_TYPE.GRASS);
          for (let y = surfaceY - 1; y >= surfaceY - 3; y--) {
            this.setLocalBlock(lx, y, lz, BLOCK_TYPE.DIRT);
          }
        }

        // Deep Stone & Ore Veins (Coal, Iron, Gold, Diamond) + Bedrock Floor
        const stoneTop = surfaceY - (surfaceY < seaLevel ? 4 : 4);
        for (let y = stoneTop; y >= 0; y--) {
          let blockToSet: BlockType = BLOCK_TYPE.STONE;

          // Bedrock Floor (y = 0..2)
          if (y === 0) {
            blockToSet = BLOCK_TYPE.BEDROCK;
          } else if (y === 1 && Math.sin(wx * 12.3 + wz * 45.6) > -0.2) {
            blockToSet = BLOCK_TYPE.BEDROCK;
          } else if (y === 2 && Math.cos(wx * 32.1 + wz * 65.4) > 0.6) {
            blockToSet = BLOCK_TYPE.BEDROCK;
          } else {
            // Balanced Ore Distribution:
            // 1. Diamonds: deepest depths (y <= 7), rare compact clusters
            if (y <= 7) {
              const diamondVal = noise.noise3D((wx + 300) * 0.40, y * 0.40, (wz + 300) * 0.40);
              if (diamondVal > 0.78) blockToSet = BLOCK_TYPE.DIAMOND_ORE;
            }

            // 2. Gold: deep depths (y <= 13), rare clusters
            if (y <= 13 && blockToSet === BLOCK_TYPE.STONE) {
              const goldVal = noise.noise3D((wx + 150) * 0.36, y * 0.36, (wz + 150) * 0.36);
              if (goldVal > 0.74) blockToSet = BLOCK_TYPE.GOLD_ORE;
            }

            // 3. Iron: mid to deep levels (y <= 24), moderate clusters
            if (y <= 24 && blockToSet === BLOCK_TYPE.STONE) {
              const ironVal = noise.noise3D((wx + 88) * 0.32, y * 0.32, (wz + 88) * 0.32);
              if (ironVal > 0.66) blockToSet = BLOCK_TYPE.IRON_ORE;
            }

            // 4. Coal: widely distributed from underground to mountain cliffs (y <= 38)
            if (y <= 38 && blockToSet === BLOCK_TYPE.STONE) {
              const coalVal = noise.noise3D(wx * 0.28, y * 0.28, wz * 0.28);
              if (coalVal > 0.62) blockToSet = BLOCK_TYPE.COAL_ORE;
            }
          }

          this.setLocalBlock(lx, y, lz, blockToSet);
        }
      }
    }

    if (hasCanyon) {
      this.primaryBiome = 'canyon';
    }

    // 2. Simple 3D Caves (Worm tunnels & caverns beneath the surface)
    for (let lx = 0; lx < WORLD_CONFIG.CHUNK_SIZE_X; lx++) {
      for (let lz = 0; lz < WORLD_CONFIG.CHUNK_SIZE_Z; lz++) {
        const wx = this.worldStartX + lx;
        const wz = this.worldStartZ + lz;
        const maxCaveY = heightMap[lx][lz] - 2;

        for (let y = 3; y <= maxCaveY; y++) {
          // Double 3D Simplex noise creates organic cylindrical tunnel networks
          const cave1 = noise.noise3D(wx * 0.065, y * 0.085, wz * 0.065);
          const cave2 = noise.noise3D((wx + 80) * 0.065, y * 0.085, (wz + 80) * 0.065);
          const caveDistSq = cave1 * cave1 + cave2 * cave2;

          // Carve cave cavity
          if (caveDistSq < 0.038) {
            this.setLocalBlock(lx, y, lz, BLOCK_TYPE.AIR);
          }
        }
      }
    }

    // 3. Tree generation adapted to Biomes (Dense Forests vs Plains)
    let treeCount = 0;
    if (this.primaryBiome === 'dense_forest') {
      // Dense forest: 4 to 6 trees per chunk!
      treeCount = 4 + Math.floor(this.chunkRandom(5) * 3);
    } else if (this.primaryBiome === 'forest') {
      // Normal forest: 2 to 3 trees
      treeCount = 2 + (this.chunkRandom(5) > 0.5 ? 1 : 0);
    } else if (this.primaryBiome === 'plains') {
      // Plains: 0 to 1 tree
      treeCount = this.chunkRandom(5) > 0.65 ? 1 : 0;
    }

    for (let t = 0; t < treeCount; t++) {
      const tx = 2 + Math.floor(this.chunkRandom(10 + t * 4) * 12);
      const tz = 2 + Math.floor(this.chunkRandom(11 + t * 4) * 12);

      // Check if spot is valid
      if (isCanyonColumn[tx][tz]) continue;
      const groundY = heightMap[tx][tz];

      if (groundY <= 3 || groundY >= WORLD_CONFIG.CHUNK_HEIGHT - 10) continue;
      if (this.getLocalBlock(tx, groundY, tz) !== BLOCK_TYPE.GRASS) continue;

      const isBirch = this.chunkRandom(12 + t * 4) > 0.5;

      if (isBirch) {
        this.growBirchTree(tx, groundY, tz, t);
      } else {
        this.growOakTree(tx, groundY, tz, t);
      }
    }

    this.isDirty = false;
  }

  private growOakTree(tx: number, groundY: number, tz: number, treeIndex: number): void {
    const trunkHeight = 4 + Math.floor(this.chunkRandom(20 + treeIndex) * 2);

    this.setLocalBlock(tx, groundY, tz, BLOCK_TYPE.DIRT);

    for (let y = 1; y <= trunkHeight; y++) {
      this.setLocalBlock(tx, groundY + y, tz, BLOCK_TYPE.OAK_LOG);
    }

    const topY = groundY + trunkHeight;

    for (let dy = -2; dy <= -1; dy++) {
      const ly = topY + dy;
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
          const cur = this.getLocalBlock(tx + dx, ly, tz + dz);
          if (cur === BLOCK_TYPE.AIR) {
            this.setLocalBlock(tx + dx, ly, tz + dz, BLOCK_TYPE.OAK_LEAVES);
          }
        }
      }
    }

    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const cur = this.getLocalBlock(tx + dx, topY, tz + dz);
        if (cur === BLOCK_TYPE.AIR) {
          this.setLocalBlock(tx + dx, topY, tz + dz, BLOCK_TYPE.OAK_LEAVES);
        }
      }
    }

    const capOffsets = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dz] of capOffsets) {
      const cur = this.getLocalBlock(tx + dx, topY + 1, tz + dz);
      if (cur === BLOCK_TYPE.AIR) {
        this.setLocalBlock(tx + dx, topY + 1, tz + dz, BLOCK_TYPE.OAK_LEAVES);
      }
    }
  }

  private growBirchTree(tx: number, groundY: number, tz: number, treeIndex: number): void {
    const trunkHeight = 5 + Math.floor(this.chunkRandom(30 + treeIndex) * 2);

    this.setLocalBlock(tx, groundY, tz, BLOCK_TYPE.DIRT);

    for (let y = 1; y <= trunkHeight; y++) {
      this.setLocalBlock(tx, groundY + y, tz, BLOCK_TYPE.BIRCH_LOG);
    }

    const topY = groundY + trunkHeight;

    for (let dy = -2; dy <= 0; dy++) {
      const ly = topY + dy;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const cur = this.getLocalBlock(tx + dx, ly, tz + dz);
          if (cur === BLOCK_TYPE.AIR) {
            this.setLocalBlock(tx + dx, ly, tz + dz, BLOCK_TYPE.BIRCH_LEAVES);
          }
        }
      }
    }

    const capOffsets = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dz] of capOffsets) {
      const cur = this.getLocalBlock(tx + dx, topY + 1, tz + dz);
      if (cur === BLOCK_TYPE.AIR) {
        this.setLocalBlock(tx + dx, topY + 1, tz + dz, BLOCK_TYPE.BIRCH_LEAVES);
      }
    }
  }

  private isFaceVisible(lx: number, ly: number, lz: number, currentType: BlockType, world: World): boolean {
    const isOpaque = (t: BlockType): boolean => {
      return t !== BLOCK_TYPE.AIR && t !== BLOCK_TYPE.WATER;
    };

    const getNeighbor = (nx: number, ny: number, nz: number): BlockType => {
      if (
        nx >= 0 &&
        nx < WORLD_CONFIG.CHUNK_SIZE_X &&
        ny >= 0 &&
        ny < WORLD_CONFIG.CHUNK_HEIGHT &&
        nz >= 0 &&
        nz < WORLD_CONFIG.CHUNK_SIZE_Z
      ) {
        return this.getLocalBlock(nx, ny, nz);
      }
      return world.getBlock(this.worldStartX + nx, ny, this.worldStartZ + nz);
    };

    const n1 = getNeighbor(lx + 1, ly, lz);
    const n2 = getNeighbor(lx - 1, ly, lz);
    const n3 = getNeighbor(lx, ly + 1, lz);
    const n4 = getNeighbor(lx, ly - 1, lz);
    const n5 = getNeighbor(lx, ly, lz + 1);
    const n6 = getNeighbor(lx, ly, lz - 1);

    if (currentType === BLOCK_TYPE.WATER) {
      // Water face is only visible if at least one neighbor is AIR!
      // (Inner water completely surrounded by water or solid is culled for performance)
      return (
        n1 === BLOCK_TYPE.AIR ||
        n2 === BLOCK_TYPE.AIR ||
        n3 === BLOCK_TYPE.AIR ||
        n4 === BLOCK_TYPE.AIR ||
        n5 === BLOCK_TYPE.AIR ||
        n6 === BLOCK_TYPE.AIR
      );
    }

    // For any solid block (sand, stone, dirt, ores, wood, etc.):
    // If ANY neighbor is AIR or WATER, this block MUST be rendered!
    // If it were culled against water, the riverbed/seabed disappeared, creating the X-RAY bug!
    return (
      !isOpaque(n1) ||
      !isOpaque(n2) ||
      !isOpaque(n3) ||
      !isOpaque(n4) ||
      !isOpaque(n5) ||
      !isOpaque(n6)
    );
  }

  public buildMeshes(materials: BlockMaterials, world: World): void {
    this.clearMeshes();

    const positionsByType = new Map<BlockType, { wx: number; wy: number; wz: number }[]>();

    for (let lx = 0; lx < WORLD_CONFIG.CHUNK_SIZE_X; lx++) {
      for (let ly = 0; ly < WORLD_CONFIG.CHUNK_HEIGHT; ly++) {
        for (let lz = 0; lz < WORLD_CONFIG.CHUNK_SIZE_Z; lz++) {
          const type = this.getLocalBlock(lx, ly, lz);
          if (type === BLOCK_TYPE.AIR) continue;

          if (this.isFaceVisible(lx, ly, lz, type, world)) {
            let list = positionsByType.get(type);
            if (!list) {
              list = [];
              positionsByType.set(type, list);
            }
            list.push({
              wx: this.worldStartX + lx,
              wy: ly,
              wz: this.worldStartZ + lz,
            });
          }
        }
      }
    }

    positionsByType.forEach((positions, type) => {
      const mat = materials.materialsByBlock[type];
      if (!mat || positions.length === 0) return;

      const instancedMesh = new THREE.InstancedMesh(
        Chunk.sharedGeometry,
        mat,
        positions.length
      );
      instancedMesh.receiveShadow = false;
      instancedMesh.castShadow = false;

      // Transparent water meshes render after opaque meshes
      if (type === BLOCK_TYPE.WATER) {
        instancedMesh.renderOrder = 1;
      }

      for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        Chunk.dummy.position.set(p.wx + 0.5, p.wy + 0.5, p.wz + 0.5);
        Chunk.dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, Chunk.dummy.matrix);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      this.instancedMeshes.push(instancedMesh);
      this.group.add(instancedMesh);
    });

    this.isDirty = false;
  }

  public clearMeshes(): void {
    for (const mesh of this.instancedMeshes) {
      this.group.remove(mesh);
      mesh.dispose();
    }
    this.instancedMeshes = [];
  }

  public dispose(): void {
    this.clearMeshes();
  }
}
