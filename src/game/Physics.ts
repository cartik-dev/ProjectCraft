import * as THREE from 'three';
import { BLOCK_TYPE, PHYSICS_CONFIG } from './constants';
import type { World } from './World';

export class PlayerPhysics {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public isGrounded = false;
  public highestFallY = 0;
  public onFallDamage?: (damage: number) => void;
  public isInWater = false;
  public isUnderwater = false;

  private world: World;
  private readonly radius = PHYSICS_CONFIG.PLAYER_RADIUS;
  private readonly height = PHYSICS_CONFIG.PLAYER_HEIGHT;
  private underwaterOverlay: HTMLDivElement | null = null;
  private waterFlowTimer = 0;

  constructor(world: World, spawnPosition: THREE.Vector3) {
    this.world = world;
    this.position = spawnPosition.clone();
    this.highestFallY = this.position.y;
    this.createUnderwaterOverlay();
  }

  private createUnderwaterOverlay(): void {
    if (typeof document === 'undefined') return;

    const existing = document.getElementById('projectcraft-underwater-overlay') as HTMLDivElement | null;
    if (existing) {
      this.underwaterOverlay = existing;
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'projectcraft-underwater-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '999',
      opacity: '0',
      background:
        'radial-gradient(circle at 50% 42%, rgba(28, 132, 190, 0.16), rgba(5, 55, 110, 0.52) 72%, rgba(2, 24, 56, 0.72))',
      mixBlendMode: 'multiply',
      transition: 'opacity 120ms ease-out',
      overflow: 'hidden',
    });

    const caustics = document.createElement('div');
    Object.assign(caustics.style, {
      position: 'absolute',
      inset: '-10%',
      opacity: '0.38',
      backgroundImage:
        'radial-gradient(circle at 20% 30%, rgba(130, 220, 255, 0.22) 0 1.5%, transparent 6%), radial-gradient(circle at 70% 65%, rgba(100, 205, 255, 0.18) 0 1.2%, transparent 5%), radial-gradient(circle at 45% 80%, rgba(160, 235, 255, 0.16) 0 1.4%, transparent 5%)',
      backgroundSize: '180px 150px, 220px 190px, 260px 210px',
      filter: 'blur(1px)',
      animation: 'projectcraftUnderwaterCaustics 7s linear infinite',
    });

    const particles = document.createElement('div');
    Object.assign(particles.style, {
      position: 'absolute',
      inset: '0',
      opacity: '0.32',
      backgroundImage:
        'radial-gradient(circle, rgba(210,245,255,0.55) 0 1px, transparent 2px), radial-gradient(circle, rgba(170,230,255,0.40) 0 1px, transparent 2px)',
      backgroundSize: '110px 135px, 170px 180px',
      backgroundPosition: '0 0, 35px 70px',
      animation: 'projectcraftUnderwaterParticles 10s linear infinite',
    });

    overlay.appendChild(caustics);
    overlay.appendChild(particles);

