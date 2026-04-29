// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = login(username.trim(), password);
    if (ok) {
      navigate('/dashboard');
    } else {
      setError('Usuario o contraseña incorrectos.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0d0d0d', fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        backgroundImage: 'radial-gradient(circle, #F5C518 1px, transparent 1px)',
        backgroundSize: '32px 32px', position: 'absolute', inset: 0, opacity: 0.03,
      }} />
      <div style={{
        background: 'linear-gradient(145deg, #1a1a1a, #111)',
        border: '1px solid #F5C518',
        borderRadius: '16px', padding: '3rem 2.5rem', width: '100%', maxWidth: '420px',
        boxShadow: '0 0 60px rgba(245,197,24,0.15)', position: 'relative', zIndex: 1,
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <img src="/logo.png" alt="GGPC" style={{ height: '90px', marginBottom: '1rem' }}
            onError={(e) => { e.target.style.display='none'; }} />
          <h1 style={{
            fontSize: '1.3rem', fontWeight: 800, color: '#F5C518',
            letterSpacing: '2px', margin: 0, textTransform: 'uppercase',
          }}>Global Guard Protection Corp.</h1>
          <p style={{ color: '#888', fontSize: '0.8rem', letterSpacing: '3px', marginTop: '0.5rem' }}>
            SISTEMA DE GESTIÓN DE SEGURIDAD
          </p>
          <div style={{ width: '60px', height: '2px', background: '#F5C518', margin: '1rem auto 0' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              USUARIO
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              style={{
                width: '100%', padding: '0.9rem 1rem', background: '#0d0d0d',
                border: '1px solid #333', borderRadius: '8px', color: '#fff',
                fontSize: '1rem', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#F5C518'}
              onBlur={(e) => e.target.style.borderColor = '#333'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#aaa', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              CONTRASEÑA
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{
                width: '100%', padding: '0.9rem 1rem', background: '#0d0d0d',
                border: '1px solid #333', borderRadius: '8px', color: '#fff',
                fontSize: '1rem', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#F5C518'}
              onBlur={(e) => e.target.style.borderColor = '#333'}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem',
              color: '#f87171', fontSize: '0.875rem', textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '1rem', background: loading ? '#a38700' : '#F5C518',
              color: '#000', border: 'none', borderRadius: '8px', fontSize: '1rem',
              fontWeight: 800, letterSpacing: '2px', cursor: loading ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase', transition: 'all 0.2s',
            }}
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#444', fontSize: '0.75rem', marginTop: '2rem' }}>
          Global Guard Protection Corp. © 2025 · Sistema Interno
        </p>
      </div>
    </div>
  );
}
