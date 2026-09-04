import * as THREE from 'three';
import { BLOCK_TYPE, type BlockType, WORLD_CONFIG } from './constants';
import { SimplexNoise } from './noise';
import { createBlockMaterials, type BlockMaterials } from './textures';
import { Chunk } from './Chunk';

export class World {
  public chunks = new Map<string, Chunk>();
  public group: THREE.Group;
  public materials: BlockMaterials;
  private noise: SimplexNoise;

  private waterMeshes = new Map<string, THREE.InstancedMesh[]>();
  private waterGeometries = {
    top: new THREE.PlaneGeometry(1, 1),
    plusX: new THREE.PlaneGeometry(1, 1),
    minusX: new THREE.PlaneGeometry(1, 1),
    plusZ: new THREE.PlaneGeometry(1, 1),
    minusZ: new THREE.PlaneGeometry(1, 1),
  };
  private waterDummy = new THREE.Object3D();

  private lastPlayerChunkX = -9999;
  private lastPlayerChunkZ = -9999;

  constructor(seed = WORLD_CONFIG.SEED) {
    this.group = new THREE.Group();
    this.materials = createBlockMaterials();
    this.noise = new SimplexNoise(seed);

    this.waterGeometries.top.rotateX(-Math.PI / 2);
    this.waterGeometries.plusX.rotateY(Math.PI / 2);
    this.waterGeometries.minusX.rotateY(-Math.PI / 2);
    this.waterGeometries.minusZ.rotateY(Math.PI);

    this.updatePlayerPosition(0, 0, true);
  }

