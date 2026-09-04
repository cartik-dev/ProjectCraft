import * as THREE from 'three';
import { BLOCK_TYPE, type BlockType, WORLD_CONFIG } from './constants';
import { SimplexNoise } from './noise';
import { createBlockMaterials, type BlockMaterials } from './textures';
import { createWaterEffectMaterial } from './WaterEffectMaterial';
import { Chunk } from './Chunk';

export class World {
  public chunks = new Map<string, Chunk>();
  public group: THREE.Group;
  public materials: BlockMaterials;
  private noise: SimplexNoise;
  private waterMeshes = new Map<string, THREE.InstancedMesh>();
  private waterGeometry = new THREE.BoxGeometry(1, 1, 1);
  private waterDummy = new THREE.Object3D();

  private lastPlayerChunkX = -9999;
  private lastPlayerChunkZ = -9999;

  constructor(seed = WORLD_CONFIG.SEED) {
    this.group = new THREE.Group();
    this.materials = createBlockMaterials();
    this.materials.materialsByBlock[BLOCK_TYPE.WATER] = createWaterEffectMaterial();
    this.noise = new SimplexNoise(seed);
    this.updatePlayerPosition(0, 0, true);
  }

  public resetSeed(newSeed: number): void {
    for (const mesh of this.waterMeshes.values()) {
      this.group.remove(mesh);
      mesh.dispose();
    }
    this.waterMeshes.clear();

    for (const chunk of this.chunks.values()) {
      this.group.remove(chunk.group);
      chunk.dispose();
    }
    this.chunks.clear();
    this.noise = new SimplexNoise(newSeed);
    this.lastPlayerChunkX = -9999;
    this.lastPlayerChunkZ = -9999;
    this.updatePlayerPosition(0, 0, true);
  }

  private getChunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  public getChunk(cx: number, cz: number): Chunk | undefined {
    return this.chunks.get(this.getChunkKey(cx, cz));
  }

