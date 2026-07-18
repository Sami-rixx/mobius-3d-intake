import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useRef, useEffect, useState, Suspense } from 'react';
import React from 'react';
import * as THREE from 'three';

// Check if WebGL is available
function isWebGLAvailable() {
  try {
    return !!window.WebGLRenderingContext;
  } catch (e) {
    return false;
  }
}

// Fallback background (gradient)
function FallbackBackground() {
  return (
    <div className="fixed inset-0 z-0 bg-gradient-to-br from-night via-muse-blue to-night" />
  );
}

// Individual floating shape component
function FloatingShape({ 
  geometry, 
  position, 
  color, 
  size = 1,
  rotationSpeed = 0.1,
  floatSpeed = 1,
  floatIntensity = 1,
  index 
}) {
  const meshRef = useRef();
  const [deviceOrientation, setDeviceOrientation] = useState({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });

  // Handle device orientation for mobile
  useEffect(() => {
    const handleDeviceOrientation = (event) => {
      setDeviceOrientation({
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0,
      });
    };

    window.addEventListener('deviceorientation', handleDeviceOrientation);
    
    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      // Slow rotation
      meshRef.current.rotation.x = state.clock.elapsedTime * rotationSpeed * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * rotationSpeed * 0.8;
      
      // Floating up and down
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * floatSpeed) * floatIntensity;
      
      // Apply device tilt on mobile
      if (window.innerWidth <= 768) {
        const tiltX = (deviceOrientation.beta || 0) * 0.01;
        const tiltY = (deviceOrientation.gamma || 0) * 0.01;
        meshRef.current.rotation.x += tiltX * 0.5;
        meshRef.current.rotation.y += tiltY * 0.5;
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      {geometry}
      <meshBasicMaterial 
        color={color}
        transparent={true}
        opacity={0.15}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Low-poly torus knot
function TorusKnotShape({ position, color, size = 1 }) {
  return (
    <FloatingShape
      geometry={<torusKnotGeometry args={[size * 0.8, size * 0.3, 100, 16]} />}
      position={position}
      color={color}
      size={size}
      rotationSpeed={0.05}
      floatSpeed={0.8}
      floatIntensity={1.5}
    />
  );
}

// Icosahedron shape
function IcosahedronShape({ position, color, size = 1 }) {
  return (
    <FloatingShape
      geometry={<icosahedronGeometry args={[size * 1.2]} />}
      position={position}
      color={color}
      size={size}
      rotationSpeed={0.15}
      floatSpeed={1.2}
      floatIntensity={1}
    />
  );
}

// Octahedron shape
function OctahedronShape({ position, color, size = 1 }) {
  return (
    <FloatingShape
      geometry={<octahedronGeometry args={[size * 1.5]} />}
      position={position}
      color={color}
      size={size}
      rotationSpeed={0.1}
      floatSpeed={0.6}
      floatIntensity={2}
    />
  );
}

// Tetrahedron shape
function TetrahedronShape({ position, color, size = 1 }) {
  return (
    <FloatingShape
      geometry={<tetrahedronGeometry args={[size * 1.8]} />}
      position={position}
      color={color}
      size={size}
      rotationSpeed={0.2}
      floatSpeed={1.5}
      floatIntensity={0.8}
    />
  );
}

// Dodecahedron shape
function DodecahedronShape({ position, color, size = 1 }) {
  return (
    <FloatingShape
      geometry={<dodecahedronGeometry args={[size * 1.1]} />}
      position={position}
      color={color}
      size={size}
      rotationSpeed={0.08}
      floatSpeed={0.9}
      floatIntensity={1.2}
    />
  );
}

// Error boundary for 3D canvas
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('3D Canvas error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <FallbackBackground />;
    }
    return this.props.children;
  }
}

// Main 3D Background Component
function Background3D() {
  // Check if we're in a browser environment with WebGL
  const [show3D, setShow3D] = useState(false);

  useEffect(() => {
    // Only show 3D if WebGL is available and we're in a browser
    if (typeof window !== 'undefined' && isWebGLAvailable()) {
      setShow3D(true);
    }
  }, []);

  if (!show3D) {
    return <FallbackBackground />;
  }

  return (
    <CanvasErrorBoundary>
      <Canvas
        camera={{ 
          position: [0, 0, 30], 
          fov: 60,
          near: 1,
          far: 1000 
        }}
        style={{ background: 'transparent' }}
        gl={{ antialias: false, alpha: true }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} color="#ffffff" />
        <directionalLight 
          position={[10, 10, 10]} 
          intensity={0.3} 
          color="#2FA6A0" 
        />
        <directionalLight 
          position={[-10, -10, -10]} 
          intensity={0.3} 
          color="#C9A96E" 
        />
        <pointLight position={[20, 20, 20]} color="#2FA6A0" intensity={0.5} />
        <pointLight position={[-20, -20, -20]} color="#C9A96E" intensity={0.5} />

        {/* Environment for reflections */}
        <Environment preset="city" />

        {/* 5 Floating Shapes - positioned behind UI */}
        <Suspense fallback={null}>
          <TorusKnotShape 
            position={[15, 8, -15]} 
            color="#2FA6A0" 
            size={2}
          />
          <IcosahedronShape 
            position={[-12, -6, -20]} 
            color="#C9A96E" 
            size={1.5}
          />
          <OctahedronShape 
            position={[10, -10, -18]} 
            color="#1B3A5C" 
            size={1.2}
          />
          <TetrahedronShape 
            position={[-8, 12, -12]} 
            color="#2FA6A0" 
            size={1}
          />
          <DodecahedronShape 
            position={[5, -15, -25]} 
            color="#C9A96E" 
            size={1.3}
          />
        </Suspense>

        {/* Disable orbit controls - we want fixed camera */}
        <OrbitControls 
          enabled={false}
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </CanvasErrorBoundary>
  );
}

// Memoized version for performance
export default Background3D;
