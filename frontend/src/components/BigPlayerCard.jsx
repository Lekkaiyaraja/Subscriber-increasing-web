import { useState } from 'react';
import { API } from '../config.js';

function BigPlayerCard({ player, onVote, teamColor }) {
  const [isVoting, setIsVoting] = useState(false);
  const [celebration, setCelebration] = useState(false);

  const handleVote = async () => {
    if (isVoting) return;
    setIsVoting(true);
    setCelebration(true);
    await onVote(player._id);
    setTimeout(() => {
      setIsVoting(false);
      setCelebration(false);
    }, 1000);
  };

  return (
    <div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 12px 28px rgba(15, 39, 95, 0.12)',
        background: '#fff',
        border: `2px solid ${teamColor || '#dfe7f5'}`,
        cursor: 'pointer',
        transform: celebration ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.3s ease',
        position: 'relative',
      }}
    >
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src={player.photo ? `${API}${player.photo}` : 'https://via.placeholder.com/200x240?text=Player'}
          alt={player.name}
          style={{
            width: '100%',
            height: 'clamp(200px, 35vw, 240px)',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: celebration ? 'rgba(0,0,0,0.3)' : 'transparent',
            display: celebration ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 60,
            animation: celebration ? 'celebrate 0.8s ease-out' : 'none',
          }}
        >
          ✨
        </div>
      </div>

      <div style={{ padding: 'clamp(10px, 2.5vw, 14px)' }}>
        <h3 style={{ margin: '0 0 8px', color: '#0b3d91', fontSize: 'clamp(13px, 3vw, 16px)', fontWeight: '700' }}>
          {player.name}
        </h3>
        <p style={{ margin: '0 0 12px', color: '#556', fontSize: 'clamp(11px, 2.5vw, 13px)' }}>
          Votes: {player.votes || 0}
        </p>
        <button
          onClick={handleVote}
          disabled={isVoting}
          style={{
            width: '100%',
            background: teamColor || '#0b3d91',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: 'clamp(8px, 2vw, 10px) 12px',
            fontWeight: '700',
            cursor: isVoting ? 'not-allowed' : 'pointer',
            opacity: isVoting ? 0.7 : 1,
            transition: 'all 0.2s ease',
            fontSize: 'clamp(11px, 2.5vw, 13px)',
          }}
        >
          {isVoting ? '✓ Voted' : 'Vote Now'}
        </button>
      </div>

      <style>{`
        @keyframes celebrate {
          0% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.2) rotate(15deg); }
          100% { transform: scale(0.5) rotate(-15deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default BigPlayerCard;
