/**
 * Viseme Adapter - Frame-Accurate Lip-Sync
 * 
 * Bridges the existing viseme pipeline to the particle face system.
 * 
 * Input: Viseme events from backend (Azure 23 visemes)
 *   { id: "AH", t: 120, weight: 0.8, hold: 50 }
 * 
 * Output: Per-frame viseme weights for shader uniforms
 * 
 * Features:
 * - Time-based envelope (attack → peak → hold → decay)
 * - Multiple simultaneous visemes with additive blending
 * - Graceful fallback to audio-driven mouthLevel
 * - Binary search pruning for performance
 */

// Viseme timing constants (matching VisemeScheduler)
const PRE_GAP_MS = 40;
const DECAY_MS = 150;

// Azure viseme → ARKit blend shape mapping
const VISEME_TO_ARKIT = {
  SIL:  {},
  AE:   { jawOpen: 0.7, mouthSmile_L: 0.2, mouthSmile_R: 0.2 },
  AH:   { jawOpen: 0.6, mouthFunnel: 0.3 },
  AW:   { jawOpen: 0.8, mouthSmile_L: 0.3, mouthSmile_R: 0.3 },
  ER:   { jawOpen: 0.4, mouthFunnel: 0.4 },
  EY:   { jawOpen: 0.3, mouthSmile_L: 0.15, mouthSmile_R: 0.15 },
  IH:   { jawOpen: 0.25, mouthSmile_L: 0.1, mouthSmile_R: 0.1 },
  IY:   { jawOpen: 0.35, mouthSmile_L: 0.25, mouthSmile_R: 0.25 },
  AO:   { jawOpen: 0.5, mouthFunnel: 0.5 },
  UW:   { jawOpen: 0.2, mouthPucker: 0.7 },
  UH:   { jawOpen: 0.25, mouthPucker: 0.4 },
  FF:   { mouthPress_L: 0.6, mouthPress_R: 0.6 },
  TH:   { jawOpen: 0.15, mouthStretch_L: 0.4, mouthStretch_R: 0.4 },
  SS:   { jawOpen: 0.1, mouthSmile_L: 0.3, mouthSmile_R: 0.3 },
  SH:   { jawOpen: 0.15, mouthPucker: 0.5 },
  CH:   { jawOpen: 0.4, mouthPress_L: 0.5, mouthPress_R: 0.5 },
  JH:   { jawOpen: 0.4, mouthPress_L: 0.5, mouthPress_R: 0.5 },
  ZH:   { jawOpen: 0.15, mouthPucker: 0.4 },
  RR:   { jawOpen: 0.2, mouthFunnel: 0.3 },
  MM:   { mouthPress_L: 0.8, mouthPress_R: 0.8 },
  NN:   { jawOpen: 0.15, mouthStretch_L: 0.3, mouthStretch_R: 0.3 },
  PP:   { mouthPress_L: 0.9, mouthPress_R: 0.9 },
  DD:   { jawOpen: 0.35, mouthPress_L: 0.4, mouthPress_R: 0.4 }
};

export class VisemeAdapter {
  constructor(options = {}) {
    // Active viseme events (sorted by time)
    this.events = [];
    
    // Current blended viseme weights
    this.currentWeights = {};
    this._initWeights();
    
    // Utterance start time (performance.now)
    this.utteranceStart = 0;
    
    // Fallback mouth level (audio-driven)
    this.fallbackMouthLevel = 0;
    
    // Whether we have active viseme events
    this.hasVisemeEvents = false;
    
    // Debug mode
    this.debug = options.debug || false;
  }

  /**
   * Push a batch of viseme events
   * @param {Array} events - Viseme events [{id, t, weight, hold}]
   * @param {number} utteranceStartTime - performance.now() when utterance started
   */
  pushVisemeBatch(events, utteranceStartTime) {
    this.events = events.map(e => ({
      id: e.id,
      t: e.t,
      weight: e.weight || 1.0,
      hold: e.hold || 50
    }));
    
    // Sort by time for binary search
    this.events.sort((a, b) => a.t - b.t);
    
    this.utteranceStart = utteranceStartTime;
    this.hasVisemeEvents = this.events.length > 0;
    
    if (this.debug) {
      console.log(`[VisemeAdapter] Pushed ${this.events.length} viseme events`);
    }
  }

  /**
   * Push a single viseme event (for streaming)
   * @param {Object} event - Viseme event {id, t, weight, hold}
   */
  pushViseme(event) {
    this.events.push({
      id: event.id,
      t: event.t,
      weight: event.weight || 1.0,
      hold: event.hold || 50
    });
    
    this.events.sort((a, b) => a.t - b.t);
    this.hasVisemeEvents = true;
  }

  /**
   * Update viseme weights for current frame
   * @param {number} currentTime - performance.now()
   * @param {number} fallbackMouthLevel - Audio-driven mouth level (0-0.24)
   */
  update(currentTime, fallbackMouthLevel = 0) {
    this.fallbackMouthLevel = fallbackMouthLevel;
    
    if (!this.hasVisemeEvents) {
      // Fallback to audio-driven mouth animation
      this._applyFallback(fallbackMouthLevel);
      return;
    }
    
    const elapsed = currentTime - this.utteranceStart;
    
    // Reset weights
    this._initWeights();
    
    // Process active visemes
    let activeCount = 0;
    
    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];
      const eventWeight = this._getVisemeWeight(event, elapsed);
      
