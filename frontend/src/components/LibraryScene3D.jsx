import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, RoundedBox, Float } from '@react-three/drei';
import * as THREE from 'three';

// Detect WebGL availability
function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

/**
 * Bottom Book (Warm Yellow/Gold with Red Bookmark Ribbon)
 */
function BottomBook({ hovered, setHovered }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    // Gentle breathing
    meshRef.current.position.y = -0.1 + Math.sin(t * 1.2) * 0.015;
  });

  return (
    <group 
      ref={meshRef}
      position={[0.2, -0.1, 0]} 
      rotation={[-0.15, -0.42, 0.05]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered('bottomBook'); }}
      onPointerOut={() => setHovered(null)}
    >
      {/* Bottom Cover */}
      <RoundedBox args={[2.0, 0.28, 2.5]} radius={0.06} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color={hovered === 'bottomBook' ? '#FFA500' : '#FFB703'} 
          roughness={0.28} 
          metalness={0.05} 
        />
      </RoundedBox>

      {/* Pages Block (Cream parchment) */}
      <mesh position={[0.04, 0.01, 0.02]}>
        <boxGeometry args={[1.88, 0.24, 2.42]} />
        <meshStandardMaterial color="#FFF9ED" roughness={0.7} />
      </mesh>

      {/* Red Bookmark Ribbon draping out from the bottom edge */}
      <group position={[-0.6, -0.13, 1.25]} rotation={[0.4, 0.2, -0.1]}>
        {/* Ribbon upper strip */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.22, 0.02, 0.45]} />
          <meshStandardMaterial color="#E63946" roughness={0.4} />
        </mesh>
        {/* Notched V-cut tip */}
        <mesh position={[0, -0.01, 0.26]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.12, 0.15, 3]} />
          <meshStandardMaterial color="#E63946" roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Top Book (Coral Red with Cream Pages and Yellow Bookmark Ribbon)
 */
function TopBook({ hovered, setHovered }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    // Gentle floating response
    meshRef.current.position.y = 0.28 + Math.sin(t * 1.5 + 0.5) * 0.02 + (hovered === 'topBook' ? 0.08 : 0);
    meshRef.current.rotation.y = -0.65 + Math.sin(t * 0.8) * 0.02;
  });

  return (
    <group 
      ref={meshRef}
      position={[0.28, 0.28, -0.05]} 
      rotation={[-0.15, -0.65, 0.05]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered('topBook'); }}
      onPointerOut={() => setHovered(null)}
    >
      {/* Top Book Cover */}
      <RoundedBox args={[1.85, 0.28, 2.3]} radius={0.07} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color={hovered === 'topBook' ? '#FF3344' : '#F04A53'} 
          roughness={0.25} 
          metalness={0.05} 
        />
      </RoundedBox>

      {/* Pages Block */}
      <mesh position={[0.03, 0.01, 0.02]}>
        <boxGeometry args={[1.74, 0.23, 2.22]} />
        <meshStandardMaterial color="#FFF9ED" roughness={0.7} />
      </mesh>

      {/* Gold/Red Bookmark Ribbon at spine */}
      <group position={[-0.55, -0.12, 1.15]} rotation={[0.45, 0.15, -0.15]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.18, 0.02, 0.35]} />
          <meshStandardMaterial color="#FFBA08" roughness={0.35} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Minimalist White Pencil Holder with Lime Green Pencil inside
 */
