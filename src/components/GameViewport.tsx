import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { World } from '../game/World';
import { PlayerPhysics } from '../game/Physics';
import { InputManager } from '../game/InputManager';
import { ParticleSystem } from '../game/Particles';
import { CloudLayer } from '../game/Clouds';
import { FirstPersonArm } from '../game/Arm';
import { Inventory } from '../game/Inventory';
import { ItemDropManager } from '../game/ItemDrops';
import { DayNightCycle } from '../game/DayNightCycle';
import { MobManager } from '../game/MobManager';
import { BLOCK_TYPE, type BlockType, BLOCK_HARDNESS, CONTROLS_CONFIG } from '../game/constants';
import { soundManager } from '../game/SoundManager';
import { Crosshair } from './Crosshair';
import { DebugHUD } from './DebugHUD';
import { TouchControls } from './TouchControls';
import { Hotbar } from './Hotbar';
import { SurvivalHUD } from './SurvivalHUD';
import { InventoryGUI } from './InventoryGUI';
import { FurnaceGUI } from './FurnaceGUI';
import { MainMenu } from './MainMenu';
import { SettingsModal, type FogDistanceOption } from './SettingsModal';

// Preserves player position and camera angles across Hot Module Reloads (HMR)
let persistentPlayerPos: { x: number; y: number; z: number } | null = null;
let persistentYaw = 0;
let persistentPitch = 0;

