import { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../config.js';
import { socket } from '../socket.js';

function SupporterGroupBadgesManager() {
  const [badges, setBadges] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      const { data } = await axios.get(`${API}/api/admin/badges`);
      setBadges(data || []);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    load();
    socket.on('badgesUpdated', load);
    return () => socket.off('badgesUpdated', load);
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || !file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('groupName', groupName.trim());
      form.append('badgeImage', file);
      await axios.post(`${API}/api/admin/badges`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setGroupName('');
      setFile(null);
      load();
    } catch (err) {
      // ignore
    }
    setLoading(false);
  };

  const handleDelete = async (g) => {
    if (!confirm(`Delete badge for ${g}?`)) return;
    try {
      await axios.delete(`${API}/api/admin/badges/${encodeURIComponent(g)}`);
      load();
    } catch (err) {}
  };

  const startEdit = (b) => {
    setEditing(b);
    setGroupName(b.groupName);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    try {
      const form = new FormData();
      if (file) form.append('badgeImage', file);
      if (groupName && groupName.trim() !== editing.groupName) form.append('newGroupName', groupName.trim());
      await axios.patch(`${API}/api/admin/badges/${encodeURIComponent(editing.groupName)}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setEditing(null);
      setGroupName('');
      setFile(null);
      load();
    } catch (err) {}
    setLoading(false);
  };

  return (
    <section style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 20px 60px rgba(15, 39, 95, 0.08)' }}>
      <h3 style={{ marginTop: 0, color: '#0b3d91' }}>Supporter Group Badges Manager</h3>
      <p style={{ marginTop: 4, color: '#556' }}>Add / edit / remove supporter group badges to display on approved fan photos.</p>

      <form onSubmit={editing ? handleUpdate : handleAdd} style={{ display: 'grid', gap: 10, marginTop: 12 }}>
        <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name (e.g. TVK)" style={{ padding: 10, borderRadius: 8, border: '1px solid #e6eefc' }} />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] || null)} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" style={{ background: '#0b3d91', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8 }}>{editing ? 'Update Badge' : (loading ? 'Adding...' : 'Add Badge')}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setGroupName(''); setFile(null); }} style={{ background: '#e2e8f0', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Cancel</button>}
        </div>
      </form>

      <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
        {badges.length === 0 ? <p style={{ color: '#556' }}>No badges added yet.</p> : badges.map((b) => (
          <div key={b.groupName} style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', border: '1px solid #eef4ff', padding: 10, borderRadius: 10 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <img src={b.badgeImageUrl} alt={b.groupName} style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, background: '#fff', border: '1px solid #e6eefc' }} />
              <div>
                <div style={{ fontWeight: 700 }}>{b.groupName}</div>
                <div style={{ fontSize: 12, color: '#556' }}>{b.badgeImageUrl}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => startEdit(b)} style={{ background: '#1d70b8', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Edit</button>
              <button type="button" onClick={() => handleDelete(b.groupName)} style={{ background: '#e63946', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default SupporterGroupBadgesManager;
