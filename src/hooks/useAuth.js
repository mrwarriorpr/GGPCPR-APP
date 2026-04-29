// src/hooks/useAuth.js
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const USERS = [
  { id: 1, username: 'admin',       password: 'GGPC2024!',     name: 'Administrador', role: 'admin' },
  { id: 2, username: 'supervisor1', password: 'Super2024!',    name: 'Supervisor 1',  role: 'supervisor' },
  { id: 3, username: 'supervisor2', password: 'Super2024!',    name: 'Supervisor 2',  role: 'supervisor' },
  { id: 4, username: 'manager',     password: 'Manager2024!',  name: 'Gerente RRHH',  role: 'manager' },
  { id: 5, username: 'director',    password: 'Director2024!', name: 'Director',      role: 'director' },
  ];

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
          try { return JSON.parse(sessionStorage.getItem('ggpc_session')); } catch { return null; }
    });
    const [loading] = useState(false);

  const login = (username, password) => {
        const found = USERS.find(
                u => u.username === username.trim() && u.password === password
              );
        if (found) {
                const { password: _, ...safe } = found;
                sessionStorage.setItem('ggpc_session', JSON.stringify(safe));
                setUser(safe);
                return true;
        }
        return false;
  };

  const logout = () => {
        sessionStorage.removeItem('ggpc_session');
        setUser(null);
  };

  return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
{children}
</AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