export const GameViewport: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Core Game Systems refs
  const worldRef = useRef<World | null>(null);
  const physicsRef = useRef<PlayerPhysics | null>(null);
  const inputManagerRef = useRef<InputManager>(new InputManager());
  const particlesRef = useRef<ParticleSystem | null>(null);
  const cloudsRef = useRef<CloudLayer | null>(null);
  const armRef = useRef<FirstPersonArm | null>(null);
  const inventoryRef = useRef<Inventory>(new Inventory());
  const itemDropManagerRef = useRef<ItemDropManager>(new ItemDropManager());
  const dayNightCycleRef = useRef<DayNightCycle>(new DayNightCycle());
  const mobManagerRef = useRef<MobManager>(new MobManager());

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const targetOutlineRef = useRef<THREE.LineSegments | null>(null);
  const crackMeshRef = useRef<THREE.Mesh | null>(null);
  const crackMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);

  // Game state
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const gameStateRef = useRef<'menu' | 'playing'>('menu');

  // Survival state: Health, Hunger, Death
  const [health, setHealth] = useState(20);
  const healthRef = useRef(20);
  const [hunger, setHunger] = useState(20);
  const hungerRef = useRef(20);
  const [isHurt, setIsHurt] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [deathCause, setDeathCause] = useState('Вы погибли!');

  // Inventory & Crafting GUI state
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const isInventoryOpenRef = useRef(false);
  const [inventoryMode, setInventoryMode] = useState<'2x2' | '3x3'>('2x2');

  // Furnace GUI state
  const [isFurnaceOpen, setIsFurnaceOpen] = useState(false);
  const isFurnaceOpenRef = useRef(false);

  // Random world seed on fresh start
  const [currentSeed, setCurrentSeed] = useState(() =>
    Math.floor(Math.random() * 899999 + 100000)
  );
  const [, setInventoryVersion] = useState(0);

  // UI state
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [fps, setFps] = useState(60);
  const [coords, setCoords] = useState({ x: 0, y: 0, z: 0 });
  const [yawAngle, setYawAngle] = useState(0);
  const [lookingAt, setLookingAt] = useState<{
    x: number;
    y: number;
    z: number;
    type: string;
  } | null>(null);

  const [blockIcons, setBlockIcons] = useState<Record<BlockType, string> | undefined>(undefined);
  const [biome, setBiome] = useState('Равнины (Plains)');
  const [isMusicMuted, setIsMusicMuted] = useState(soundManager.isMusicMuted);

  const handleToggleMusic = useCallback(() => {
    soundManager.toggleMusic();
    setIsMusicMuted(soundManager.isMusicMuted);
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current !== null) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Settings & Options State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isSettingsOpenRef = useRef(false);
  isSettingsOpenRef.current = isSettingsOpen;

  const [fogDistance, setFogDistance] = useState<FogDistanceOption>('normal');
  const [isFogEnabled, setIsFogEnabled] = useState(true);
  const [fov, setFov] = useState(75);
  const [sensitivity, setSensitivity] = useState(1.0);
  const [isSoundMuted, setIsSoundMuted] = useState(soundManager.isSoundMuted);

  const applyFogSettings = useCallback((dist: FogDistanceOption, enabled: boolean) => {
    const scene = sceneRef.current;
    if (!scene || !scene.fog) return;
    const fog = scene.fog as THREE.Fog;
    if (!enabled) {
      fog.near = 500;
      fog.far = 1000;
      return;
    }
    switch (dist) {
      case 'tiny':
        fog.near = 10;
        fog.far = 28;
        break;
      case 'short':
        fog.near = 18;
        fog.far = 44;
        break;
      case 'normal':
        fog.near = 28;
        fog.far = 62;
        break;
      case 'far':
        fog.near = 45;
        fog.far = 92;
        break;
    }
  }, []);

  const wasGroundedRef = useRef(true);
  const lastHitSoundTimeRef = useRef(0);

  // Targeted block ray info
  const targetRayRef = useRef<{
    hit: boolean;
    blockPos?: THREE.Vector3;
    placePos?: THREE.Vector3;
    blockType?: BlockType;
  }>({ hit: false });

  // Mining / breaking animation refs
  const isMiningRef = useRef(false);
  const miningProgressRef = useRef(0);
  const miningTargetRef = useRef<THREE.Vector3 | null>(null);

  // Auto-detect mobile devices
  useEffect(() => {
    const isTouch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth < 768;
    setIsMobileMode(isTouch);
  }, []);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    isInventoryOpenRef.current = isInventoryOpen;
  }, [isInventoryOpen]);

  useEffect(() => {
    isFurnaceOpenRef.current = isFurnaceOpen;
  }, [isFurnaceOpen]);

  // Damage handler
  const handleTakeDamage = useCallback((amount: number, cause = 'Вы погибли!') => {
    if (healthRef.current <= 0) return;
    healthRef.current = Math.max(0, healthRef.current - amount);
    setHealth(healthRef.current);
    setIsHurt(true);
    setTimeout(() => setIsHurt(false), 260);
    soundManager.playHit();

    if (healthRef.current <= 0) {
      setIsDead(true);
      setDeathCause(cause);
      inputManagerRef.current.releasePointerLock();
    }
  }, []);

  const handleRespawn = useCallback(() => {
    healthRef.current = 20;
    hungerRef.current = 20;
    setHealth(20);
    setHunger(20);
    setIsDead(false);
    if (worldRef.current && physicsRef.current) {
      physicsRef.current.teleport(worldRef.current.getSpawnPoint());
    }
    if (!isMobileMode) {
      inputManagerRef.current.requestPointerLock();
    }
  }, [isMobileMode]);

  // Food Eating & Hunger Refs
  const isEatingRef = useRef(false);
  const eatProgressRef = useRef(0);
  const lastBiteSoundRef = useRef(0);
  const starvationTimerRef = useRef(0);
  const regenTimerRef = useRef(0);

  const startEating = useCallback(() => {
    if (gameStateRef.current !== 'playing' || isInventoryOpenRef.current || isFurnaceOpenRef.current || healthRef.current <= 0) return;
    const inventory = inventoryRef.current;
    const held = inventory.getSelectedBlockType();
    if (!Inventory.isFood(held)) return;
    if (hungerRef.current >= 20) {
      showToast('Вы сыты!');
      return;
    }
    isEatingRef.current = true;
    eatProgressRef.current = 0;
    lastBiteSoundRef.current = performance.now();
    if (armRef.current) {
      armRef.current.setEating(true);
    }
    soundManager.playEatBite();
  }, [showToast]);

  const stopEating = useCallback(() => {
    if (isEatingRef.current) {
      isEatingRef.current = false;
      eatProgressRef.current = 0;
      if (armRef.current) {
        armRef.current.setEating(false);
      }
    }
  }, []);

  // Place block or interact with Furnace / Crafting Table
  const placeBlock = useCallback(() => {
    if (gameStateRef.current !== 'playing' || isInventoryOpenRef.current || isFurnaceOpenRef.current || healthRef.current <= 0) return;
    const world = worldRef.current;
    const physics = physicsRef.current;
    const arm = armRef.current;
    const inventory = inventoryRef.current;
    const hit = targetRayRef.current;
    if (!world || !physics) return;

    if (!hit.hit || !hit.placePos) return;

    // 2. Right click on Furnace opens Furnace GUI!
    if (hit.blockType === BLOCK_TYPE.FURNACE) {
      setIsFurnaceOpen(true);
      inputManagerRef.current.releasePointerLock();
      return;
    }

    // 3. Right click on Crafting Table opens 3x3 Crafting GUI!
    if (hit.blockType === BLOCK_TYPE.CRAFTING_TABLE) {
      setInventoryMode('3x3');
      setIsInventoryOpen(true);
      inputManagerRef.current.releasePointerLock();
      return;
    }

    const blockToPlace = inventory.getSelectedBlockType();
    const isNonPlaceable =
      blockToPlace === BLOCK_TYPE.AIR ||
      blockToPlace === BLOCK_TYPE.STICK ||
      blockToPlace === BLOCK_TYPE.COAL ||
      blockToPlace === BLOCK_TYPE.IRON_INGOT ||
      blockToPlace === BLOCK_TYPE.GOLD_INGOT ||
      blockToPlace === BLOCK_TYPE.DIAMOND ||
      blockToPlace === BLOCK_TYPE.WOODEN_PICKAXE ||
      blockToPlace === BLOCK_TYPE.STONE_PICKAXE ||
      blockToPlace === BLOCK_TYPE.IRON_PICKAXE ||
      blockToPlace === BLOCK_TYPE.GOLDEN_PICKAXE ||
      blockToPlace === BLOCK_TYPE.DIAMOND_PICKAXE ||
      blockToPlace === BLOCK_TYPE.WOODEN_AXE ||
      blockToPlace === BLOCK_TYPE.STONE_AXE ||
      blockToPlace === BLOCK_TYPE.IRON_AXE ||
      blockToPlace === BLOCK_TYPE.DIAMOND_AXE ||
      blockToPlace === BLOCK_TYPE.WOODEN_SHOVEL ||
      blockToPlace === BLOCK_TYPE.IRON_SHOVEL ||
      blockToPlace === BLOCK_TYPE.WOODEN_SWORD ||
      blockToPlace === BLOCK_TYPE.IRON_SWORD ||
      blockToPlace === BLOCK_TYPE.GOLDEN_SWORD ||
      blockToPlace === BLOCK_TYPE.DIAMOND_SWORD ||
      blockToPlace === BLOCK_TYPE.RAW_PORKCHOP ||
      blockToPlace === BLOCK_TYPE.COOKED_PORKCHOP ||
      blockToPlace === BLOCK_TYPE.ROTTEN_FLESH ||
      blockToPlace === BLOCK_TYPE.BONE ||
      blockToPlace === BLOCK_TYPE.BEDROCK;

    if (isNonPlaceable) return;

    // Check player AABB collision
    const pX = physics.position.x;
    const pY = physics.position.y;
    const pZ = physics.position.z;
    const r = 0.3;
    const h = 1.8;

    const bx = hit.placePos.x;
    const by = hit.placePos.y;
    const bz = hit.placePos.z;

    const overlapsPlayer =
      pX + r > bx &&
      pX - r < bx + 1 &&
      pY + h > by &&
      pY < by + 1 &&
      pZ + r > bz &&
      pZ - r < bz + 1;

    if (overlapsPlayer) return;

    if (world.setBlock(bx, by, bz, blockToPlace)) {
      inventory.consumeSelected();
      setInventoryVersion((v) => v + 1);
      if (arm) {
        arm.triggerSwing();
        arm.setHeldBlock(inventory.getSelectedBlockType(), world.materials);
      }
      soundManager.playPlace();
    }
  }, []);

  const attackMobInFront = useCallback((): boolean => {
    const mobManager = mobManagerRef.current;
    const camera = cameraRef.current;
    const world = worldRef.current;
    const inventory = inventoryRef.current;
    if (!camera || !world) return false;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    for (const mob of mobManager.mobs) {
      if (mob.position.distanceTo(camera.position) < 3.8) {
        const dir = mob.position.clone().sub(camera.position).normalize();
        if (forward.dot(dir) > 0.82) {
          const held = inventory.getSelectedBlockType();
          let dmg = 4;
          if (held === BLOCK_TYPE.WOODEN_SWORD) dmg = 7;
          else if (held === BLOCK_TYPE.IRON_SWORD) dmg = 12;
          else if (held === BLOCK_TYPE.GOLDEN_SWORD) dmg = 9;
          else if (held === BLOCK_TYPE.DIAMOND_SWORD) dmg = 18;
          else if (held === BLOCK_TYPE.WOODEN_AXE || held === BLOCK_TYPE.STONE_AXE) dmg = 6;
          else if (held === BLOCK_TYPE.IRON_AXE || held === BLOCK_TYPE.DIAMOND_AXE) dmg = 10;

          mobManager.hitMob(mob, dmg, forward, itemDropManagerRef.current, world.materials);
          armRef.current?.triggerSwing();

          // Weapon durability reduction
          if (inventory.damageHeldTool() && armRef.current) {
            armRef.current.setHeldBlock(BLOCK_TYPE.AIR, world.materials);
          }
          setInventoryVersion((v) => v + 1);
          return true;
        }
      }
    }
    return false;
  }, []);

  const startMining = useCallback(() => {
    if (gameStateRef.current !== 'playing' || isInventoryOpenRef.current || isFurnaceOpenRef.current || healthRef.current <= 0) return;
    if (attackMobInFront()) return;
    isMiningRef.current = true;
  }, [attackMobInFront]);

  const stopMining = useCallback(() => {
    isMiningRef.current = false;
    miningProgressRef.current = 0;
    miningTargetRef.current = null;
    if (crackMeshRef.current) crackMeshRef.current.visible = false;
  }, []);

  const handleStartGame = useCallback(() => {
    setGameState('playing');
    gameStateRef.current = 'playing';
    soundManager.startMusicScheduler();
    if (!isMobileMode) {
      inputManagerRef.current.requestPointerLock();
    }
  }, [isMobileMode]);

  const handleRegenerateWorld = useCallback((newSeed: number) => {
    setCurrentSeed(newSeed);
    itemDropManagerRef.current.clear();
    mobManagerRef.current.clear();
    worldRef.current?.resetSeed(newSeed);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Setup Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const skyColor = new THREE.Color(0x62b0ff);
    scene.background = skyColor;
    scene.fog = new THREE.Fog(skyColor, 28, 62);

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.rotation.order = 'YXZ';
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Setup Day/Night Cycle with Dynamic Lights
    const dayNightCycle = dayNightCycleRef.current;
    scene.add(dayNightCycle.group);
    scene.add(dayNightCycle.sunLight);
    scene.add(dayNightCycle.ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xbfdbfe, 0x86efac, 0.55);
    scene.add(hemiLight);

    // 3. Setup Procedural Clouds
    const clouds = new CloudLayer();
    cloudsRef.current = clouds;
    scene.add(clouds.group);

    // 4. Setup Animated First-Person Arm
    const arm = new FirstPersonArm();
    armRef.current = arm;
    camera.add(arm.group);
    scene.add(camera);

    // 5. Setup Voxel Particle System
    const particles = new ParticleSystem();
    particlesRef.current = particles;
    scene.add(particles.group);

    // 6. Setup 3D Item Drops System
    const itemDropManager = itemDropManagerRef.current;
    scene.add(itemDropManager.group);

    // 7. Setup Mobs Manager (Zombies, Skeletons, Pigs, Sheep)
    const mobManager = mobManagerRef.current;
    scene.add(mobManager.group);

    // 8. Setup Infinite Voxel World
    const world = new World(currentSeed);
    worldRef.current = world;
    scene.add(world.group);
    setBlockIcons(world.materials.blockIcons);

    const inventory = inventoryRef.current;
    arm.setHeldBlock(inventory.getSelectedBlockType(), world.materials);

    // 9. Setup Input Manager
    const inputManager = inputManagerRef.current;
    inputManager.init(renderer.domElement);
    inputManager.onPointerLockChange = (locked) => {
      setIsPointerLocked(locked);
      if (!locked) {
        stopMining();
      }
    };

    // 10. Setup Player Physics & Safe Spawn
    let spawnPos = world.getSpawnPoint();
    if (persistentPlayerPos) {
      spawnPos = new THREE.Vector3(
        persistentPlayerPos.x,
        persistentPlayerPos.y,
        persistentPlayerPos.z
      );
    }
    const physics = new PlayerPhysics(world, spawnPos);
    physics.onFallDamage = (dmg) => {
      handleTakeDamage(dmg, 'Разбился при падении с высоты');
    };
    physicsRef.current = physics;
    inputManager.yaw = persistentYaw;
    inputManager.pitch = persistentPitch;
    camera.position.copy(physics.getEyePosition());

    // 11. Target Outline Box
    const boxEdges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const targetOutline = new THREE.LineSegments(boxEdges, lineMat);
    targetOutline.visible = false;
    scene.add(targetOutline);
    targetOutlineRef.current = targetOutline;

    // 12. Crack Overlay Mesh
    const crackMat = new THREE.MeshBasicMaterial({
      map: world.materials.crackTextures[0],
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    crackMaterialRef.current = crackMat;
    const crackMesh = new THREE.Mesh(new THREE.BoxGeometry(1.004, 1.004, 1.004), crackMat);
    crackMesh.visible = false;
    scene.add(crackMesh);
    crackMeshRef.current = crackMesh;

    // 13. Mouse & Keyboard event listeners for PC
    const handleMouseDown = (e: MouseEvent) => {
      if (gameStateRef.current !== 'playing' || isInventoryOpenRef.current || isFurnaceOpenRef.current || healthRef.current <= 0) return;
      soundManager.startMusicScheduler();
      if (!inputManager.isPointerLocked && !isMobileMode) {
        inputManager.requestPointerLock();
        return;
      }
      if (e.button === 0) {
        if (attackMobInFront()) return;
        startMining();
      } else if (e.button === 2) {
        const held = inventory.getSelectedBlockType();
        if (Inventory.isFood(held)) {
          startEating();
        } else {
          placeBlock();
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        stopMining();
      } else if (e.button === 2) {
        stopEating();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('contextmenu', handleContextMenu);

    // Keyboard controls: 1-9 for slots, 'E' for inventory, 'Escape' for settings
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current !== 'playing' || healthRef.current <= 0) return;

      if (e.code === 'Escape') {
        e.preventDefault();
        if (isInventoryOpenRef.current) {
          setIsInventoryOpen(false);
          inputManager.requestPointerLock();
          return;
        }
        if (isFurnaceOpenRef.current) {
          setIsFurnaceOpen(false);
          inputManager.requestPointerLock();
          return;
        }
        setIsSettingsOpen((prev) => {
          const next = !prev;
          if (next) {
            inputManager.releasePointerLock();
          } else {
            inputManager.requestPointerLock();
          }
          return next;
        });
        return;
      }

      if (e.code === 'KeyE') {
        e.preventDefault();
        if (isFurnaceOpenRef.current) {
          setIsFurnaceOpen(false);
          inputManager.requestPointerLock();
          return;
        }
        setIsInventoryOpen((prev) => {
          const next = !prev;
          if (next) {
            setInventoryMode('2x2');
            inputManager.releasePointerLock();
          } else {
            inputManager.requestPointerLock();
          }
          return next;
        });
        return;
      }

      if (isInventoryOpenRef.current || isFurnaceOpenRef.current || isSettingsOpenRef.current) return;

      if (e.code >= 'Digit1' && e.code <= 'Digit9') {
        const idx = parseInt(e.code.replace('Digit', ''), 10) - 1;
        if (idx >= 0 && idx < 9) {
          inventory.selectedIndex = idx;
          setInventoryVersion((v) => v + 1);
          arm.setHeldBlock(inventory.getSelectedBlockType(), world.materials);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // 14. Main Game Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = lastTime;
    let lastHudUpdate = lastTime;
    let panoramaAngle = 0;
    const forwardVector = new THREE.Vector3();

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // MENU MODE: 3D ROTATING PANORAMA
      if (gameStateRef.current === 'menu') {
        panoramaAngle += dt * 0.05;
        camera.position.set(
          Math.cos(panoramaAngle) * 45,
          24,
          Math.sin(panoramaAngle) * 45
        );
        camera.lookAt(0, 16, 0);
        clouds.update(dt, camera.position);
        world.updatePlayerPosition(camera.position.x, camera.position.z);
        renderer.render(scene, camera);
        return;
      }

      // PLAYING MODE
      frameCount++;
      if (time - lastFpsUpdate >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastFpsUpdate = time;
      }

      // Day / Night Cycle
      dayNightCycle.update(dt, camera.position, scene);

      const isLockedUI =
        isInventoryOpenRef.current ||
        isFurnaceOpenRef.current ||
        isSettingsOpenRef.current ||
        healthRef.current <= 0;

      if (!isLockedUI) {
        inputManager.updateLook();
      }
      camera.rotation.y = inputManager.yaw;
      camera.rotation.x = inputManager.pitch;

      const movement = isLockedUI
        ? { forward: 0, right: 0 }
        : inputManager.getMovementInput();
      const canSprint = hungerRef.current > 6;
      const isJumping = !isLockedUI && inputManager.isJumping();
      const isSprinting = !isLockedUI && inputManager.isSprinting() && canSprint;

      // Update Player Physics
      physics.update(dt, movement, inputManager.yaw, isJumping, isSprinting);
      camera.position.copy(physics.getEyePosition());

      // Audio: Footsteps & Jumps
      const isMoving = (Math.abs(movement.forward) > 0 || Math.abs(movement.right) > 0) && physics.isGrounded;
      if (isMoving) {
        soundManager.playStep(isSprinting);
      }
      if (physics.isGrounded && !wasGroundedRef.current && isJumping) {
        soundManager.playJump();
        // Jump hunger cost (rebalanced)
        hungerRef.current = Math.max(0, hungerRef.current - 0.008);
      }
      wasGroundedRef.current = physics.isGrounded;

      // Hunger depletion over time (Comfortable and balanced drain)
      const hungerDrain = isSprinting ? dt * 0.025 : isMoving ? dt * 0.006 : dt * 0.0012;
      hungerRef.current = Math.max(0, hungerRef.current - hungerDrain);
      setHunger(Math.round(hungerRef.current * 10) / 10);

      // Starvation damage when hunger is 0
      if (hungerRef.current <= 0) {
        starvationTimerRef.current += dt;
        if (starvationTimerRef.current >= 4.0) {
          starvationTimerRef.current = 0;
          handleTakeDamage(1, 'Умер от голода');
        }
      } else {
        starvationTimerRef.current = 0;
      }

      // Natural regeneration when hunger >= 18 and health < 20
      if (hungerRef.current >= 18 && healthRef.current < 20 && healthRef.current > 0) {
        regenTimerRef.current += dt;
        if (regenTimerRef.current >= 3.5) {
          regenTimerRef.current = 0;
          healthRef.current = Math.min(20, healthRef.current + 1);
          setHealth(healthRef.current);
          hungerRef.current = Math.max(0, hungerRef.current - 0.15);
          setHunger(Math.round(hungerRef.current * 10) / 10);
        }
      } else {
        regenTimerRef.current = 0;
      }

      // Update Food Eating (Holding Right-Click / Touch button)
      if (isEatingRef.current && !isLockedUI) {
        const held = inventory.getSelectedBlockType();
        if (!Inventory.isFood(held)) {
          stopEating();
        } else {
          eatProgressRef.current += dt;

          // Crunch bite sound every 240ms
          if (time - lastBiteSoundRef.current >= 240) {
            soundManager.playEatBite();
            lastBiteSoundRef.current = time;

            // Emit food crumb particles in front of camera
            const crumbPos = camera.position
              .clone()
              .add(forwardVector.clone().multiplyScalar(0.45))
              .add(new THREE.Vector3(0, -0.15, 0));
            particles.emitBlockBreak(crumbPos, held);
          }

          // Completed eating! (1.5 seconds)
          if (eatProgressRef.current >= 1.5) {
            isEatingRef.current = false;
            eatProgressRef.current = 0;
            arm.setEating(false);
            soundManager.playBurp();

            const nutrition = Inventory.getFoodNutrition(held);
            inventory.consumeSelected();
            hungerRef.current = Math.min(20, hungerRef.current + nutrition);
            if (held === BLOCK_TYPE.COOKED_PORKCHOP) {
              healthRef.current = Math.min(20, healthRef.current + 2);
              setHealth(healthRef.current);
            }
            setHunger(Math.round(hungerRef.current * 10) / 10);
            setInventoryVersion((v) => v + 1);
            arm.setHeldBlock(inventory.getSelectedBlockType(), world.materials);
          }
        }
      }

      // Update Particles
      particles.update(dt);

      // Update Infinite World Chunks around player
      world.updatePlayerPosition(camera.position.x, camera.position.z);

      // Update 3D Item Drops (Magnet Attraction)
      itemDropManager.update(dt, physics.position, world, (dropType) => {
        const added = inventory.addItem(dropType, 1);
        if (added) {
          soundManager.playPlace();
          setInventoryVersion((v) => v + 1);
          arm.setHeldBlock(inventory.getSelectedBlockType(), world.materials);
        }
        return added;
      });

      // Update Mobs (Zombies, Skeletons, Pigs, Sheep)
      mobManager.update(dt, physics.position, dayNightCycle.isNight, world, (dmg, cause) => {
        handleTakeDamage(dmg, cause);
      });

      // Update Clouds
      clouds.update(dt, camera.position);

      // Raycast to find targeted voxel
      camera.getWorldDirection(forwardVector);
      const hit = world.raycast(camera.position, forwardVector, 5.5);
      targetRayRef.current = hit;

      // Target wireframe outline
      if (hit.hit && hit.blockPos && !isLockedUI) {
        targetOutline.visible = true;
        targetOutline.position.set(
          hit.blockPos.x + 0.5,
          hit.blockPos.y + 0.5,
          hit.blockPos.z + 0.5
        );
      } else {
        targetOutline.visible = false;
      }

      // Mining / Break Animation Progress
      const isMining = isMiningRef.current && hit.hit && hit.blockPos !== undefined && !isLockedUI;
      if (isMining && hit.blockPos) {
        const target = hit.blockPos;
        const currentTarget = miningTargetRef.current;

        const isSameTarget =
          currentTarget &&
          currentTarget.x === target.x &&
          currentTarget.y === target.y &&
          currentTarget.z === target.z;

        if (hit.blockType === BLOCK_TYPE.BEDROCK) {
          miningProgressRef.current = 0;
          crackMesh.visible = false;
        } else if (isSameTarget) {
          const baseHardness =
            hit.blockType !== undefined ? BLOCK_HARDNESS[hit.blockType] || 0.5 : 0.5;

          const toolSpeed = inventory.getMiningSpeedMultiplier(hit.blockType ?? BLOCK_TYPE.DIRT);
          const effectiveHardness = Math.max(0.08, baseHardness / toolSpeed);

          miningProgressRef.current += dt / effectiveHardness;

          if (time - lastHitSoundTimeRef.current >= 240) {
            soundManager.playHit();
            lastHitSoundTimeRef.current = time;
          }

          const crackStage = Math.min(
            4,
            Math.floor(miningProgressRef.current * 5)
          );
          crackMat.map = world.materials.crackTextures[crackStage];
          crackMat.needsUpdate = true;

          crackMesh.visible = true;
          crackMesh.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);

          // Finished breaking block! Spawn 3D drop!
          if (miningProgressRef.current >= 1.0) {
            const brokenType = hit.blockType ?? BLOCK_TYPE.DIRT;
            world.setBlock(target.x, target.y, target.z, BLOCK_TYPE.AIR);
            soundManager.playBreak();
            particles.emitBlockBreak(target, brokenType);

            // AUTHENTIC MINECRAFT HARVEST RULES:
            const held = inventory.getSelectedBlockType();
            const isWoodPick = held === BLOCK_TYPE.WOODEN_PICKAXE;
            const isStonePick = held === BLOCK_TYPE.STONE_PICKAXE;
            const isIronPick = held === BLOCK_TYPE.IRON_PICKAXE;
            const isGoldPick = held === BLOCK_TYPE.GOLDEN_PICKAXE;
            const isDiamondPick = held === BLOCK_TYPE.DIAMOND_PICKAXE;
            const isAnyPick = isWoodPick || isStonePick || isIronPick || isGoldPick || isDiamondPick;
            const isStoneTierPick = isStonePick || isIronPick || isGoldPick || isDiamondPick;
            const isIronTierPick = isIronPick || isDiamondPick;

            let shouldDrop = true;
            let dropItem: BlockType = brokenType;

            if (brokenType === BLOCK_TYPE.STONE) {
              if (!isAnyPick) {
                shouldDrop = false;
                showToast('⚠️ Камень рукой не добывается! Скрафти кирку.');
              }
            } else if (brokenType === BLOCK_TYPE.COAL_ORE) {
              if (isAnyPick) {
                dropItem = BLOCK_TYPE.COAL;
              } else {
                shouldDrop = false;
                showToast('⚠️ Для угля нужна кирка!');
              }
            } else if (brokenType === BLOCK_TYPE.IRON_ORE) {
              if (isStoneTierPick) {
                dropItem = BLOCK_TYPE.IRON_ORE;
              } else {
                shouldDrop = false;
                showToast('⚠️ Для железной руды нужна каменная кирка или лучше!');
              }
            } else if (brokenType === BLOCK_TYPE.GOLD_ORE) {
              if (isIronTierPick) {
                dropItem = BLOCK_TYPE.GOLD_ORE;
              } else {
                shouldDrop = false;
                showToast('⚠️ Для золотой руды нужна железная кирка или лучше!');
              }
            } else if (brokenType === BLOCK_TYPE.DIAMOND_ORE) {
              if (isIronTierPick) {
                dropItem = BLOCK_TYPE.DIAMOND;
              } else {
                shouldDrop = false;
                showToast('⚠️ Для алмазов нужна железная кирка или лучше!');
              }
            } else if (brokenType === BLOCK_TYPE.WATER) {
              shouldDrop = false;
            }

            if (shouldDrop) {
              itemDropManager.spawnDrop(target, dropItem, world.materials);
            }

            // TOOL DURABILITY REDUCTION
            const toolBroke = inventory.damageHeldTool();
            if (toolBroke) {
              arm.setHeldBlock(BLOCK_TYPE.AIR, world.materials);
            }
            setInventoryVersion((v) => v + 1);

            arm.triggerSwing();
            miningProgressRef.current = 0;
            crackMesh.visible = false;
          }
        } else {
          miningTargetRef.current = target.clone();
          miningProgressRef.current = 0;
          crackMesh.visible = false;
        }
      } else {
        miningProgressRef.current = 0;
        miningTargetRef.current = null;
        crackMesh.visible = false;
      }

      // Update First-Person Arm
      arm.update(dt, isMoving, isMiningRef.current);

      // Throttled HUD Update (10 Hz)
      if (time - lastHudUpdate >= 100) {
        setCoords({
          x: physics.position.x,
          y: physics.position.y,
          z: physics.position.z,
        });
        setYawAngle(inputManager.yaw);

        if (hit.hit && hit.blockPos && hit.blockType !== undefined) {
          const blockNames: Record<BlockType, string> = {
            [BLOCK_TYPE.AIR]: 'Воздух',
            [BLOCK_TYPE.WATER]: 'Вода (Water)',
            [BLOCK_TYPE.SAND]: 'Песок (Sand)',
            [BLOCK_TYPE.SNOW]: 'Снег (Snow)',
            [BLOCK_TYPE.GRASS]: 'Блок травы (Grass Block)',
            [BLOCK_TYPE.DIRT]: 'Земля (Dirt)',
            [BLOCK_TYPE.STONE]: 'Камень (Stone)',
            [BLOCK_TYPE.OAK_LOG]: 'Дуб (Oak Log)',
            [BLOCK_TYPE.OAK_LEAVES]: 'Листва дуба (Oak Leaves)',
            [BLOCK_TYPE.BIRCH_LOG]: 'Берёза (Birch Log)',
            [BLOCK_TYPE.BIRCH_LEAVES]: 'Листва берёзы (Birch Leaves)',
            [BLOCK_TYPE.OAK_PLANKS]: 'Дубовые доски (Oak Planks)',
            [BLOCK_TYPE.BIRCH_PLANKS]: 'Берёзовые доски (Birch Planks)',
            [BLOCK_TYPE.CRAFTING_TABLE]: 'Верстак (Crafting Table - ПКМ)',
            [BLOCK_TYPE.FURNACE]: 'Печь (Furnace - ПКМ)',
            [BLOCK_TYPE.STICK]: 'Палка (Stick)',
            [BLOCK_TYPE.COAL_ORE]: 'Угольная руда (Coal Ore)',
            [BLOCK_TYPE.IRON_ORE]: 'Железная руда (Iron Ore)',
            [BLOCK_TYPE.GOLD_ORE]: 'Золотая руда (Gold Ore)',
            [BLOCK_TYPE.DIAMOND_ORE]: 'Алмазная руда (Diamond Ore)',
            [BLOCK_TYPE.COAL]: 'Уголь (Coal)',
            [BLOCK_TYPE.IRON_INGOT]: 'Слиток железа (Iron Ingot)',
            [BLOCK_TYPE.GOLD_INGOT]: 'Золотой слиток (Gold Ingot)',
            [BLOCK_TYPE.DIAMOND]: 'Алмаз (Diamond)',
            [BLOCK_TYPE.WOODEN_PICKAXE]: 'Деревянная кирка (Wooden Pickaxe)',
            [BLOCK_TYPE.STONE_PICKAXE]: 'Каменная кирка (Stone Pickaxe)',
            [BLOCK_TYPE.IRON_PICKAXE]: 'Железная кирка (Iron Pickaxe)',
            [BLOCK_TYPE.GOLDEN_PICKAXE]: 'Золотая кирка (Golden Pickaxe)',
            [BLOCK_TYPE.DIAMOND_PICKAXE]: 'Алмазная кирка (Diamond Pickaxe)',
            [BLOCK_TYPE.WOODEN_AXE]: 'Деревянный топор (Wooden Axe)',
            [BLOCK_TYPE.STONE_AXE]: 'Каменный топор (Stone Axe)',
            [BLOCK_TYPE.IRON_AXE]: 'Железный топор (Iron Axe)',
            [BLOCK_TYPE.DIAMOND_AXE]: 'Алмазный топор (Diamond Axe)',
            [BLOCK_TYPE.WOODEN_SHOVEL]: 'Деревянная лопата (Wooden Shovel)',
            [BLOCK_TYPE.IRON_SHOVEL]: 'Железная лопата (Iron Shovel)',
            [BLOCK_TYPE.WOODEN_SWORD]: 'Деревянный меч (Wooden Sword)',
            [BLOCK_TYPE.IRON_SWORD]: 'Железный меч (Iron Sword)',
            [BLOCK_TYPE.GOLDEN_SWORD]: 'Золотой меч (Golden Sword)',
            [BLOCK_TYPE.DIAMOND_SWORD]: 'Алмазный меч (Diamond Sword)',
            [BLOCK_TYPE.RAW_PORKCHOP]: 'Сырая свинина (ПКМ — съесть)',
            [BLOCK_TYPE.COOKED_PORKCHOP]: 'Жареная свинина (ПКМ — съесть)',
            [BLOCK_TYPE.ROTTEN_FLESH]: 'Гнилая плоть (ПКМ — съесть)',
            [BLOCK_TYPE.BONE]: 'Кость (Bone)',
            [BLOCK_TYPE.WHITE_WOOL]: 'Белая шерсть (White Wool)',
            [BLOCK_TYPE.BEDROCK]: 'Бедрок (Bedrock - неразрушим)',
          };

          setLookingAt({
            x: hit.blockPos.x,
            y: hit.blockPos.y,
            z: hit.blockPos.z,
            type: blockNames[hit.blockType] || 'Блок',
          });
        } else {
          setLookingAt(null);
        }
        setBiome(world.getBiomeAt(physics.position.x, physics.position.z));
        lastHudUpdate = time;
      }

      // Render Scene
      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (physicsRef.current) {
        persistentPlayerPos = {
          x: physicsRef.current.position.x,
          y: physicsRef.current.position.y,
          z: physicsRef.current.position.z,
        };
      }
      persistentYaw = inputManager.yaw;
      persistentPitch = inputManager.pitch;

      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      inputManager.destroy();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [placeBlock, startMining, stopMining, attackMobInFront, handleTakeDamage, isMobileMode, currentSeed]);

  const inventory = inventoryRef.current;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none',
        backgroundColor: '#62b0ff',
      }}
    >
      {/* 3D Rotating Main Menu */}
      {gameState === 'menu' && (
        <MainMenu
          onStartGame={handleStartGame}
          isMobileMode={isMobileMode}
          onToggleMobileMode={() => setIsMobileMode(!isMobileMode)}
          seed={currentSeed}
          onRegenerateWorld={handleRegenerateWorld}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Gameplay HUD elements */}
      {gameState === 'playing' && (
        <>
          {/* 3D Crosshair */}
          <Crosshair />

          {/* Minecraft 1.0 Alpha Header & Actions HUD */}
          <DebugHUD
            coords={coords}
            fps={fps}
            lookingAt={lookingAt}
            yaw={yawAngle}
            biome={biome}
            isMobileMode={isMobileMode}
            onToggleMobileMode={() => setIsMobileMode(!isMobileMode)}
            onOpenSettings={() => {
              setIsSettingsOpen(true);
              inputManagerRef.current.releasePointerLock();
            }}
          />

          {/* Mining Requirement Toast Warning */}
          {toastMessage && (
            <div
              style={{
                position: 'absolute',
                top: '76px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(220, 38, 38, 0.92)',
                color: '#ffffff',
                padding: '8px 18px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.6)',
                zIndex: 80,
                pointerEvents: 'none',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              {toastMessage}
            </div>
          )}

          {/* Touch Controls for Mobile */}
          {isMobileMode && !isDead && (
            <TouchControls
              inputManager={inputManagerRef.current}
              onStartMining={startMining}
              onStopMining={stopMining}
              onPlaceBlock={placeBlock}
              onStartPlaceOrEat={() => {
                const held = inventory.getSelectedBlockType();
                if (Inventory.isFood(held)) {
                  startEating();
                } else {
                  placeBlock();
                }
              }}
              onStopPlaceOrEat={stopEating}
            />
          )}

          {/* Survival Hearts & Hunger Bar & Death Screen */}
          <SurvivalHUD
            health={health}
            hunger={hunger}
            isHurt={isHurt}
            isDead={isDead}
            deathCause={deathCause}
            onRespawn={handleRespawn}
          />

          {/* 9-Slot Hotbar */}
          {!isDead && (
            <Hotbar
              slots={inventory.slots.slice(0, 9)}
              selectedIndex={inventory.selectedIndex}
              onSelectSlot={(idx) => {
                inventory.selectedIndex = idx;
                setInventoryVersion((v) => v + 1);
                if (armRef.current && worldRef.current) {
                  armRef.current.setHeldBlock(
                    inventory.getSelectedBlockType(),
                    worldRef.current.materials
                  );
                }
              }}
              blockIcons={blockIcons}
              onOpenInventory={() => {
                setInventoryMode('2x2');
                setIsInventoryOpen(true);
                inputManagerRef.current.releasePointerLock();
              }}
            />
          )}

          {/* Inventory & Crafting GUI */}
          <InventoryGUI
            inventory={inventory}
            isOpen={isInventoryOpen}
            mode={inventoryMode}
            onClose={() => {
              setIsInventoryOpen(false);
              if (!isMobileMode && !isDead && !isFurnaceOpen) {
                inputManagerRef.current.requestPointerLock();
              }
              if (armRef.current && worldRef.current) {
                armRef.current.setHeldBlock(
                  inventory.getSelectedBlockType(),
                  worldRef.current.materials
                );
              }
            }}
            blockIcons={blockIcons}
            onInventoryChange={() => {
              setInventoryVersion((v) => v + 1);
              if (armRef.current && worldRef.current) {
                armRef.current.setHeldBlock(
                  inventory.getSelectedBlockType(),
                  worldRef.current.materials
                );
              }
            }}
          />

          {/* Furnace GUI */}
          <FurnaceGUI
            inventory={inventory}
            isOpen={isFurnaceOpen}
            onClose={() => {
              setIsFurnaceOpen(false);
              if (!isMobileMode && !isDead && !isInventoryOpen) {
                inputManagerRef.current.requestPointerLock();
              }
            }}
            blockIcons={blockIcons}
            onInventoryChange={() => setInventoryVersion((v) => v + 1)}
          />

          {/* PC Click to Play Banner Overlay */}
          {!isMobileMode && !isPointerLocked && !isInventoryOpen && !isFurnaceOpen && !isSettingsOpen && !isDead && (
            <div
              onClick={() => inputManagerRef.current.requestPointerLock()}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontFamily: 'monospace',
                cursor: 'pointer',
                zIndex: 50,
                backdropFilter: 'blur(3px)',
              }}
            >
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  textShadow: '2px 2px #000',
                  color: '#facc15',
                }}
              >
                Кликните для захвата мыши
              </div>
              <div style={{ fontSize: '14px', color: '#d1d5db', textAlign: 'center' }}>
                WASD — Движение &bull; Пробел — Прыжок &bull; Shift — Бег
                <br />
                ЛКМ — Добывать / Атаковать &bull; ПКМ — Ставить / Верстак / Печь / Есть &bull; <b>E</b> — Инвентарь &bull; <b>Esc</b> — Настройки
              </div>
            </div>
          )}
        </>
      )}

      {/* Settings / Options Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          if (gameState === 'playing' && !isMobileMode) {
            inputManagerRef.current.requestPointerLock();
          }
        }}
        fogDistance={fogDistance}
        onChangeFogDistance={(d) => {
          setFogDistance(d);
          applyFogSettings(d, isFogEnabled);
        }}
        isFogEnabled={isFogEnabled}
        onToggleFog={() => {
          const next = !isFogEnabled;
          setIsFogEnabled(next);
          applyFogSettings(fogDistance, next);
        }}
        fov={fov}
        onChangeFov={(val) => {
          setFov(val);
          if (cameraRef.current) {
            cameraRef.current.fov = val;
            cameraRef.current.updateProjectionMatrix();
          }
        }}
        sensitivity={sensitivity}
        onChangeSensitivity={(val) => {
          setSensitivity(val);
          CONTROLS_CONFIG.MOUSE_SENSITIVITY = 0.0022 * val;
        }}
        isMusicMuted={isMusicMuted}
        onToggleMusic={handleToggleMusic}
        isSoundMuted={isSoundMuted}
        onToggleSound={() => {
          const active = soundManager.toggleSound();
          setIsSoundMuted(!active);
        }}
        isMobileMode={isMobileMode}
        onToggleMobileMode={() => setIsMobileMode(!isMobileMode)}
        onQuitToTitle={() => {
          setIsSettingsOpen(false);
          setGameState('menu');
          inputManagerRef.current.releasePointerLock();
        }}
      />
    </div>
  );
};