    if (!document.getElementById('projectcraft-underwater-style')) {
      const style = document.createElement('style');
      style.id = 'projectcraft-underwater-style';
      style.textContent = `
        @keyframes projectcraftUnderwaterCaustics {
          0% { transform: translate3d(-2%, -1%, 0) scale(1.02); }
          50% { transform: translate3d(2%, 1%, 0) scale(1.06); }
          100% { transform: translate3d(-2%, -1%, 0) scale(1.02); }
        }
        @keyframes projectcraftUnderwaterParticles {
          0% { transform: translate3d(0, 8%, 0); }
          100% { transform: translate3d(2%, -8%, 0); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(overlay);
    this.underwaterOverlay = overlay;
  }

  private updateUnderwaterOverlay(): void {
    if (!this.underwaterOverlay) return;
    this.underwaterOverlay.style.opacity = this.isUnderwater ? '1' : '0';
  }

  public getEyePosition(): THREE.Vector3 {
    return new THREE.Vector3(
      this.position.x,
      this.position.y + PHYSICS_CONFIG.PLAYER_EYE_HEIGHT,
      this.position.z
    );
  }

  public teleport(pos: THREE.Vector3): void {
    this.position.copy(pos);
    this.velocity.set(0, 0, 0);
    this.highestFallY = pos.y;
    this.isGrounded = false;
    this.isUnderwater = this.world.isWater(
      Math.floor(this.position.x),
      Math.floor(this.position.y + PHYSICS_CONFIG.PLAYER_EYE_HEIGHT),
      Math.floor(this.position.z)
    );
    this.updateUnderwaterOverlay();
  }

  public update(
    delta: number,
    inputMove: { forward: number; right: number },
    yaw: number,
    isJumping: boolean,
    isSprinting: boolean
  ): void {
    const fwdX = -Math.sin(yaw);
    const fwdZ = -Math.cos(yaw);
    const rightX = Math.cos(yaw);
    const rightZ = -Math.sin(yaw);

    const moveX = fwdX * inputMove.forward + rightX * inputMove.right;
    const moveZ = fwdZ * inputMove.forward + rightZ * inputMove.right;
    const moveLen = Math.hypot(moveX, moveZ);

    const inWaterFeet =
      this.world.isWater(Math.floor(this.position.x), Math.floor(this.position.y), Math.floor(this.position.z)) ||
      this.world.isWater(Math.floor(this.position.x), Math.floor(this.position.y - 0.2), Math.floor(this.position.z));

    const inWaterBody = this.world.isWater(
      Math.floor(this.position.x),
      Math.floor(this.position.y + 0.6),
      Math.floor(this.position.z)
    );

    this.isInWater = inWaterFeet || inWaterBody;

    const speed = this.isInWater
      ? 4.0
      : isSprinting
      ? PHYSICS_CONFIG.SPRINT_SPEED
      : PHYSICS_CONFIG.WALK_SPEED;

    let targetVelX = 0;
    let targetVelZ = 0;

    if (moveLen > 0.001) {
      targetVelX = (moveX / moveLen) * speed;
      targetVelZ = (moveZ / moveLen) * speed;
    }

    const accelRate = this.isInWater ? 10.0 : (this.isGrounded ? 18.0 : 6.0);
    this.velocity.x += (targetVelX - this.velocity.x) * Math.min(1.0, accelRate * delta);
    this.velocity.z += (targetVelZ - this.velocity.z) * Math.min(1.0, accelRate * delta);

    if (this.isInWater) {
      this.highestFallY = this.position.y;
      if (isJumping) {
        if (!inWaterBody && inWaterFeet) {
          this.velocity.y = 7.5;
        } else {
          this.velocity.y = 5.2;
        }
      } else {
        this.velocity.y = Math.max(-3.5, this.velocity.y - 8.0 * delta);
      }
    } else {
      if (isJumping && this.isGrounded) {
        this.velocity.y = PHYSICS_CONFIG.JUMP_SPEED;
        this.isGrounded = false;
      }

      this.velocity.y -= PHYSICS_CONFIG.GRAVITY * delta;
      if (this.velocity.y < PHYSICS_CONFIG.TERMINAL_VELOCITY) {
        this.velocity.y = PHYSICS_CONFIG.TERMINAL_VELOCITY;
      }
    }

    this.moveAndCollide(delta);

    // Simple local fluid simulation. It only runs near the player, preferring
    // downward flow into holes and then horizontal spread across supported blocks.
    this.waterFlowTimer += delta;
    if (this.waterFlowTimer >= 0.12) {
      this.waterFlowTimer = 0;
      this.updateNearbyWater();
    }

    const eyeY = this.position.y + PHYSICS_CONFIG.PLAYER_EYE_HEIGHT;
    this.isUnderwater = this.world.isWater(
      Math.floor(this.position.x),
      Math.floor(eyeY),
      Math.floor(this.position.z)
    );
    this.updateUnderwaterOverlay();

    if (this.position.y < -10) {
      this.teleport(this.world.getSpawnPoint());
    }
  }

  private updateNearbyWater(): void {
    const px = Math.floor(this.position.x);
    const py = Math.floor(this.position.y);
    const pz = Math.floor(this.position.z);
    const radius = 4;
    const minY = Math.max(1, py - 4);
    const maxY = Math.min(47, py + 4);

    // Water falls down first: this is what fills a hole dug underneath a lake/ocean.
    for (let y = minY; y <= maxY; y++) {
      for (let x = px - radius; x <= px + radius; x++) {
        for (let z = pz - radius; z <= pz + radius; z++) {
          if (this.world.getBlock(x, y, z) !== BLOCK_TYPE.AIR) continue;
          if (this.world.getBlock(x, y + 1, z) !== BLOCK_TYPE.WATER) continue;
          if (this.world.setBlock(x, y, z, BLOCK_TYPE.WATER)) return;
        }
      }
    }

    // Then allow a single supported side-flow step at a time.
    for (let y = minY; y <= maxY; y++) {
      for (let x = px - radius; x <= px + radius; x++) {
        for (let z = pz - radius; z <= pz + radius; z++) {
          if (this.world.getBlock(x, y, z) !== BLOCK_TYPE.AIR) continue;
          if (this.world.getBlock(x, y - 1, z) === BLOCK_TYPE.AIR) continue;

          const hasSideWater =
            this.world.getBlock(x + 1, y, z) === BLOCK_TYPE.WATER ||
            this.world.getBlock(x - 1, y, z) === BLOCK_TYPE.WATER ||
            this.world.getBlock(x, y, z + 1) === BLOCK_TYPE.WATER ||
            this.world.getBlock(x, y, z - 1) === BLOCK_TYPE.WATER;

          if (hasSideWater && this.world.setBlock(x, y, z, BLOCK_TYPE.WATER)) return;
        }
      }
    }
  }

  private moveAndCollide(dt: number): void {
    const eps = 0.001;

    const canStepUp = (targetBx: number, targetBy: number, targetBz: number): boolean => {
      const footY = Math.floor(this.position.y);
      if (
        targetBy === footY &&
        !this.world.isSolid(targetBx, footY + 1, targetBz) &&
        !this.world.isSolid(targetBx, footY + 2, targetBz)
      ) {
        return true;
      }
      return false;
    };

    this.position.x += this.velocity.x * dt;
    let minX = this.position.x - this.radius;
    let maxX = this.position.x + this.radius;
    let minY = this.position.y;
    let maxY = this.position.y + this.height;
    let minZ = this.position.z - this.radius;
    let maxZ = this.position.z + this.radius;

    for (let bx = Math.floor(minX); bx <= Math.floor(maxX); bx++) {
      for (let by = Math.floor(minY); by <= Math.floor(maxY); by++) {
        for (let bz = Math.floor(minZ); bz <= Math.floor(maxZ); bz++) {
          if (this.world.isSolid(bx, by, bz)) {
            if (this.isInWater && canStepUp(bx, by, bz)) {
              this.position.y = by + 1 + eps;
              this.isGrounded = true;
              continue;
            }

            if (this.velocity.x > 0) {
              this.position.x = bx - this.radius - eps;
            } else if (this.velocity.x < 0) {
              this.position.x = bx + 1 + this.radius + eps;
            }
            this.velocity.x = 0;
            break;
          }
        }
      }
    }

    this.position.z += this.velocity.z * dt;
    minX = this.position.x - this.radius;
    maxX = this.position.x + this.radius;
    minZ = this.position.z - this.radius;
    maxZ = this.position.z + this.radius;

    for (let bx = Math.floor(minX); bx <= Math.floor(maxX); bx++) {
      for (let by = Math.floor(minY); by <= Math.floor(maxY); by++) {
        for (let bz = Math.floor(minZ); bz <= Math.floor(maxZ); bz++) {
          if (this.world.isSolid(bx, by, bz)) {
            if (this.isInWater && canStepUp(bx, by, bz)) {
              this.position.y = by + 1 + eps;
              this.isGrounded = true;
              continue;
            }

            if (this.velocity.z > 0) {
              this.position.z = bz - this.radius - eps;
            } else if (this.velocity.z < 0) {
              this.position.z = bz + 1 + this.radius + eps;
            }
            this.velocity.z = 0;
            break;
          }
        }
      }
    }

    this.position.y += this.velocity.y * dt;
    this.isGrounded = false;

    const minX2 = this.position.x - this.radius;
    const maxX2 = this.position.x + this.radius;
    const minY2 = this.position.y;
    const maxY2 = this.position.y + this.height;
    const minZ2 = this.position.z - this.radius;
    const maxZ2 = this.position.z + this.radius;

    for (let bx = Math.floor(minX2); bx <= Math.floor(maxX2); bx++) {
      for (let by = Math.floor(minY2); by <= Math.floor(maxY2); by++) {
        for (let bz = Math.floor(minZ2); bz <= Math.floor(maxZ2); bz++) {
          if (this.world.isSolid(bx, by, bz)) {
            if (this.velocity.y > 0) {
              this.position.y = by - this.height - eps;
            } else {
              this.position.y = by + 1 + eps;
              this.isGrounded = true;
            }
            this.velocity.y = 0;
          }
        }
      }
    }

    if (this.isGrounded && this.highestFallY - this.position.y > 3) {
      const fallDistance = this.highestFallY - this.position.y;
      const damage = Math.max(0, Math.floor(fallDistance - 3));
      if (damage > 0 && this.onFallDamage) {
        this.onFallDamage(damage);
      }
      this.highestFallY = this.position.y;
    } else if (!this.isGrounded) {
      this.highestFallY = Math.max(this.highestFallY, this.position.y);
    }
  }

  public dispose(): void {
    if (this.underwaterOverlay?.parentElement) {
      this.underwaterOverlay.parentElement.removeChild(this.underwaterOverlay);
    }
    this.underwaterOverlay = null;
  }
}
