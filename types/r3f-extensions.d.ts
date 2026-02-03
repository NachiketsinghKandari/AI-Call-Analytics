import { ReactThreeFiber } from '@react-three/fiber';
import * as THREE from 'three';

// Extend JSX intrinsic elements for custom R3F materials
declare module '@react-three/fiber' {
  interface ThreeElements {
    waveDotMaterial: ReactThreeFiber.MaterialNode<
      THREE.ShaderMaterial,
      [THREE.ShaderMaterialParameters]
    >;
  }
}
