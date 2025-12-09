import React from 'react';

const LoadingSpinner = () => {
  // SFH Logo Component for Loading
  const Logo = () => {
    return (
      <div className="logo-container">
        <div className="logo-circle">
          <span className="logo-text">SFH</span>
        </div>
        <style jsx>{`
          .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .logo-circle {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #D4AF37 0%, #F7E7CE 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
          }
          .logo-text {
            color: #1C1C1C;
            font-family: 'Playfair Display', serif;
            font-weight: bold;
            font-size: 1.2rem;
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className="loading-container">
      <div className="luxury-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-center">
          <Logo />
        </div>
      </div>
      <p className="loading-text">Loading Luxury Collection...</p>
      
      <style jsx>{`
        .loading-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #1C1C1C, #0a0a0a);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        
        .luxury-spinner {
          position: relative;
          width: 120px;
          height: 120px;
        }
        
        .spinner-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 3px solid transparent;
          border-top: 3px solid #D4AF37;
          border-radius: 50%;
          animation: spin 2s linear infinite;
        }
        
        .spinner-ring:nth-child(1) {
          animation-delay: 0s;
        }
        
        .spinner-ring:nth-child(2) {
          animation-delay: 0.3s;
          border-top-color: #4B1C2F;
        }
        
        .spinner-ring:nth-child(3) {
          animation-delay: 0.6s;
          border-top-color: #014421;
        }
        
        .spinner-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          background: rgba(212, 175, 55, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .loading-text {
          margin-top: 2rem;
          color: #D4AF37;
          font-size: 1.1rem;
          font-weight: 500;
          animation: fadeInOut 2s ease-in-out infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;