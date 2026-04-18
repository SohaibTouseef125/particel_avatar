/**
 * Eye Controller - Gaze, 170ms Blink, Saccades
 * Optimized for JamesGPT 85K Particle Avatar
 */

export class EyeController {
  constructor(options = {}) {
    this.gazeTarget = { x: 0, y: 0 };
    this.gazeCurrent = { x: 0, y: 0 };
    this.gazeSpeed = 10.0;

    this.blinkAmount = 0;
    this.blinkInterval = { min: 1200, max: 3000 };
    this.blinkDuration = 170; // 170ms Duration
    this.blinkTimer = 0;
    this.blinkState = 'open';
    this.blinkPhase = 0;
    this.nextBlinkTime = this._randomInterval();

    this.saccade = { x: 0, y: 0 };
    this.saccadeTarget = { x: 0, y: 0 };
    this.saccadeTimer = 0;
  }

  update(dt) {
    // 1. Update Gaze
    const lerp = 1 - Math.exp(-this.gazeSpeed * (dt / 1000));
    this.gazeCurrent.x += (this.gazeTarget.x - this.gazeCurrent.x) * lerp;
    this.gazeCurrent.y += (this.gazeTarget.y - this.gazeCurrent.y) * lerp;

    // 2. Update Blink
    this.blinkTimer += dt;
    if (this.blinkState === 'open') {
      if (this.blinkTimer >= this.nextBlinkTime) {
        this.blinkState = 'closing';
        this.blinkPhase = 0;
      }
    } else if (this.blinkState === 'closing') {
      this.blinkPhase += dt / (this.blinkDuration / 2);
      this.blinkAmount = Math.min(1.0, this.blinkPhase);
      if (this.blinkPhase >= 1.0) {
        this.blinkState = 'opening';
        this.blinkPhase = 0;
      }
    } else if (this.blinkState === 'opening') {
      this.blinkPhase += dt / (this.blinkDuration / 2);
      this.blinkAmount = Math.max(0.0, 1.0 - this.blinkPhase);
      if (this.blinkPhase >= 1.0) {
        this.blinkState = 'open';
        this.blinkTimer = 0;
        this.nextBlinkTime = this._randomInterval();
      }
    }

    // 3. Update Micro-Saccades
    this.saccadeTimer += dt;
    if (this.saccadeTimer > 150) { // Tiny jitter every 150ms
      this.saccadeTimer = 0;
      this.saccadeTarget.x = (Math.random() - 0.5) * 0.05;
      this.saccadeTarget.y = (Math.random() - 0.5) * 0.05;
    }
    this.saccade.x += (this.saccadeTarget.x - this.saccade.x) * 0.2;
    this.saccade.y += (this.saccadeTarget.y - this.saccade.y) * 0.2;
  }

  /**
   * Set the target gaze coordinates
   * @param {number} x - Horizontal gaze (-1 to 1)
   * @param {number} y - Vertical gaze (-1 to 1)
   */
  setGazeTarget(x, y) {
    this.gazeTarget.x = Math.max(-1, Math.min(1, x));
    this.gazeTarget.y = Math.max(-1, Math.min(1, y));
  }

  forceBlink() {
    if (this.blinkState === 'open') {
      this.blinkState = 'closing';
      this.blinkPhase = 0;
      this.blinkTimer = 0;
    }
  }

  _randomInterval() {
    return this.blinkInterval.min + Math.random() * (this.blinkInterval.max - this.blinkInterval.min);
  }
}
