import * as THREE from 'three';
import { PHYSICS_CONFIG } from './constants';
import type { World } from './World';

export class PlayerPhysics {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public isGrounded = false;
  public highestFallY = 0;
  public onFallDamage?: (damage: number) => void;
  public isInWater = false;

  private world: World;
  private readonly radius = PHYSICS_CONFIG.PLAYER_RADIUS;
  private readonly height = PHYSICS_CONFIG.PLAYER_HEIGHT;

  constructor(world: World, spawnPosition: THREE.Vector3) {
    this.world = world;
    this.position = spawnPosition.clone();
    this.highestFallY = this.position.y;
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

    // Water detection: check feet and body
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

    // Smooth horizontal acceleration
    const accelRate = this.isInWater ? 10.0 : (this.isGrounded ? 18.0 : 6.0);
    this.velocity.x += (targetVelX - this.velocity.x) * Math.min(1.0, accelRate * delta);
    this.velocity.z += (targetVelZ - this.velocity.z) * Math.min(1.0, accelRate * delta);

    if (this.isInWater) {
      this.highestFallY = this.position.y; // Falling into water resets fall damage!
      if (isJumping) {
        if (!inWaterBody && inWaterFeet) {
          this.velocity.y = 7.5; // High leap out of water onto shore!
        } else {
          this.velocity.y = 5.2; // Swim up towards surface
        }
      } else {
        this.velocity.y = Math.max(-3.5, this.velocity.y - 8.0 * delta); // Slower sink
      }
    } else {
      // Jumping on land
      if (isJumping && this.isGrounded) {
        this.velocity.y = PHYSICS_CONFIG.JUMP_SPEED;
        this.isGrounded = false;
      }

      // Gravity
      this.velocity.y -= PHYSICS_CONFIG.GRAVITY * delta;
      if (this.velocity.y < PHYSICS_CONFIG.TERMINAL_VELOCITY) {
        this.velocity.y = PHYSICS_CONFIG.TERMINAL_VELOCITY;
      }
    }

    // Axis-separated collision resolution
    this.moveAndCollide(delta);

    // Fall rescue - respawn if fallen into the void
    if (this.position.y < -10) {
      this.teleport(this.world.getSpawnPoint());
    }
  }

  private moveAndCollide(dt: number): void {
    const eps = 0.001;

    // Helper: auto-step up 1-block ledge (e.g. climbing out of water or over blocks)
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

    // --- 1. Move along X axis ---
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
            // Auto step-up only when climbing out of water onto shore
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

    // --- 2. Move along Z axis ---
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

    // --- 3. Move along Y axis ---
    this.position.y += this.velocity.y * dt;
    minX = this.position.x - this.radius;
    maxX = this.position.x + this.radius;
    minY = this.position.y;
    maxY = this.position.y + this.height;
    minZ = this.position.z - this.radius;
    maxZ = this.position.z + this.radius;

    const wasInAir = !this.isGrounded;
    this.isGrounded = false;

    for (let bx = Math.floor(minX); bx <= Math.floor(maxX); bx++) {
      for (let by = Math.floor(minY); by <= Math.floor(maxY); by++) {
        for (let bz = Math.floor(minZ); bz <= Math.floor(maxZ); bz++) {
          if (this.world.isSolid(bx, by, bz)) {
            if (this.velocity.y < 0) {
              // Hit floor
              this.position.y = by + 1;
              this.velocity.y = 0;
              this.isGrounded = true;

              // Fall Damage Calculation (negated if landing in water)
              if (wasInAir && !this.isInWater) {
                const fallDistance = this.highestFallY - this.position.y;
                if (fallDistance > 3.5 && this.onFallDamage) {
                  const damage = Math.floor((fallDistance - 3) * 2);
                  if (damage > 0) {
                    this.onFallDamage(damage);
                  }
                }
              }
              this.highestFallY = this.position.y;
            } else if (this.velocity.y > 0) {
              // Hit ceiling
              this.position.y = by - this.height - eps;
              this.velocity.y = 0;
            }
            break;
          }
        }
      }
    }

    // Track highest Y during fall
    if (this.position.y > this.highestFallY || this.isGrounded || this.isInWater) {
      this.highestFallY = this.position.y;
    }
  }
}