  public resetSeed(newSeed: number): void {
    for (const meshes of this.waterMeshes.values()) {
      for (const mesh of meshes) {
        this.group.remove(mesh);
        mesh.dispose();
      }
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

  private getWaterMaterial(): THREE.Material {
    const material = this.materials.materialsByBlock[BLOCK_TYPE.WATER];
    if (Array.isArray(material)) return material[0];
    material.transparent = true;
    material.opacity = 0.72;
    material.depthWrite = false;
    material.side = THREE.DoubleSide;
    return material;
  }

  private createWaterFaceMesh(
    geometry: THREE.PlaneGeometry,
    positions: THREE.Vector3[],
  ): THREE.InstancedMesh | undefined {
    if (positions.length === 0) return undefined;

    const mesh = new THREE.InstancedMesh(
      geometry,
      this.getWaterMaterial(),
      positions.length,
    );
    mesh.renderOrder = 2;
    mesh.frustumCulled = false;
    mesh.receiveShadow = false;
    mesh.castShadow = false;

    for (let i = 0; i < positions.length; i++) {
      this.waterDummy.position.copy(positions[i]);
      this.waterDummy.updateMatrix();
      mesh.setMatrixAt(i, this.waterDummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }

  private rebuildWaterMesh(chunk: Chunk): void {
    const key = this.getChunkKey(chunk.cx, chunk.cz);
    const previous = this.waterMeshes.get(key);
    if (previous) {
      for (const mesh of previous) {
        this.group.remove(mesh);
        mesh.dispose();
      }
    }
    this.waterMeshes.delete(key);
    this.hideLegacyWaterMesh(chunk);

    const top: THREE.Vector3[] = [];
    const plusX: THREE.Vector3[] = [];
    const minusX: THREE.Vector3[] = [];
    const plusZ: THREE.Vector3[] = [];
    const minusZ: THREE.Vector3[] = [];

    for (let lx = 0; lx < WORLD_CONFIG.CHUNK_SIZE_X; lx++) {
      for (let ly = 0; ly < WORLD_CONFIG.CHUNK_HEIGHT; ly++) {
        for (let lz = 0; lz < WORLD_CONFIG.CHUNK_SIZE_Z; lz++) {
          if (chunk.getLocalBlock(lx, ly, lz) !== BLOCK_TYPE.WATER) continue;

          const wx = chunk.worldStartX + lx;
          const wz = chunk.worldStartZ + lz;
          const centerY = ly + 0.5;

          const neighborX1 = this.getBlock(wx + 1, ly, wz);
          const neighborX0 = this.getBlock(wx - 1, ly, wz);
          const neighborZ1 = this.getBlock(wx, ly, wz + 1);
          const neighborZ0 = this.getBlock(wx, ly, wz - 1);
          const above = this.getBlock(wx, ly + 1, wz);

          if (above === BLOCK_TYPE.AIR) {
            top.push(new THREE.Vector3(wx + 0.5, ly + 1.002, wz + 0.5));
          }
          if (neighborX1 === BLOCK_TYPE.AIR) {
            plusX.push(new THREE.Vector3(wx + 1.002, centerY, wz + 0.5));
          }
          if (neighborX0 === BLOCK_TYPE.AIR) {
            minusX.push(new THREE.Vector3(wx - 0.002, centerY, wz + 0.5));
          }
          if (neighborZ1 === BLOCK_TYPE.AIR) {
            plusZ.push(new THREE.Vector3(wx + 0.5, centerY, wz + 1.002));
          }
          if (neighborZ0 === BLOCK_TYPE.AIR) {
            minusZ.push(new THREE.Vector3(wx + 0.5, centerY, wz - 0.002));
          }
        }
      }
    }

    const meshes: THREE.InstancedMesh[] = [];
    const topMesh = this.createWaterFaceMesh(this.waterGeometries.top, top);
    const plusXMesh = this.createWaterFaceMesh(this.waterGeometries.plusX, plusX);
    const minusXMesh = this.createWaterFaceMesh(this.waterGeometries.minusX, minusX);
    const plusZMesh = this.createWaterFaceMesh(this.waterGeometries.plusZ, plusZ);
    const minusZMesh = this.createWaterFaceMesh(this.waterGeometries.minusZ, minusZ);

    for (const mesh of [topMesh, plusXMesh, minusXMesh, plusZMesh, minusZMesh]) {
      if (mesh) {
        meshes.push(mesh);
        this.group.add(mesh);
      }
    }

    if (meshes.length > 0) this.waterMeshes.set(key, meshes);
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

    for (const chunk of chunksToMesh) {
      chunk.buildMeshes(this.materials, this);
      this.rebuildWaterMesh(chunk);
    }

    const chunksToRemove: string[] = [];
    this.chunks.forEach((chunk, key) => {
      const dist = Math.max(Math.abs(chunk.cx - pcx), Math.abs(chunk.cz - pcz));
      if (dist > unloadDist) {
        const meshes = this.waterMeshes.get(key);
        if (meshes) {
          for (const mesh of meshes) {
            this.group.remove(mesh);
            mesh.dispose();
          }
          this.waterMeshes.delete(key);
        }
        chunk.dispose();
        this.group.remove(chunk.group);
        chunksToRemove.push(key);
      }
    });

    for (const key of chunksToRemove) this.chunks.delete(key);
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
    for (let r = 0; r <= 64; r += 4) {
      for (let dx = -r; dx <= r; dx += 4) {
        for (let dz = -r; dz <= r; dz += 4) {
          if (Math.abs(dx) !== r && Math.abs(dz) !== r && r > 0) continue;
          this.getOrCreateChunk(
            Math.floor(dx / WORLD_CONFIG.CHUNK_SIZE_X),
            Math.floor(dz / WORLD_CONFIG.CHUNK_SIZE_Z),
          );

          for (let y = WORLD_CONFIG.CHUNK_HEIGHT - 2; y >= 1; y--) {
            const block = this.getBlock(dx, y, dz);
            if (
              block === BLOCK_TYPE.AIR ||
              block === BLOCK_TYPE.WATER ||
              block === BLOCK_TYPE.BEDROCK
            ) continue;

            const above1 = this.getBlock(dx, y + 1, dz);
            const above2 = this.getBlock(dx, y + 2, dz);
            if (above1 === BLOCK_TYPE.AIR && above2 === BLOCK_TYPE.AIR) {
              return new THREE.Vector3(dx + 0.5, y + 1.2, dz + 0.5);
            }
          }
        }
      }
    }

    return new THREE.Vector3(0.5, WORLD_CONFIG.SEA_LEVEL + 2.5, 0.5);
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
    maxDistance = 6.0,
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
          dist = maxX;
          x += stepX;
          maxX += deltaX;
          normalX = -stepX;
          normalY = 0;
          normalZ = 0;
        } else {
          dist = maxZ;
          z += stepZ;
          maxZ += deltaZ;
          normalX = 0;
          normalY = 0;
          normalZ = -stepZ;
        }
      } else if (maxY < maxZ) {
        dist = maxY;
        y += stepY;
        maxY += deltaY;
        normalX = 0;
        normalY = -stepY;
        normalZ = 0;
      } else {
        dist = maxZ;
        z += stepZ;
        maxZ += deltaZ;
        normalX = 0;
        normalY = 0;
        normalZ = -stepZ;
      }
    }

    return { hit: false };
  }
}
