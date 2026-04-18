/**
 * Region Mapper - Precise Anatomical Region Classification
 * Optimized for JamesGPT 85K Particle Avatar
 */

export function mapRegions(positions, count, customLandmarks = null) {
  // Landmarks normalized to avatar.png proportions
  const landmarks = customLandmarks || {
    leftEye:  { x: -0.25, y: 0.62, z: 0 },
    rightEye: { x:  0.25, y: 0.62, z: 0 },
    mouth:    { x:  0.00, y: 0.13, z: 0 }
  };

  const regions = {
    leftEyeIndices: [],
    rightEyeIndices: [],
    mouthIndices: [],
    landmarks: landmarks
  };

  // ── SURGICAL RADII ──
  // Tight radii ensure only the eyes and lips move.
  const EYE_RADIUS = 0.16;      
  const MOUTH_RADIUS = 0.22;    

  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    const x = positions[idx];
    const y = positions[idx + 1];

    const distToLeftEye = Math.sqrt(Math.pow(x - landmarks.leftEye.x, 2) + Math.pow(y - landmarks.leftEye.y, 2));
    const distToRightEye = Math.sqrt(Math.pow(x - landmarks.rightEye.x, 2) + Math.pow(y - landmarks.rightEye.y, 2));
    const distToMouth = Math.sqrt(Math.pow(x - landmarks.mouth.x, 2) + Math.pow(y - landmarks.mouth.y, 2));

    if (distToLeftEye < EYE_RADIUS) {
      regions.leftEyeIndices.push(i);
    } else if (distToRightEye < EYE_RADIUS) {
      regions.rightEyeIndices.push(i);
    } else if (distToMouth < MOUTH_RADIUS) {
      regions.mouthIndices.push(i);
    }
  }

  return regions;
}

export default { mapRegions };
