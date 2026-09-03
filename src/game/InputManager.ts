import { CONTROLS_CONFIG } from './constants';

export class InputManager {
  // Movement keys state
  private keys: Record<string, boolean> = {};

  // Mobile virtual controls state
  public joystickVector = { x: 0, y: 0 }; // x: strafe (-1 to 1), y: forward (-1 to 1)
  public mobileJump = false;
  public mobileSprint = false;

  // Accumulated look deltas
  private accumulatedYawDelta = 0;
  private accumulatedPitchDelta = 0;

  // Current camera Euler angles
  public yaw = 0;
  public pitch = 0;

  // Pointer lock state
  public isPointerLocked = false;
  public onPointerLockChange?: (locked: boolean) => void;

  private domElement: HTMLElement | null = null;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handlePointerLockChange = this.handlePointerLockChange.bind(this);
  }

  public init(element: HTMLElement): void {
    this.domElement = element;

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.keys[e.code] = true;
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys[e.code] = false;
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isPointerLocked) return;

    this.accumulatedYawDelta -= e.movementX * CONTROLS_CONFIG.MOUSE_SENSITIVITY;
    this.accumulatedPitchDelta -= e.movementY * CONTROLS_CONFIG.MOUSE_SENSITIVITY;
  }

  private handlePointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.domElement;
    if (this.onPointerLockChange) {
      this.onPointerLockChange(this.isPointerLocked);
    }
  }

  public requestPointerLock(): void {
    if (this.domElement && !this.isPointerLocked) {
      try {
        this.domElement.requestPointerLock();
      } catch (err) {
        console.warn('Pointer lock request error', err);
      }
    }
  }

  public releasePointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  /**
   * Called by mobile touch swipe area on the right side of the screen
   */
  public addTouchLookDelta(deltaX: number, deltaY: number): void {
    this.accumulatedYawDelta -= deltaX * CONTROLS_CONFIG.TOUCH_LOOK_SENSITIVITY;
    this.accumulatedPitchDelta -= deltaY * CONTROLS_CONFIG.TOUCH_LOOK_SENSITIVITY;
  }

  /**
   * Applies accumulated look deltas to yaw and pitch, then resets deltas
   */
  public updateLook(): void {
    this.yaw += this.accumulatedYawDelta;
    this.pitch += this.accumulatedPitchDelta;

    // Clamp pitch (prevent camera flipping upside down)
    this.pitch = Math.max(
      CONTROLS_CONFIG.MIN_PITCH,
      Math.min(CONTROLS_CONFIG.MAX_PITCH, this.pitch)
    );

    this.accumulatedYawDelta = 0;
    this.accumulatedPitchDelta = 0;
  }

  /**
   * Returns normalized forward and right movement inputs [-1, 1]
   */
  public getMovementInput(): { forward: number; right: number } {
    let forward = 0;
    let right = 0;

    // Keyboard inputs
    if (this.keys['KeyW'] || this.keys['ArrowUp']) forward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) forward -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) right += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) right -= 1;

    // Combine with mobile virtual joystick
    if (Math.abs(this.joystickVector.y) > 0.05) {
      forward += this.joystickVector.y;
    }
    if (Math.abs(this.joystickVector.x) > 0.05) {
      right += this.joystickVector.x;
    }

    // Clamp between -1 and 1
    forward = Math.max(-1, Math.min(1, forward));
    right = Math.max(-1, Math.min(1, right));

    return { forward, right };
  }

  public isJumping(): boolean {
    return Boolean(this.keys['Space'] || this.mobileJump);
  }

  public isSprinting(): boolean {
    return Boolean(
      this.keys['ShiftLeft'] ||
      this.keys['ShiftRight'] ||
      this.mobileSprint
    );
  }
}