function PencilHolder({ hovered, setHovered }) {
  const meshRef = useRef();

  return (
    <group 
      ref={meshRef} 
      position={[-1.75, 0.05, -0.25]}
      onPointerOver={(e) => { e.stopPropagation(); setHovered('holder'); }}
      onPointerOut={() => setHovered(null)}
    >
      {/* White Cube Ceramic Container */}
      <RoundedBox args={[0.9, 0.9, 0.9]} radius={0.08} smoothness={4}>
        <meshStandardMaterial 
          color="#FFFFFF" 
          roughness={0.2} 
          metalness={0.02} 
        />
      </RoundedBox>

      {/* Inner Hollow Cavity */}
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.45, 24]} />
        <meshStandardMaterial color="#E8DFD8" roughness={0.6} />
      </mesh>

      {/* Lime Green Chunky Pencil tilted inside the holder */}
      <group position={[0.08, 0.5, 0.02]} rotation={[0.25, 0.1, -0.38]}>
        {/* Pencil Body */}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.85, 12]} />
          <meshStandardMaterial color="#70E000" roughness={0.3} />
        </mesh>
        {/* Sharpened Wood Cone */}
        <mesh position={[0, 0.77, 0]}>
          <coneGeometry args={[0.1, 0.2, 12]} />
          <meshStandardMaterial color="#E9D8A6" roughness={0.5} />
        </mesh>
        {/* Green Lead Tip */}
        <mesh position={[0, 0.85, 0]}>
          <coneGeometry args={[0.035, 0.07, 12]} />
          <meshStandardMaterial color="#38B000" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Cute Rounded Ceramic Potted Plant with Green Succulent Leaves
 */
function PottedPlant() {
  return (
    <group position={[1.85, 0.45, -1.3]}>
      {/* White Ceramic Pot */}
      <mesh position={[0, -0.1, 0]}>
        <sphereGeometry args={[0.55, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
      </mesh>
      {/* Pot Interior Soil */}
      <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 24]} />
        <meshStandardMaterial color="#58311B" roughness={0.9} />
      </mesh>

      {/* Green Succulent / Sprout Leaves */}
      {/* Leaf 1 - Left */}
      <mesh position={[-0.2, 0.32, 0.05]} rotation={[0.3, 0.2, 0.6]}>
        <coneGeometry args={[0.18, 0.55, 16]} />
        <meshStandardMaterial color="#55A630" roughness={0.35} />
      </mesh>
      {/* Leaf 2 - Right */}
      <mesh position={[0.22, 0.35, -0.05]} rotation={[-0.2, -0.3, -0.55]}>
        <coneGeometry args={[0.17, 0.52, 16]} />
        <meshStandardMaterial color="#70E000" roughness={0.35} />
      </mesh>
      {/* Leaf 3 - Front Center */}
      <mesh position={[0.02, 0.38, 0.18]} rotation={[0.55, 0, 0]}>
        <coneGeometry args={[0.16, 0.48, 16]} />
        <meshStandardMaterial color="#38B000" roughness={0.35} />
      </mesh>
      {/* Leaf 4 - Back */}
      <mesh position={[-0.05, 0.42, -0.18]} rotation={[-0.45, 0.2, -0.1]}>
        <coneGeometry args={[0.15, 0.45, 16]} />
        <meshStandardMaterial color="#55A630" roughness={0.35} />
      </mesh>
    </group>
  );
}

/**
 * Desk Pencils lying in front of the books
 */
function DeskPencils() {
  return (
    <group position={[1.5, -0.65, 0.85]} rotation={[0.05, -0.4, 0.02]}>
      {/* Blue Pencil */}
      <group position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        {/* Body */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.9, 12]} />
          <meshStandardMaterial color="#4361EE" roughness={0.3} />
        </mesh>
        {/* Wood cone */}
        <mesh position={[0, -0.15, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.075, 0.2, 12]} />
          <meshStandardMaterial color="#E9D8A6" roughness={0.6} />
        </mesh>
        {/* Blue tip */}
        <mesh position={[0, -0.22, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.028, 0.08, 12]} />
          <meshStandardMaterial color="#1B263B" roughness={0.3} />
        </mesh>
        {/* Metal band */}
        <mesh position={[0, 0.88, 0]}>
          <cylinderGeometry args={[0.078, 0.078, 0.08, 12]} />
          <meshStandardMaterial color="#D1D5DB" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Purple Eraser */}
        <mesh position={[0, 0.98, 0]}>
          <cylinderGeometry args={[0.073, 0.073, 0.14, 12]} />
          <meshStandardMaterial color="#7209B7" roughness={0.5} />
        </mesh>
      </group>

      {/* Lavender / Purple Pencil beside it */}
      <group position={[0.25, 0, -0.32]} rotation={[0, 0.2, Math.PI / 2]}>
        {/* Body */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.8, 12]} />
          <meshStandardMaterial color="#8338EC" roughness={0.3} />
        </mesh>
        {/* Wood cone */}
        <mesh position={[0, -0.13, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.075, 0.18, 12]} />
          <meshStandardMaterial color="#E9D8A6" roughness={0.6} />
        </mesh>
        {/* Purple tip */}
        <mesh position={[0, -0.2, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.028, 0.07, 12]} />
          <meshStandardMaterial color="#3A0CA3" roughness={0.3} />
        </mesh>
        {/* Cream Eraser */}
        <mesh position={[0, 0.82, 0]}>
          <cylinderGeometry args={[0.073, 0.073, 0.14, 12]} />
          <meshStandardMaterial color="#FFF1E6" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Yellow Sticky Note Pad with Peeling Corner
 */
