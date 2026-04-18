/**
 * JamesGPT High-Density Particle Generator
 * Targets ~85,000 particles for high-fidelity surface cohesion.
 */
export function generateFaceParticles() {
  const positions = [], uvs = [];
  const density = 292; // 292 * 292 = 85,264 particles
  
  for (let i = 0; i < density; i++) {
    for (let j = 0; j < density; j++) {
      const u = i / (density - 1);
      const v = j / (density - 1);
      
      // Match avatar.png proportions (approx 3:4)
      // World space spanning approx -1.15 to 1.15 X and -1.55 to 1.55 Y
      const x = (u - 0.5) * 2.3;
      const y = (v - 0.5) * 3.1;

      positions.push(x, y, 0);
      uvs.push(u, v);
    }
  }
  
  return { 
    positions: new Float32Array(positions), 
    uvs: new Float32Array(uvs),
    count: positions.length / 3 
  };
}
