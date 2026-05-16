import { useEffect, useState } from 'react';
import axios from 'axios';
import { socket } from '../socket.js';
import { API } from '../config.js';
import BigPlayerCard from '../components/BigPlayerCard.jsx';
import ScoreBoard from '../components/ScoreBoard.jsx';
import RunControls from '../components/RunControls.jsx';
import ApprovedUserShowcase from '../components/ApprovedUserShowcase.jsx';
import ApprovedUserOverlay from '../components/ApprovedUserOverlay.jsx';

function LivePage() {
  const [teams, setTeams] = useState([]);
  const [match, setMatch] = useState(null);
  const [scores, setScores] = useState([]);
  const [players, setPlayers] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [featuredFans, setFeaturedFans] = useState([]);
  const [spotlightSubscribers, setSpotlightSubscribers] = useState([]);
  const [activeSpotlightFan, setActiveSpotlightFan] = useState(null);
  const [teamAPlayers, setTeamAPlayers] = useState([]);
  const [teamBPlayers, setTeamBPlayers] = useState([]);
  const [teamAName, setTeamAName] = useState('Team A');
  const [teamBName, setTeamBName] = useState('Team B');
  const [theme, setTheme] = useState({ background: '#f5f8ff', teamAColor: '#0b3d91', teamBColor: '#e63946' });
  const [scoreData, setScoreData] = useState({ teamA: { runs: 0, wickets: 0 }, teamB: { runs: 0, wickets: 0 }, battingTeam: '' });
  const [message, setMessage] = useState('Loading live match...');
  const [toast, setToast] = useState('');
  const [fanName, setFanName] = useState('');
  const [fanPlace, setFanPlace] = useState('');
  const [fanPhoto, setFanPhoto] = useState(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [overlayUser, setOverlayUser] = useState(null);
  const [recentApprovedUsers, setRecentApprovedUsers] = useState([]);
  const [todaySubscribers, setTodaySubscribers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPlayerTeamName = (player) => player.teamName || player.teamId?.name || '';

  const normalizePlayerList = (list, fallbackTeamName, allPlayers, selectedPlayers = []) => {
    if (Array.isArray(list) && list.length > 0) {
      return list
        .map((item) => {
          if (!item) return null;
          if (typeof item === 'string') {
            return allPlayers.find((player) => player._id === item) || null;
          }
          if (item.player) {
            return item.player;
          }
          return item;
        })
        .filter(Boolean)
        .slice(0, 8);
    }

    const fallbackSelected = (selectedPlayers || [])
      .filter((item) => item.team === fallbackTeamName)
      .map((item) => item.player)
      .filter(Boolean);

    if (fallbackSelected.length > 0) {
      return fallbackSelected.slice(0, 8);
    }

    return (allPlayers || [])
      .filter((player) => getPlayerTeamName(player) === fallbackTeamName)
      .slice(0, 8);
  };

  const PLACEHOLDER_FAN_IMAGE = 'https://placehold.co/880x620?text=Fan+Spotlight';

  const buildFanPhotoUrl = (photo) => {
    if (!photo) return PLACEHOLDER_FAN_IMAGE;
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    const normalized = photo.startsWith('/') ? photo : `/${photo}`;
    return API ? `${API}${normalized}` : normalized;
  };

  const applyApprovedUpload = (approvedUpload) => {
    if (!approvedUpload || !approvedUpload._id || !(approvedUpload.status === 'approved' || approvedUpload.approved)) {
      return;
    }
    setUploads((prev) => [approvedUpload, ...prev.filter((item) => item._id !== approvedUpload._id)]);
    setFeaturedFans((prev) => [approvedUpload, ...prev.filter((item) => item._id !== approvedUpload._id)].slice(0, 8));
    setRecentApprovedUsers((prev) => [approvedUpload, ...prev.filter((item) => item._id !== approvedUpload._id)].slice(0, 8));
    setMessage('A fan upload was approved live');
  };

  const loadSpotlightSubscribers = async () => {
    try {
      const { data } = await axios.get(`${API}/api/user/subscribers/spotlight`);
      setSpotlightSubscribers(data || []);
      setActiveSpotlightFan((current) => {
        if (!Array.isArray(data) || data.length === 0) {
          return null;
        }
        const stillSelected = current ? data.find((item) => item._id === current._id) : null;
        return stillSelected || data[0] || null;
      });
    } catch (error) {
      console.error('Failed to load spotlight subscribers', error);
    }
  };

  const handleSelectSpotlightFan = (fan) => {
    setActiveSpotlightFan(fan);
  };

  const loadLiveData = async () => {
    try {
      const { data } = await axios.get(`${API}/api/user/live-data`);
      const allPlayers = data.players || [];
      const selectedPlayers = data.match?.selectedPlayers || [];

      setTeams(data.teams || []);
      setPlayers(allPlayers);
      setMatch(data.match || null);
      const approvedUploads = Array.isArray(data.uploads) ? data.uploads : [];
      setUploads(approvedUploads);
      setFeaturedFans(approvedUploads.slice(0, 8));
      setRecentApprovedUsers(approvedUploads.slice(0, 8));

      const currentTeamAName = data.teamAName || data.match?.teamAName || data.match?.teamA?.name || 'Team A';
      const currentTeamBName = data.teamBName || data.match?.teamBName || data.match?.teamB?.name || 'Team B';

      setTeamAName(currentTeamAName);
      setTeamBName(currentTeamBName);

      setTheme({
        background: data.teamBackground || data.match?.matchTheme?.background || theme.background,
        teamAColor: data.teamAColor || data.match?.matchTheme?.teamAColor || theme.teamAColor,
        teamBColor: data.teamBColor || data.match?.matchTheme?.teamBColor || theme.teamBColor,
      });

      setTeamAPlayers(normalizePlayerList(data.teamAPlayers || [], currentTeamAName, allPlayers, selectedPlayers));
      setTeamBPlayers(normalizePlayerList(data.teamBPlayers || [], currentTeamBName, allPlayers, selectedPlayers));

      const allScores = Array.isArray(data.scores) ? data.scores : [];
      const scoreForTeamA = allScores.find((item) => item.team === currentTeamAName) || { runs: 0, wickets: 0 };
      const scoreForTeamB = allScores.find((item) => item.team === currentTeamBName) || { runs: 0, wickets: 0 };

      setScoreData({
        teamA: { runs: scoreForTeamA.runs || 0, wickets: scoreForTeamA.wickets || 0 },
        teamB: { runs: scoreForTeamB.runs || 0, wickets: scoreForTeamB.wickets || 0 },
        battingTeam: data.scoreData?.battingTeam || data.battingTeam || '',
      });

      const filteredScores = allScores.filter((item) => item.team === currentTeamAName || item.team === currentTeamBName);
      setScores(filteredScores.length === 2 ? filteredScores : [
        { team: currentTeamAName, runs: scoreForTeamA.runs || 0, wickets: scoreForTeamA.wickets || 0 },
        { team: currentTeamBName, runs: scoreForTeamB.runs || 0, wickets: scoreForTeamB.wickets || 0 },
      ]);

      setMessage('Live data loaded');
    } catch (error) {
      setMessage('Unable to load live data');
    }
  };

  useEffect(() => {
    loadLiveData();
    loadSpotlightSubscribers();

    const handleApprovedUploadEvent = (approvedUpload) => {
      applyApprovedUpload(approvedUpload);
    };

    const handleShowApprovedUser = (user) => {
      applyApprovedUpload(user);
      setOverlayUser(user);
    };

    socket.on('matchUpdated', loadLiveData);
    socket.on('scoreUpdated', loadLiveData);
    socket.on('scoresUpdated', loadLiveData);
    socket.on('score-update', loadLiveData);
    socket.on('themeChange', loadLiveData);
    socket.on('theme-update', loadLiveData);
    socket.on('teamNameChange', loadLiveData);
    socket.on('newUpload', loadLiveData);
    socket.on('fan-update', loadLiveData);
    socket.on('fan-approved', handleApprovedUploadEvent);
    socket.on('uploadApproved', handleApprovedUploadEvent);
    socket.on('spotlightUpdated', loadSpotlightSubscribers);
    socket.on('featuredFanUpdated', (featuredFan) => {
      if (!featuredFan || !featuredFan._id) return;
      setFeaturedFans((prev) => [featuredFan, ...prev.filter((item) => item._id !== featuredFan._id)].slice(0, 8));
    });
    socket.on('uploadDeleted', loadLiveData);
    socket.on('showApprovedUser', handleShowApprovedUser);
    socket.on('playerCreated', loadLiveData);
    socket.on('player-update', loadLiveData);
    socket.on('voteUpdated', loadLiveData);

    return () => {
      socket.off('matchUpdated');
      socket.off('scoreUpdated');
      socket.off('scoresUpdated');
      socket.off('score-update');
      socket.off('themeChange');
      socket.off('theme-update');
      socket.off('teamNameChange');
      socket.off('newUpload');
      socket.off('fan-update');
      socket.off('fan-approved');
      socket.off('uploadApproved');
      socket.off('spotlightUpdated');
      socket.off('featuredFanUpdated');
      socket.off('uploadDeleted');
      socket.off('showApprovedUser');
      socket.off('playerCreated');
      socket.off('player-update');
      socket.off('voteUpdated');
    };
  }, []);

  useEffect(() => {
    if (featuredFans.length <= 1) {
      setCarouselIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % featuredFans.length);
    }, 5200);
    return () => clearInterval(interval);
  }, [featuredFans.length]);

  const handleVote = async (playerId) => {
    try {
      await axios.post(`${API}/api/user/vote-player`, { playerId });
    } catch (error) {
      try {
        await axios.post(`${API}/api/user/vote`, { playerId });
      } catch (inner) {
        setToast('Vote failed');
      }
    }
  };

  const handleUploadPhoto = async (event) => {
    event.preventDefault();
    if (!fanName.trim() && !fanPhoto && !fanPlace.trim()) {
      setToast('Enter a name, place or upload a photo');
      return;
    }

    const formData = new FormData();
    if (fanPhoto) formData.append('photo', fanPhoto);
    formData.append('name', fanName.trim() || 'Guest');
    formData.append('place', fanPlace.trim() || '');
    formData.append('isSubscriber', isSubscriber);

    setIsSubmitting(true);
    try {
      await axios.post(`${API}/api/user/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setToast('Waiting for admin approval');
      setFanName('');
      setFanPlace('');
      setFanPhoto(null);
      setIsSubscriber(false);
    } catch (error) {
      if (error.response?.status === 404) {
        try {
          await axios.post(`${API}/api/user/upload-photo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          setToast('Waiting for admin approval');
          setFanName('');
          setFanPlace('');
          setFanPhoto(null);
          setIsSubscriber(false);
        } catch (inner) {
          setToast(inner.response?.data?.message || 'Upload failed');
        }
      } else {
        setToast(error.response?.data?.message || 'Upload failed');
      }
    }
    setIsSubmitting(false);
  };

  const featuredFan = featuredFans[carouselIndex] || featuredFans[0] || null;
  const mainSpotlightFan = activeSpotlightFan || spotlightSubscribers[0] || null;

  const selectedPlayersForTeam = (name, list) => {
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
    return players.filter((player) => getPlayerTeamName(player) === name).slice(0, 8);
  };

  const battingTeamLabel = scoreData.battingTeam || '';

  const displayTeamAPlayers = selectedPlayersForTeam(teamAName, teamAPlayers).slice(0, 4);
  const displayTeamBPlayers = selectedPlayersForTeam(teamBName, teamBPlayers).slice(0, 4);

  return (
    <div
      style={{
        background: theme.background,
        minHeight: '100vh',
        padding: 'clamp(12px, 4vw, 24px)',
        transition: 'background 0.3s ease',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflowX: 'hidden',
        width: '100%',
      }}
    >
      <style>{`
        html, body, #root {
          width: 100%;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
        }
        @media (max-width: 768px) {
          body, html, #root {
            overflow-x: hidden;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          .responsive-grid-main { 
            display: grid !important; 
            grid-template-columns: 1fr !important; 
            gap: clamp(16px, 4vw, 24px) !important;
          }
          .responsive-grid-cards { 
            grid-template-columns: 1fr !important; 
          }
        }
        @media (max-width: 480px) {
          body, html, #root {
            overflow-x: hidden;
            width: 100%;
            padding: 0;
            margin: 0;
          }
          .responsive-grid-main { 
            display: grid !important; 
            grid-template-columns: 1fr !important; 
            gap: clamp(12px, 3vw, 16px) !important;
          }
          .responsive-grid-cards { 
            grid-template-columns: 1fr !important; 
          }
        }
      `}</style>
      {overlayUser && <ApprovedUserOverlay user={overlayUser} onClose={() => setOverlayUser(null)} />}

      <div className="responsive-grid-main" style={{ maxWidth: 1480, margin: '0 auto', display: 'grid', gap: 24, overflowX: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'clamp(10px, 3vw, 14px)', alignItems: 'flex-end', overflowX: 'hidden' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(26px, 6vw, 42px)', letterSpacing: '-0.04em', color: '#102341' }}>IPL Live Score</h1>
            <p style={{ margin: '12px 0 0', maxWidth: 760, color: '#4f5f7b', fontSize: 'clamp(12px, 3vw, 16px)' }}>Watch the match update instantly with fan uploads, player voting, and admin-powered team theme control.</p>
          </div>
          <div style={{ display: 'flex', gap: 'clamp(8px, 2vw, 10px)', flexWrap: 'wrap', minWidth: 0 }}>
            <span style={{ padding: '10px clamp(12px, 3vw, 16px)', borderRadius: 18, background: theme.teamAColor, color: '#fff', fontWeight: 700, fontSize: 'clamp(11px, 2.5vw, 14px)', whiteSpace: 'nowrap' }}>{teamAName}</span>
            <span style={{ padding: '10px clamp(12px, 3vw, 16px)', borderRadius: 18, background: theme.teamBColor, color: '#fff', fontWeight: 700, fontSize: 'clamp(11px, 2.5vw, 14px)', whiteSpace: 'nowrap' }}>{teamBName}</span>
          </div>
        </div>

        <div className="responsive-grid-main" style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {/* <section style={{ backdropFilter: 'blur(18px)', background: 'rgba(255,255,255,0.92)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.75)', padding: 'clamp(16px, 4vw, 28px)', boxShadow: '0 36px 90px rgba(15, 39, 95, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, fontSize: 'clamp(12px, 2.5vw, 15px)', fontWeight: 700, color: theme.teamAColor }}>Live Scoreboard</p>
                <h2 style={{ margin: '10px 0 0', fontSize: 'clamp(20px, 5vw, 28px)', color: '#102341' }}>Current Innings</h2>
              </div>
              <div style={{ alignSelf: 'center', minWidth: 160, padding: '10px 16px', borderRadius: 20, background: '#f9fbff', border: `1px solid ${theme.teamBColor}22`, color: '#102341', fontWeight: 700, textAlign: 'center', fontSize: 'clamp(11px, 2.5vw, 14px)' }}>
                {battingTeamLabel ? `Batting: ${battingTeamLabel}` : 'Batting team not selected'}
              </div>
            </div>
            <div style={{ marginTop: 24 }}>
              <ScoreBoard scores={scores} teams={[teamAName, teamBName]} theme={theme} battingTeam={scoreData.battingTeam} />
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px', padding: 18, borderRadius: 22, background: '#fff', border: `1px solid ${theme.teamAColor}22` }}>
                <p style={{ margin: 0, color: theme.teamAColor, fontWeight: 700, fontSize: 'clamp(12px, 2.5vw, 14px)' }}>Team A</p>
                <p style={{ margin: '10px 0 0', color: '#415070', fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 700 }}>{scoreData.teamA.runs}/{scoreData.teamA.wickets}</p>
              </div>
              <div style={{ flex: '1 1 180px', padding: 18, borderRadius: 22, background: '#fff', border: `1px solid ${theme.teamBColor}22` }}>
                <p style={{ margin: 0, color: theme.teamBColor, fontWeight: 700, fontSize: 'clamp(12px, 2.5vw, 14px)' }}>Team B</p>
                <p style={{ margin: '10px 0 0', color: '#415070', fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 700 }}>{scoreData.teamB.runs}/{scoreData.teamB.wickets}</p>
              </div>
            </div>
          </section> */}

      

          {/* <section style={{ backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.88)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.8)', padding: 'clamp(16px, 4vw, 28px)', boxShadow: '0 36px 90px rgba(15, 39, 95, 0.12)', display: 'grid', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, fontSize: 'clamp(12px, 2.5vw, 15px)', fontWeight: 700, color: '#102341' }}>Featured Subscriber Spotlight</p>
                <h2 style={{ margin: '8px 0 0', fontSize: 'clamp(20px, 5vw, 28px)', color: '#102341' }}>Top 20 Subscribers</h2>
                <p style={{ margin: '10px 0 0', color: '#556', maxWidth: 540, fontSize: 'clamp(12px, 2.5vw, 14px)' }}>Latest approved subscribers automatically appear in the spotlight strip and older entries are kept in the database.</p>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 20, background: '#eef4ff', color: '#0b3d91', fontWeight: 700, fontSize: 'clamp(11px, 2.5vw, 14px)' }}>
                <span>{spotlightSubscribers.length}</span>
                <span>in spotlight</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0, height: '100%' }}>
              <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
                {mainSpotlightFan ? (
                  <div style={{ borderRadius: 28, overflow: 'hidden', position: 'relative', width: '100%', display: 'flex', flex: 1 }}>
                    <img
                      src={buildFanPhotoUrl(mainSpotlightFan.photo)}
                      alt={mainSpotlightFan.name || 'Featured subscriber'}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = PLACEHOLDER_FAN_IMAGE;
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.64) 100%)' }} />
                    <div style={{ position: 'absolute', left: 24, right: 24, bottom: 24, padding: 18, borderRadius: 24, background: 'rgba(8, 15, 40, 0.88)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(14px)', color: '#fff' }}>
                      <p style={{ margin: 0, letterSpacing: '0.14em', fontSize: 12, textTransform: 'uppercase', color: '#84a2ff' }}>Subscriber Spotlight</p>
                      <h3 style={{ margin: '10px 0 0', fontSize: 30, lineHeight: 1.05 }}>{mainSpotlightFan.name || 'Featured Subscriber'}</h3>
                      <p style={{ margin: '12px 0 0', color: '#d8e4ff', fontSize: 15 }}>{mainSpotlightFan.place || 'Subscriber club'}</p>
                      <span style={{ display: 'inline-flex', marginTop: 14, alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)', color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        SUBSCRIBER
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, minHeight: 0, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7fbff', color: '#102341', padding: 28 }}>
                    <p style={{ margin: 0, fontSize: 16 }}>No subscriber spotlight yet. Approved subscribers will appear here instantly.</p>
                  </div>
                )}
              </div>
            </div>
          </section> */}

          <section
  style={{
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',

    background: 'rgba(255, 255, 255, 0.18)', // white glass
    borderRadius: 32,
    border: '1px solid rgba(255, 255, 255, 0.55)',

    boxShadow:
      '0 30px 80px rgba(15, 39, 95, 0.10), inset 0 0 40px rgba(255,255,255,0.35)',

    padding: 'clamp(16px, 4vw, 28px)',
    display: 'grid',
    gap: 24,

    position: 'relative',
    overflow: 'hidden',
  }}
>
  {/* ✨ WHITE MIRROR SHINE */}
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background:
        'linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,255,255,0.25), rgba(255,255,255,0.45))',
      pointerEvents: 'none',
    }}
  />

  {/* CONTENT */}
  <div
    style={{
      position: 'relative',
      zIndex: 2,
      display: 'grid',
      gap: 24,
    }}
  >
    
    {/* HEADER */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(12px, 2.5vw, 15px)',
            fontWeight: 700,
            color: '#102341',
          }}
        >
          Featured Subscriber Spotlight
        </p>

        <h2
          style={{
            margin: '8px 0 0',
            fontSize: 'clamp(20px, 5vw, 28px)',
            color: '#102341',
          }}
        >
          Be the next name in the Spotlight
        </h2>

        <p
          style={{
            margin: '10px 0 0',
            color: '#556',
            maxWidth: 540,
            fontSize: 'clamp(12px, 2.5vw, 14px)',
          }}
        >