function StickyNote() {
  return (
    <group position={[-0.6, -0.68, 1.2]} rotation={[-0.1, 0.3, -0.05]}>
      {/* Base square note */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.65, 0.02, 0.65]} />
        <meshStandardMaterial color="#FFEE32" roughness={0.5} />
      </mesh>
      {/* Slightly curled corner */}
      <mesh position={[0.26, 0.03, 0.26]} rotation={[0.2, 0, -0.25]}>
        <boxGeometry args={[0.2, 0.015, 0.2]} />
        <meshStandardMaterial color="#FFD60A" roughness={0.5} />
      </mesh>
    </group>
  );
}

/**
 * Entire Isometric Desk Scene Assembly
 */
function SceneContent() {
  const [hovered, setHovered] = useState(null);
  const groupRef = useRef();

  // Subtle interactive parallax based on pointer
  useFrame((state) => {
    if (!groupRef.current) return;
    const { x, y } = state.pointer;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, x * 0.12, 0.05);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -y * 0.08, 0.05);
  });

  return (
    <group ref={groupRef}>
      {/* Warm Ambient & Directional Key Lighting */}
      <ambientLight intensity={1.1} color="#FFF7F0" />
      <directionalLight 
        position={[6, 9, 7]} 
        intensity={1.5} 
        color="#FFFFFF" 
        castShadow 
      />
      <directionalLight 
        position={[-6, 5, -3]} 
        intensity={0.4} 
        color="#FFD6BA" 
      />
      <pointLight position={[0, 3, 2]} intensity={0.5} color="#FFE5D9" />

      {/* 3D Elements */}
      <BottomBook hovered={hovered} setHovered={setHovered} />
      <TopBook hovered={hovered} setHovered={setHovered} />
      <PencilHolder hovered={hovered} setHovered={setHovered} />
      <PottedPlant />
      <DeskPencils />
      <StickyNote />

      {/* Soft Contact Shadows on Peach Ground Plane */}
      <ContactShadows 
        position={[0, -0.74, 0]} 
        opacity={0.45} 
        scale={8} 
        blur={1.8} 
        far={3} 
        color="#6B3410"
      />
    </group>
  );
}

/**
 * Main 3D Canvas with 2D Fallback
 */
export default function LibraryScene3D() {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    setHasWebGL(isWebGLAvailable());
  }, []);

  if (!hasWebGL) {
    return (
      <div className="scene-fallback" role="img" aria-label="3D Library Desk Illustration">
        <div className="fallback-clay-art">
          <div className="fallback-book-stack">
            <div className="fallback-book-bottom" />
            <div className="fallback-book-top" />
          </div>
          <div className="fallback-holder">
            <div className="fallback-pencil" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scene-canvas-container" tabIndex={0} aria-label="Interactive 3D Online Library Desk Scene">
      <Canvas
        camera={{ position: [3.8, 3.4, 4.6], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
