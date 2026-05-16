import { useMemo } from 'react';
import { API } from '../config.js';

const PLACEHOLDER_IMAGE = 'https://placehold.co/120x120?text=Fan';

const buildFanPhotoUrl = (photo) => {
  if (!photo) return PLACEHOLDER_IMAGE;
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
  const normalized = photo.startsWith('/') ? photo : `/${photo}`;
  return API ? `${API}${normalized}` : normalized;
};

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
                src={buildFanPhotoUrl(activeUser.photo)}
                alt={activeUser.name || 'featured fan'}
                onError={(event) => {
                  event.currentTarget.src = PLACEHOLDER_IMAGE;
                }}
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
              <div style={{ position: 'absolute', bottom: 18, left: 18, right: 18, color: '#fff' }}>
  <span
    style={{
      display: 'inline-block',
      background: '#e53935',
      color: '#fff',
      padding: '6px 14px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 0.5,
      marginBottom: 8
    }}
  >
    SUBSCRIBER
  </span>

  <h3 style={{ margin: '6px 0 4px', fontSize: 'clamp(18px, 4vw, 24px)', lineHeight: 1.1 }}>
    {activeUser.name || 'Guest Fan'}
  </h3>

  {activeUser.place && (
    <p style={{ margin: 0, opacity: 0.9, fontSize: 'clamp(12px, 3vw, 14px)' }}>
      {activeUser.place}
    </p>
  )}
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
                      src={buildFanPhotoUrl(user.photo)}
                      alt={user.name || 'approved fan'}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = PLACEHOLDER_IMAGE;
                      }}
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
