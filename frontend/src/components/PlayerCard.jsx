import { buildImageUrl, handleImageError } from '../utils/imageHelpers.js';

function PlayerCard({ player, onVote }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 'clamp(10px, 2.5vw, 14px)', borderRadius: 14, border: '1px solid #dfe7f5', background: '#fcfdff', flexWrap: 'wrap' }}>
      <img src={buildImageUrl(player.photo)} alt={player.name} onError={handleImageError} style={{ width: 'clamp(70px, 15vw, 84px)', height: 'clamp(70px, 15vw, 84px)', objectFit: 'cover', borderRadius: 14 }} />
      <div style={{ flex: 1, minWidth: 120 }}>
        <h3 style={{ margin: '0 0 6px', color: '#0b3d91', fontSize: 'clamp(14px, 3vw, 16px)' }}>{player.name}</h3>
        <p style={{ margin: 0, color: '#556', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>Votes: {player.votes || 0}</p>
      </div>
      {onVote ? (
        <button onClick={() => onVote(player._id)} style={{ background: '#0b3d91', color: '#fff', border: 'none', borderRadius: 10, padding: 'clamp(8px, 2vw, 10px) clamp(10px, 2.5vw, 14px)', cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(11px, 2.5vw, 13px)', whiteSpace: 'nowrap' }}>
          Vote
        </button>
      ) : null}
    </div>
  );
}

export default PlayerCard;
