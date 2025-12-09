import React from 'react';

const AnimatedBackground = () => {
  return (
    <div className="animated-background">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>
      
      <style jsx>{`
        .animated-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          overflow: hidden;
        }
        
        .bg-shape {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, var(--color), transparent);
          opacity: 0.1;
          filter: blur(60px);
          animation: float 20s ease-in-out infinite;
        }
        
        .shape-1 {
          --color: #D4AF37;
          width: 400px;
          height: 400px;
          top: 10%;
          left: 5%;
          animation-delay: 0s;
        }
        
        .shape-2 {
          --color: #4B1C2F;
          width: 300px;
          height: 300px;
          top: 60%;
          right: 10%;
          animation-delay: 5s;
        }
        
        .shape-3 {
          --color: #014421;
          width: 250px;
          height: 250px;
          bottom: 20%;
          left: 60%;
          animation-delay: 10s;
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          25% { 
            transform: translate(100px, 50px) rotate(90deg) scale(1.1);
          }
          50% { 
            transform: translate(50px, 100px) rotate(180deg) scale(0.9);
          }
          75% { 
            transform: translate(-50px, 50px) rotate(270deg) scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackground;