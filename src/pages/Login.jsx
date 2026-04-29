// src/pages/Login.jsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 600));
    const ok = login(form.username, form.password);
    if (!ok) setError('Usuario o contraseña incorrectos.');
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0d0d0d',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle dot grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.07,
        backgroundImage: 'radial-gradient(circle, #F5C518 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />
      {/* Gold accent top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: '#F5C518' }} />

      <div style={{
        background: '#1a1a1a',
        border: '1px solid #2e2e2e',
        borderTop: '3px solid #F5C518',
        borderRadius: 20,
        padding: '48px 40px', width: '100%', maxWidth: 420,
        boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
        position: 'relative',
      }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 100, height: 100, margin: '0 auto 16px',
            borderRadius: '50%',
            background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 6,
            boxShadow: '0 0 0 3px #F5C518, 0 8px 30px rgba(245,197,24,0.3)',
          }}>
            <img src="/logo-ggpc.jpg" alt="GGPC Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
          </div>
          <h1 style={{ color: 'white', margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Global Guard Protection Corp.
          </h1>
          <p style={{ color: '#666', margin: '6px 0 0', fontSize: 12, letterSpacing: '0.5px' }}>SISTEMA DE GESTIÓN DE SEGURIDAD</p>
          <div style={{ width: 40, height: 2, background: '#F5C518', margin: '12px auto 0', borderRadius: 2 }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#999', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Usuario
            </label>
            <input
              type="text" value={form.username} autoComplete="username"
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 15,
                background: '#111', border: '1px solid #333',
                color: 'white', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#F5C518'}
              onBlur={e => e.target.style.borderColor = '#333'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: '#999', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Contraseña
            </label>
            <input
              type="password" value={form.password} autoComplete="current-password"
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 15,
                background: '#111', border: '1px solid #333',
                color: 'white', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#F5C518'}
              onBlur={e => e.target.style.borderColor = '#333'}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(220,50,50,0.15)', border: '1px solid rgba(220,50,50,0.4)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              color: '#ff8080', fontSize: 13, textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 800,
              background: loading ? '#555' : '#F5C518',
              color: loading ? '#aaa' : '#0d0d0d',
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.5px', textTransform: 'uppercase',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#444', fontSize: 11, marginTop: 28, marginBottom: 0 }}>
          Global Guard Protection Corp. © 2025 · Sistema Interno
        </p>
      </div>
    </div>
  );
}
