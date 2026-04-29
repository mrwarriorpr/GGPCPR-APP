// src/components/Layout.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '◈' },
  { to: '/empleados', label: 'Empleados', icon: '◉' },
  { to: '/puestos', label: 'Puestos', icon: '◎' },
  { to: '/horarios', label: 'Plan Bisemanal', icon: '◷' },
  { to: '/vacantes', label: 'Vacantes', icon: '◌' },
  { to: '/citas', label: 'Citas', icon: '◑' },
];

const C = {
  black:'#0d0d0d', dark:'#1a1a1a', panel:'#222222', border:'#2e2e2e',
  gold:'#F5C518', green:'#2d7a3a', white:'#ffffff', gray:'#888888', light:'#f4f4f2',
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const handleLogout = () => { logout(); navigate('/login'); };
  const W = collapsed ? 64 : 240;

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:C.light, fontFamily:"'Segoe UI', system-ui, sans-serif" }}>
      <aside style={{
        width:W, transition:'width 0.25s ease', background:C.black,
        display:'flex', flexDirection:'column', flexShrink:0,
        boxShadow:'3px 0 24px rgba(0,0,0,0.5)', borderRight:`1px solid ${C.border}`,
      }}>
        <div style={{ height:3, background:C.gold, flexShrink:0 }} />
        <div style={{
          padding: collapsed ? '16px 0' : '16px 16px 14px', borderBottom:`1px solid ${C.border}`,
          display:'flex', alignItems:'center', gap:10,
          justifyContent: collapsed ? 'center' : 'flex-start', overflow:'hidden',
        }}>
          <div style={{
            width: collapsed ? 38 : 42, height: collapsed ? 38 : 42, borderRadius:'50%',
            flexShrink:0, background:'white', overflow:'hidden',
            outline:`2px solid ${C.gold}`, outlineOffset:1, transition:'all 0.25s',
          }}>
            <img src="/logo-ggpc.jpg" alt="GGPC" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          {!collapsed && (
            <div style={{ overflow:'hidden' }}>
              <div style={{ color:C.gold, fontWeight:900, fontSize:13, letterSpacing:'1.5px', whiteSpace:'nowrap' }}>GLOBAL GUARD</div>
              <div style={{ color:C.gray, fontSize:9, letterSpacing:'0.8px', whiteSpace:'nowrap' }}>PROTECTION CORP.</div>
            </div>
          )}
        </div>

        <nav style={{ flex:1, padding:'10px 0', overflow:'hidden' }}>
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10,
              padding: collapsed ? '11px 0' : '10px 16px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: isActive ? C.gold : '#5a5a5a',
              textDecoration:'none', fontSize:13, fontWeight: isActive ? 700 : 400,
              background: isActive ? 'rgba(245,197,24,0.08)' : 'transparent',
              borderLeft: isActive ? `3px solid ${C.gold}` : '3px solid transparent',
              transition:'all 0.15s', whiteSpace:'nowrap', overflow:'hidden',
            })}>
              <span style={{ fontSize:16, flexShrink:0, width:18, textAlign:'center' }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop:`1px solid ${C.border}`, padding:'10px 0', overflow:'hidden' }}>
          {!collapsed && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 16px 10px', overflow:'hidden' }}>
              <div style={{
                width:30, height:30, borderRadius:8, flexShrink:0,
                background:C.gold, display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:11, fontWeight:900, color:C.black,
              }}>
                {user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2)||'US'}
              </div>
              <div style={{ overflow:'hidden' }}>
                <div style={{ color:C.white, fontSize:12, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
                <div style={{ color:C.gray, fontSize:10 }}>{user?.role}</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            display:'flex', alignItems:'center', gap:10,
            padding: collapsed ? '10px 0' : '8px 16px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            width:'100%', background:'none', border:'none', cursor:'pointer',
            color:'#5a3a3a', fontSize:12, whiteSpace:'nowrap',
          }}
            onMouseEnter={e=>e.currentTarget.style.color='#ff6060'}
            onMouseLeave={e=>e.currentTarget.style.color='#5a3a3a'}
          >
            <span style={{ fontSize:15, width:18, textAlign:'center' }}>⏻</span>
            {!collapsed && 'Cerrar sesión'}
          </button>
          <button onClick={()=>setCollapsed(o=>!o)} style={{
            display:'flex', alignItems:'center', gap:10,
            padding: collapsed ? '8px 0' : '6px 16px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            width:'100%', background:'none', border:'none', cursor:'pointer', color:'#3a3a3a', fontSize:11,
          }}>
            <span style={{ transform: collapsed ? 'rotate(180deg)' : '', display:'inline-block', transition:'transform 0.25s', width:18, textAlign:'center' }}>◁</span>
            {!collapsed && 'Colapsar menú'}
          </button>
        </div>
      </aside>

      <main style={{ flex:1, overflow:'auto', padding:'20px 28px' }}>
        <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', marginBottom:8, gap:10 }}>
          <div style={{ fontSize:12, color:'#999' }}>
            {new Date().toLocaleDateString('es-PR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
          </div>
          <div style={{ background:C.gold, color:C.black, fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:20, letterSpacing:'0.5px', textTransform:'uppercase' }}>
            {user?.role}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
