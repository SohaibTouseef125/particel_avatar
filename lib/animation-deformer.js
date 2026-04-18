/**
 * JamesGPT Elastic Animation Deformer
 * Prevents "breaking" by using smooth distance-based falloff.
 */

export class AnimationDeformer {
  constructor(positions, regions) {
    this.positions = positions;
    this.regions = regions;
    this.landmarks = regions.landmarks;
  }

  applyEyeBlink(blinkAmount, positions) {
    if (blinkAmount < 0.001) return;
    
    const intensity = 0.12; 
    const lY = this.landmarks.leftEye.y;
    const rY = this.landmarks.rightEye.y;

    // Apply smooth movement to eye particles
    this.regions.leftEyeIndices.forEach(i => {
      const idx = i * 3;
      const originalY = this.positions[idx + 1];
      const dy = originalY - lY;
      
      // Smoothing factor: particles closer to center move more, edges move less
      const falloff = Math.exp(-Math.pow(dy, 2) / 0.02);
      
      if (dy > 0.01) positions[idx + 1] -= blinkAmount * intensity * falloff;
      else if (dy < -0.01) positions[idx + 1] += blinkAmount * intensity * 0.3 * falloff;
    });

    this.regions.rightEyeIndices.forEach(i => {
      const idx = i * 3;
      const originalY = this.positions[idx + 1];
      const dy = originalY - rY;
      const falloff = Math.exp(-Math.pow(dy, 2) / 0.02);
      
      if (dy > 0.01) positions[idx + 1] -= blinkAmount * intensity * falloff;
      else if (dy < -0.01) positions[idx + 1] += blinkAmount * intensity * 0.3 * falloff;
    });
  }

  applyLipSync(visemes, positions) {
    if (this.regions.mouthIndices.length === 0) return;
    
    const mouthY = this.landmarks.mouth.y;
    const mouthX = this.landmarks.mouth.x;

    const open = (visemes.AH || 0) * 0.5 + (visemes.AO || 0) * 0.7 + (visemes.AE || 0) * 0.3;
    const stretch = (visemes.IY || 0) * 0.12;

    this.regions.mouthIndices.forEach(i => {
      const idx = i * 3;
      const ox = this.positions[idx];
      const oy = this.positions[idx + 1];
      
      const dx = ox - mouthX;
      const dy = oy - mouthY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // ── SMOOTH ELASTIC FALLOFF ──
      // This ensures particles don't "break" away from the face
      const falloff = Math.max(0, 1.0 - (dist / 0.3)); 

      // Only lower lip/jaw moves down
      if (dy < -0.01) {
        positions[idx + 1] -= open * 0.3 * falloff;
      }
      
      // Horizontal stretch
      if (stretch > 0) {
        positions[idx] += dx * stretch * falloff;
      }
    });
  }

  applyExpressions(weights, positions) {
    if (!weights) return;
    const mY = this.landmarks.mouth.y;
    const mX = this.landmarks.mouth.x;
    const eY = this.landmarks.leftEye.y;

    // Joy / Smile
    if (weights.mouthSmile > 0.01) {
      const s = weights.mouthSmile;
      this.regions.mouthIndices.forEach(i => {
        const idx = i * 3;
        const dx = this.positions[idx] - mX;
        const dy = this.positions[idx + 1] - mY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (Math.abs(dx) > 0.05) {
          const falloff = Math.max(0, 1.0 - (dist / 0.3));
          positions[idx + 1] += s * 0.08 * falloff;
          positions[idx] += (dx > 0 ? 1 : -1) * s * 0.02 * falloff;
        }
      });
    }

    // Brows
    const browLift = (weights.browInnerUp || 0) * 0.15;
    const browDrop = (weights.browDown || 0) * 0.1;
    const browFactor = browLift - browDrop;

    if (Math.abs(browFactor) > 0.001) {
      [...this.regions.leftEyeIndices, ...this.regions.rightEyeIndices].forEach(i => {
        const idx = i * 3;
        const dy = this.positions[idx + 1] - eY;
        if (dy > 0.06) {
          const falloff = Math.min(1.0, (dy - 0.06) / 0.15);
          positions[idx + 1] += browFactor * falloff;
        }
      });
    }
  }
}
