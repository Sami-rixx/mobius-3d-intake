// Pure CSS 3D Background - No WebGL dependencies
// This guarantees the background will always work

function Background3D() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-night via-muse-blue to-night" />
      
      {/* 5 Floating CSS Shapes */}
      
      {/* Shape 1: Torus-like ring (CSS) */}
      <div 
        className="absolute w-32 h-32 rounded-full border-4 border-accent-teal/10 opacity-15 animate-float"
        style={{ 
          top: '15%', 
          left: '10%',
          animationDelay: '0s',
          animationDuration: '20s'
        }}
      />
      
      {/* Shape 2: Icosahedron-like (CSS polygon) */}
      <div 
        className="absolute w-28 h-28 opacity-15 animate-float"
        style={{ 
          top: '70%', 
          right: '15%',
          animationDelay: '2s',
          animationDuration: '25s',
          clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)',
          background: 'linear-gradient(135deg, rgba(201, 169, 110, 0.15), rgba(201, 169, 110, 0.05))'
        }}
      />
      
      {/* Shape 3: Octahedron-like (CSS diamond) */}
      <div 
        className="absolute w-24 h-24 opacity-15 animate-float"
        style={{ 
          top: '40%', 
          right: '30%',
          animationDelay: '4s',
          animationDuration: '30s',
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          background: 'linear-gradient(135deg, rgba(27, 58, 92, 0.15), rgba(27, 58, 92, 0.05))'
        }}
      />
      
      {/* Shape 4: Tetrahedron-like (CSS triangle) */}
      <div 
        className="absolute w-0 h-0 border-l-[4rem] border-r-[4rem] border-b-[7rem] border-l-transparent border-r-transparent border-b-accent-teal/10 opacity-15 animate-float"
        style={{ 
          bottom: '20%', 
          left: '20%',
          animationDelay: '1s',
          animationDuration: '18s'
        }}
      />
      
      {/* Shape 5: Dodecahedron-like (CSS rounded) */}
      <div 
        className="absolute w-36 h-36 rounded-[20%] opacity-15 animate-pulse-soft"
        style={{ 
          bottom: '40%', 
          right: '25%',
          animationDelay: '3s',
          animationDuration: '22s',
          background: 'radial-gradient(circle, rgba(201, 169, 110, 0.15), rgba(201, 169, 110, 0.05))'
        }}
      />
    </div>
  );
}

export default Background3D;
