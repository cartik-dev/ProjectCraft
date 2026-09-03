import * as THREE from 'three';

export class DayNightCycle {
  public group: THREE.Group;
  public timeOfDay = 0.25; // 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
  public cycleDurationSeconds = 480; // 8 minutes per full Minecraft day

  public isNight = false;

  private sunMesh: THREE.Mesh;
  private moonMesh: THREE.Mesh;
  private starfield: THREE.Points;
  private starMaterial: THREE.PointsMaterial;

  public sunLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;

  private daySkyColor = new THREE.Color(0x62b0ff);
  private sunsetSkyColor = new THREE.Color(0xd97706);
  private nightSkyColor = new THREE.Color(0x070b14);
  private currentSkyColor = new THREE.Color(0x62b0ff);

  constructor() {
    this.group = new THREE.Group();

    // 1. Sun (Bright yellow square)
    const sunGeo = new THREE.PlaneGeometry(24, 24);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfff0aa,
      side: THREE.DoubleSide,
      fog: false,
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.group.add(this.sunMesh);

    // 2. Moon (White square)
    const moonGeo = new THREE.PlaneGeometry(20, 20);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xeeeeff,
      side: THREE.DoubleSide,
      fog: false,
    });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.group.add(this.moonMesh);

    // 3. Starfield (350 pixel stars on sky dome)
    const starCount = 350;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.95); // Upper dome
      const r = 180;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.2,
      transparent: true,
      opacity: 0.0,
      fog: false,
    });
    this.starfield = new THREE.Points(starGeo, this.starMaterial);
    this.group.add(this.starfield);

    // 4. Lights
    this.sunLight = new THREE.DirectionalLight(0xfff8ea, 1.3);
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.05);
  }

  public update(
    dt: number,
    cameraPos: THREE.Vector3,
    scene: THREE.Scene
  ): void {
    // Progress time
    this.timeOfDay = (this.timeOfDay + dt / this.cycleDurationSeconds) % 1.0;

    // Follow player camera
    this.group.position.copy(cameraPos);

    // Celestial angle (0 = sunrise, PI/2 = noon, PI = sunset, 3PI/2 = midnight)
    const angle = this.timeOfDay * Math.PI * 2;
    const orbitRadius = 160;

    const sunX = Math.cos(angle) * orbitRadius;
    const sunY = Math.sin(angle) * orbitRadius;
    this.sunMesh.position.set(sunX, sunY, 0);
    this.sunMesh.lookAt(0, 0, 0);

    // Moon is directly opposite
    const moonX = -sunX;
    const moonY = -sunY;
    this.moonMesh.position.set(moonX, moonY, 0);
    this.moonMesh.lookAt(0, 0, 0);

    // Update Sun / Moon directional light
    if (sunY > 0) {
      this.sunLight.position.set(sunX, sunY, 30);
      this.sunLight.intensity = Math.max(0.15, (sunY / orbitRadius) * 1.3);
      this.sunLight.color.setHex(0xfff8ea);
    } else {
      this.sunLight.position.set(moonX, moonY, 30);
      this.sunLight.intensity = Math.max(0.08, (moonY / orbitRadius) * 0.35);
      this.sunLight.color.setHex(0xa5b4fc); // Moonlit blue
    }

    // Determine day / sunset / night state
    // sunY > 20: Day
    // -20 <= sunY <= 20: Dusk / Dawn
    // sunY < -20: Night
    const elevation = sunY / orbitRadius; // -1 to 1

    if (elevation > 0.15) {
      // Full Daylight
      this.isNight = false;
      this.currentSkyColor.copy(this.daySkyColor);
      this.ambientLight.intensity = 1.05;
      this.starMaterial.opacity = 0.0;
    } else if (elevation > -0.15) {
      // Sunset / Sunrise transition
      const t = (elevation + 0.15) / 0.3; // 0 (night) to 1 (day)
      if (t > 0.5) {
        this.currentSkyColor.lerpColors(this.sunsetSkyColor, this.daySkyColor, (t - 0.5) * 2);
      } else {
        this.currentSkyColor.lerpColors(this.nightSkyColor, this.sunsetSkyColor, t * 2);
      }
      this.ambientLight.intensity = 0.35 + t * 0.7;
      this.starMaterial.opacity = (1 - t) * 0.85;
      this.isNight = t < 0.35;
    } else {
      // Midnight Night
      this.isNight = true;
      this.currentSkyColor.copy(this.nightSkyColor);
      this.ambientLight.intensity = 0.22;
      this.starMaterial.opacity = 0.95;
    }

    // Apply colors to scene sky and fog
    scene.background = this.currentSkyColor;
    if (scene.fog) {
      scene.fog.color.copy(this.currentSkyColor);
    }
  }
}
