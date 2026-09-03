import * as THREE from 'three';

export class CloudLayer {
  public group: THREE.Group;
  private clouds: { mesh: THREE.Mesh; offsetX: number; offsetZ: number }[] = [];
  private windSpeed = 1.2; // units per second
  private cloudAltitude = 40;
  private wrapRange = 90;

  constructor() {
    this.group = new THREE.Group();

    const cloudMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    // Create 24 fluffy cloud clusters
    const count = 24;
    for (let i = 0; i < count; i++) {
      const width = 12 + Math.random() * 16;
      const height = 2 + Math.random() * 2;
      const length = 12 + Math.random() * 16;

      const geometry = new THREE.BoxGeometry(width, height, length);
      const mesh = new THREE.Mesh(geometry, cloudMaterial);

      const offsetX = (Math.random() - 0.5) * (this.wrapRange * 2);
      const offsetZ = (Math.random() - 0.5) * (this.wrapRange * 2);

      mesh.position.set(offsetX, this.cloudAltitude + (Math.random() - 0.5) * 2, offsetZ);
      this.group.add(mesh);

      this.clouds.push({ mesh, offsetX, offsetZ });
    }
  }

  public update(dt: number, playerPos: THREE.Vector3): void {
    for (const c of this.clouds) {
      c.offsetX += this.windSpeed * dt;

      // Wrap clouds around player center
      const relX = c.offsetX - playerPos.x;
      const relZ = c.offsetZ - playerPos.z;

      if (relX > this.wrapRange) {
        c.offsetX -= this.wrapRange * 2;
      } else if (relX < -this.wrapRange) {
        c.offsetX += this.wrapRange * 2;
      }

      if (relZ > this.wrapRange) {
        c.offsetZ -= this.wrapRange * 2;
      } else if (relZ < -this.wrapRange) {
        c.offsetZ += this.wrapRange * 2;
      }

      c.mesh.position.x = c.offsetX;
      c.mesh.position.z = c.offsetZ;
    }
  }
}
