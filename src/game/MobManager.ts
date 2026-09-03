import * as THREE from 'three';
import { BLOCK_TYPE } from './constants';
import type { World } from './World';
import type { ItemDropManager } from './ItemDrops';
import type { BlockMaterials } from './textures';
import { soundManager } from './SoundManager';

export interface MobEntity {
  id: string;
  type: 'zombie' | 'pig' | 'skeleton' | 'sheep';
  group: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  health: number;
  maxHealth: number;
  isGrounded: boolean;
  walkCycle: number;
  lastAttackTime: number;
  hurtTime: number;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  backLeftLeg?: THREE.Mesh;
  backRightLeg?: THREE.Mesh;
  leftArm?: THREE.Mesh;
  rightArm?: THREE.Mesh;
  meshesToFlash: THREE.Mesh[];
  originalColors: number[];
  fleeTimer?: number;
  lastSoundTime?: number;
}

export class MobManager {
  public group: THREE.Group;
  public mobs: MobEntity[] = [];
  private nextId = 1;
  private lastSpawnTime = 0;

  constructor() {
    this.group = new THREE.Group();
  }

  // --- 1. ZOMBIE MODEL (Detailed Steve-like Zombie) ---
  private createZombieMesh(): {
    group: THREE.Group;
    leftLeg: THREE.Mesh;
    rightLeg: THREE.Mesh;
    leftArm: THREE.Mesh;
    rightArm: THREE.Mesh;
    meshes: THREE.Mesh[];
    colors: number[];
  } {
    const group = new THREE.Group();
    const meshes: THREE.Mesh[] = [];
    const colors: number[] = [];

    const green = 0x4a7c28;
    const darkGreen = 0x274a14;
    const cyan = 0x008b8b;
    const blue = 0x2b3d8f;
    const eyeBlack = 0x18181b;

    // Head
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMat = new THREE.MeshLambertMaterial({ color: green });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.65, 0);
    group.add(head);
    meshes.push(head);
    colors.push(green);

