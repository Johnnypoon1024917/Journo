/**
 * TouchGestureRecognizer Utility
 * 
 * Recognizes and processes touch gestures for mobile interactions.
 * Implements Requirements 5.1, 5.2, 5.5, 5.6
 */

export interface Point {
  x: number;
  y: number;
}

export interface TouchPoint {
  identifier: number;
  clientX: number;
  clientY: number;
  force?: number;
  radiusX?: number;
  radiusY?: number;
}

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface LongPressResult {
  detected: boolean;
  duration: number;
  position: Point;
}

export interface PinchResult {
  scale: number;
  center: Point;
  distance: number;
}

export interface RotationResult {
  angle: number;
  center: Point;
}

export interface DragResult {
  delta: Point;
  velocity: Point;
  position: Point;
}

export interface SwipeResult {
  direction: SwipeDirection;
  velocity: number;
  distance: number;
}

/**
 * TouchGestureRecognizer Class
 * 
 * Tracks and recognizes various touch gestures including:
 * - Long press (400ms threshold)
 * - Pinch (two-finger scale)
 * - Rotation (two-finger rotate)
 * - Drag (single-finger movement)
 * - Swipe (fast single-finger movement)
 */
export class TouchGestureRecognizer {
  private touchStartTime: number = 0;
  private touchStartPosition: Point = { x: 0, y: 0 };
  private previousTouches: TouchPoint[] = [];
  private currentTouches: TouchPoint[] = [];
  private longPressTimer: NodeJS.Timeout | null = null;
  private longPressThreshold: number = 400; // ms
  private swipeThreshold: number = 50; // pixels
  private swipeVelocityThreshold: number = 0.5; // pixels per ms

  /**
   * Start tracking touches
   */
  onTouchStart(touches: TouchPoint[]): void {
    this.touchStartTime = Date.now();
    this.currentTouches = [...touches];
    this.previousTouches = [...touches];
    
    if (touches.length === 1) {
      this.touchStartPosition = {
        x: touches[0].clientX,
        y: touches[0].clientY,
      };
    }
  }

  /**
   * Update touch positions
   */
  onTouchMove(touches: TouchPoint[]): void {
    this.previousTouches = [...this.currentTouches];
    this.currentTouches = [...touches];
  }

  /**
   * End touch tracking
   */
  onTouchEnd(): void {
    this.clearLongPressTimer();
    this.previousTouches = [];
    this.currentTouches = [];
  }

  /**
   * Cancel touch tracking
   */
  onTouchCancel(): void {
    this.clearLongPressTimer();
    this.previousTouches = [];
    this.currentTouches = [];
  }

  /**
   * Recognize long press gesture (400ms threshold)
   * Returns true if the touch has been held for at least 400ms
   */
  recognizeLongPress(duration?: number): LongPressResult {
    const threshold = duration || this.longPressThreshold;
    const elapsed = Date.now() - this.touchStartTime;
    const detected = elapsed >= threshold && this.currentTouches.length === 1;
    
    return {
      detected,
      duration: elapsed,
      position: this.touchStartPosition,
    };
  }

  /**
   * Start long press timer with callback
   */
  startLongPressTimer(callback: () => void, duration?: number): void {
    this.clearLongPressTimer();
    const threshold = duration || this.longPressThreshold;
    
    this.longPressTimer = setTimeout(() => {
      if (this.currentTouches.length === 1) {
        callback();
      }
    }, threshold);
  }

  /**
   * Clear long press timer
   */
  clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  /**
   * Recognize pinch gesture (two-finger scale)
   * Returns scale factor and center point, or null if not a pinch
   */
  recognizePinch(): PinchResult | null {
    if (this.currentTouches.length !== 2 || this.previousTouches.length !== 2) {
      return null;
    }

    const currentDistance = this.calculateDistance(
      this.currentTouches[0],
      this.currentTouches[1]
    );
    
    const previousDistance = this.calculateDistance(
      this.previousTouches[0],
      this.previousTouches[1]
    );

    if (previousDistance === 0) {
      return null;
    }

    const scale = currentDistance / previousDistance;
    const center = this.calculateCenter(this.currentTouches[0], this.currentTouches[1]);

    return {
      scale,
      center,
      distance: currentDistance,
    };
  }

  /**
   * Recognize rotation gesture (two-finger rotate)
   * Returns rotation angle in degrees, or null if not a rotation
   */
  recognizeRotation(): RotationResult | null {
    if (this.currentTouches.length !== 2 || this.previousTouches.length !== 2) {
      return null;
    }

    const currentAngle = this.calculateAngle(
      this.currentTouches[0],
      this.currentTouches[1]
    );
    
    const previousAngle = this.calculateAngle(
      this.previousTouches[0],
      this.previousTouches[1]
    );

    let angleDelta = currentAngle - previousAngle;
    
    // Normalize angle to -180 to 180 range
    if (angleDelta > 180) {
      angleDelta -= 360;
    } else if (angleDelta < -180) {
      angleDelta += 360;
    }

    const center = this.calculateCenter(this.currentTouches[0], this.currentTouches[1]);

    return {
      angle: angleDelta,
      center,
    };
  }

  /**
   * Recognize drag gesture (single-finger movement)
   * Returns delta, velocity, and current position
   */
  recognizeDrag(): DragResult | null {
    if (this.currentTouches.length !== 1 || this.previousTouches.length !== 1) {
      return null;
    }

    const current = this.currentTouches[0];
    const previous = this.previousTouches[0];
    
    const delta = {
      x: current.clientX - previous.clientX,
      y: current.clientY - previous.clientY,
    };

    const elapsed = Date.now() - this.touchStartTime;
    const velocity = {
      x: elapsed > 0 ? delta.x / elapsed : 0,
      y: elapsed > 0 ? delta.y / elapsed : 0,
    };

    return {
      delta,
      velocity,
      position: { x: current.clientX, y: current.clientY },
    };
  }

  /**
   * Recognize swipe gesture (fast single-finger movement)
   * Returns swipe direction and velocity, or null if not a swipe
   */
  recognizeSwipe(): SwipeResult | null {
    if (this.currentTouches.length !== 1) {
      return null;
    }

    const current = this.currentTouches[0];
    const deltaX = current.clientX - this.touchStartPosition.x;
    const deltaY = current.clientY - this.touchStartPosition.y;
    const elapsed = Date.now() - this.touchStartTime;

    if (elapsed === 0) {
      return null;
    }

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / elapsed;

    // Check if movement is fast enough and far enough
    if (distance < this.swipeThreshold || velocity < this.swipeVelocityThreshold) {
      return null;
    }

    // Determine primary direction
    let direction: SwipeDirection;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    return {
      direction,
      velocity,
      distance,
    };
  }

  /**
   * Calculate distance between two touch points
   */
  private calculateDistance(touch1: TouchPoint, touch2: TouchPoint): number {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate center point between two touches
   */
  private calculateCenter(touch1: TouchPoint, touch2: TouchPoint): Point {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }

  /**
   * Calculate angle between two touch points in degrees
   */
  private calculateAngle(touch1: TouchPoint, touch2: TouchPoint): number {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }

  /**
   * Get current touch count
   */
  getTouchCount(): number {
    return this.currentTouches.length;
  }

  /**
   * Get current touches
   */
  getCurrentTouches(): TouchPoint[] {
    return [...this.currentTouches];
  }

  /**
   * Reset all gesture state
   */
  reset(): void {
    this.clearLongPressTimer();
    this.touchStartTime = 0;
    this.touchStartPosition = { x: 0, y: 0 };
    this.previousTouches = [];
    this.currentTouches = [];
  }
}
