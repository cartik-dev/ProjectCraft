import * as THREE from 'three';
import { BLOCK_COLORS, type BlockType } from './constants';

interface Particle {
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  scale: number;
}

export class ParticleSystem {
  public group: THREE.Group;
  private instancedMesh: THREE.InstancedMesh;
  private maxParticles = 160;
  private particles: Particle[] = [];
  private dummy = new THREE.Object3D();

  constructor() {
    this.group = new THREE.Group();

    const geo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    const mat = new THREE.MeshBasicMaterial();

    this.instancedMesh = new THREE.InstancedMesh(geo, mat, this.maxParticles);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.add(this.instancedMesh);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        life: 0,
        maxLife: 0.6,
        scale: 1,
      });
      // Hide initially off-screen
      this.dummy.position.set(0, -9999, 0);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  public emitBlockBreak(blockPos: THREE.Vector3, type: BlockType): void {
    const hexColor = BLOCK_COLORS[type] ?? 0x795130;
    const baseColor = new THREE.Color(hexColor);
    const countToSpawn = 14;

    let spawned = 0;
    for (let i = 0; i < this.maxParticles && spawned < countToSpawn; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.life = 0;
        p.maxLife = 0.45 + Math.random() * 0.25;

        // Spread spawn inside the broken block cube
        p.position.set(
          blockPos.x + 0.2 + Math.random() * 0.6,
          blockPos.y + 0.2 + Math.random() * 0.6,
          blockPos.z + 0.2 + Math.random() * 0.6
        );

        // Random outward velocity with upward kick
        p.velocity.set(
          (Math.random() - 0.5) * 4.5,
          Math.random() * 3.5 + 1.5,
          (Math.random() - 0.5) * 4.5
        );

        // Slightly vary particle color brightness for pixel depth
        const variance = (Math.random() - 0.5) * 0.15;
        p.color.copy(baseColor).offsetHSL(0, 0, variance);
        this.instancedMesh.setColorAt(i, p.color);

        p.scale = 0.7 + Math.random() * 0.5;
        spawned++;
      }
    }

    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  public update(dt: number): void {
    let hasUpdates = false;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      hasUpdates = true;
      p.life += dt;

      if (p.life >= p.maxLife) {
        p.active = false;
        this.dummy.position.set(0, -9999, 0);
        this.dummy.scale.set(1, 1, 1);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
        continue;
      }

      // Physics: gravity + drag
      p.velocity.y -= 16.0 * dt;
      p.position.addScaledVector(p.velocity, dt);

      // Shrink towards end of life
      const remainingProgress = 1 - p.life / p.maxLife;
      const curScale = p.scale * remainingProgress;

      this.dummy.position.copy(p.position);
      this.dummy.scale.set(curScale, curScale, curScale);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    if (hasUpdates) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    }
  }
}