    // Hair cap
    const hairGeo = new THREE.BoxGeometry(0.52, 0.12, 0.52);
    const hairMat = new THREE.MeshLambertMaterial({ color: darkGreen });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.87, 0);
    group.add(hair);
    meshes.push(hair);
    colors.push(darkGreen);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.1, 0.08, 0.02);
    const eyeMat = new THREE.MeshLambertMaterial({ color: eyeBlack });
    const lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.position.set(-0.13, 1.68, -0.26);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.position.set(0.13, 1.68, -0.26);

    // Mouth
    const mouthGeo = new THREE.BoxGeometry(0.14, 0.06, 0.02);
    const mouthMat = new THREE.MeshLambertMaterial({ color: darkGreen });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, 1.52, -0.26);

    group.add(lEye, rEye, mouth);
    meshes.push(lEye, rEye, mouth);
    colors.push(eyeBlack, eyeBlack, darkGreen);

    // Body (Shirt)
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.65, 0.25);
    const bodyMat = new THREE.MeshLambertMaterial({ color: cyan });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 1.1, 0);
    group.add(body);
    meshes.push(body);
    colors.push(cyan);

    // Outstretched Arms with shirt sleeves
    const armGeo = new THREE.BoxGeometry(0.18, 0.18, 0.6);
    const leftArmMat = new THREE.MeshLambertMaterial({ color: green });
    const leftArm = new THREE.Mesh(armGeo, leftArmMat);
    leftArm.position.set(-0.35, 1.25, -0.28);

    const lSleeveGeo = new THREE.BoxGeometry(0.2, 0.2, 0.22);
    const lSleeveMat = new THREE.MeshLambertMaterial({ color: cyan });
    const lSleeve = new THREE.Mesh(lSleeveGeo, lSleeveMat);
    lSleeve.position.set(0, 0, 0.19);
    leftArm.add(lSleeve);

    const rightArmMat = new THREE.MeshLambertMaterial({ color: green });
    const rightArm = new THREE.Mesh(armGeo, rightArmMat);
    rightArm.position.set(0.35, 1.25, -0.28);

    const rSleeve = new THREE.Mesh(lSleeveGeo, lSleeveMat);
    rSleeve.position.set(0, 0, 0.19);
    rightArm.add(rSleeve);

    group.add(leftArm, rightArm);
    meshes.push(leftArm, rightArm, lSleeve, rSleeve);
    colors.push(green, green, cyan, cyan);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.75, 0.2);
    const leftLegMat = new THREE.MeshLambertMaterial({ color: blue });
    const leftLeg = new THREE.Mesh(legGeo, leftLegMat);
    leftLeg.position.set(-0.13, 0.38, 0);

    const rightLegMat = new THREE.MeshLambertMaterial({ color: blue });
    const rightLeg = new THREE.Mesh(legGeo, rightLegMat);
    rightLeg.position.set(0.13, 0.38, 0);

    group.add(leftLeg, rightLeg);
    meshes.push(leftLeg, rightLeg);
    colors.push(blue, blue);

    return { group, leftLeg, rightLeg, leftArm, rightArm, meshes, colors };
  }

  // --- 2. SKELETON MODEL (Detailed Bone Archer with 3D Bow) ---
  private createSkeletonMesh(): {
    group: THREE.Group;
    leftLeg: THREE.Mesh;
    rightLeg: THREE.Mesh;
    leftArm: THREE.Mesh;
    rightArm: THREE.Mesh;
    meshes: THREE.Mesh[];
    colors: number[];
  } {
    const group = new THREE.Group();
    const meshes: THREE.Mesh[] = [];
    const colors: number[] = [];

    const bone = 0xededed;
    const darkBone = 0x1f2937;
    const rib = 0x9ca3af;
    const bowWood = 0x78350f;
    const bowString = 0xe5e7eb;

    // Skull
    const headGeo = new THREE.BoxGeometry(0.48, 0.48, 0.48);
    const headMat = new THREE.MeshLambertMaterial({ color: bone });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.65, 0);
    group.add(head);
    meshes.push(head);
    colors.push(bone);

    // Sockets & Cavity
    const eyeGeo = new THREE.BoxGeometry(0.11, 0.11, 0.02);
    const eyeMat = new THREE.MeshLambertMaterial({ color: darkBone });
    const lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.position.set(-0.11, 1.68, -0.25);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.position.set(0.11, 1.68, -0.25);

    const mouthGeo = new THREE.BoxGeometry(0.16, 0.06, 0.02);
    const mouthMat = new THREE.MeshLambertMaterial({ color: darkBone });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, 1.50, -0.25);

    group.add(lEye, rEye, mouth);
    meshes.push(lEye, rEye, mouth);
    colors.push(darkBone, darkBone, darkBone);

    // Ribcage & Spine
    const bodyGeo = new THREE.BoxGeometry(0.42, 0.65, 0.2);
    const bodyMat = new THREE.MeshLambertMaterial({ color: rib });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 1.1, 0);
    group.add(body);
    meshes.push(body);
    colors.push(rib);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.12, 0.12, 0.6);
    const leftArmMat = new THREE.MeshLambertMaterial({ color: bone });
    const leftArm = new THREE.Mesh(armGeo, leftArmMat);
    leftArm.position.set(-0.28, 1.25, -0.28);

    const rightArmMat = new THREE.MeshLambertMaterial({ color: bone });
    const rightArm = new THREE.Mesh(armGeo, rightArmMat);
    rightArm.position.set(0.28, 1.25, -0.28);

    // 3D Bow held by skeleton
    const bowGeo = new THREE.BoxGeometry(0.06, 0.55, 0.06);
    const bowMat = new THREE.MeshLambertMaterial({ color: bowWood });
    const bow = new THREE.Mesh(bowGeo, bowMat);
    bow.position.set(0.08, 0, -0.32);

    const bowStringGeo = new THREE.BoxGeometry(0.02, 0.52, 0.02);
    const bowStringMat = new THREE.MeshLambertMaterial({ color: bowString });
    const bString = new THREE.Mesh(bowStringGeo, bowStringMat);
    bString.position.set(0.08, 0, -0.26);

    rightArm.add(bow);
    rightArm.add(bString);

    group.add(leftArm, rightArm);
    meshes.push(leftArm, rightArm, bow, bString);
    colors.push(bone, bone, bowWood, bowString);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.12, 0.75, 0.12);
    const legMat = new THREE.MeshLambertMaterial({ color: bone });
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.12, 0.38, 0);
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.12, 0.38, 0);

    group.add(leftLeg, rightLeg);
    meshes.push(leftLeg, rightLeg);
    colors.push(bone, bone);

    return { group, leftLeg, rightLeg, leftArm, rightArm, meshes, colors };
  }

  // --- 3. PIG MODEL (Detailed with snout, nostrils, eyes, ears, curly tail & hooves) ---
  private createPigMesh(): {
    group: THREE.Group;
    flLeg: THREE.Mesh;
    frLeg: THREE.Mesh;
    blLeg: THREE.Mesh;
    brLeg: THREE.Mesh;
    meshes: THREE.Mesh[];
    colors: number[];
  } {
    const group = new THREE.Group();
    const meshes: THREE.Mesh[] = [];
    const colors: number[] = [];

    const pink = 0xf472b6;
    const darkPink = 0xdb2777;
    const nostrilCol = 0x9d174d;
    const hoofCol = 0x831843;
    const white = 0xffffff;
    const black = 0x111111;

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.65, 0.5, 0.85);
    const bodyMat = new THREE.MeshLambertMaterial({ color: pink });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.6, 0);
    group.add(body);
    meshes.push(body);
    colors.push(pink);

    // Curly tail at back (+Z)
    const tailGeo = new THREE.BoxGeometry(0.06, 0.12, 0.08);
    const tailMat = new THREE.MeshLambertMaterial({ color: darkPink });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, 0.65, 0.44);
    group.add(tail);
    meshes.push(tail);
    colors.push(darkPink);

    // Head
    const headGeo = new THREE.BoxGeometry(0.44, 0.44, 0.44);
    const headMat = new THREE.MeshLambertMaterial({ color: pink });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 0.75, -0.5);
    group.add(head);
    meshes.push(head);
    colors.push(pink);

    // Snout
    const snoutGeo = new THREE.BoxGeometry(0.22, 0.14, 0.1);
    const snoutMat = new THREE.MeshLambertMaterial({ color: darkPink });
    const snout = new THREE.Mesh(snoutGeo, snoutMat);
    snout.position.set(0, 0.68, -0.74);
    group.add(snout);
    meshes.push(snout);
    colors.push(darkPink);

    // Nostrils
    const nostrilGeo = new THREE.BoxGeometry(0.04, 0.04, 0.02);
    const nostrilMat = new THREE.MeshLambertMaterial({ color: nostrilCol });
    const lNos = new THREE.Mesh(nostrilGeo, nostrilMat);
    lNos.position.set(-0.06, 0.68, -0.80);
    const rNos = new THREE.Mesh(nostrilGeo, nostrilMat);
    rNos.position.set(0.06, 0.68, -0.80);
    group.add(lNos, rNos);
    meshes.push(lNos, rNos);
    colors.push(nostrilCol, nostrilCol);

    // Eyes
    const eyeWhiteGeo = new THREE.BoxGeometry(0.06, 0.08, 0.08);
    const eyeWhiteMat = new THREE.MeshLambertMaterial({ color: white });
    const eyePupilGeo = new THREE.BoxGeometry(0.062, 0.06, 0.04);
    const eyePupilMat = new THREE.MeshLambertMaterial({ color: black });

    const lEyeW = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    lEyeW.position.set(-0.22, 0.82, -0.55);
    const lEyeP = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    lEyeP.position.set(-0.22, 0.82, -0.57);

    const rEyeW = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rEyeW.position.set(0.22, 0.82, -0.55);
    const rEyeP = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    rEyeP.position.set(0.22, 0.82, -0.57);

    // Ears
    const earGeo = new THREE.BoxGeometry(0.08, 0.12, 0.08);
    const earMat = new THREE.MeshLambertMaterial({ color: pink });
    const lEar = new THREE.Mesh(earGeo, earMat);
    lEar.position.set(-0.20, 0.98, -0.45);
    const rEar = new THREE.Mesh(earGeo, earMat);
    rEar.position.set(0.20, 0.98, -0.45);

    group.add(lEyeW, lEyeP, rEyeW, rEyeP, lEar, rEar);
    meshes.push(lEyeW, lEyeP, rEyeW, rEyeP, lEar, rEar);
    colors.push(white, black, white, black, pink, pink);

    // Legs with hooves
    const legGeo = new THREE.BoxGeometry(0.16, 0.38, 0.16);
    const legMat = new THREE.MeshLambertMaterial({ color: pink });
    const hoofGeo = new THREE.BoxGeometry(0.165, 0.08, 0.165);
    const hoofMat = new THREE.MeshLambertMaterial({ color: hoofCol });

    const flLeg = new THREE.Mesh(legGeo, legMat);
    flLeg.position.set(-0.2, 0.19, -0.3);
    const flHoof = new THREE.Mesh(hoofGeo, hoofMat);
    flHoof.position.set(0, -0.15, 0);
    flLeg.add(flHoof);

    const frLeg = new THREE.Mesh(legGeo, legMat);
    frLeg.position.set(0.2, 0.19, -0.3);
    const frHoof = new THREE.Mesh(hoofGeo, hoofMat);
    frHoof.position.set(0, -0.15, 0);
    frLeg.add(frHoof);

    const blLeg = new THREE.Mesh(legGeo, legMat);
    blLeg.position.set(-0.2, 0.19, 0.3);
    const blHoof = new THREE.Mesh(hoofGeo, hoofMat);
    blHoof.position.set(0, -0.15, 0);
    blLeg.add(blHoof);

    const brLeg = new THREE.Mesh(legGeo, legMat);
    brLeg.position.set(0.2, 0.19, 0.3);
    const brHoof = new THREE.Mesh(hoofGeo, hoofMat);
    brHoof.position.set(0, -0.15, 0);
    brLeg.add(brHoof);

    group.add(flLeg, frLeg, blLeg, brLeg);
    meshes.push(flLeg, frLeg, blLeg, brLeg, flHoof, frHoof, blHoof, brHoof);
    colors.push(pink, pink, pink, pink, hoofCol, hoofCol, hoofCol, hoofCol);

    return { group, flLeg, frLeg, blLeg, brLeg, meshes, colors };
  }

  // --- 4. SHEEP MODEL (Detailed with fluffy coat, wool hat, pink nose, ears & hooves) ---
  private createSheepMesh(): {
    group: THREE.Group;
    flLeg: THREE.Mesh;
    frLeg: THREE.Mesh;
    blLeg: THREE.Mesh;
    brLeg: THREE.Mesh;
    meshes: THREE.Mesh[];
    colors: number[];
  } {
    const group = new THREE.Group();
    const meshes: THREE.Mesh[] = [];
    const colors: number[] = [];

    const whiteWool = 0xf8fafc;
    const skinTone = 0xe2d4b7;
    const darkSkin = 0xbda685;
    const pinkNose = 0xf472b6;
    const black = 0x111111;

    // Wool Body (fluffy cube)
    const bodyGeo = new THREE.BoxGeometry(0.72, 0.62, 0.95);
    const bodyMat = new THREE.MeshLambertMaterial({ color: whiteWool });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.68, 0);
    group.add(body);
    meshes.push(body);
    colors.push(whiteWool);

    // Head
    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMat = new THREE.MeshLambertMaterial({ color: skinTone });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 0.82, -0.55);
    group.add(head);
    meshes.push(head);
    colors.push(skinTone);

    // Wool hat
    const hatGeo = new THREE.BoxGeometry(0.42, 0.22, 0.36);
    const hatMat = new THREE.MeshLambertMaterial({ color: whiteWool });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.set(0, 0.98, -0.55);
    group.add(hat);
    meshes.push(hat);
    colors.push(whiteWool);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.04, 0.06, 0.06);
    const eyeMat = new THREE.MeshLambertMaterial({ color: black });
    const lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.position.set(-0.205, 0.85, -0.60);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.position.set(0.205, 0.85, -0.60);

    // Pink nose
    const noseGeo = new THREE.BoxGeometry(0.12, 0.06, 0.04);
    const noseMat = new THREE.MeshLambertMaterial({ color: pinkNose });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 0.72, -0.76);

    // Droopy ears
    const earGeo = new THREE.BoxGeometry(0.12, 0.06, 0.06);
    const earMat = new THREE.MeshLambertMaterial({ color: skinTone });
    const lEar = new THREE.Mesh(earGeo, earMat);
    lEar.position.set(-0.24, 0.85, -0.50);
    const rEar = new THREE.Mesh(earGeo, earMat);
    rEar.position.set(0.24, 0.85, -0.50);

    group.add(lEye, rEye, nose, lEar, rEar);
    meshes.push(lEye, rEye, nose, lEar, rEar);
    colors.push(black, black, pinkNose, skinTone, skinTone);

    // 4 Legs with hooves
    const legGeo = new THREE.BoxGeometry(0.15, 0.42, 0.15);
    const legMat = new THREE.MeshLambertMaterial({ color: skinTone });
    const hoofGeo = new THREE.BoxGeometry(0.155, 0.08, 0.155);
    const hoofMat = new THREE.MeshLambertMaterial({ color: darkSkin });

    const flLeg = new THREE.Mesh(legGeo, legMat);
    flLeg.position.set(-0.22, 0.21, -0.32);
    const flHoof = new THREE.Mesh(hoofGeo, hoofMat);
    flHoof.position.set(0, -0.17, 0);
    flLeg.add(flHoof);

    const frLeg = new THREE.Mesh(legGeo, legMat);
    frLeg.position.set(0.22, 0.21, -0.32);
    const frHoof = new THREE.Mesh(hoofGeo, hoofMat);
    frHoof.position.set(0, -0.17, 0);
    frLeg.add(frHoof);

    const blLeg = new THREE.Mesh(legGeo, legMat);
    blLeg.position.set(-0.22, 0.21, 0.32);
    const blHoof = new THREE.Mesh(hoofGeo, hoofMat);
    blHoof.position.set(0, -0.17, 0);
    blLeg.add(blHoof);

    const brLeg = new THREE.Mesh(legGeo, legMat);
    brLeg.position.set(0.22, 0.21, 0.32);
    const brHoof = new THREE.Mesh(hoofGeo, hoofMat);
    brHoof.position.set(0, -0.17, 0);
    brLeg.add(brHoof);

    group.add(flLeg, frLeg, blLeg, brLeg);
    meshes.push(flLeg, frLeg, blLeg, brLeg, flHoof, frHoof, blHoof, brHoof);
    colors.push(skinTone, skinTone, skinTone, skinTone, darkSkin, darkSkin, darkSkin, darkSkin);

    return { group, flLeg, frLeg, blLeg, brLeg, meshes, colors };
  }

  public spawnZombie(pos: THREE.Vector3): void {
    const data = this.createZombieMesh();
    data.group.position.copy(pos);
    this.group.add(data.group);

    this.mobs.push({
      id: `zombie_${this.nextId++}`,
      type: 'zombie',
      group: data.group,
      position: pos.clone(),
      velocity: new THREE.Vector3(),
      health: 20,
      maxHealth: 20,
      isGrounded: true,
      walkCycle: 0,
      lastAttackTime: 0,
      hurtTime: 0,
      leftLeg: data.leftLeg,
      rightLeg: data.rightLeg,
      leftArm: data.leftArm,
      rightArm: data.rightArm,
      meshesToFlash: data.meshes,
      originalColors: data.colors,
    });
  }

  public spawnSkeleton(pos: THREE.Vector3): void {
    const data = this.createSkeletonMesh();
    data.group.position.copy(pos);
    this.group.add(data.group);

    this.mobs.push({
      id: `skeleton_${this.nextId++}`,
      type: 'skeleton',
      group: data.group,
      position: pos.clone(),
      velocity: new THREE.Vector3(),
      health: 16,
      maxHealth: 16,
      isGrounded: true,
      walkCycle: 0,
      lastAttackTime: 0,
      hurtTime: 0,
      leftLeg: data.leftLeg,
      rightLeg: data.rightLeg,
      leftArm: data.leftArm,
      rightArm: data.rightArm,
      meshesToFlash: data.meshes,
      originalColors: data.colors,
    });
  }

  public spawnPig(pos: THREE.Vector3): void {
    const data = this.createPigMesh();
    data.group.position.copy(pos);
    this.group.add(data.group);

    this.mobs.push({
      id: `pig_${this.nextId++}`,
      type: 'pig',
      group: data.group,
      position: pos.clone(),
      velocity: new THREE.Vector3(),
      health: 10,
      maxHealth: 10,
      isGrounded: true,
      walkCycle: 0,
      lastAttackTime: 0,
      hurtTime: 0,
      leftLeg: data.flLeg,
      rightLeg: data.frLeg,
      backLeftLeg: data.blLeg,
      backRightLeg: data.brLeg,
      meshesToFlash: data.meshes,
      originalColors: data.colors,
    });
  }

  public spawnSheep(pos: THREE.Vector3): void {
    const data = this.createSheepMesh();
    data.group.position.copy(pos);
    this.group.add(data.group);

    this.mobs.push({
      id: `sheep_${this.nextId++}`,
      type: 'sheep',
      group: data.group,
      position: pos.clone(),
      velocity: new THREE.Vector3(),
      health: 10,
      maxHealth: 10,
      isGrounded: true,
      walkCycle: 0,
      lastAttackTime: 0,
      hurtTime: 0,
      leftLeg: data.flLeg,
      rightLeg: data.frLeg,
      backLeftLeg: data.blLeg,
      backRightLeg: data.brLeg,
      meshesToFlash: data.meshes,
      originalColors: data.colors,
    });
  }

  public hitMob(
    mob: MobEntity,
    damage: number,
    knockbackDir: THREE.Vector3,
    dropManager: ItemDropManager,
    materials: BlockMaterials
  ): boolean {
    mob.health -= damage;
    mob.hurtTime = performance.now();
    soundManager.playHit();

    // Play creature hurt sound
    if (mob.type === 'zombie') soundManager.playZombieGroan();
    else if (mob.type === 'skeleton') soundManager.playSkeletonRattle();
    else if (mob.type === 'pig') soundManager.playPigOink();
    else if (mob.type === 'sheep') soundManager.playSheepBaa();

    // Knockback
    mob.velocity.x += knockbackDir.x * 6.5;
    mob.velocity.z += knockbackDir.z * 6.5;
    mob.velocity.y += 3.5;
    mob.isGrounded = false;

    if (mob.type === 'pig' || mob.type === 'sheep') {
      mob.fleeTimer = 6.0;
    }

    // Death check & proper loot drops
    if (mob.health <= 0) {
      this.group.remove(mob.group);
      soundManager.playBreak();

      if (mob.type === 'zombie') {
        dropManager.spawnDrop(mob.position, BLOCK_TYPE.ROTTEN_FLESH, materials);
      } else if (mob.type === 'skeleton') {
        dropManager.spawnDrop(mob.position, BLOCK_TYPE.BONE, materials);
      } else if (mob.type === 'pig') {
        dropManager.spawnDrop(mob.position, BLOCK_TYPE.RAW_PORKCHOP, materials);
      } else if (mob.type === 'sheep') {
        dropManager.spawnDrop(mob.position, BLOCK_TYPE.WHITE_WOOL, materials);
        dropManager.spawnDrop(mob.position, BLOCK_TYPE.RAW_PORKCHOP, materials);
      }
      return true;
    }
    return false;
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    isNight: boolean,
    world: World,
    onPlayerDamage: (dmg: number, cause: string) => void
  ): void {
    const now = performance.now();

    // Spawning logic
    if (now - this.lastSpawnTime > 6500) {
      this.lastSpawnTime = now;
      const hostiles = this.mobs.filter((m) => m.type === 'zombie' || m.type === 'skeleton').length;
      const passives = this.mobs.filter((m) => m.type === 'pig' || m.type === 'sheep').length;

      const angle = Math.random() * Math.PI * 2;
      const dist = 14 + Math.random() * 12;
      const spawnX = Math.floor(playerPos.x + Math.cos(angle) * dist);
      const spawnZ = Math.floor(playerPos.z + Math.sin(angle) * dist);

      let surfaceY = 30;
      for (let y = 40; y >= 4; y--) {
        if (world.isSolid(spawnX, y, spawnZ)) {
          surfaceY = y + 1;
          break;
        }
      }

      const spawnVec = new THREE.Vector3(spawnX + 0.5, surfaceY, spawnZ + 0.5);

      if (isNight && hostiles < 4) {
        if (Math.random() > 0.5) {
          this.spawnZombie(spawnVec);
        } else {
          this.spawnSkeleton(spawnVec);
        }
      } else if (!isNight && passives < 5) {
        if (Math.random() > 0.5) {
          this.spawnPig(spawnVec);
        } else {
          this.spawnSheep(spawnVec);
        }
      }
    }

    const alive: MobEntity[] = [];

    for (const mob of this.mobs) {
      if (mob.health <= 0) continue;

      const distToPlayer = mob.position.distanceTo(playerPos);

      // Red damage flash
      const isHurt = now - mob.hurtTime < 220;
      for (let i = 0; i < mob.meshesToFlash.length; i++) {
        const mat = mob.meshesToFlash[i].material as THREE.MeshLambertMaterial;
        mat.color.setHex(isHurt ? 0xff2222 : mob.originalColors[i]);
      }

      // --- AI BEHAVIOR ---
      let moveDir = new THREE.Vector3();
      let moveSpeed = 0;

      // Ambient sounds
      if (!mob.lastSoundTime) mob.lastSoundTime = now + Math.random() * 4000;
      if (now - mob.lastSoundTime > 9000 + Math.random() * 4000) {
        if (distToPlayer < 18) {
          if (mob.type === 'zombie') soundManager.playZombieGroan();
          else if (mob.type === 'skeleton') soundManager.playSkeletonRattle();
          else if (mob.type === 'pig') soundManager.playPigOink();
          else if (mob.type === 'sheep') soundManager.playSheepBaa();
        }
        mob.lastSoundTime = now;
      }

      if (mob.type === 'zombie' || mob.type === 'skeleton') {
        // Chase player
        if (distToPlayer < 20) {
          moveDir.subVectors(playerPos, mob.position).setY(0).normalize();
          moveSpeed = mob.type === 'zombie' ? 2.5 : 2.8;
          mob.group.lookAt(playerPos.x, mob.position.y, playerPos.z);
          mob.group.rotateY(Math.PI); // Orient face forward towards player!

          // Attack player
          if (distToPlayer < 1.4 && now - mob.lastAttackTime > 1200) {
            mob.lastAttackTime = now;
            onPlayerDamage(3, mob.type === 'zombie' ? 'Был убит Зомби' : 'Был застрелен Скелетом');
            soundManager.playHit();
          }
        }
      } else {
        // Pig or Sheep
        if (mob.fleeTimer && mob.fleeTimer > 0) {
          mob.fleeTimer -= dt;
          moveDir.subVectors(mob.position, playerPos).setY(0).normalize();
          moveSpeed = 4.8;
          mob.group.lookAt(mob.position.x + moveDir.x, mob.position.y, mob.position.z + moveDir.z);
          mob.group.rotateY(Math.PI); // Orient face forward in flee direction!
        } else {
          if (Math.sin(now * 0.001 + parseFloat(mob.id)) > 0.35) {
            const wanderAngle = now * 0.0005 + parseFloat(mob.id);
            moveDir.set(Math.cos(wanderAngle), 0, Math.sin(wanderAngle)).normalize();
            moveSpeed = 1.0;
            mob.group.lookAt(mob.position.x + moveDir.x, mob.position.y, mob.position.z + moveDir.z);
            mob.group.rotateY(Math.PI); // Orient face forward in wander direction!
          }
        }
      }

      // Horizontal velocity
      if (moveSpeed > 0) {
        mob.velocity.x += (moveDir.x * moveSpeed - mob.velocity.x) * dt * 6.0;
        mob.velocity.z += (moveDir.z * moveSpeed - mob.velocity.z) * dt * 6.0;
        mob.walkCycle += dt * moveSpeed * 5.0;
      } else {
        mob.velocity.x *= Math.max(0, 1 - dt * 6.0);
        mob.velocity.z *= Math.max(0, 1 - dt * 6.0);
      }

      // Leg and arm animation
      const legSwing = Math.sin(mob.walkCycle) * 0.45;
      mob.leftLeg.rotation.x = legSwing;
      mob.rightLeg.rotation.x = -legSwing;
      if (mob.backLeftLeg && mob.backRightLeg) {
        mob.backLeftLeg.rotation.x = -legSwing;
        mob.backRightLeg.rotation.x = legSwing;
      }
      if (mob.leftArm && mob.rightArm && mob.type === 'zombie') {
        // Subtle zombie arm bobbing
        mob.leftArm.position.y = 1.25 + Math.sin(mob.walkCycle) * 0.04;
        mob.rightArm.position.y = 1.25 - Math.sin(mob.walkCycle) * 0.04;
      }

      // --- FULL AXIS-SEPARATED AABB COLLISION (No passing through walls!) ---
      const mobRadius = 0.35;
      const mobHeight = mob.type === 'zombie' || mob.type === 'skeleton' ? 1.8 : 0.8;

      // 1. Move X with wall collision
      const nextX = mob.position.x + mob.velocity.x * dt;
      let collidesX = false;
      const checkMinY = Math.floor(mob.position.y);
      const checkMaxY = Math.floor(mob.position.y + mobHeight);

      for (let y = checkMinY; y <= checkMaxY; y++) {
        for (let z = Math.floor(mob.position.z - mobRadius); z <= Math.floor(mob.position.z + mobRadius); z++) {
          const bx = Math.floor(nextX + (mob.velocity.x > 0 ? mobRadius : -mobRadius));
          if (world.isSolid(bx, y, z)) {
            collidesX = true;
            break;
          }
        }
        if (collidesX) break;
      }

      if (!collidesX) {
        mob.position.x = nextX;
      } else {
        // Obstacle jump over 1 block if space above is clear
        const stepY = Math.floor(mob.position.y);
        const wallX = Math.floor(nextX + (mob.velocity.x > 0 ? mobRadius : -mobRadius));
        const centerZ = Math.floor(mob.position.z);
        if (mob.isGrounded && world.isSolid(wallX, stepY, centerZ) && !world.isSolid(wallX, stepY + 1, centerZ) && !world.isSolid(wallX, stepY + 2, centerZ)) {
          mob.velocity.y = 5.8;
        } else {
          mob.velocity.x = 0;
        }
      }

      // 2. Move Z with wall collision
      const nextZ = mob.position.z + mob.velocity.z * dt;
      let collidesZ = false;

      for (let y = checkMinY; y <= checkMaxY; y++) {
        for (let x = Math.floor(mob.position.x - mobRadius); x <= Math.floor(mob.position.x + mobRadius); x++) {
          const bz = Math.floor(nextZ + (mob.velocity.z > 0 ? mobRadius : -mobRadius));
          if (world.isSolid(x, y, bz)) {
            collidesZ = true;
            break;
          }
        }
        if (collidesZ) break;
      }

      if (!collidesZ) {
        mob.position.z = nextZ;
      } else {
        const stepY = Math.floor(mob.position.y);
        const wallZ = Math.floor(nextZ + (mob.velocity.z > 0 ? mobRadius : -mobRadius));
        const centerX = Math.floor(mob.position.x);
        if (mob.isGrounded && world.isSolid(centerX, stepY, wallZ) && !world.isSolid(centerX, stepY + 1, wallZ) && !world.isSolid(centerX, stepY + 2, wallZ)) {
          mob.velocity.y = 5.8;
        } else {
          mob.velocity.z = 0;
        }
      }

      // 3. Move Y with Gravity & Ground collision
      mob.velocity.y -= 22.0 * dt;
      mob.position.y += mob.velocity.y * dt;

      const bx = Math.floor(mob.position.x);
      const bz = Math.floor(mob.position.z);
      const byUnder = Math.floor(mob.position.y - 0.05);

      if (world.isSolid(bx, byUnder, bz)) {
        mob.position.y = byUnder + 1;
        mob.velocity.y = 0;
        mob.isGrounded = true;
      } else {
        mob.isGrounded = false;
      }

      mob.group.position.copy(mob.position);
      alive.push(mob);
    }

    this.mobs = alive;
  }

  public clear(): void {
    for (const mob of this.mobs) {
      this.group.remove(mob.group);
    }
    this.mobs = [];
  }
}
