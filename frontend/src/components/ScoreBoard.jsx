function ScoreBoard({ scores, teams, theme = {}, battingTeam }) {
  const isActive = (team) => battingTeam && battingTeam === team;

  return (
    <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr', alignItems: 'stretch', minWidth: 0, overflow: 'visible' }}>
      <style>{`
        @media (max-width: 768px) {
          .scoreboard-grid { 
            grid-template-columns: 1fr !important; 
            gap: clamp(14px, 3vw, 18px) !important;
            min-width: 0 !important;
          }
        }
        @media (max-width: 480px) {
          .scoreboard-grid { 
            grid-template-columns: 1fr !important; 
            gap: clamp(10px, 2.5vw, 14px) !important;
            min-width: 0 !important;
            overflow: visible !important;
          }
        }
      `}</style>
      <div className="scoreboard-grid" style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr', alignItems: 'stretch', minWidth: 0, overflow: 'visible' }}>
        {teams.map((team, index) => {
          const score = scores.find((item) => item.team === team);
          const teamColor = index === 0 ? theme.teamAColor : theme.teamBColor;
          const active = isActive(team);
          return (
            <div
              key={team || index}
              style={{
                position: 'relative',
                padding: 'clamp(16px, 4vw, 28px)',
                borderRadius: 24,
                border: `1px solid ${active ? 'rgba(255,255,255,0.55)' : 'rgba(16, 47, 120, 0.12)'}`,
                minWidth: 0,
                width: '100%',
                background: active
                  ? `linear-gradient(135deg, ${teamColor}33, rgba(255,255,255,0.12))`
                  : `linear-gradient(135deg, ${teamColor}12, rgba(255,255,255,0.06))`,
                boxShadow: active ? `0 30px 80px rgba(15, 39, 95, 0.18)` : '0 24px 60px rgba(15, 39, 95, 0.08)',
                overflow: 'visible',
                minHeight: 'fit-content',
                flexShrink: 0,
                transition: 'transform 180ms ease, box-shadow 180ms ease',
                transform: active ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(16px, 3vw, 24px)' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 'clamp(11px, 2vw, 14px)', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4c6b95' }}>Team</p>
                  <h3 style={{ margin: '8px 0 0', fontSize: 'clamp(20px, 5vw, 28px)', color: theme.teamAColor || '#0d3b7a' }}>{team}</h3>
                </div>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: teamColor || '#0b3d91', boxShadow: active ? `0 0 0 6px ${teamColor}44` : 'none' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 'clamp(48px, 10vw, 72px)', fontWeight: 800, lineHeight: 1, color: '#102341' }}>{score ? score.runs : 0}</span>
                <span style={{ fontSize: 'clamp(24px, 6vw, 32px)', color: '#4f627c', fontWeight: 700 }}>/ {score ? score.wickets : 0}</span>
              </div>
              <p style={{ margin: '18px 0 0', color: '#5f6f8c', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>Wickets: {score?.wickets ?? 0}</p>
              {active ? <div style={{ marginTop: 18, padding: '12px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.2)', color: '#102341', fontWeight: 700, fontSize: 'clamp(11px, 2.5vw, 13px)' }}>Currently batting</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ScoreBoard;
