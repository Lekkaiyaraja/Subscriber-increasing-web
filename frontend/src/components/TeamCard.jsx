import PlayerCard from './PlayerCard.jsx';

function TeamCard({ teamName, players, onVote }) {
  return (
    <section style={{ background: '#fff', borderRadius: 16, padding: 'clamp(16px, 4vw, 20px)', boxShadow: '0 16px 35px rgba(15, 39, 95, 0.08)' }}>
      <h2 style={{ marginTop: 0, color: '#0b3d91', fontSize: 'clamp(18px, 4vw, 22px)' }}>{teamName}</h2>
      <div style={{ display: 'grid', gap: 14 }}>
        {players.length === 0 ? (
          <p style={{ color: '#556', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>No players selected yet.</p>
        ) : (
          players.map((player) => (
            <PlayerCard key={player._id} player={player} onVote={onVote} />
          ))
        )}
      </div>
    </section>
  );
}

export default TeamCard;
