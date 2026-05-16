import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { socket } from '../socket.js';
import { API } from '../config.js';
import ApprovedUserShowcase from '../components/ApprovedUserShowcase.jsx';
import ApprovedUserOverlay from '../components/ApprovedUserOverlay.jsx';
import ScoreBoard from '../components/ScoreBoard.jsx';

function AdminPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [match, setMatch] = useState(null);
  const [scores, setScores] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [message, setMessage] = useState('Enter admin credentials');
  const [playerName, setPlayerName] = useState('');

  const isTodayUpload = (upload) => {
    if (!upload || !upload.createdAt) return false;
    const today = new Date();
    const d = new Date(upload.createdAt);
    return (
      upload.approved === true &&
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const updateTodaySubscribers = (uploadList) => {
    const todayUploads = (uploadList || uploads).filter(isTodayUpload);
    setTodaySubscribers(todayUploads);
  };
  const [playerTeamName, setPlayerTeamName] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [createTeamAName, setCreateTeamAName] = useState('');
  const [createTeamBName, setCreateTeamBName] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [livePlayerIds, setLivePlayerIds] = useState([]);
  const [runTeam, setRunTeam] = useState('');
  const [theme, setTheme] = useState({ background: '#f5f8ff', teamAColor: '#0b3d91', teamBColor: '#e63946' });
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [overlayUser, setOverlayUser] = useState(null);
  const [recentApprovedUsers, setRecentApprovedUsers] = useState([]);
  const [spotlightSubscribers, setSpotlightSubscribers] = useState([]);
  const [todaySubscribers, setTodaySubscribers] = useState([]);
  const [currentSpotlightIndex, setCurrentSpotlightIndex] = useState(0);
  const previousSpotlightIds = useRef([]);

  const buildPhotoUrl = (photo) => {
    if (!photo) return 'https://placehold.co/160x160?text=Subscriber';
    if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
    const normalized = photo.startsWith('/') ? photo : `/${photo}`;
    return API ? `${API}${normalized}` : normalized;
  };

  const loadAdminState = async () => {
    try {
      const [teamRes, playerRes, matchRes, scoreRes, uploadRes] = await Promise.all([
        axios.get(`${API}/api/admin/teams`),
        axios.get(`${API}/api/admin/players`),
        axios.get(`${API}/api/admin/match`),
        axios.get(`${API}/api/admin/scores`),
        axios.get(`${API}/api/admin/uploads`),
      ]);
      setTeams(teamRes.data);
      setPlayers(playerRes.data);
      setMatch(matchRes.data);
      setScores(scoreRes.data);
      setUploads(uploadRes.data);
      updateTodaySubscribers(uploadRes.data);

      const [spotlightRes] = await Promise.all([
        axios.get(`${API}/api/user/subscribers/spotlight`),
      ]);

      const latestSpotlightUsers = spotlightRes.data || [];
      const topTwentyLatest = latestSpotlightUsers.slice(0, 20);
      const topTwenty = [...topTwentyLatest].reverse();

      setSpotlightSubscribers(topTwenty);
      updateTodaySubscribers(uploadRes.data);

      setCurrentSpotlightIndex((prevIndex) => {
        if (topTwenty.length === 0) {
          return 0;
        }

        const previousLatestId = previousSpotlightIds.current[previousSpotlightIds.current.length - 1];
        const currentLatestId = topTwenty[topTwenty.length - 1]?._id;
        const currentActiveId = spotlightSubscribers[prevIndex]?._id;
        const stillSelectedIndex = topTwenty.findIndex((item) => item._id === currentActiveId);

        if (!previousLatestId || previousLatestId !== currentLatestId) {
          return topTwenty.length - 1;
        }

        if (stillSelectedIndex !== -1) {
          return stillSelectedIndex;
        }

        return Math.min(prevIndex, topTwenty.length - 1);
      });

      previousSpotlightIds.current = topTwenty.map((user) => user._id);

      if (matchRes.data) {
        setTheme(matchRes.data.matchTheme || theme);
        setTeamAName(matchRes.data.teamAName || '');
        setTeamBName(matchRes.data.teamBName || '');
        const existingLiveIds = (matchRes.data.selectedPlayers || [])
          .map((item) => item.player?._id || item.player)
          .filter(Boolean);
        setLivePlayerIds(existingLiveIds);
        if ((!runTeam || runTeam === '') && matchRes.data.teamAName) {
          setRunTeam(matchRes.data.teamAName);
        }
      }
      setMessage('Admin panel ready');
    } catch (error) {
      setMessage('Unable to load admin data');
    }
  };

  useEffect(() => {
    if (!loggedIn) return;
    loadAdminState();

    socket.on('matchUpdated', loadAdminState);
    socket.on('scoreUpdated', loadAdminState);
    socket.on('scoresUpdated', loadAdminState);
    socket.on('playerCreated', loadAdminState);
    socket.on('uploadApproved', loadAdminState);
    socket.on('featuredFanUpdated', loadAdminState);
    socket.on('spotlightUpdated', loadAdminState);
    socket.on('uploadDeleted', loadAdminState);
    socket.on('fan-approved', loadAdminState);
    socket.on('newUpload', loadAdminState);
    socket.on('fan-update', loadAdminState);
    socket.on('voteUpdated', loadAdminState);
    socket.on('themeChange', loadAdminState);
    socket.on('teamNameChange', loadAdminState);
    socket.on('showApprovedUser', (user) => {
      setOverlayUser(user);
      setRecentApprovedUsers((prev) => [user, ...prev.filter((item) => item._id !== user._id)].slice(0, 8));
      loadAdminState();
    });

    return () => {
      socket.off('matchUpdated');
      socket.off('scoreUpdated');
      socket.off('scoresUpdated');
      socket.off('playerCreated');
      socket.off('uploadApproved');
      socket.off('featuredFanUpdated');
      socket.off('spotlightUpdated');
      socket.off('uploadDeleted');
      socket.off('fan-approved');
      socket.off('newUpload');
      socket.off('fan-update');
      socket.off('voteUpdated');
      socket.off('themeChange');
      socket.off('teamNameChange');
      socket.off('showApprovedUser');
    };
  }, [loggedIn]);

  // Auto-cycle spotlight images every 5 seconds (only from top 20)
  useEffect(() => {
    if (spotlightSubscribers.length <= 1) {
      return undefined;
    }
    const timer = setInterval(() => {
      setCurrentSpotlightIndex((prev) => (prev + 1) % spotlightSubscribers.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [spotlightSubscribers.length]);

  const availablePlayers = useMemo(
    () => players.filter((player) => player.name),
    [players],
  );

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`${API}/api/admin/login`, { username, password });
      setLoggedIn(true);
      setMessage('Logged in successfully');
    } catch (error) {
      setMessage('Admin login failed');
      setLoggedIn(false);
    }
  };

  const handlePlayerUpload = async (event) => {
    event.preventDefault();
    if (!photoFile || !playerName.trim() || !playerTeamName.trim()) {
      setMessage('Fill in player name, team, and photo');
      return;
    }
    const formData = new FormData();
    formData.append('name', playerName.trim());
    formData.append('teamName', playerTeamName.trim());
    formData.append('photo', photoFile);
    try {
      await axios.post(`${API}/api/admin/upload-player`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Player uploaded successfully');
      setPlayerName('');
      setPlayerTeamName('');
      setPhotoFile(null);
      loadAdminState();
    } catch (error) {
      setMessage('Upload failed');
    }
  };

  const handleAddToLive = () => {
    if (selectedPlayerIds.length === 0) {
      setMessage('Select something to add to live squad');
      return;
    }
    setLivePlayerIds((prev) => Array.from(new Set([...prev, ...selectedPlayerIds])));
    setSelectedPlayerIds([]);
    setMessage('Players added to live squad');
  };

  const handleRemoveLivePlayer = (playerId) => {
    setLivePlayerIds((prev) => prev.filter((id) => id !== playerId));
    setMessage('Player removed from live squad');
  };

  const handleSaveLivePlayers = async (event) => {
    event.preventDefault();
    if (!match || livePlayerIds.length < 4) {
      setMessage('Select at least 4 players for live');
      return;
    }
    try {
      const selectedPlayers = livePlayerIds.map((id) => {
        const player = players.find((item) => item._id === id);
        return { team: player?.teamName || player?.teamId?.name || 'Unknown', player: id };
      });
      await axios.post(`${API}/api/admin/select-players`, { matchId: match._id, selectedPlayers });
      setMessage('Live squad updated');
      loadAdminState();
    } catch (error) {
      setMessage('Live squad save failed');
    }
  };

  const handleMatchCreate = async (event) => {
    event.preventDefault();
    const trimmedA = createTeamAName.trim();
    const trimmedB = createTeamBName.trim();
    if (!trimmedA || !trimmedB) {
      setMessage('Team names cannot be empty');
      return;
    }
    if (trimmedA === trimmedB) {
      setMessage('Team A and Team B must be different');
      return;
    }
    try {
      await axios.post(`${API}/api/admin/create-match`, { teamAName: trimmedA, teamBName: trimmedB });
      setMessage('Match created');
      setCreateTeamAName('');
      setCreateTeamBName('');
      setTeamAName(trimmedA);
      setTeamBName(trimmedB);
      loadAdminState();
    } catch (error) {
      setMessage('Match creation failed');
    }
  };

  const handleScoreControl = async (team, runs, wicket) => {
    if (!team) {
      setMessage('Please select a team to update score');
      return;
    }
    try {
      const response = await axios.post(`${API}/api/admin/update-score`, { team, runs, wicket });
      const updatedScore = response.data;
      setScores((prev) => prev.map((item) => (item.team === updatedScore.team ? updatedScore : item)));
      setMessage('Score updated');
      loadAdminState();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Score update failed');
    }
  };

  const handleThemeUpdate = async () => {
    try {
      await axios.post(`${API}/api/admin/update-theme`, theme);
      setMessage('Theme updated');
      loadAdminState();
    } catch (error) {
      setMessage('Theme update failed');
    }
  };

  const handleTeamNamesUpdate = async () => {
    try {
      await axios.post(`${API}/api/admin/update-team-names`, { teamAName, teamBName });
      setMessage('Team names updated');
      loadAdminState();
    } catch (error) {
      setMessage('Team names update failed');
    }
  };

  const handleApproval = async (uploadId, approved) => {
    try {
      await axios.patch(`${API}/api/admin/approve/${uploadId}`, { status: approved ? 'approved' : 'pending' });
      setMessage('Upload approval updated');
      loadAdminState();
    } catch (error) {
      setMessage('Approval failed');
    }
  };
  const handleDeleteUpload = async (uploadId) => {
    try {
      await axios.delete(`${API}/api/admin/delete-upload/${uploadId}`);
      setMessage('Upload removed');
      loadAdminState();
    } catch (error) {
      setMessage('Upload delete failed');
    }
  };
  if (!loggedIn) {
    return (
      <div style={{ maxWidth: 540, background: '#fff', padding: 'clamp(16px, 4vw, 24px)', borderRadius: 16, boxShadow: '0 20px 60px rgba(15, 39, 95, 0.08)', margin: 'auto', marginTop: 'clamp(40px, 8vw, 60px)' }}>
        <h2 style={{ color: '#0b3d91', fontSize: 'clamp(20px, 5vw, 28px)' }}>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <label style={{ display: 'block', marginBottom: 12, color: '#334', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d0d7ee', marginTop: 6, boxSizing: 'border-box', fontSize: 'clamp(12px, 2.5vw, 14px)' }} />
          </label>
          <label style={{ display: 'block', marginBottom: 12, color: '#334', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d0d7ee', marginTop: 6, boxSizing: 'border-box', fontSize: 'clamp(12px, 2.5vw, 14px)' }} />
          </label>
          <button type="submit" style={{ background: '#0b3d91', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: 10, cursor: 'pointer', width: '100%', fontWeight: 700, fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
            Login
          </button>
        </form>
        <p style={{ marginTop: 16, color: '#556', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>{message}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 24, padding: 20, maxWidth: 1400, margin: '0 auto', overflowX: 'hidden' }}>
      {overlayUser && <ApprovedUserOverlay user={overlayUser} onClose={() => setOverlayUser(null)} />}

      <ApprovedUserShowcase 
        approvedUsers={spotlightSubscribers} 
        recentUsers={recentApprovedUsers}
        currentIndex={currentSpotlightIndex}
        onThumbnailClick={(index) => setCurrentSpotlightIndex(index)}
      />

      <section style={{ background: '#fff', borderRadius: 24, padding: 'clamp(16px, 4vw, 24px)', boxShadow: '0 20px 60px rgba(15, 39, 95, 0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ marginTop: 0, color: '#0b3d91', fontSize: 'clamp(20px, 5vw, 28px)' }}>Today's Subscribers</h2>
            <p style={{ margin: '8px 0 0', color: '#556', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>All approved subscriber uploads from today for your screenshot grid.</p>
          </div>
          <span style={{ padding: '10px 16px', borderRadius: 999, background: '#eef4ff', color: '#0b3d91', fontWeight: 700, fontSize: 'clamp(11px, 2.5vw, 14px)' }}>
            {todaySubscribers.length} subscribers today
          </span>
        </div>
        {todaySubscribers.length === 0 ? (
          <p style={{ marginTop: 18, color: '#556', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>No approved subscriber uploads yet today.</p>
        ) : (
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', marginTop: 20 }}>
            {todaySubscribers.map((subscriber) => (
              <div key={subscriber._id} style={{ display: 'grid', gap: 10, padding: 'clamp(8px, 2vw, 14px)', borderRadius: 16, background: '#f8fbff', border: '1px solid #e2e8f0' }}>
                <img
                  src={buildPhotoUrl(subscriber.photo)}
                  alt={subscriber.name || 'Subscriber photo'}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = 'https://placehold.co/160x160?text=Subscriber';
                  }}
                  style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 14, objectFit: 'cover' }}
                />
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: '#102341', fontSize: 'clamp(11px, 2.5vw, 14px)' }}>{subscriber.name || 'Subscriber'}</p>
                  <p style={{ margin: '6px 0 0', color: '#556', fontSize: 'clamp(10px, 2vw, 12px)' }}>{subscriber.place || 'Subscriber'}</p>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px', borderRadius: 999, background: '#0b3d91', color: '#fff', fontSize: 'clamp(9px, 2vw, 11px)', fontWeight: 700, letterSpacing: '0.05em' }}>
                  SUBSCRIBER
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ background: '#fff', borderRadius: 16, padding: 'clamp(16px, 4vw, 24px)', boxShadow: '0 20px 60px rgba(15, 39, 95, 0.08)' }}>
        <h2 style={{ marginTop: 0, color: '#0b3d91', fontSize: 'clamp(20px, 5vw, 28px)' }}>Admin Dashboard</h2>
        <div style={{ margin: '22px 0 0' }}>
          <ScoreBoard
            scores={scores}
            teams={[match?.teamAName || teamAName || 'Team A', match?.teamBName || teamBName || 'Team B']}
            theme={theme}
            battingTeam={match?.battingTeam || ''}
          />
        </div>
        
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr 1fr', marginTop: 20 }}>
          <style>{`
            @media (max-width: 768px) {
              .admin-grid-2col { gridTemplateColumns: 1fr !important; }
            }
          `}</style>
          <div className="admin-grid-2col" style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr 1fr', marginTop: 20 }}>
            <div>
              <h3 style={{ fontSize: 'clamp(16px, 4vw, 18px)' }}>Create Match</h3>
              <form onSubmit={handleMatchCreate} style={{ display: 'grid', gap: 12 }}>
                <label style={{ display: 'grid', gap: 8, fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
                  Team A name
                  <input
                    value={createTeamAName}
                    onChange={(e) => setCreateTeamAName(e.target.value)}
                    placeholder="Enter Team A name"
                    style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d0d7ee', fontSize: 'clamp(12px, 2.5vw, 14px)' }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 8, fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
                  Team B name
                  <input
                    value={createTeamBName}
                    onChange={(e) => setCreateTeamBName(e.target.value)}
                    placeholder="Enter Team B name"
                    style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d0d7ee', fontSize: 'clamp(12px, 2.5vw, 14px)' }}
                  />
                </label>
                <button type="submit" style={{ width: '100%', background: '#0b3d91', color: '#fff', borderRadius: 10, padding: '10px 16', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
                  Create Match
                </button>
              </form>
            </div>

            <div>
              <h3 style={{ fontSize: 'clamp(16px, 4vw, 18px)' }}>Match Theme Colors</h3>
              <div style={{ display: 'grid', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'clamp(11px, 2.5vw, 13px)' }}>
                  Background:
                  <input type="color" value={theme.background} onChange={(e) => setTheme({ ...theme, background: e.target.value })} style={{ width: 50, height: 40, borderRadius: 6, border: 'none', cursor: 'pointer' }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'clamp(11px, 2.5vw, 13px)' }}>
                  Team A Color:
                  <input type="color" value={theme.teamAColor} onChange={(e) => setTheme({ ...theme, teamAColor: e.target.value })} style={{ width: 50, height: 40, borderRadius: 6, border: 'none', cursor: 'pointer' }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'clamp(11px, 2.5vw, 13px)' }}>
                  Team B Color:
                  <input type="color" value={theme.teamBColor} onChange={(e) => setTheme({ ...theme, teamBColor: e.target.value })} style={{ width: 50, height: 40, borderRadius: 6, border: 'none', cursor: 'pointer' }} />
                </label>
                <button onClick={handleThemeUpdate} style={{ background: '#667eea', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16', cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
                  Apply Theme
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #ddd' }}>
          <h3 style={{ fontSize: 'clamp(16px, 4vw, 18px)' }}>Team Names</h3>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
            <style>{`
              @media (max-width: 768px) {
                .team-names-grid { gridTemplateColumns: 1fr !important; }
              }
            `}</style>
            <div className="team-names-grid" style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <input value={teamAName} onChange={(e) => setTeamAName(e.target.value)} placeholder="Team A name" style={{ padding: 10, borderRadius: 10, border: '1px solid #d0d7ee', fontSize: 'clamp(12px, 2.5vw, 14px)' }} />
              <input value={teamBName} onChange={(e) => setTeamBName(e.target.value)} placeholder="Team B name" style={{ padding: 10, borderRadius: 10, border: '1px solid #d0d7ee', fontSize: 'clamp(12px, 2.5vw, 14px)' }} />
            </div>
            <button onClick={handleTeamNamesUpdate} style={{ gridColumn: '1 / -1', background: '#0b3d91', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16', cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
              Update Team Names
            </button>
          </div>
        </div>
      </section>

      <section style={{ background: '#fff', borderRadius: 16, padding: 'clamp(16px, 4vw, 24px)', boxShadow: '0 20px 60px rgba(15, 39, 95, 0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <div>
            <h2 style={{ marginTop: 0, color: '#0b3d91', fontSize: 'clamp(20px, 5vw, 28px)' }}>Upload Player & Select Players</h2>
            <p style={{ margin: '8px 0 0', color: '#556', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>Add new athletes and curate the live squad with instant roster controls.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ padding: '10px 16px', borderRadius: 999, background: '#eef4ff', color: '#0b3d91', fontWeight: 700, fontSize: 'clamp(10px, 2.5vw, 12px)' }}>Dynamic roster</span>
            <span style={{ padding: '10px 16px', borderRadius: 999, background: '#fef5f6', color: '#b91c1c', fontWeight: 700, fontSize: 'clamp(10px, 2.5vw, 12px)' }}>No static team list</span>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr 1fr', marginTop: 20 }}>
          <style>{`
            @media (max-width: 768px) {
              .player-grid-2col { gridTemplateColumns: 1fr !important; }
              .player-checkbox-grid { gridTemplateColumns: 1fr !important; }
            }
          `}</style>
          <div className="player-grid-2col" style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <h3 style={{ fontSize: 'clamp(16px, 4vw, 18px)' }}>Upload Player Photo</h3>
              <form onSubmit={handlePlayerUpload} style={{ display: 'grid', gap: 12 }}>
                <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Player name" style={{ padding: 10, borderRadius: 10, border: '1px solid #d0d7ee', fontSize: 'clamp(12px, 2.5vw, 14px)' }} />
                <input
                  value={playerTeamName}
                  onChange={(e) => setPlayerTeamName(e.target.value)}
                  placeholder="Enter team name"
                  style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid #d0d7ee', fontSize: 'clamp(12px, 2.5vw, 14px)' }}
                />
                <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} style={{ fontSize: 'clamp(11px, 2.5vw, 13px)' }} />
                <button type="submit" style={{ width: '100%', background: '#0b3d91', color: '#fff', borderRadius: 10, padding: '10px 16', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
                  Upload Player
                </button>
              </form>
            </div>

            <div>
              <h3 style={{ fontSize: 'clamp(16px, 4vw, 18px)' }}>Select Players for Live</h3>
              <form onSubmit={handleSaveLivePlayers} style={{ display: 'grid', gap: 12 }}>
                <div className="player-checkbox-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxHeight: 300, overflowY: 'auto' }}>
                  {availablePlayers.map((player) => (
                    <label key={player._id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f2f6ff', padding: 10, borderRadius: 10 }}>
                      <input
                        type="checkbox"
                        value={player._id}
                        checked={selectedPlayerIds.includes(player._id)}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSelectedPlayerIds((prev) => (prev.includes(value) ? prev.filter((id) => id !== value) : [...prev, value]));
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 'clamp(11px, 2vw, 13px)' }}>{player.name}</div>
                        <div style={{ fontSize: 'clamp(10px, 2vw, 12px)', color: '#556' }}>{player.teamName || player.teamId?.name || 'Team unknown'}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button type="button" onClick={handleAddToLive} style={{ background: '#0b3d91', color: '#fff', borderRadius: 10, padding: '10px 16', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
                    Add to Live
                  </button>
                  <button type="submit" style={{ background: '#1d70b8', color: '#fff', borderRadius: 10, padding: '10px 16', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
                    Save Live Squad
                  </button>
                </div>
              </form>
              <div style={{ marginTop: 16, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                <h4 style={{ margin: '0 0 12px', color: '#0b3d91', fontSize: 'clamp(14px, 3vw, 16px)' }}>Live Squad</h4>
                {livePlayerIds.length === 0 ? (
                  <p style={{ margin: 0, color: '#556', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>No players added to live yet.</p>
                ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {livePlayerIds.map((id) => {
                      const player = players.find((item) => item._id === id);
                      return (
                        <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #d0d7ee', borderRadius: 10, padding: 12, flexWrap: 'wrap', gap: 8 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 'clamp(12px, 2.5vw, 14px)' }}>{player?.name || 'Unknown player'}</div>
                            <div style={{ fontSize: 'clamp(10px, 2vw, 12px)', color: '#556' }}>{player?.teamName || player?.teamId?.name || 'Team unknown'}</div>
                          </div>
                          <button type="button" onClick={() => handleRemoveLivePlayer(id)} style={{ background: '#e63946', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 12', cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(11px, 2.5vw, 13px)' }}>
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: '#fff', borderRadius: 24, padding: 'clamp(16px, 4vw, 28px)', boxShadow: '0 30px 80px rgba(15, 39, 95, 0.12)' }}>
        <h3 style={{ marginTop: 0, color: '#0b3d91', fontSize: 'clamp(18px, 4vw, 20px)' }}>Live Score Control</h3>
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[(match?.teamAName || teamAName), (match?.teamBName || teamBName)].filter(Boolean).map((team) => (
              <button
                key={team}
                type="button"
                onClick={() => setRunTeam(team)}
                style={{
                  background: runTeam === team ? '#0b3d91' : '#f5f7ff',
                  color: runTeam === team ? '#fff' : '#102341',
                  border: '1px solid #d0d7ee',
                  borderRadius: 12,
                  padding: 'clamp(10px, 2vw, 12px) clamp(14px, 3vw, 18px)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                }}
              >
                {team}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {['1', '2', '3', '4', '6'].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleScoreControl(runTeam, Number(value), false)}
                disabled={!runTeam}
                style={{
                  background: '#0b3d91',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: 'clamp(10px, 2vw, 12px) clamp(14px, 3vw, 16px)',
                  cursor: runTeam ? 'pointer' : 'not-allowed',
                  fontWeight: 700,
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  opacity: !runTeam ? 0.5 : 1,
                }}
              >
                +{value}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleScoreControl(runTeam, 0, true)}
              disabled={!runTeam}
              style={{
                background: '#e63946',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: 'clamp(10px, 2vw, 12px) clamp(14px, 3vw, 16px)',
                cursor: runTeam ? 'pointer' : 'not-allowed',
                fontWeight: 700,
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                opacity: !runTeam ? 0.5 : 1,
              }}
            >
              WICKET
            </button>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr 1fr' }}>
        <style>{`
          @media (max-width: 768px) {
            .admin-summary-grid { gridTemplateColumns: 1fr !important; }
          }
        `}</style>
        <div className="admin-summary-grid" style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr 1fr' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 'clamp(16px, 4vw, 24px)', boxShadow: '0 20px 60px rgba(15, 39, 95, 0.08)' }}>
            <h3 style={{ marginTop: 0, fontSize: 'clamp(16px, 4vw, 18px)' }}>Match Summary</h3>
            {match ? (
              <div style={{ fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
                <p><strong>Teams:</strong> {match.teamAName || match.teamA?.name} vs {match.teamBName || match.teamB?.name}</p>
                <p><strong>Selected players:</strong></p>
                <ul style={{ paddingLeft: 20, margin: 0, fontSize: 'clamp(11px, 2.5vw, 13px)' }}>
                  {match.selectedPlayers?.map((item) => (
                    <li key={item.player?._id}>{item.team}: {item.player?.name}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p style={{ fontSize: 'clamp(12px, 2.5vw, 14px)' }}>No active match.</p>
            )}
          </div>
          <div style={{ background: '#fff', borderRadius: 16, padding: 'clamp(16px, 4vw, 24px)', boxShadow: '0 20px 60px rgba(15, 39, 95, 0.08)' }}>
            <h3 style={{ marginTop: 0, fontSize: 'clamp(16px, 4vw, 18px)' }}>Current Scores</h3>
            <ul style={{ paddingLeft: 20, margin: 0, fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
              {scores.map((score) => (
                <li key={score._id}>{score.team}: {score.runs}/{score.wickets}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section style={{ background: '#fff', borderRadius: 16, padding: 'clamp(16px, 4vw, 24px)', boxShadow: '0 20px 60px rgba(15, 39, 95, 0.08)' }}>
        <h3 style={{ marginTop: 0, fontSize: 'clamp(18px, 4vw, 20px)' }}>User Upload Approvals</h3>
        {uploads.filter((u) => !u.approved).length === 0 ? (
          <p style={{ fontSize: 'clamp(12px, 2.5vw, 14px)' }}>No pending uploads.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {uploads.filter((u) => !u.approved).map((upload) => (
              <div key={upload._id} style={{ border: '1px solid #d8e2f1', borderRadius: 12, padding: 'clamp(12px, 2.5vw, 16px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <img src={`${API}${upload.photo}`} alt="preview" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 'clamp(12px, 2.5vw, 14px)' }}>{upload.name || upload.playerId?.name || 'Fan Upload'}</p>
                    <p style={{ margin: '6px 0 0', color: '#556', fontSize: 'clamp(11px, 2.5vw, 13px)' }}>Pending review</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => handleApproval(upload._id, true)} style={{ background: '#0b3d91', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14', cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(11px, 2.5vw, 13px)' }}>
                    Approve
                  </button>
                  <button onClick={() => handleApproval(upload._id, false)} style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14', cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(11px, 2.5vw, 13px)' }}>
                    Reject
                  </button>
                  <button onClick={() => handleDeleteUpload(upload._id)} style={{ background: '#e63946', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14', cursor: 'pointer', fontWeight: 700, fontSize: 'clamp(11px, 2.5vw, 13px)' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p style={{ color: '#556' }}>{message}</p>
    </div>
  );
}

export default AdminPage;
