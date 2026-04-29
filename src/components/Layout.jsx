// src/components/Layout.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: '◉' },
  { path: '/empleados', label: 'Empleados', icon: '👤' },
  { path: '/puestos',   label: 'Puestos',   icon: '📍' },
  { path: '/horarios',  label: 'Horarios',  icon: '📅' },
  { path: '/vacantes',  label: 'Vacantes',  icon: '🔔' },
  { path: '/citas',     label: 'Citas',     icon: '📋' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0d0d0d', fontFamily:"'Segoe UI',sans-serif" }}>
      {/* Sidebar */}
      <div style={{
        width: collapsed ? 60 : 220, minHeight:'100vh', background:'#111',
        borderRight:'1px solid #222', display:'flex', flexDirection:'column',
        transition:'width 0.2s', flexShrink:0, position:'relative', zIndex:10,
      }}>
        {/* Logo */}
        <div style={{ padding:'1rem', borderBottom:'1px solid #222', display:'flex', alignItems:'center', gap:10 }}>
          <img src="/logo.png" alt="GGPC" style={{ width:36, height:36, flexShrink:0 }}
            onError={e=>e.target.style.display='none'} />
          {!collapsed && <span style={{ color:'#F5C518', fontWeight:800, fontSize:13, letterSpacing:1 }}>GGPC</span>}
        </div>

        {/* Toggle */}
        <button onClick={()=>setCollapsed(!collapsed)} style={{
          background:'none', border:'none', color:'#666', cursor:'pointer',
          padding:'8px', textAlign:'center', fontSize:16,
        }}>{collapsed ? '▶' : '◀'}</button>

        {/* Nav links */}
        <nav style={{ flex:1, padding:'0.5rem 0' }}>
          {NAV.map(n => (
            <NavLink key={n.path} to={n.path} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:12, padding:'10px 16px',
              color: isActive ? '#F5C518' : '#aaa', textDecoration:'none',
              background: isActive ? 'rgba(245,197,24,0.1)' : 'transparent',
              borderLeft: isActive ? '3px solid #F5C518' : '3px solid transparent',
              fontSize:14, fontWeight: isActive ? 600 : 400,
              transition:'all 0.15s', whiteSpace:'nowrap', overflow:'hidden',
            })}>
              <span style={{ fontSize:18, flexShrink:0 }}>{n.icon}</span>
              {!collapsed && n.label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div style={{ padding:'1rem', borderTop:'1px solid #222' }}>
          {!collapsed && <div style={{ color:'#666', fontSize:12, marginBottom:8 }}>{user?.name}</div>}
          <button onClick={handleLogout} style={{
            width:'100%', padding:'8px', background:'rgba(220,38,38,0.1)',
            border:'1px solid rgba(220,38,38,0.3)', borderRadius:6,
            color:'#f87171', cursor:'pointer', fontSize:12,
          }}>
            {collapsed ? '↩' : 'Cerrar sesión'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, overflow:'auto', padding:'2rem', minWidth:0 }}>
        {children}
      </div>
    </div>
  );
}
