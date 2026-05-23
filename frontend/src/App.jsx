import { NavLink, Routes, Route } from 'react-router-dom';
import LivePage from './pages/LivePage.jsx';
import AdminPage from './pages/AdminPage.jsx';

const navLinkStyle = ({ isActive }) => ({
  marginRight: 16,
  color: isActive ? '#0b3d91' : '#555',
  textDecoration: 'none',
  fontWeight: isActive ? '700' : '500',
});

function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f8ff', color: '#1b2437', padding: 'clamp(12px, 4vw, 20px)', fontFamily: 'Arial, sans-serif', overflowX: 'hidden', width: '100%' }}>
      <style>{`
        * {
          box-sizing: border-box;
        }
        html, body, #root {
          width: 100%;
          overflow-x: hidden;
        }

        @media (max-width: 768px) {
          body, html, #root { 
            overflow-x: hidden; 
            width: 100%;
            padding: 0;
            margin: 0;
          }
          * { box-sizing: border-box; }
        }

        @media (max-width: 480px) {
          body, html, #root { 
            overflow-x: hidden; 
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
      <header style={{ marginBottom: 'clamp(16px, 4vw, 24px)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'clamp(12px, 3vw, 16px)', overflowX: 'hidden' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ margin: 0, color: '#0b3d91', fontSize: 'clamp(20px, 5vw, 32px)', wordBreak: 'break-word' }}>TVK 17226209 Supporters</h1>
          <p style={{ margin: '4px 0 0', color: '#556', fontSize: 'clamp(12px, 3vw, 16px)' }}>Together. Stronger. Bigger.</p>
        </div>
        <nav style={{ marginTop: 'clamp(8px, 2vw, 12px)', display: 'flex', gap: 'clamp(10px, 2vw, 12px)', flexWrap: 'wrap' }}>
          <NavLink to="/" style={navLinkStyle} end>
            Live Page
          </NavLink>
          <NavLink to="/admin" style={navLinkStyle}>
            Admin Page
          </NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<LivePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  );
}

export default App;