      if (eventWeight > 0.001) {
        this._blendViseme(event.id, eventWeight * event.weight);
        activeCount++;
      }
    }
    
    // Blend with fallback if viseme weights are low
    const totalWeight = Object.values(this.currentWeights).reduce((sum, w) => sum + w, 0);
    if (totalWeight < 0.1) {
      this._applyFallback(fallbackMouthLevel);
    }
    
    if (this.debug && activeCount > 0) {
      console.log(`[VisemeAdapter] ${activeCount} active visemes at ${elapsed.toFixed(0)}ms`);
    }
  }

  /**
   * Get current viseme weights for shader uniforms
   * @returns {Object} Viseme weights
   */
  getShaderWeights() {
    return {
      uVisemeSIL: this.currentWeights.SIL || 0,
      uVisemeAE: this.currentWeights.AE || 0,
      uVisemeAH: this.currentWeights.AH || 0,
      uVisemeAW: this.currentWeights.AW || 0,
      uVisemeER: this.currentWeights.ER || 0,
      uVisemeEY: this.currentWeights.EY || 0,
      uVisemeIH: this.currentWeights.IH || 0,
      uVisemeIY: this.currentWeights.IY || 0,
      uVisemeAO: this.currentWeights.AO || 0,
      uVisemeUW: this.currentWeights.UW || 0,
      uVisemeUH: this.currentWeights.UH || 0,
      uVisemeFF: this.currentWeights.FF || 0,
      uVisemeTH: this.currentWeights.TH || 0,
      uVisemeSS: this.currentWeights.SS || 0,
      uVisemeSH: this.currentWeights.SH || 0,
      uVisemeCH: this.currentWeights.CH || 0,
      uVisemeJH: this.currentWeights.JH || 0,
      uVisemeZH: this.currentWeights.ZH || 0,
      uVisemeRR: this.currentWeights.RR || 0,
      uVisemeMM: this.currentWeights.MM || 0,
      uVisemeNN: this.currentWeights.NN || 0,
      uVisemePP: this.currentWeights.PP || 0,
      uVisemeDD: this.currentWeights.DD || 0
    };
  }

  /**
   * Get ARKit blend shape weights from current visemes
   * @returns {Object} ARKit blend shape weights
   */
  getARKitWeights() {
    const arkit = {};
    
    Object.keys(this.currentWeights).forEach(visemeId => {
      const weight = this.currentWeights[visemeId];
      if (weight < 0.001) return;
      
      const mapping = VISEME_TO_ARKIT[visemeId];
      if (!mapping) return;
      
      Object.keys(mapping).forEach(key => {
        arkit[key] = (arkit[key] || 0) + mapping[key] * weight;
      });
    });
    
    // Clamp
    Object.keys(arkit).forEach(key => {
      arkit[key] = Math.max(0, Math.min(1, arkit[key]));
    });
    
    return arkit;
  }

  /**
   * Clear all viseme events
   */
  clear() {
    this.events = [];
    this.hasVisemeEvents = false;
    this._initWeights();
  }

  // ── Private Methods ──

  _initWeights() {
    const visemeIds = ['SIL', 'AE', 'AH', 'AW', 'ER', 'EY', 'IH', 'IY', 'AO', 'UW', 'UH',
                       'FF', 'TH', 'SS', 'SH', 'CH', 'JH', 'ZH', 'RR', 'MM', 'NN', 'PP', 'DD'];
    visemeIds.forEach(id => {
      this.currentWeights[id] = 0;
    });
  }

  _getVisemeWeight(event, elapsed) {
    const { t, hold } = event;
    
    // Before pre-gap
    if (elapsed < t - PRE_GAP_MS) {
      return 0;
    }
    
    // After decay
    if (elapsed > t + hold + DECAY_MS) {
      return 0;
    }
    
    // Pre-gap (ramp up)
    if (elapsed < t) {
      const progress = (elapsed - (t - PRE_GAP_MS)) / PRE_GAP_MS;
      return this._easeIn(progress);
    }
    
    // Peak + Hold
    if (elapsed < t + hold) {
      return 1.0;
    }
    
    // Decay
    const decayProgress = (elapsed - (t + hold)) / DECAY_MS;
    return this._easeOut(1 - decayProgress);
  }

  _blendViseme(visemeId, weight) {
    this.currentWeights[visemeId] = Math.min(1, (this.currentWeights[visemeId] || 0) + weight);
  }

  _applyFallback(mouthLevel) {
    this._initWeights();

    // Map mouth level to viseme-like shapes for lip sync
    if (mouthLevel > 0.01) {
      const openAmount = Math.min(1, mouthLevel / 0.24); // Normalize to 0-1

      // Mouth opening visemes
      this.currentWeights.AH = openAmount * 0.6;  // Open mouth
      this.currentWeights.AE = openAmount * 0.4;  // Slightly open
      this.currentWeights.IY = (1 - openAmount) * 0.2;  // Closed mouth

      // Lip rounding for different mouth shapes
      if (openAmount > 0.5) {
        this.currentWeights.AO = openAmount * 0.3;  // Rounded open
      }
    } else {
      this.currentWeights.SIL = 1;  // Silence - mouth closed
    }
  }

  _easeIn(t) {
    return t * t * (3 - 2 * t);
  }

  _easeOut(t) {
    return t * t;
  }
}

export default VisemeAdapter;
