'use client';

import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

// =============================================================================
// Types
// =============================================================================

export interface WaveBackgroundProps {
  className?: string;
  dotColor?: string;
  intensity?: number;
}

interface DotTerrainProps {
  gridSize: number;
  dotColor: string;
  intensity: number;
}

// =============================================================================
// Shader Material Definition
// =============================================================================

type WaveDotMaterialUniforms = {
  uTime: number;
  uMouse: THREE.Vector2;
  uMouseActive: number;
  uColor: THREE.Color;
  uIntensity: number;
  uPointSize: number;
  uMaxDepth: number;
};

const WaveDotMaterial = shaderMaterial(
  // Uniforms
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0, 0),
    uMouseActive: 0,
    uColor: new THREE.Color('#ffffff'),
    uIntensity: 1.0,
    uPointSize: 3.0,
    uMaxDepth: 30.0,
  } as WaveDotMaterialUniforms,
  // Vertex Shader
  /* glsl */ `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uMouseActive;
    uniform float uIntensity;
    uniform float uPointSize;
    uniform float uMaxDepth;

    varying float vElevation;
    varying float vDistanceFromCenter;
    varying float vDepth;

    // Simplex noise functions for smooth wave generation
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                          -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
        + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec3 pos = position;

      // Diagonal coordinates (rotated 45 degrees) for non-linear wave flow
      float diagonal1 = (pos.x + pos.z) * 0.707; // 45 degree rotation
      float diagonal2 = (pos.x - pos.z) * 0.707; // perpendicular diagonal

      // Ambient wave animation - waves flow diagonally
      float wave1 = snoise(vec2(diagonal1 * 0.15 + uTime * 0.25, diagonal2 * 0.12)) * 0.5;
      float wave2 = snoise(vec2(diagonal2 * 0.2 - uTime * 0.18, diagonal1 * 0.18 + uTime * 0.08)) * 0.35;
      float wave3 = snoise(vec2(diagonal1 * 0.08 + uTime * 0.12, diagonal2 * 0.1 - uTime * 0.15)) * 0.6;

      float ambientWave = (wave1 + wave2 + wave3) * uIntensity;

      // Mouse ripple effect - cohesive and soothing
      float mouseDistance = length(pos.xz - uMouse);

      // Wide radius for far-reaching, gentle propagation
      float rippleRadius = 35.0;

      // Soft exponential falloff for smooth, natural decay
      float falloff = exp(-mouseDistance * 0.08);
      float rippleStrength = falloff * smoothstep(rippleRadius, rippleRadius * 0.3, mouseDistance);

      // Primary wave - slow, gentle undulation that propagates outward
      float primaryRipple = sin(mouseDistance * 0.4 - uTime * 2.0) * 1.2;

      // Secondary wave - subtle harmonic for natural feel
      float secondaryRipple = sin(mouseDistance * 0.7 - uTime * 2.8) * 0.4;

      // Combined ripple with smooth activation
      float ripple = (primaryRipple + secondaryRipple) * rippleStrength * uMouseActive * uIntensity;

      // Gentle push down effect - very subtle depression near cursor
      float pushDown = -falloff * 0.4 * uMouseActive;

      // Combine waves
      pos.y += ambientWave + ripple + pushDown;

      vElevation = pos.y;
      vDistanceFromCenter = length(pos.xz) / 30.0;

      // Calculate depth for fade effect (z goes from -maxDepth to +maxDepth approximately)
      // We want dots at the back (negative z in world space, before camera transform) to fade
      // The grid extends from -halfSize to +halfSize, so normalize based on that
      vDepth = clamp((pos.z + uMaxDepth) / (uMaxDepth * 2.0), 0.0, 1.0);

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

      // Size attenuation for depth perception
      gl_PointSize = uPointSize * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  /* glsl */ `
    uniform vec3 uColor;

    varying float vElevation;
    varying float vDistanceFromCenter;
    varying float vDepth;

    void main() {
      // Create circular dots with blur/glow effect
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);

      // Core of the dot (solid center)
      float coreAlpha = 1.0 - smoothstep(0.2, 0.35, dist);

      // Soft glow/blur around the dot
      float glowAlpha = (1.0 - smoothstep(0.1, 0.5, dist)) * 0.6;

      // Combine core and glow
      float alpha = max(coreAlpha, glowAlpha);

      if (alpha < 0.01) discard;

      // Modulate brightness based on elevation and distance
      float brightness = 0.6 + vElevation * 0.15;
      brightness *= (1.0 - vDistanceFromCenter * 0.3);
      brightness = clamp(brightness, 0.3, 1.0);

      vec3 finalColor = uColor * brightness;

      // Depth fade: dots at the back (low vDepth) fade out
      float depthFade = smoothstep(0.0, 0.5, vDepth);

      // Edge vignette fade
      float edgeFade = 1.0 - smoothstep(0.7, 1.0, vDistanceFromCenter);

      gl_FragColor = vec4(finalColor, alpha * 0.9 * depthFade * edgeFade);
    }
  `
);

// Extend Three.js with our custom material
extend({ WaveDotMaterial });

// Type declaration for the custom material
type WaveDotMaterialImpl = THREE.ShaderMaterial & WaveDotMaterialUniforms;

// =============================================================================
// DotTerrain Component
// =============================================================================

function DotTerrain({ gridSize, dotColor, intensity }: DotTerrainProps) {
  const materialRef = useRef<WaveDotMaterialImpl>(null);
  const { camera } = useThree();
  const mousePosition = useRef(new THREE.Vector2(0, 0));
  const targetMousePosition = useRef(new THREE.Vector2(0, 0));
  const mouseActive = useRef(0);
  const targetMouseActive = useRef(0);
  const raycaster = useRef(new THREE.Raycaster());
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  // Reusable vectors to avoid allocations in event handlers
  const tempVec2 = useMemo(() => new THREE.Vector2(), []);
  const tempVec3 = useMemo(() => new THREE.Vector3(), []);

  // Calculate spacing and max depth for the grid
  const { positions, maxDepth } = useMemo(() => {
    const points: number[] = [];
    const spacing = 1.2;
    const halfSize = (gridSize * spacing) / 2;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = i * spacing - halfSize;
        const z = j * spacing - halfSize;
        points.push(x, 0, z);
      }
    }

    return {
      positions: new Float32Array(points),
      maxDepth: halfSize,
    };
  }, [gridSize]);

  // Parse color - memoized
  const color = useMemo(() => new THREE.Color(dotColor), [dotColor]);

  // Mouse move handler - memoized to prevent recreation
  const handleMouseMove = useCallback((event: MouseEvent) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;

    tempVec2.set(x, y);
    raycaster.current.setFromCamera(tempVec2, camera);

    if (raycaster.current.ray.intersectPlane(plane.current, tempVec3)) {
      targetMousePosition.current.set(tempVec3.x, tempVec3.z);
      targetMouseActive.current = 1;
    }
  }, [camera, tempVec2, tempVec3]);

  const handleMouseLeave = useCallback(() => {
    targetMouseActive.current = 0;
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const x = (touch.clientX / window.innerWidth) * 2 - 1;
      const y = -(touch.clientY / window.innerHeight) * 2 + 1;

      tempVec2.set(x, y);
      raycaster.current.setFromCamera(tempVec2, camera);

      if (raycaster.current.ray.intersectPlane(plane.current, tempVec3)) {
        targetMousePosition.current.set(tempVec3.x, tempVec3.z);
        targetMouseActive.current = 1;
      }
    }
  }, [camera, tempVec2, tempVec3]);

  const handleTouchEnd = useCallback(() => {
    targetMouseActive.current = 0;
  }, []);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseLeave, handleTouchMove, handleTouchEnd]);

  // Animation loop - optimized uniform updates
  useFrame((state) => {
    const material = materialRef.current;
    if (material) {
      // Update time
      material.uTime = state.clock.elapsedTime;

      // Smooth mouse position lerp - faster tracking for better responsiveness
      mousePosition.current.lerp(targetMousePosition.current, 0.15);
      material.uMouse.copy(mousePosition.current);

      // Smooth mouse active lerp
      mouseActive.current = THREE.MathUtils.lerp(
        mouseActive.current,
        targetMouseActive.current,
        0.12
      );
      material.uMouseActive = mouseActive.current;
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <waveDotMaterial
        ref={materialRef}
        uColor={color}
        uIntensity={intensity}
        uPointSize={4.0}
        uMaxDepth={maxDepth}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// =============================================================================
// Scene Component
// =============================================================================

interface SceneProps {
  gridSize: number;
  dotColor: string;
  intensity: number;
}

function Scene({ gridSize, dotColor, intensity }: SceneProps) {
  return (
    <DotTerrain gridSize={gridSize} dotColor={dotColor} intensity={intensity} />
  );
}

// =============================================================================
// Helper function to get initial DPR
// =============================================================================

function getInitialDpr(isMobile: boolean): number {
  if (typeof window === 'undefined') return 1;
  return isMobile ? 1 : Math.min(window.devicePixelRatio, 2);
}

function getIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
}

function getIsLowEnd(): boolean {
  if (typeof window === 'undefined') return false;
  const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory || 4;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  return deviceMemory < 4 || hardwareConcurrency < 4;
}

// =============================================================================
// Main WaveBackground Component
// =============================================================================

export default function WaveBackground({
  className = '',
  dotColor = '#6366f1',
  intensity = 1.0,
}: WaveBackgroundProps) {
  // Initialize state with actual device values immediately to avoid blurriness
  const [isMobile] = useState(() => getIsMobile());
  const [isLowEnd] = useState(() => getIsLowEnd());
  const [dpr] = useState(() => getInitialDpr(getIsMobile()));

  // Grid size based on device capability - memoized
  const gridSize = useMemo(() => {
    if (isMobile) return 30;
    if (isLowEnd) return 35;
    return 50;
  }, [isMobile, isLowEnd]);

  return (
    <div
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ touchAction: 'none' }}
    >
      <Canvas
        dpr={dpr}
        camera={{
          position: [18, 15, 18],
          fov: 60,
          near: 0.1,
          far: 200,
        }}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: isMobile ? 'low-power' : 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <Scene
          gridSize={gridSize}
          dotColor={dotColor}
          intensity={intensity}
        />
      </Canvas>
    </div>
  );
}
