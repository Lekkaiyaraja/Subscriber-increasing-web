import { useMemo, useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../config.js';
import { socket } from '../socket.js';
import { buildImageUrl, handleImageError } from '../utils/imageHelpers.js';

function ApprovedUserShowcase({ approvedUsers = [], recentUsers = [], currentIndex = 0, onThumbnailClick = () => {} }) {
  const carouselItems = useMemo(() => {
    if (approvedUsers.length > 0) {
      return approvedUsers.slice(0, 20);
    }
    return recentUsers.slice(0, 20);
  }, [approvedUsers, recentUsers]);

  const safeIndex = carouselItems.length > 0 ? Math.min(currentIndex, carouselItems.length - 1) : 0;
  const activeUser = carouselItems[safeIndex] || null;
  const displayUsers = carouselItems;
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await axios.get(`${API}/api/admin/badges`);
        if (mounted) setBadges(res.data || []);
      } catch (err) {
        // ignore
      }
    };
    load();
    socket.on('badgesUpdated', load);
    return () => {
      mounted = false;
      socket.off('badgesUpdated', load);
    };
  }, []);

  const normalizeBadgeText = (text) => {
    const raw = String(text || '').trim();
    if (!raw) return '';
    return raw
      .replace(/[\\/]+/g, ' ')
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  };

  const getSupporterGroupCandidates = (fan) => {
    const raw = fan ? String(fan.supporterGroup || fan.place || '').trim() : '';
    if (!raw) return [];
    const parts = raw
      .split(/[\\/\(\)\[\],\|:\-]+/)
      .map((part) => part.trim())
      .filter(Boolean);

    const normalizedRaw = normalizeBadgeText(raw);
    const normalizedParts = parts.map(normalizeBadgeText).filter(Boolean);
    return Array.from(new Set([normalizedRaw, ...normalizedParts]));
  };

  const normalizeSupporterGroup = (fan) => {
    const candidates = getSupporterGroupCandidates(fan);
    return candidates.length > 0 ? candidates[candidates.length - 1] : '';
  };

  const findBadgeForFan = (fan) => {
    if (!fan) return null;
    const explicitBadge = fan.badgeImage ? String(fan.badgeImage).trim() : '';
    if (explicitBadge) {
      return { badgeImageUrl: explicitBadge, groupName: fan.supporterGroup || normalizeSupporterGroup(fan) };
    }

    if (badges.length === 0) return null;
    const candidates = getSupporterGroupCandidates(fan);

    return badges.find((badge) => {
      const normalizedBadgeName = normalizeBadgeText(badge.groupName || '');
      if (!normalizedBadgeName) return false;
      return candidates.some((candidate) => {
        if (candidate === normalizedBadgeName) return true;
        return candidate.includes(normalizedBadgeName) || normalizedBadgeName.includes(candidate);
      });
    }) || null;
  };

  const matchedBadge = findBadgeForFan(activeUser);
  const badgeImageUrl = matchedBadge ? matchedBadge.badgeImageUrl : null;
  const badgeGroupLabel = String(activeUser?.supporterGroup || matchedBadge?.groupName || normalizeSupporterGroup(activeUser) || '')
    .trim()
    .toUpperCase();
  const badgeLabelText = badgeGroupLabel || 'SUPPORTER';
  const badgePlaceholderLabel = badgeLabelText
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    // Debugging: log active user and badge mapping when spotlight changes
    try {
      // eslint-disable-next-line no-console
      console.debug('Spotlight debug:', { activeUser, matchedBadge, badgeImageUrl, badgeGroupLabel });
    } catch (e) {}
  }, [activeUser, matchedBadge, badgeImageUrl, badgeGroupLabel]);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(7, 63, 138, 0.95), rgba(112, 58, 204, 0.95))',
        borderRadius: 28,
        padding: 'clamp(16px, 4vw, 24px)',
        marginBottom: 30,
        boxShadow: '0 30px 80px rgba(15, 39, 95, 0.18)',
        color: '#fff',
        display: 'grid',
        gap: 20,
        height: 'fit-content',
        overflowX: 'hidden',
      }}
    >
      <div style={{ display: 'grid', gap: 16, alignItems: 'center', justifyItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#27e0a6', boxShadow: '0 0 12px rgba(39, 232, 166, 0.8)' }} />
          <h2 style={{ margin: 0, fontSize: 'clamp(18px, 4vw, 20px)', letterSpacing: 1.1 }}>Featured Fan Spotlight</h2>
        </div>
        {activeUser ? (
          <div
            style={{
              width: '100%', maxWidth: 520,
              borderRadius: 28,
              padding: 'clamp(12px, 3vw, 18px)',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 22px 50px rgba(0, 0, 0, 0.18)',
              display: 'grid',
              gap: 16,
            }}
          >
            {/* Main spotlight image - Responsive height with object-fit: contain */}
            <div 
              style={{ 
                position: 'relative', 
                borderRadius: 24, 
                overflow: 'hidden', 
                width: '100%',
                height: 'clamp(280px, 50vw, 420px)',
                background: '#111',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.38) 65%)' }} />
              <img
                src={buildImageUrl(activeUser.photo)}
                alt={activeUser.name || 'featured fan'}
                onError={handleImageError}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  display: 'block',
                  backgroundColor: '#111',
                }}
              />
              {/* <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18, color: '#fff' }}>
                <p style={{ margin: 0, fontSize: 'clamp(20px, 2vw, 12px)', opacity: 0.9 }}>Welcome</p>
                <h3 style={{ margin: '8px 0 4px', fontSize: 'clamp(18px, 4vw, 24px)', lineHeight: 1.1 }}>{activeUser.name || 'Guest Fan'}</h3>
                {activeUser.place && <p style={{ margin: 0, opacity: 0.9, fontSize: 'clamp(12px, 3vw, 14px)' }}>{activeUser.place}</p>}
              </div> */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 'min(80%, 300px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 20,
                  background: '#ffffff',
                  border: '1px solid rgba(226, 232, 240, 0.95)',
                  boxShadow: '0 12px 24px rgba(20, 44, 85, 0.1)',
                  zIndex: 2,
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    minWidth: 54,
                    borderRadius: 16,
                    display: 'grid',
                    placeItems: 'center',
                    background: badgeImageUrl ? '#f8fafc' : '#eff2f7',
                    border: badgeImageUrl ? '1px solid #dbe4f3' : '1px dashed #cbd5e1',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {badgeImageUrl ? (
                    <img
                      src={badgeImageUrl}
                      alt={badgeLabelText}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <span style={{ color: '#475569', fontSize: 18, fontWeight: 700, letterSpacing: '0.08em' }}>{badgePlaceholderLabel}</span>
                  )}
                </div>
                <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
                    <span style={{ color: '#0f172a', fontWeight: 800, fontSize: 'clamp(13px, 2.7vw, 15px)', lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {badgeLabelText}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #1a73ff 0%, #4f96ff 100%)', color: '#fff', flexShrink: 0, boxShadow: '0 1px 3px rgba(15, 23, 42, 0.18)', border: '1px solid rgba(255,255,255,0.8)' }}>
                      <svg viewBox="0 0 24 24" style={{ width: 12, height: 12, display: 'block' }} aria-hidden="true">
                        <path d="M20.3 7.7a1 1 0 0 0-1.4-1.4L9 16.2 5.1 12.3a1 1 0 0 0-1.4 1.4l4.6 4.6a1 1 0 0 0 1.4 0l10.6-10.6z" fill="currentColor" />
                      </svg>
                    </span>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#334155', fontSize: 'clamp(11px, 2.4vw, 12px)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span style={{ fontSize: 14, lineHeight: 1 }}>👤</span>
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeUser.name || 'Guest Fan'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Thumbnail strip - Responsive sizing, clickable to render */}
            {displayUsers.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(8px, 2vw, 12px)', flexWrap: 'wrap', paddingBottom: 8, overflowX: 'auto' }}>
                {displayUsers.map((user, index) => (
                  <button
                    key={user._id}
                    onClick={() => onThumbnailClick(index)}
                    type="button"
                    style={{
                      width: 'clamp(56px, 12vw, 72px)',
                      height: 'clamp(56px, 12vw, 72px)',
                      borderRadius: 18,
                      overflow: 'hidden',
                      border: index === currentIndex ? '3px solid #fff' : '2px solid rgba(255,255,255,0.32)',
                      boxShadow: index === currentIndex ? '0 0 0 4px rgba(255,255,255,0.16)' : 'none',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: 'transparent',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={buildImageUrl(user.photo)}
                      alt={user.name || 'approved fan'}
                      onError={handleImageError}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: 'clamp(16px, 3vw, 24px)', background: 'rgba(255,255,255,0.1)', borderRadius: 18, textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#eef2ff', fontSize: 'clamp(12px, 2.5vw, 14px)' }}>No approved fans are live yet. Approve a fan upload from the admin panel to feature it here.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes rotateCards {
          0% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default ApprovedUserShowcase;
