import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

// Simple CSS-only 3D background as fallback
function Simple3DBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-night via-muse-blue to-night" />
      
      {/* Floating shapes using CSS transforms */}
      <div className="absolute inset-0">
        {/* Shape 1 - Floating circle */}
        <div 
          className="absolute w-32 h-32 rounded-full bg-accent-teal/10 opacity-15 animate-float"
          style={{ 
            top: '20%', 
            left: '10%',
            animationDelay: '0s',
            animationDuration: '20s'
          }}
        />
        
        {/* Shape 2 - Floating square */}
        <div 
          className="absolute w-24 h-24 rounded-lg bg-accent-gold/10 opacity-15 animate-float"
          style={{ 
            top: '60%', 
            right: '15%',
            animationDelay: '2s',
            animationDuration: '25s'
          }}
        />
        
        {/* Shape 3 - Floating triangle */}
        <div 
          className="absolute w-0 h-0 border-l-[3rem] border-r-[3rem] border-b-[5rem] border-l-transparent border-r-transparent border-b-accent-teal/10 opacity-15 animate-float"
          style={{ 
            top: '10%', 
            right: '30%',
            animationDelay: '4s',
            animationDuration: '30s'
          }}
        />
        
        {/* Shape 4 - Floating diamond */}
        <div 
          className="absolute w-20 h-20 rounded-full bg-accent-gold/10 opacity-15 animate-pulse-soft"
          style={{ 
            bottom: '20%', 
            left: '20%',
            animationDelay: '1s',
            animationDuration: '18s'
          }}
        />
        
        {/* Shape 5 - Floating hexagon */}
        <div 
          className="absolute w-28 h-28 rounded-[50%] bg-accent-teal/10 opacity-15 animate-float"
          style={{ 
            bottom: '40%', 
            right: '25%',
            animationDelay: '3s',
            animationDuration: '22s',
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
          }}
        />
      </div>
    </div>
  );
}

// Enhanced 3D Canvas with proper error handling
function Canvas3D() {
  const canvasRef = useRef(null);
  const [webGLAvailable, setWebGLAvailable] = useState(false);

  useEffect(() => {
    // Check if WebGL is available
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebGLAvailable(!!gl);
    } catch (e) {
      setWebGLAvailable(false);
    }
  }, []);

  useEffect(() => {
    if (!webGLAvailable || !canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 0, 30);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0x2FA6A0, 0.3);
    directionalLight1.position.set(10, 10, 10);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xC9A96E, 0.3);
    directionalLight2.position.set(-10, -10, -10);
    scene.add(directionalLight2);

    // Create 5 floating shapes
    const shapes = [];
    
    // Torus Knot
    const torusKnot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.8, 0.3, 100, 16),
      new THREE.MeshBasicMaterial({ color: 0x2FA6A0, transparent: true, opacity: 0.15 })
    );
    torusKnot.position.set(15, 8, -15);
    scene.add(torusKnot);
    shapes.push(torusKnot);

    // Icosahedron
    const icosahedron = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.2),
      new THREE.MeshBasicMaterial({ color: 0xC9A96E, transparent: true, opacity: 0.15 })
    );
    icosahedron.position.set(-12, -6, -20);
    scene.add(icosahedron);
    shapes.push(icosahedron);

    // Octahedron
    const octahedron = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.5),
      new THREE.MeshBasicMaterial({ color: 0x1B3A5C, transparent: true, opacity: 0.15 })
    );
    octahedron.position.set(10, -10, -18);
    scene.add(octahedron);
    shapes.push(octahedron);

    // Tetrahedron
    const tetrahedron = new THREE.Mesh(
      new THREE.TetrahedronGeometry(1.8),
      new THREE.MeshBasicMaterial({ color: 0x2FA6A0, transparent: true, opacity: 0.15 })
    );
    tetrahedron.position.set(-8, 12, -12);
    scene.add(tetrahedron);
    shapes.push(tetrahedron);

    // Dodecahedron
    const dodecahedron = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.1),
      new THREE.MeshBasicMaterial({ color: 0xC9A96E, transparent: true, opacity: 0.15 })
    );
    dodecahedron.position.set(5, -15, -25);
    scene.add(dodecahedron);
    shapes.push(dodecahedron);

    // Animation loop
    let time = 0;
    const animate = () => {
      time += 0.01;
      
      // Rotate all shapes
      shapes.forEach((shape, i) => {
        shape.rotation.x = time * (0.5 + i * 0.1);
        shape.rotation.y = time * (0.8 + i * 0.2);
        shape.position.y += Math.sin(time * (1 + i * 0.3)) * 0.01;
      });

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animate);
      renderer.dispose();
    };
  }, [webGLAvailable]);

  if (!webGLAvailable) {
    return <Simple3DBackground />;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ background: 'transparent' }}
    />
  );
}

// Main component with fallback
function Background3D() {
  const [useCanvas, setUseCanvas] = useState(true);

  useEffect(() => {
    // Try canvas first, fall back to CSS if it fails
    const timer = setTimeout(() => {
      setUseCanvas(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!useCanvas) {
    return <Simple3DBackground />;
  }

  return <Canvas3D />;
}

export default Background3D;
