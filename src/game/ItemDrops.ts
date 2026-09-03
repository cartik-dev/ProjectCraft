import * as THREE from 'three';
import { BLOCK_TYPE, type BlockType } from './constants';
import type { BlockMaterials } from './textures';
import type { World } from './World';

export interface DropEntity {
  mesh: THREE.Mesh;
  type: BlockType;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  spawnTime: number;
  isResting: boolean;
  baseY: number;
}

export class ItemDropManager {
  public group: THREE.Group;
  private drops: DropEntity[] = [];
  private static dropGeometry = new THREE.BoxGeometry(0.24, 0.24, 0.24);

  constructor() {
    this.group = new THREE.Group();
  }

  public spawnDrop(
    pos: THREE.Vector3,
    type: BlockType,
    materials: BlockMaterials
  ): void {
    if (type === BLOCK_TYPE.AIR) return;

    let dropType = type;
    if (type === BLOCK_TYPE.COAL_ORE) {
      dropType = BLOCK_TYPE.COAL;
    }

    const mat = materials.materialsByBlock[dropType] || materials.materialsByBlock[BLOCK_TYPE.DIRT];
    const mesh = new THREE.Mesh(ItemDropManager.dropGeometry, mat);

    const startPos = new THREE.Vector3(
      pos.x + 0.5,
      pos.y + 0.35,
      pos.z + 0.5
    );
    mesh.position.copy(startPos);
    this.group.add(mesh);

    const randX = (Math.random() - 0.5) * 1.6;
    const randZ = (Math.random() - 0.5) * 1.6;
    const randY = 2.2 + Math.random() * 1.2;

    this.drops.push({
      mesh,
      type: dropType,
      position: startPos,
      velocity: new THREE.Vector3(randX, randY, randZ),
      spawnTime: performance.now(),
      isResting: false,
      baseY: startPos.y,
    });
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    world: World,
    onPickup: (type: BlockType) => boolean
  ): void {
    const now = performance.now();
    const remaining: DropEntity[] = [];
    const playerCenter = new THREE.Vector3(playerPos.x, playerPos.y + 0.85, playerPos.z);

    for (const drop of this.drops) {
      const age = (now - drop.spawnTime) / 1000;

      // Despawn after 5 minutes
      if (age > 300) {
        this.group.remove(drop.mesh);
        continue;
      }

      const distToPlayer = drop.position.distanceTo(playerCenter);

      // 1. Magnetic Attraction (Aggressively pulls towards player within 2.8 blocks)
      if (distToPlayer < 2.8 && age > 0.15) {
        drop.isResting = false;
        // Fly directly toward player center
        const pullDir = playerCenter.clone().sub(drop.position).normalize();
        const speed = Math.max(7.0, (3.0 - distToPlayer) * 8.0);
        drop.position.addScaledVector(pullDir, speed * dt);
        drop.velocity.set(0, 0, 0);
      } else if (!drop.isResting) {
        // 2. Normal falling physics when not attracted
        drop.velocity.y -= 20.0 * dt;
        drop.position.x += drop.velocity.x * dt;
        drop.position.z += drop.velocity.z * dt;
        drop.position.y += drop.velocity.y * dt;

        // Check if landed on a solid block below
        const bx = Math.floor(drop.position.x);
        const bz = Math.floor(drop.position.z);
        const byUnder = Math.floor(drop.position.y - 0.15);

        if (world.isSolid(bx, byUnder, bz)) {
          drop.isResting = true;
          drop.baseY = byUnder + 1.15;
          drop.position.y = drop.baseY;
          drop.velocity.set(0, 0, 0);
        } else if (drop.position.y < 1) {
          // Bottom floor safety
          drop.isResting = true;
          drop.baseY = 2;
          drop.position.y = 2;
        }
      } else {
        // Verify block beneath is still solid (if dug out from under it)
        const bx = Math.floor(drop.position.x);
        const bz = Math.floor(drop.position.z);
        const byUnder = Math.floor(drop.baseY - 0.5);
        if (!world.isSolid(bx, byUnder, bz)) {
          drop.isResting = false;
        }
      }

      // 3. Smooth continuous rotation and bobbing
      drop.mesh.rotation.y += dt * 2.8;

      if (drop.isResting) {
        drop.mesh.position.set(
          drop.position.x,
          drop.baseY + Math.sin(now * 0.005) * 0.05,
          drop.position.z
        );
      } else {
        drop.mesh.position.copy(drop.position);
      }

      // 4. Pickup Collision Check
      if (distToPlayer < 1.4 && age > 0.1) {
        const collected = onPickup(drop.type);
        if (collected) {
          this.group.remove(drop.mesh);
          continue;
        }
      }

      remaining.push(drop);
    }

    this.drops = remaining;
  }

  public clear(): void {
    for (const drop of this.drops) {
      this.group.remove(drop.mesh);
    }
    this.drops = [];
  }
}
