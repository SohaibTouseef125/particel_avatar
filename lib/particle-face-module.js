import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { generateFaceParticles } from './particle-face-generator.js';
import { EyeController } from './eye-controller.js';
import { VisemeAdapter } from './viseme-adapter.js';
import { AnimationDeformer } from './animation-deformer.js';
import { mapRegions } from './region-mapper.js';
import { ExpressionSystem } from './expression-system.js';

class JamesGPTFaceModule {
  constructor() {
    this.renderer = null; this.scene = null; this.camera = null; this.controls = null;
    this.points = null; this.basePositions = null; this.count = 0;
    this.eyeController = new EyeController();
    this.visemeAdapter = new VisemeAdapter();
    this.expressionSystem = new ExpressionSystem();
    this.deformer = null;
    this.isInitialized = false;
  }

  async init(canvas, options = {}) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    this.camera.position.z = 6;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 10;

    const data = generateFaceParticles();
    this.basePositions = new Float32Array(data.positions);
    this.count = data.count;

    const texLoader = new THREE.TextureLoader();
    const tex = await new Promise(res => texLoader.load('./avatar.png', res));
    
    // ── PRECISE CALIBRATED LANDMARKS ──
    const landmarks = {
      leftEye:  { x: -0.22, y: 0.65, z: 0 },
      rightEye: { x:  0.22, y: 0.65, z: 0 },
      mouth:    { x:  0.00, y: 0.135, z: 0 }
    };

    const regions = mapRegions(this.basePositions, this.count, landmarks);
    this.deformer = new AnimationDeformer(this.basePositions, regions);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(data.positions), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(data.uvs, 2));

    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTexture: { value: tex }, uCohesion: { value: 1.0 } },
      vertexShader: `
        uniform float uCohesion;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * vec4(position * uCohesion, 1.0);
          gl_PointSize = 2.8 * (6.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec2 vUv; uniform sampler2D uTexture;
        void main() {
          vec4 texColor = texture2D(uTexture, vUv);
          if (texColor.a < 0.1) discard;
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          gl_FragColor = vec4(texColor.rgb, texColor.a * (1.1 - dist * 2.0));
        }
      `
    });

    this.points = new THREE.Points(geo, this.mat);
    this.scene.add(this.points);
    this.isInitialized = true;
    console.log('[JamesGPT] Master Module Online');
  }

  update(dt, audioData = {}) {
    if (!this.isInitialized) return;
    this.controls.update();
    const dtMs = dt * 1000;
    const now = performance.now();

    this.eyeController.update(dtMs);
    this.visemeAdapter.update(now, audioData.mouthLevel || 0);
    this.expressionSystem.update(dtMs);

    const positions = this.points.geometry.attributes.position.array;
    positions.set(this.basePositions);
    
    // Apply Surgical Animations
    this.deformer.applyEyeBlink(this.eyeController.blinkAmount, positions);
    this.deformer.applyLipSync(this.visemeAdapter.currentWeights, positions);
    
    const arkit = this.expressionSystem.getBlendedWeights(this.visemeAdapter.getARKitWeights());
    this.deformer.applyExpressions(arkit, positions);
    
    // Micro-Saccades
    const sx = this.eyeController.saccade.x * 0.02;
    const sy = this.eyeController.saccade.y * 0.02;
    [...this.deformer.regions.leftEyeIndices, ...this.deformer.regions.rightEyeIndices].forEach(i => {
        positions[i*3] += sx; positions[i*3+1] += sy;
    });

    this.points.geometry.attributes.position.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }

  setExpression(expression) {
    if (this.isInitialized) this.expressionSystem.setExpression(expression, 1.0);
  }

  onClick(x, y) {
    if (this.isInitialized) this.eyeController.forceBlink();
  }

  resize(w, h) {
    if (!this.renderer) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  destroy() {
    if (this.renderer) this.renderer.dispose();
    this.isInitialized = false;
  }
}

export default new JamesGPTFaceModule();
