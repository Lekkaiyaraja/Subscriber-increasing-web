import { useEffect, useState } from 'react';
import { buildImageUrl, handleImageError } from '../utils/imageHelpers.js';

function ApprovedUserOverlay({ user, onClose }) {
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(false);
      setTimeout(onClose, 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: animate ? 'fadeInOverlay 0.4s ease' : 'fadeOutOverlay 0.3s ease',
        padding: 'clamp(16px, 5vw, 20px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          padding: 'clamp(20px, 5vw, 28px)',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          maxWidth: 300,
          animation: animate ? 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'popOut 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontSize: 'clamp(32px, 8vw, 40px)',
            marginBottom: 12,
            animation: 'bounce 0.6s ease infinite',
          }}
        >
          🎉
        </div>
        <img
          src={buildImageUrl(user.photo)}
          alt="approved user"
          onError={handleImageError}
          style={{
            width: 'clamp(120px, 30vw, 160px)',
            height: 'clamp(120px, 30vw, 160px)',
            borderRadius: 14,
            objectFit: 'cover',
            marginBottom: 16,
            border: '3px solid #0b3d91',
            boxShadow: '0 8px 20px rgba(11, 61, 145, 0.2)',
          }}
        />
        <h2 style={{ margin: '0 0 8px', color: '#0b3d91', fontSize: 'clamp(16px, 4vw, 18px)' }}>
          Photo Approved! 🏆
        </h2>
        <p style={{ margin: '0 0 4px', color: '#556', fontSize: 'clamp(11px, 2.5vw, 13px)' }}>
          {user.name || user.playerId?.name || 'Fan Photo'}
        </p>
        <p style={{ margin: 0, color: '#889', fontSize: 'clamp(10px, 2vw, 12px)' }}>
          Featured on live broadcast
        </p>
      </div>

      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOutOverlay {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes popIn {
          from { transform: scale(0.6) rotateX(-30deg); opacity: 0; }
          to { transform: scale(1) rotateX(0deg); opacity: 1; }
        }
        @keyframes popOut {
          from { transform: scale(1); opacity: 1; }
          to { transform: scale(0.6); opacity: 0; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}

export default ApprovedUserOverlay;