only approved subscribers make it here!        </p>
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          borderRadius: 20,

          background: 'rgba(255,255,255,0.55)', // white glass badge
          border: '1px solid rgba(255,255,255,0.7)',

          color: '#0b3d91',
          fontWeight: 700,
          fontSize: 'clamp(11px, 2.5vw, 14px)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <span>{spotlightSubscribers.length}</span>
        <span>in spotlight</span>
      </div>
    </div>

    {/* IMAGE SECTION (UNCHANGED LOGIC) */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {mainSpotlightFan ? (
          <div
            style={{
              borderRadius: 28,
              overflow: 'hidden',
              position: 'relative',
              width: '100%',
              display: 'flex',
              flex: 1,
            }}
          >
            <img
              src={buildFanPhotoUrl(mainSpotlightFan.photo)}
              alt={mainSpotlightFan.name || 'Featured subscriber'}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = PLACEHOLDER_FAN_IMAGE;
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />

            {/* LIGHT WHITE OVERLAY */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.35) 100%)',
              }}
            />

            {/* WHITE GLASS TEXT CARD */}
            <div
              style={{
                position: 'absolute',
                left: 24,
                right: 24,
                bottom: 24,
                padding: 18,
                borderRadius: 24,

                background: 'rgba(255,255,255,0.35)',
                border: '1px solid rgba(255,255,255,0.6)',

                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',

                color: '#311041',
              }}
            >
              <p
                style={{
                  margin: 0,
                  letterSpacing: '0.14em',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  color: '#0b3d91',
                }}
              >
                Subscriber Spotlight
              </p>

              <h3 style={{ margin: '10px 0 0', fontSize: 30, lineHeight: 1.05 }}>
                {mainSpotlightFan.name || 'Featured Subscriber'}
              </h3>

              <p style={{ margin: '12px 0 0', color: '#415070', fontSize: 15 }}>
                {mainSpotlightFan.place || 'Subscriber club'}
              </p>

              <span
  style={{
    display: 'inline-flex',
    marginTop: 14,
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    borderRadius: 999,

    background: 'red',
    border: '1px solid rgba(255,255,255,0.9)',

    color: '#102341',
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  }}
>
  SUBSCRIBER
