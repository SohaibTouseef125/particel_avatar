# JamesGPT Particle Face Avatar

A production-ready, real-time 3D particle face avatar system with frame-accurate viseme lip-sync, eye controls, and emotional expressions. Built for the JamesGPT AI assistant.

![Golden Holographic Particle Face](./eyUvz.jpg)

## Features

- **85,000 structured grid particles** forming a golden holographic face
- **Frame-accurate viseme lip-sync** supporting all 23 Azure Neural TTS visemes
- **Eye control system** with gaze tracking, auto-blink, and micro-saccades
- **7 emotional expressions** with smooth blending and viseme-priority safety
- **Audio reactivity** (microphone, remote voice, mouth level)
- **Click ripple effects** (up to 10 simultaneous)
- **Adaptive quality** for mobile (25K-85K particles)
- **60 FPS** on mid-range devices

## Quick Start

### Demo

Open `demo/index.html` in a browser to see the interactive demo with:
- Viseme playback timeline
- Emotion controls
- Eye gaze sliders
- Audio reactivity
- Performance stats

### Integration

```javascript
import ParticleFaceAvatar from './src/particle-face-avatar.js';

// Initialize
ParticleFaceAvatar.init(canvasElement, { mini: false });

// Update every frame
ParticleFaceAvatar.update(dt, {
  micEnergy: 0.5,
  remoteEnergy: 0.3,
  mouthLevel: 0.12,
  smileLevel: 0.02
});

// Set expression
ParticleFaceAvatar.setExpression('joy');

// Handle click
canvas.addEventListener('click', (e) => {
  const x = e.offsetX / canvasElement.width;
  const y = e.offsetY / canvasElement.height;
  ParticleFaceAvatar.onClick(x, y);
});

// Resize
ParticleFaceAvatar.resize(newWidth, newHeight);

// Cleanup
ParticleFaceAvatar.destroy();
```

## Project Structure

```
├── src/
│   ├── particle-face-avatar.js    # Main module (exports default interface)
│   └── shaders/
│       ├── particle-vertex.glsl   # Vertex shader
│       └── particle-fragment.glsl # Fragment shader
├── lib/
│   ├── particle-face-generator.js # 85K particle position generator
│   ├── eye-controller.js          # Gaze, blink, saccades
│   ├── expression-system.js       # Emotion blending
│   └── viseme-adapter.js          # Viseme → ARKit mapping
├── demo/
│   └── index.html                 # Interactive demo page
├── README.md                      # This file
└── API_REFERENCE.md               # Detailed API docs
```

## API Reference

See [API_REFERENCE.md](./API_REFERENCE.md) for complete documentation.

### Core Interface

```javascript
export default {
  init(canvas, options)      // Initialize avatar
  update(dt, audioData)      // Frame update
  setExpression(expression)  // Set emotion
  onClick(x, y)             // Click handler
  resize(width, height)     // Resize handler
  destroy()                 // Cleanup
}
```

### Extended API

```javascript
// Push viseme events from backend
pushVisemes(events, startTime)

// Set gaze target
setGaze(x, y)

// Get internal instance
getInstance()
```

## Viseme Support

All 23 Azure Neural TTS visemes are supported:

| ID | Name | Mouth Shape |
|----|------|-------------|
| 0 | SIL | Silence |
| 1 | AE | Wide open |
| 2 | AH | Open rounded |
| 3 | AW | Wide diphthong |
| 4 | ER | R-colored |
| 5 | EY | Mid-spread |
| 6 | IH | Slightly open |
| 7 | IY | Spread wide |
| 8 | AO | Rounded open |
| 9 | UW | Rounded closed |
| 10 | UH | Slightly rounded |
| 11 | FF | Teeth on lip |
| 12 | TH | Tongue between |
| 13 | SS | Narrow slit |
| 14 | SH | Rounded small |
| 15 | CH | Closed release |
| 16 | JH | Voiced CH |
| 17 | ZH | Voiced SH |
| 18 | RR | Tongue up |
| 19 | MM | Closed lips |
| 20 | NN | Tongue up open |
| 21 | PP | Closed burst |
| 22 | DD | Closed open |

## Expressions

| Expression | Description |
|------------|-------------|
| `neutral` | Default resting state |
| `joy` | Smile, eyebrow lift, eye squint |
| `anger` | Brow down, nose wrinkle, lip press |
| `surprise` | Eyes wide, jaw drop |
| `sadness` | Brow inner up, mouth frown |
| `thinking` | Brow furrow, gaze up, lip press |
| `concerned` | Brow inner up, slight frown |

## Performance

| Metric | Desktop | Mobile (mid-range) |
|--------|---------|-------------------|
| FPS | 60 | 60 |
| Particles | 85,000 | 50,000 |
| GPU Time | < 2ms | < 3.5ms |
| Memory | < 6MB | < 7MB |

## Technical Details

### Particle System

- **Vertex Shader**: Handles particle positioning, viseme deformation, expression blending, eye controls, idle breathing, and audio reactivity
- **Fragment Shader**: Circular particles with soft edges, gold metallic color, holographic shimmer, and eye glow
- **Blending**: Additive blending for holographic effect

### Viseme Pipeline

```
Backend (Azure TTS)
  → Viseme events: [{id, t, weight, hold}]
  → Phoenix Channel (WebSocket)
  → Frontend VisemeScheduler
  → VisemeAdapter
  → Shader uniforms (23 viseme weights)
  → Particle mouth deformation
```

### Expression Blending

- Smooth lerp transitions (200-400ms)
- Priority-safe: visemes always override mouth shapes
- Emotions affect eyes, brows, cheeks, subtle mouth modulation only

### Adaptive Quality

Automatically detects device capability:
- **Desktop**: 85K particles, full bloom, aura enabled
- **Mid-range mobile**: 50K particles, reduced bloom, aura enabled
- **Low-end mobile**: 25K particles, minimal bloom, aura disabled
- **Mini mode (46px)**: 25K particles, minimal effects

## Dependencies

- Three.js (latest)
- Modern browser with WebGL 2.0 support

## Browser Support

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

## License

Proprietary - JamesGPT Project

---

*Built for the JamesGPT AI assistant avatar system.*
