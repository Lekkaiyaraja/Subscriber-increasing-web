import { useState } from 'react';

function UploadAndVote({ players, onUpload, onVote }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('Upload a fan photo for approval');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!photoFile) {
      setUploadMessage('Choose an image file first');
      return;
    }
    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('playerId', selectedPlayerId);
    await onUpload(formData);
    setSelectedPlayerId('');
    setPhotoFile(null);
    setUploadMessage('Upload sent for admin approval');
  };

  return (
    <section style={{ background: '#fff', borderRadius: 18, padding: 24, boxShadow: '0 18px 45px rgba(15, 39, 95, 0.08)' }}>
      <h2 style={{ marginTop: 0, color: '#0b3d91' }}>Fan Upload & Vote</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14, marginBottom: 24 }}>
        <label style={{ display: 'grid', gap: 6, color: '#334' }}>
          Select player to vote
          <select value={selectedPlayerId} onChange={(e) => setSelectedPlayerId(e.target.value)} style={{ padding: 10, borderRadius: 10, border: '1px solid #d0d7ee' }}>
            <option value="">Choose a player</option>
            {players.map((player) => (
              <option key={player._id} value={player._id}>{player.name} ({player.teamName || player.teamId?.name || 'Unknown'})</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6, color: '#334' }}>
          Upload fan photo
          <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} />
        </label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="submit" style={{ background: '#0b3d91', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 18px', cursor: 'pointer' }}>
            Submit Upload
          </button>
          {selectedPlayerId ? (
            <button type="button" onClick={() => onVote(selectedPlayerId)} style={{ background: '#1d70b8', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 18px', cursor: 'pointer' }}>
              Vote Now
            </button>
          ) : null}
        </div>
      </form>
      <p style={{ margin: 0, color: '#556' }}>{uploadMessage}</p>
      <div style={{ marginTop: 24 }}>
        <h3 style={{ color: '#0b3d91' }}>Player Vote List</h3>
        <ul style={{ paddingLeft: 20, margin: 0, color: '#334' }}>
          {players.slice(0, 6).map((player) => (
            <li key={player._id}>{player.name} — Votes: {player.votes || 0}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default UploadAndVote;
