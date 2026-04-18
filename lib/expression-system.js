/**
 * JamesGPT Expression System
 * Manages smooth transitions between 7 emotional states.
 */

export const EXPRESSIONS = {
  NEUTRAL: 'neutral',
  JOY: 'joy',
  ANGER: 'anger',
  SURPRISE: 'surprise',
  SADNESS: 'sadness',
  THINKING: 'thinking',
  LISTENING: 'listening'
};

const EXPRESSION_MAPS = {
  neutral: { browInnerUp: 0, mouthSmile: 0, eyeWide: 0, browDown: 0 },
  joy: { browInnerUp: 0.2, mouthSmile: 0.8, eyeWide: 0.1 },
  anger: { browDown: 0.7, mouthPress: 0.4, noseSneer: 0.5 },
  surprise: { browInnerUp: 0.8, eyeWide: 0.6, jawOpen: 0.2 },
  sadness: { browInnerUp: 0.5, mouthFrown: 0.6, eyeSquint: 0.2 },
  thinking: { browDown: 0.3, eyeSquint: 0.3, mouthPucker: 0.2, lookUp: 0.4 },
  listening: { browInnerUp: 0.1, headTilt: 0.2, eyeWide: 0.05 }
};

export class ExpressionSystem {
  constructor() {
    this.current = 'neutral';
    this.weights = {};
    Object.values(EXPRESSIONS).forEach(e => this.weights[e] = 0);
    this.weights.neutral = 1.0;
    this.targets = { ...this.weights };
    this.transitionSpeed = 0.1; 
  }

  setExpression(name, intensity = 1.0) {
    if (!EXPRESSIONS[name.toUpperCase()]) return;
    Object.keys(this.targets).forEach(k => this.targets[k] = 0);
    this.targets[name] = intensity;
    this.current = name;
  }

  update(dt) {
    const lerp = 1 - Math.exp(-10 * (dt / 1000));
    Object.keys(this.weights).forEach(k => {
      this.weights[k] += (this.targets[k] - this.weights[k]) * lerp;
    });
  }

  getBlendedWeights(visemeArkit = {}) {
    const result = { ...visemeArkit };
    // Blend expressions into ARKit weights
    Object.keys(this.weights).forEach(expr => {
      const w = this.weights[expr];
      if (w < 0.01) return;
      const map = EXPRESSION_MAPS[expr];
      Object.keys(map).forEach(key => {
        result[key] = Math.max(result[key] || 0, map[key] * w);
      });
    });
    return result;
  }
}