  public getOrCreateChunk(cx: number, cz: number): Chunk {
    const key = this.getChunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(cx, cz);
      chunk.generate(this.noise);
      this.chunks.set(key, chunk);
      this.group.add(chunk.group);
    }
    return chunk;
  }

  private hideLegacyWaterMesh(chunk: Chunk): void {
    for (const child of chunk.group.children) {
      if (child instanceof THREE.InstancedMesh && child.renderOrder === 1) {
        child.visible = false;
      }
    }
  }

  private packPair(first: boolean, second: boolean): number {
    return (Number(first) + Number(second) * 2) / 4;
  }

  /**
   * Render each water block with only its exposed top and air-facing side faces.
   * The mask is packed into instanceColor for the water shader.
   */
  private rebuildWaterMesh(chunk: Chunk): void {
    const key = this.getChunkKey(chunk.cx, chunk.cz);
    const previous = this.waterMeshes.get(key);
    if (previous) {
      this.group.remove(previous);
      previous.dispose();
      this.waterMeshes.delete(key);
    }

    this.hideLegacyWaterMesh(chunk);

    const waterPositions: Array<{
      x: number;
      y: number;
      z: number;
      plusX: boolean;
      minusX: boolean;
      plusZ: boolean;
      minusZ: boolean;
      top: boolean;
    }> = [];

    for (let lx = 0; lx < WORLD_CONFIG.CHUNK_SIZE_X; lx++) {
      for (let ly = 0; ly < WORLD_CONFIG.CHUNK_HEIGHT; ly++) {
        for (let lz = 0; lz < WORLD_CONFIG.CHUNK_SIZE_Z; lz++) {
          if (chunk.getLocalBlock(lx, ly, lz) !== BLOCK_TYPE.WATER) continue;

          const wx = chunk.worldStartX + lx;
          const wz = chunk.worldStartZ + lz;
          const plusX = this.getBlock(wx + 1, ly, wz) === BLOCK_TYPE.AIR;
          const minusX = this.getBlock(wx - 1, ly, wz) === BLOCK_TYPE.AIR;
          const plusZ = this.getBlock(wx, ly, wz + 1) === BLOCK_TYPE.AIR;
          const minusZ = this.getBlock(wx, ly, wz - 1) === BLOCK_TYPE.AIR;
          const top = this.getBlock(wx, ly + 1, wz) === BLOCK_TYPE.AIR;

          if (!plusX && !minusX && !plusZ && !minusZ && !top) continue;

          waterPositions.push({
            x: wx,
            y: ly,
            z: wz,
            plusX,
            minusX,
            plusZ,
            minusZ,
            top,
          });
        }
      }
    }

    if (waterPositions.length === 0) return;

    const material = this.materials.materialsByBlock[BLOCK_TYPE.WATER];
    if (Array.isArray(material)) return;

    const mesh = new THREE.InstancedMesh(
      this.waterGeometry,
      material,
      waterPositions.length
    );
    mesh.renderOrder = 2;
    mesh.receiveShadow = false;
    mesh.castShadow = false;
    mesh.frustumCulled = true;

    for (let i = 0; i < waterPositions.length; i++) {
      const p = waterPositions[i];
      this.waterDummy.position.set(p.x + 0.5, p.y + 0.5, p.z + 0.5);
      this.waterDummy.updateMatrix();
      mesh.setMatrixAt(i, this.waterDummy.matrix);
      mesh.setColorAt(i, new THREE.Color(
        this.packPair(p.plusX, p.minusX),
        this.packPair(p.plusZ, p.minusZ),
        this.packPair(p.top, false)
      ));
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    this.waterMeshes.set(key, mesh);
    this.group.add(mesh);
  }

  private rebuildLoadedWaterMeshes(): void {
    for (const chunk of this.chunks.values()) {
      this.rebuildWaterMesh(chunk);
    }
  }

  public updatePlayerPosition(playerX: number, playerZ: number, force = false): void {
    const pcx = Math.floor(playerX / WORLD_CONFIG.CHUNK_SIZE_X);
    const pcz = Math.floor(playerZ / WORLD_CONFIG.CHUNK_SIZE_Z);

    if (!force && pcx === this.lastPlayerChunkX && pcz === this.lastPlayerChunkZ) return;

    this.lastPlayerChunkX = pcx;
    this.lastPlayerChunkZ = pcz;

    const radius = WORLD_CONFIG.VIEW_DISTANCE_CHUNKS;
    const unloadDist = WORLD_CONFIG.UNLOAD_DISTANCE_CHUNKS;
    const chunksToMesh: Chunk[] = [];

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        const key = this.getChunkKey(cx, cz);
        let chunk = this.chunks.get(key);
        if (!chunk) {
          chunk = new Chunk(cx, cz);
          chunk.generate(this.noise);
          this.chunks.set(key, chunk);
          this.group.add(chunk.group);
          chunksToMesh.push(chunk);
        } else if (chunk.isDirty) {
          chunksToMesh.push(chunk);
        }
      }
    }

    for (const chunk of chunksToMesh) chunk.buildMeshes(this.materials, this);

    const chunksToRemove: string[] = [];
    this.chunks.forEach((chunk, key) => {
      const dist = Math.max(Math.abs(chunk.cx - pcx), Math.abs(chunk.cz - pcz));
      if (dist > unloadDist) {
        const waterMesh = this.waterMeshes.get(key);
        if (waterMesh) {
          this.group.remove(waterMesh);
          waterMesh.dispose();
          this.waterMeshes.delete(key);
        }
        chunk.dispose();
        this.group.remove(chunk.group);
        chunksToRemove.push(key);
      }
    });

    for (const key of chunksToRemove) this.chunks.delete(key);
    this.rebuildLoadedWaterMeshes();
  }

  public getBlock(x: number, y: number, z: number): BlockType {
    if (y < 0 || y >= WORLD_CONFIG.CHUNK_HEIGHT) return BLOCK_TYPE.AIR;
    const cx = Math.floor(x / WORLD_CONFIG.CHUNK_SIZE_X);
    const cz = Math.floor(z / WORLD_CONFIG.CHUNK_SIZE_Z);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return BLOCK_TYPE.AIR;
    const lx = x - cx * WORLD_CONFIG.CHUNK_SIZE_X;
    const lz = z - cz * WORLD_CONFIG.CHUNK_SIZE_Z;
    return chunk.getLocalBlock(lx, y, lz);
  }

  public setBlock(x: number, y: number, z: number, type: BlockType): boolean {
    if (y < 0 || y >= WORLD_CONFIG.CHUNK_HEIGHT) return false;
    if (type === BLOCK_TYPE.WATER) return false;

    const cx = Math.floor(x / WORLD_CONFIG.CHUNK_SIZE_X);
    const cz = Math.floor(z / WORLD_CONFIG.CHUNK_SIZE_Z);
    const chunk = this.getOrCreateChunk(cx, cz);
    const lx = x - cx * WORLD_CONFIG.CHUNK_SIZE_X;
    const lz = z - cz * WORLD_CONFIG.CHUNK_SIZE_Z;

    const changed = chunk.setLocalBlock(lx, y, lz, type);
    if (!changed) return false;

    const affected: Chunk[] = [chunk];
    chunk.buildMeshes(this.materials, this);
    if (lx === 0) {
      const neighbor = this.getChunk(cx - 1, cz);
      if (neighbor) {
        neighbor.buildMeshes(this.materials, this);
        affected.push(neighbor);
      }
    }
    if (lx === WORLD_CONFIG.CHUNK_SIZE_X - 1) {
      const neighbor = this.getChunk(cx + 1, cz);
      if (neighbor) {
        neighbor.buildMeshes(this.materials, this);
        affected.push(neighbor);
      }
    }
    if (lz === 0) {
      const neighbor = this.getChunk(cx, cz - 1);
      if (neighbor) {
        neighbor.buildMeshes(this.materials, this);
        affected.push(neighbor);
      }
    }
    if (lz === WORLD_CONFIG.CHUNK_SIZE_Z - 1) {
      const neighbor = this.getChunk(cx, cz + 1);
      if (neighbor) {
        neighbor.buildMeshes(this.materials, this);
        affected.push(neighbor);
      }
    }

    for (const affectedChunk of affected) this.rebuildWaterMesh(affectedChunk);
    return true;
  }

  public isSolid(x: number, y: number, z: number): boolean {
    const block = this.getBlock(x, y, z);
    return block !== BLOCK_TYPE.AIR && block !== BLOCK_TYPE.WATER;
  }

  public isWater(x: number, y: number, z: number): boolean {
    return this.getBlock(x, y, z) === BLOCK_TYPE.WATER;
  }

  public getSpawnPoint(): THREE.Vector3 {
    for (let r = 0; r <= 48; r += 4) {
      for (let dx = -r; dx <= r; dx += 4) {
        for (let dz = -r; dz <= r; dz += 4) {
          if (Math.abs(dx) !== r && Math.abs(dz) !== r && r > 0) continue;
          const cx = Math.floor(dx / WORLD_CONFIG.CHUNK_SIZE_X);
          const cz = Math.floor(dz / WORLD_CONFIG.CHUNK_SIZE_Z);
          const chunk = this.getOrCreateChunk(cx, cz);
          if (chunk.primaryBiome === 'canyon') continue;
          for (let y = WORLD_CONFIG.CHUNK_HEIGHT - 4; y >= 6; y--) {
            const block = this.getBlock(dx, y, dz);
            if (block === BLOCK_TYPE.GRASS) {
              const above1 = this.getBlock(dx, y + 1, dz);
              const above2 = this.getBlock(dx, y + 2, dz);
              if (above1 === BLOCK_TYPE.AIR && above2 === BLOCK_TYPE.AIR) {
                return new THREE.Vector3(dx + 0.5, y + 1.2, dz + 0.5);
              }
            }
          }
        }
      }
    }
    return new THREE.Vector3(0.5, 22, 0.5);
  }

  public getBiomeAt(x: number, z: number): string {
    const cx = Math.floor(x / WORLD_CONFIG.CHUNK_SIZE_X);
    const cz = Math.floor(z / WORLD_CONFIG.CHUNK_SIZE_Z);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return 'Равнины (Plains)';
    switch (chunk.primaryBiome) {
      case 'dense_forest': return 'Густой лес (Dense Forest)';
      case 'canyon': return 'Каньон / Разлом (Canyon)';
      case 'forest': return 'Смешанный лес (Forest)';
      default: return 'Равнины (Plains)';
    }
  }

  public raycast(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance = 6.0
  ): { hit: boolean; blockPos?: THREE.Vector3; placePos?: THREE.Vector3; blockType?: BlockType } {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);
    const stepX = Math.sign(direction.x);
    const stepY = Math.sign(direction.y);
    const stepZ = Math.sign(direction.z);
    const deltaX = stepX !== 0 ? Math.abs(1 / direction.x) : Infinity;
    const deltaY = stepY !== 0 ? Math.abs(1 / direction.y) : Infinity;
    const deltaZ = stepZ !== 0 ? Math.abs(1 / direction.z) : Infinity;
    let maxX = stepX > 0 ? (x + 1 - origin.x) * deltaX : (origin.x - x) * deltaX;
    let maxY = stepY > 0 ? (y + 1 - origin.y) * deltaY : (origin.y - y) * deltaY;
    let maxZ = stepZ > 0 ? (z + 1 - origin.z) * deltaZ : (origin.z - z) * deltaZ;
    let normalX = 0;
    let normalY = 0;
    let normalZ = 0;
    let dist = 0;

    while (dist <= maxDistance) {
      const currentBlock = this.getBlock(x, y, z);
      if (currentBlock !== BLOCK_TYPE.AIR && currentBlock !== BLOCK_TYPE.WATER) {
        return {
          hit: true,
          blockPos: new THREE.Vector3(x, y, z),
          placePos: new THREE.Vector3(x + normalX, y + normalY, z + normalZ),
          blockType: currentBlock,
        };
      }

      if (maxX < maxY) {
        if (maxX < maxZ) {
          dist = maxX; x += stepX; maxX += deltaX;
          normalX = -stepX; normalY = 0; normalZ = 0;
        } else {
          dist = maxZ; z += stepZ; maxZ += deltaZ;
          normalX = 0; normalY = 0; normalZ = -stepZ;
        }
      } else if (maxY < maxZ) {
        dist = maxY; y += stepY; maxY += deltaY;
        normalX = 0; normalY = -stepY; normalZ = 0;
      } else {
        dist = maxZ; z += stepZ; maxZ += deltaZ;
        normalX = 0; normalY = 0; normalZ = -stepZ;
      }
    }

    return { hit: false };
  }
}