</span>
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              borderRadius: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.4)',
              backdropFilter: 'blur(12px)',
              padding: 28,
              color: '#102341',
            }}
          >
            No subscriber spotlight yet. Approved subscribers will appear here instantly.
          </div>
        )}
      </div>
    </div>
  </div>
</section>

          <section style={{ backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.88)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.8)', padding: 'clamp(16px, 4vw, 28px)', boxShadow: '0 36px 90px rgba(15, 39, 95, 0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: 'clamp(12px, 2.5vw, 15px)', fontWeight: 700, color: '#102341' }}>JOIN THE SPOTLIGHT</p>
                <h2 style={{ margin: '8px 0 0', fontSize: 'clamp(20px, 5vw, 28px)', color: '#102341' }}>Upload Your Match Moment</h2>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 18, background: theme.teamBColor, color: '#fff', fontWeight: 700, fontSize: 'clamp(11px, 2.5vw, 14px)' }}>Live Approval</span>
            </div>

            <form onSubmit={handleUploadPhoto} style={{ display: 'grid', gap: 16, marginTop: 20 }}>
              <input
                type="text"
                placeholder="Name"
                value={fanName}
                onChange={(e) => setFanName(e.target.value)}
                style={{ width: '100%', padding: 16, borderRadius: 18, border: '1px solid rgba(16, 35, 65, 0.08)', background: '#fff', color: '#102341', fontSize: 'clamp(13px, 3vw, 16px)' }}
              />
              <input
                type="text"
                placeholder="Place (city / supporter group)"
                value={fanPlace}
                onChange={(e) => setFanPlace(e.target.value)}
                style={{ width: '100%', padding: 16, borderRadius: 18, border: '1px solid rgba(16, 35, 65, 0.08)', background: '#fff', color: '#102341', fontSize: 'clamp(13px, 3vw, 16px)' }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFanPhoto(e.target.files[0] || null)}
                style={{ width: '100%', padding: 14, borderRadius: 18, border: '1px solid rgba(16, 35, 65, 0.08)', background: '#fff', fontSize: 'clamp(11px, 2.5vw, 14px)' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#102341', fontWeight: 600, fontSize: 'clamp(12px, 2.5vw, 16px)' }}>
                <input
                  type="checkbox"
                  checked={isSubscriber}
                  onChange={(e) => setIsSubscriber(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span>I'm a YouTube subscriber</span>
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '16px 22px',
                  borderRadius: 20,
                  border: 'none',
                  background: theme.teamAColor,
                  color: '#fff',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: 'clamp(13px, 3vw, 16px)',
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
              {toast && <p style={{ margin: 0, color: theme.teamBColor, fontWeight: 700, fontSize: 'clamp(12px, 2.5vw, 14px)' }}>{toast}</p>}
            </form>
          </section>
        </div>

        <div className="responsive-grid-main" style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <section style={{ backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.95)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.85)', padding: 'clamp(16px, 4vw, 28px)', boxShadow: '0 36px 90px rgba(15, 39, 95, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, color: theme.teamAColor, fontWeight: 700, fontSize: 'clamp(12px, 2.5vw, 15px)' }}>Team A</p>
                <h3 style={{ margin: '8px 0 0', color: '#102341', fontSize: 'clamp(18px, 5vw, 22px)' }}>{teamAName}</h3>
              </div>
              <div style={{ padding: '10px 18px', borderRadius: 20, background: theme.teamAColor, color: '#fff', fontWeight: 700, fontSize: 'clamp(11px, 2.5vw, 14px)' }}>Vote squad</div>
            </div>
            <div className="responsive-grid-cards" style={{ marginTop: 20, display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              {displayTeamAPlayers.map((player) => (
                <BigPlayerCard key={player._id} player={player} onVote={handleVote} teamColor={theme.teamAColor} />
              ))}
            </div>
          </section>

          <section style={{ backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.95)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.85)', padding: 'clamp(16px, 4vw, 28px)', boxShadow: '0 36px 90px rgba(15, 39, 95, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, color: theme.teamBColor, fontWeight: 700, fontSize: 'clamp(12px, 2.5vw, 15px)' }}>Team B</p>
                <h3 style={{ margin: '8px 0 0', color: '#102341', fontSize: 'clamp(18px, 5vw, 22px)' }}>{teamBName}</h3>
              </div>
              <div style={{ padding: '10px 18px', borderRadius: 20, background: theme.teamBColor, color: '#fff', fontWeight: 700, fontSize: 'clamp(11px, 2.5vw, 14px)' }}>Vote squad</div>
            </div>
            <div className="responsive-grid-cards" style={{ marginTop: 20, display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              {displayTeamBPlayers.map((player) => (
                <BigPlayerCard key={player._id} player={player} onVote={handleVote} teamColor={theme.teamBColor} />
              ))}
            </div>
          </section>
        </div>

        {/* <section style={{ backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.88)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.8)', padding: 'clamp(16px, 4vw, 28px)', boxShadow: '0 36px 90px rgba(15, 39, 95, 0.12)' }}>
          <div>
            <p style={{ margin: 0, fontSize: 'clamp(12px, 2.5vw, 15px)', fontWeight: 700, color: theme.teamAColor }}>TODAY'S SPOTLIGHT</p>
            <h2 style={{ margin: '8px 0 0', fontSize: 'clamp(20px, 5vw, 28px)', color: '#102341' }}>Today's Subscribers</h2>
            <p style={{ margin: '10px 0 0', color: '#556', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>Approved subscribers from today reset each day.</p>
          </div>
          <div className="responsive-grid-cards" style={{ marginTop: 20, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {todaySubscribers.length > 0 ? (
              todaySubscribers.map((user) => (
                <div
                  key={user._id}
                  onClick={() => setOverlayUser(user)}
                  style={{ cursor: 'pointer', borderRadius: 18, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 16px rgba(15, 39, 95, 0.1)', transition: 'transform 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <img
                    src={buildFanPhotoUrl(user.photo)}
                    alt={user.name}
                    style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ padding: 'clamp(8px, 2vw, 12px)', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontWeight: 700, color: '#102341', fontSize: 'clamp(11px, 2vw, 13px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, color: '#999', gridColumn: '1/-1', textAlign: 'center', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>No approved subscribers today yet</p>
            )}
          </div>
        </section> */}

        <div style={{ padding: 'clamp(16px, 4vw, 24px)', borderRadius: 32, background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(16, 35, 65, 0.04)', boxShadow: '0 30px 90px rgba(15, 39, 95, 0.08)' }}>
          <p style={{ margin: 0, color: '#4f5f7b', fontSize: 'clamp(13px, 3vw, 16px)' }}>{message}</p>
        </div>
      </div>
    </div>
  );
}

export default LivePage;
