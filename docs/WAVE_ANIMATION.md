# Three.js Wave Animation Documentation

Interactive 3D wave particle background for the landing page, built with **React Three Fiber** and custom **GLSL shaders**.

## Quick Reference

| Tech | Usage |
|------|-------|
| **React Three Fiber** | React wrapper for Three.js |
| **@react-three/drei** | `shaderMaterial` helper |
| **Three.js** | WebGL rendering, raycasting, geometry |
| **GLSL** | Custom vertex/fragment shaders |
| **Simplex Noise** | Procedural wave generation |

---

## Files

| File | Purpose |
|------|---------|
| `components/backgrounds/WaveBackground.tsx` | Main implementation (422 lines) |
| `types/r3f-extensions.d.ts` | TypeScript declarations for custom material |
| `app/page.tsx` | Dynamic import integration |

---

## Architecture Overview

```
User Interaction
       ↓
mousemove/touch → Raycasting to world coords
       ↓
useFrame (per-frame):
  • Lerp mouse position (0.15 factor)
  • Update shader uniforms
       ↓
Vertex Shader:
  • Simplex noise → ambient waves
  • Distance-based ripples
  • Y displacement
       ↓
Fragment Shader:
  • Circular dots with glow
  • Depth & edge fading
       ↓
WebGL Canvas (additive blending)
```

---

## Three.js APIs Used

### Core Objects
- `THREE.Vector2/Vector3` - Position tracking
- `THREE.Raycaster` - Mouse-to-world coordinate mapping
- `THREE.Plane` - Intersection plane at y=0
- `THREE.Color` - Dot color management
- `THREE.MathUtils.lerp()` - Smooth interpolation
- `THREE.AdditiveBlending` - Color accumulation

### React Three Fiber
- `Canvas` - WebGL context
- `useFrame` - Animation loop
- `useThree` - Camera/renderer access
- `extend` - Register custom material
- `shaderMaterial` - Create reusable shader material

### Geometry
- `BufferGeometry` - GPU-optimized point cloud
- `Points` - Render as dots
- `bufferAttribute` - Float32Array positions

---

## Wave Algorithm

### 1. Ambient Waves (Simplex Noise)

Three layered noise waves with diagonal coordinate rotation:

```glsl
// Diagonal coords (45° rotation) for non-linear flow
float diagonal1 = (pos.x + pos.z) * 0.707;
float diagonal2 = (pos.x - pos.z) * 0.707;

// Three octaves with different frequencies
float wave1 = snoise(vec2(diagonal1 * 0.15 + uTime * 0.25, diagonal2 * 0.12)) * 0.5;
float wave2 = snoise(vec2(diagonal2 * 0.2 - uTime * 0.18, diagonal1 * 0.18)) * 0.35;
float wave3 = snoise(vec2(diagonal1 * 0.08 + uTime * 0.12, diagonal2 * 0.1)) * 0.6;
```

### 2. Mouse Ripples

Interactive ripples with exponential falloff:

```glsl
float mouseDistance = length(pos.xz - uMouse);
float falloff = exp(-mouseDistance * 0.08);
float rippleStrength = falloff * smoothstep(35.0, 10.5, mouseDistance);

// Two harmonic waves
float primaryRipple = sin(mouseDistance * 0.4 - uTime * 2.0) * 1.2;
float secondaryRipple = sin(mouseDistance * 0.7 - uTime * 2.8) * 0.4;
```

### 3. Final Displacement

```glsl
pos.y += ambientWave + ripple + pushDown;
```

---

## Shader Uniforms

| Uniform | Type | Description |
|---------|------|-------------|
| `uTime` | float | Elapsed time for animation |
| `uMouse` | vec2 | Mouse position in world space |
| `uMouseActive` | float | 0-1 lerped activation |
| `uColor` | vec3 | Dot color (RGB) |
| `uIntensity` | float | Global effect strength |
| `uPointSize` | float | Base dot size (4.0) |
| `uMaxDepth` | float | Grid depth for fade |

---

## Fragment Shader Effects

```glsl
// Circular dot with soft glow
float coreAlpha = 1.0 - smoothstep(0.2, 0.35, dist);   // Sharp core
float glowAlpha = (1.0 - smoothstep(0.1, 0.5, dist)) * 0.6; // Soft halo

// Brightness modulation
float brightness = 0.6 + vElevation * 0.15;  // Raised = brighter

// Depth & edge fading
float depthFade = smoothstep(0.0, 0.5, vDepth);
float edgeFade = 1.0 - smoothstep(0.7, 1.0, vDistanceFromCenter);
```

---

## Configuration

### Component Props

```typescript
interface WaveBackgroundProps {
  className?: string;      // CSS classes
  dotColor?: string;       // Hex color (default: '#6366f1')
  intensity?: number;      // Effect strength (default: 1.0)
}
```

### Responsive Grid

```typescript
const gridSize = useMemo(() => {
  if (isMobile) return 30;     // 900 points
  if (isLowEnd) return 35;     // 1,225 points
  return 50;                   // 2,500 points
}, [isMobile, isLowEnd]);
```

### Camera Setup

```typescript
camera: {
  position: [20, 25, 30],  // Isometric-like view
  fov: 60,
  near: 0.1,
  far: 200
}
```

---

## Performance Optimizations

| Optimization | Benefit |
|--------------|---------|
| Device detection (`isMobile`, `isLowEnd`) | Adaptive grid density |
| DPR capping `Math.min(dpr, 2)` | Prevents excessive resolution |
| Antialias disabled on mobile | Reduces GPU load |
| `frustumCulled={false}` | Ensures ripples always render |
| `depthWrite={false}` | Reduces bandwidth |
| `if (alpha < 0.01) discard` | Early fragment exit |
| Memoized positions/callbacks | Avoids recalculation |
| Reusable `tempVec2/3` | Zero allocation in events |
| Passive touch listeners | Better scroll performance |

---

## Next.js Integration

### Dynamic Import (SSR disabled)

```typescript
const WaveBackground = dynamic(
  () => import('@/components/backgrounds/WaveBackground'),
  { ssr: false }  // Three.js requires browser
);
```

### Usage

```tsx
<WaveBackground
  className="absolute inset-0"
  dotColor="#6366f1"
  intensity={1.0}
/>
```

---

## Loading & Fade-In

The component handles loading gracefully with a smooth fade-in:

1. **Initial state**: Container starts with `opacity: 0`
2. **Ready detection**: Canvas `onCreated` callback fires when WebGL context is ready
3. **Fade-in**: CSS transition animates to `opacity: 1` over 700ms

```typescript
const [isReady, setIsReady] = useState(false);

const handleCreated = useCallback(() => {
  requestAnimationFrame(() => setIsReady(true));
}, []);

<div style={{ opacity: isReady ? 1 : 0 }}
     className="transition-opacity duration-700 ease-out">
  <Canvas onCreated={handleCreated}>
    ...
  </Canvas>
</div>
```

This prevents the jarring "pop-in" effect from dynamic imports + WebGL initialization.

---

## References

- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Three.js Documentation](https://threejs.org/docs/)
- [Simplex Noise Algorithm](https://en.wikipedia.org/wiki/Simplex_noise)
- [GLSL Shaders](https://thebookofshaders.com/)
- [@react-three/drei](https://github.com/pmndrs/drei)
