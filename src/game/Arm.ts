import * as THREE from 'three';
import { BLOCK_TYPE, type BlockType } from './constants';
import type { BlockMaterials } from './textures';

export class FirstPersonArm {
  public group: THREE.Group;
  private heldItemContainer: THREE.Group;
  private heldBlockMesh: THREE.Mesh | null = null;
  private heldToolGroup: THREE.Group | null = null;
  private heldBlockGeo: THREE.BoxGeometry;

  // Authentic Minecraft arm position: anchored in bottom-right corner, laid forward towards center
  private basePos = new THREE.Vector3(0.36, -0.30, -0.42);
  private baseRot = new THREE.Euler(-1.25, 0.38, -0.22);

  private swingProgress = 0;
  private isSwinging = false;
  private walkTime = 0;
  private isEating = false;
  private eatTime = 0;

  public setEating(eating: boolean): void {
    this.isEating = eating;
    if (!eating) this.eatTime = 0;
  }

  constructor() {
    this.group = new THREE.Group();
    this.heldItemContainer = new THREE.Group();
    this.heldBlockGeo = new THREE.BoxGeometry(0.20, 0.20, 0.20);

    const armWidth = 0.135;
    const armDepth = 0.135;

    // 1. Shoulder / Sleeve (Cyan shirt, height 0.14 at base)
    const sleeveGeo = new THREE.BoxGeometry(armWidth + 0.005, 0.14, armDepth + 0.005);
    const sleeveMat = new THREE.MeshLambertMaterial({ color: 0x008b8b });
    const sleeveMesh = new THREE.Mesh(sleeveGeo, sleeveMat);
    sleeveMesh.position.set(0, 0.07, 0);
    this.group.add(sleeveMesh);

    // 2. Hand / Forearm (Steve skin tone, height 0.28 extending forward)
    const handGeo = new THREE.BoxGeometry(armWidth, 0.28, armDepth);
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xc68658 });
    const handMesh = new THREE.Mesh(handGeo, skinMat);
    handMesh.position.set(0, 0.28, 0);
    this.group.add(handMesh);

    this.group.position.copy(this.basePos);
    this.group.rotation.copy(this.baseRot);

    // Hand anchor for held items and tools (at tip of hand)
    this.heldItemContainer.position.set(0, 0.40, 0);
    this.group.add(this.heldItemContainer);
  }

  /**
   * Builds authentic 3D Minecraft tool mesh (Pickaxe, Axe, Sword, Shovel)
   */
  private createToolMesh(blockType: BlockType): THREE.Group {
    const group = new THREE.Group();

    let headColor = 0xa67b46; // wood
    if (
      blockType === BLOCK_TYPE.STONE_PICKAXE ||
      blockType === BLOCK_TYPE.STONE_AXE
    ) {
      headColor = 0x828282;
    } else if (
      blockType === BLOCK_TYPE.IRON_PICKAXE ||
      blockType === BLOCK_TYPE.IRON_AXE ||
      blockType === BLOCK_TYPE.IRON_SHOVEL ||
      blockType === BLOCK_TYPE.IRON_SWORD
    ) {
      headColor = 0xe2e8f0; // shiny steel
    } else if (
      blockType === BLOCK_TYPE.GOLDEN_PICKAXE ||
      blockType === BLOCK_TYPE.GOLDEN_SWORD
    ) {
      headColor = 0xfbbf24; // gold
    } else if (
      blockType === BLOCK_TYPE.DIAMOND_PICKAXE ||
      blockType === BLOCK_TYPE.DIAMOND_AXE ||
      blockType === BLOCK_TYPE.DIAMOND_SWORD
    ) {
      headColor = 0x38bdf8; // diamond cyan
    }

    const headMat = new THREE.MeshLambertMaterial({ color: headColor });
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x6e4624 });

    // Handle stick
    const handleGeo = new THREE.BoxGeometry(0.032, 0.44, 0.032);
    const handleMesh = new THREE.Mesh(handleGeo, woodMat);
    handleMesh.position.set(0, 0.12, 0);
    group.add(handleMesh);

    // Pickaxe
    if (
      blockType === BLOCK_TYPE.WOODEN_PICKAXE ||
      blockType === BLOCK_TYPE.STONE_PICKAXE ||
      blockType === BLOCK_TYPE.IRON_PICKAXE ||
      blockType === BLOCK_TYPE.GOLDEN_PICKAXE ||
      blockType === BLOCK_TYPE.DIAMOND_PICKAXE
    ) {
      const headGeo = new THREE.BoxGeometry(0.26, 0.05, 0.04);
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.set(0, 0.32, 0);
      group.add(headMesh);

      const tipGeo = new THREE.BoxGeometry(0.04, 0.06, 0.04);
      const leftTip = new THREE.Mesh(tipGeo, headMat);
      leftTip.position.set(-0.11, 0.28, 0);
      const rightTip = new THREE.Mesh(tipGeo, headMat);
      rightTip.position.set(0.11, 0.28, 0);
      group.add(leftTip, rightTip);
    }
    // Axe
    else if (
      blockType === BLOCK_TYPE.WOODEN_AXE ||
      blockType === BLOCK_TYPE.STONE_AXE ||
      blockType === BLOCK_TYPE.IRON_AXE ||
      blockType === BLOCK_TYPE.DIAMOND_AXE
    ) {
      const bladeGeo = new THREE.BoxGeometry(0.12, 0.14, 0.04);
      const bladeMesh = new THREE.Mesh(bladeGeo, headMat);
      bladeMesh.position.set(0.06, 0.28, 0);
      group.add(bladeMesh);
    }
    // Shovel
    else if (
      blockType === BLOCK_TYPE.WOODEN_SHOVEL ||
      blockType === BLOCK_TYPE.IRON_SHOVEL
    ) {
      const bladeGeo = new THREE.BoxGeometry(0.09, 0.13, 0.03);
      const bladeMesh = new THREE.Mesh(bladeGeo, headMat);
      bladeMesh.position.set(0, 0.32, 0);
      group.add(bladeMesh);
    }
    // Sword
    else if (
      blockType === BLOCK_TYPE.WOODEN_SWORD ||
      blockType === BLOCK_TYPE.IRON_SWORD ||
      blockType === BLOCK_TYPE.GOLDEN_SWORD ||
      blockType === BLOCK_TYPE.DIAMOND_SWORD
    ) {
      const guardGeo = new THREE.BoxGeometry(0.14, 0.035, 0.04);
      const guardMesh = new THREE.Mesh(guardGeo, woodMat);
      guardMesh.position.set(0, 0.15, 0);
      group.add(guardMesh);

      const bladeGeo = new THREE.BoxGeometry(0.055, 0.42, 0.03);
      const bladeMesh = new THREE.Mesh(bladeGeo, headMat);
      bladeMesh.position.set(0, 0.36, 0);
      group.add(bladeMesh);
    }

    group.rotation.set(0.15, 0.1, -0.2);
    group.position.set(0, 0, -0.02);
    return group;
  }

  /**
   * Builds authentic 3D held item models for meat, bones, ingots, diamonds
   */
  private createItemMesh(blockType: BlockType): THREE.Group {
    const group = new THREE.Group();

    if (blockType === BLOCK_TYPE.RAW_PORKCHOP) {
      const meatGeo = new THREE.BoxGeometry(0.15, 0.18, 0.04);
      const meatMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });
      const meat = new THREE.Mesh(meatGeo, meatMat);

      const fatGeo = new THREE.BoxGeometry(0.04, 0.18, 0.042);
      const fatMat = new THREE.MeshLambertMaterial({ color: 0xfecaca });
      const fat = new THREE.Mesh(fatGeo, fatMat);
      fat.position.set(-0.06, 0, 0);

      const boneGeo = new THREE.BoxGeometry(0.03, 0.03, 0.044);
      const boneMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const bone = new THREE.Mesh(boneGeo, boneMat);
      bone.position.set(0.02, 0.02, 0);

      group.add(meat, fat, bone);
    } else if (blockType === BLOCK_TYPE.COOKED_PORKCHOP) {
      const meatGeo = new THREE.BoxGeometry(0.15, 0.18, 0.04);
      const meatMat = new THREE.MeshLambertMaterial({ color: 0x92400e });
      const meat = new THREE.Mesh(meatGeo, meatMat);

      const crustGeo = new THREE.BoxGeometry(0.11, 0.12, 0.042);
      const crustMat = new THREE.MeshLambertMaterial({ color: 0xd97706 });
      const crust = new THREE.Mesh(crustGeo, crustMat);

      group.add(meat, crust);
    } else if (blockType === BLOCK_TYPE.ROTTEN_FLESH) {
      const fleshGeo = new THREE.BoxGeometry(0.16, 0.16, 0.04);
      const fleshMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
      const flesh = new THREE.Mesh(fleshGeo, fleshMat);

      const rotGeo = new THREE.BoxGeometry(0.06, 0.06, 0.042);
      const rotMat = new THREE.MeshLambertMaterial({ color: 0x3d6322 });
      const rot = new THREE.Mesh(rotGeo, rotMat);
      rot.position.set(-0.03, 0.03, 0);

      group.add(flesh, rot);
    } else if (blockType === BLOCK_TYPE.BONE) {
      const shaftGeo = new THREE.BoxGeometry(0.04, 0.32, 0.04);
      const boneMat = new THREE.MeshLambertMaterial({ color: 0xf3f4f6 });
      const shaft = new THREE.Mesh(shaftGeo, boneMat);

      const topKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.045), boneMat);
      topKnuckle.position.set(0, 0.15, 0);
      const btmKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.045), boneMat);
      btmKnuckle.position.set(0, -0.15, 0);

      group.add(shaft, topKnuckle, btmKnuckle);
    } else if (blockType === BLOCK_TYPE.IRON_INGOT || blockType === BLOCK_TYPE.GOLD_INGOT) {
      const isGold = blockType === BLOCK_TYPE.GOLD_INGOT;
      const ingotGeo = new THREE.BoxGeometry(0.14, 0.06, 0.22);
      const ingotMat = new THREE.MeshLambertMaterial({ color: isGold ? 0xfbbf24 : 0xe2e8f0 });
      const ingot = new THREE.Mesh(ingotGeo, ingotMat);
      group.add(ingot);
    } else if (blockType === BLOCK_TYPE.DIAMOND) {
      const gemGeo = new THREE.OctahedronGeometry(0.09, 0);
      const gemMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });
      const gem = new THREE.Mesh(gemGeo, gemMat);
      group.add(gem);
    } else if (blockType === BLOCK_TYPE.COAL) {
      const coalGeo = new THREE.DodecahedronGeometry(0.08, 0);
      const coalMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      const coal = new THREE.Mesh(coalGeo, coalMat);
      group.add(coal);
    }

    group.rotation.set(0.15, 0.1, -0.2);
    group.position.set(0, 0, -0.02);
    return group;
  }

  public setHeldBlock(blockType: BlockType, materials: BlockMaterials): void {
    if (this.heldBlockMesh) {
      this.heldItemContainer.remove(this.heldBlockMesh);
      this.heldBlockMesh = null;
    }
    if (this.heldToolGroup) {
      this.heldItemContainer.remove(this.heldToolGroup);
      this.heldToolGroup = null;
    }

    if (blockType === BLOCK_TYPE.AIR) return;

    const isTool =
      blockType === BLOCK_TYPE.WOODEN_PICKAXE ||
      blockType === BLOCK_TYPE.STONE_PICKAXE ||
      blockType === BLOCK_TYPE.IRON_PICKAXE ||
      blockType === BLOCK_TYPE.GOLDEN_PICKAXE ||
      blockType === BLOCK_TYPE.DIAMOND_PICKAXE ||
      blockType === BLOCK_TYPE.WOODEN_AXE ||
      blockType === BLOCK_TYPE.STONE_AXE ||
      blockType === BLOCK_TYPE.IRON_AXE ||
      blockType === BLOCK_TYPE.DIAMOND_AXE ||
      blockType === BLOCK_TYPE.WOODEN_SHOVEL ||
      blockType === BLOCK_TYPE.IRON_SHOVEL ||
      blockType === BLOCK_TYPE.WOODEN_SWORD ||
      blockType === BLOCK_TYPE.IRON_SWORD ||
      blockType === BLOCK_TYPE.GOLDEN_SWORD ||
      blockType === BLOCK_TYPE.DIAMOND_SWORD ||
      blockType === BLOCK_TYPE.STICK;

    const isSpecialItem =
      blockType === BLOCK_TYPE.RAW_PORKCHOP ||
      blockType === BLOCK_TYPE.COOKED_PORKCHOP ||
      blockType === BLOCK_TYPE.ROTTEN_FLESH ||
      blockType === BLOCK_TYPE.BONE ||
      blockType === BLOCK_TYPE.COAL ||
      blockType === BLOCK_TYPE.IRON_INGOT ||
      blockType === BLOCK_TYPE.GOLD_INGOT ||
      blockType === BLOCK_TYPE.DIAMOND;

    if (isTool) {
      this.heldToolGroup = this.createToolMesh(blockType);
      this.heldItemContainer.add(this.heldToolGroup);
    } else if (isSpecialItem) {
      this.heldToolGroup = this.createItemMesh(blockType);
      this.heldItemContainer.add(this.heldToolGroup);
    } else {
      const mat = materials.materialsByBlock[blockType];
      if (!mat) return;
      this.heldBlockMesh = new THREE.Mesh(this.heldBlockGeo, mat);
      this.heldBlockMesh.rotation.set(0.2, 0.4, -0.1);
      this.heldBlockMesh.position.set(0, -0.04, -0.02);
      this.heldItemContainer.add(this.heldBlockMesh);
    }
  }

  public triggerSwing(): void {
    if (!this.isSwinging) {
      this.isSwinging = true;
      this.swingProgress = 0;
    }
  }

  public update(dt: number, isMoving: boolean, isMining: boolean): void {
    if (this.isEating) {
      this.eatTime += dt;
      // Minecraft eating animation: held food moves to mouth and vigorously bobs & shakes
      const munch = Math.sin(this.eatTime * 36) * 0.028;
      const munchRotX = Math.sin(this.eatTime * 36) * 0.15;
      const munchRotZ = Math.cos(this.eatTime * 36) * 0.08;

      this.group.position.set(
        this.basePos.x - 0.12,
        this.basePos.y + 0.10 + munch,
        this.basePos.z + 0.10
      );

      this.group.rotation.set(
        this.baseRot.x + 0.38 + munchRotX,
        this.baseRot.y - 0.22,
        this.baseRot.z + munchRotZ
      );
      return;
    }

    if (isMining) {
      this.isSwinging = true;
    }

    if (this.isSwinging) {
      const swingSpeed = 8.5;
      this.swingProgress += dt * swingSpeed;
      if (this.swingProgress >= 1.0) {
        if (isMining) {
          this.swingProgress = 0;
        } else {
          this.isSwinging = false;
          this.swingProgress = 0;
        }
      }
    }

    if (isMoving) {
      this.walkTime += dt * 9.0;
    } else {
      this.walkTime += dt * 1.5;
    }

    const bobX = Math.cos(this.walkTime) * 0.015;
    const bobY = Math.abs(Math.sin(this.walkTime)) * 0.022;

    const strike = Math.sin(Math.sqrt(this.swingProgress) * Math.PI);
    const returnSwing = Math.sin(this.swingProgress * Math.PI);

    // Classic Minecraft forward swing towards target block
    const swingRotX = -strike * 0.45;
    const swingRotY = returnSwing * 0.35;
    const swingRotZ = -strike * 0.25;

    const swingPosX = -strike * 0.05;
    const swingPosY = -returnSwing * 0.04;
    const swingPosZ = -strike * 0.10;

    this.group.position.set(
      this.basePos.x + bobX + swingPosX,
      this.basePos.y - bobY + swingPosY,
      this.basePos.z + swingPosZ
    );

    this.group.rotation.set(
      this.baseRot.x + swingRotX,
      this.baseRot.y + swingRotY,
      this.baseRot.z + swingRotZ
    );
  }
}
