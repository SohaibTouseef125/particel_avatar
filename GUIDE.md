# 🤖 JamesGPT Particle Avatar - Documentation & Guide

This document explains how the high-fidelity particle face system works and how to maintain it.

---

## 1. Overview
The JamesGPT Particle Avatar is a WebGL-based system that transforms a static 2D image (`avatar.png`) into a living, 3D-simulated particle face consisting of **85,264 individual particles**.

### Key Capabilities:
*   **Surgical Eye Blinking:** Human-like 170ms blinks affecting only the eyelids.
*   **Pro Lip-Sync:** Support for 23 Azure visemes with elastic smoothing (no face breaking).
*   **7 Emotional States:** Neutral, Joy, Anger, Surprise, Sadness, Thinking, and Listening.
*   **Real-time Gaze:** Eyes track a target using micro-saccades for a "living" look.

---

## 2. Core Architecture (How it works)

### A. Particle Generation (`lib/particle-face-generator.js`)
Creates a high-density grid. Every particle is assigned a UV coordinate corresponding to the `avatar.png`, giving it the correct skin tone and features.

### B. Anatomical Mapping (`lib/region-mapper.js`)
On startup, the system identifies which particles belong to the **Eyes** and **Mouth**. This ensures that when you "blink," the chin or ears don't move by mistake.

### C. Elastic Deformation (`lib/animation-deformer.js`)
This is the most critical part. When a part of the face moves, it uses **Gaussian Falloff**. Instead of particles snapping, they pull their neighbors slightly, creating a smooth "elastic skin" effect that prevents the face from tearing apart.

---

## 3. How to Use the Diagnostic Console

When you run the project (e.g., via `localhost:3000`), you will see a control panel on the **right side**:

1.  **Facial Expressions:** Click any button to see the avatar transition into that mood.
2.  **Manual Blink:** Click to verify the 170ms blink duration and anatomical isolation.
3.  **Gaze Sliders:** Move the sliders to see the eyes track left/right/up/down.
4.  **Viseme Tester:** Select a mouth shape (like "AH" for open or "UW" for pucker) and click **PLAY**.
5.  **Mouth Level:** Manually slide this to simulate speech energy (useful for testing real-time audio integration).

---

## 4. File Structure Reference

| File | Purpose |
| :--- | :--- |
| `index.html` | The main interface and entry point. |
| `lib/particle-face-module.js` | The **Orchestrator**. It initializes and updates all sub-systems. |
| `lib/animation-deformer.js` | The **Engine**. It calculates particle movement (blinks/lips). |
| `lib/eye-controller.js` | Manages random blinking, saccades, and gaze tracking. |
| `lib/viseme-adapter.js` | Translates viseme IDs into specific mouth weights. |
| `lib/expression-system.js` | Handles emotional state blending. |
| `lib/region-mapper.js` | Defines the boundaries for eyes and mouth. |

---

## 5. Performance Optimization
*   **Memory:** Uses less than 8MB of GPU memory.
*   **Rendering:** Uses a single `THREE.Points` draw call for maximum performance.
*   **Update Loop:** Deformations are calculated on the CPU and updated via `needsUpdate`, ensuring compatibility across all mobile devices at 60 FPS.

---

*This guide was generated to help developers and users understand the JamesGPT Particle Face system.*
