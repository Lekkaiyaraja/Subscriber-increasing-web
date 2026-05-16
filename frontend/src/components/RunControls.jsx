function RunControls({ teams, onScore }) {
  return (
    <section style={{ background: '#fff', borderRadius: 18, padding: 'clamp(16px, 4vw, 24px)', boxShadow: '0 18px 45px rgba(15, 39, 95, 0.08)', overflowX: 'hidden' }}>
      <h2 style={{ marginTop: 0, color: '#0b3d91', fontSize: 'clamp(18px, 4vw, 22px)' }}>Run Controls</h2>
      <div style={{ display: 'grid', gap: 16 }}>
        {teams.map((team) => (
          <div key={team} style={{ borderRadius: 14, border: '1px solid #dfe7f5', padding: 'clamp(12px, 3vw, 16px)' }}>
            <h3 style={{ margin: '0 0 12px', color: '#22375d', fontSize: 'clamp(14px, 3vw, 16px)' }}>{team}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {['1', '2', '3', '4', '6'].map((value) => (
                <button key={value} onClick={() => onScore(team, Number(value), false)} style={{ background: '#0b3d91', color: '#fff', border: 'none', borderRadius: 10, padding: 'clamp(10px, 2vw, 12px) clamp(14px, 3vw, 18px)', cursor: 'pointer', fontSize: 'clamp(12px, 2.5vw, 14px)', fontWeight: 700 }}>
                  +{value}
                </button>
              ))}
              <button onClick={() => onScore(team, 0, true)} style={{ background: '#e63946', color: '#fff', border: 'none', borderRadius: 10, padding: 'clamp(10px, 2vw, 12px) clamp(14px, 3vw, 18px)', cursor: 'pointer', fontSize: 'clamp(12px, 2.5vw, 14px)', fontWeight: 700 }}>
                Wicket
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default RunControls;
