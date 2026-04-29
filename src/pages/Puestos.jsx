// src/pages/Puestos.jsx
import { useState, useEffect } from 'react';
import { getPosts, getEmployees, addPost, updatePost } from '../data/store';

const EMPTY_FORM = {
  name: '', location: '', shifts: ['7:00-15:00'], requiredGuards: 1,
};

export default function Puestos() {
  const [posts, setPosts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newShift, setNewShift] = useState('');

  const reload = () => {
    setPosts(getPosts());
    setEmployees(getEmployees());
  };

  useEffect(() => { reload(); }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setShowModal(true); };
  const openEdit = (p) => { setForm({ ...p }); setEditingId(p.id); setShowModal(true); };

  const handleSave = () => {
    if (!form.name) return alert('El nombre del puesto es requerido.');
    if (editingId) {
      updatePost(editingId, form);
    } else {
      addPost(form);
    }
    reload();
    setShowModal(false);
  };

  const addShift = () => {
    if (!newShift || !/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/.test(newShift)) {
      return alert('Formato de turno inválido. Use HH:MM-HH:MM (ej: 7:00-15:00)');
    }
    setForm(f => ({ ...f, shifts: [...(f.shifts || []), newShift] }));
    setNewShift('');
  };

  const removeShift = (shift) => setForm(f => ({ ...f, shifts: f.shifts.filter(s => s !== shift) }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0a1628' }}>Puestos de Seguridad</h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>{posts.length} puestos configurados</p>
        </div>
        <button onClick={openAdd} style={{
          background: '#F5C518', color: '#0d0d0d', border: 'none', borderRadius: 10,
          padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          + Nuevo Puesto
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {posts.map(post => {
          const assignedGuards = employees.filter(e => e.postAssignment === post.id && e.status === 'active');
          const coverage = assignedGuards.length >= post.requiredGuards;

          return (
            <div key={post.id} style={{
              background: 'white', borderRadius: 14, overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <div style={{
                background: coverage ? '#0d0d0d' : '#7f1d1d',
                padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 700 }}>{post.name}</h3>
                    <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{post.location}</p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                    background: coverage ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.3)',
                    color: coverage ? '#86efac' : '#fca5a5',
                  }}>
                    {coverage ? '✓ Cubierto' : '⚠ Déficit'}
                  </span>
                </div>
              </div>

              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14, fontSize: 12 }}>
                  <div>
                    <div style={{ color: '#aaa' }}>Guardias requeridos</div>
                    <div style={{ fontWeight: 700, color: '#111', fontSize: 16 }}>{post.requiredGuards}</div>
                  </div>
                  <div>
                    <div style={{ color: '#aaa' }}>Guardias asignados</div>
                    <div style={{ fontWeight: 700, color: coverage ? '#166534' : '#b91c1c', fontSize: 16 }}>
                      {assignedGuards.length}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6, fontWeight: 600 }}>TURNOS</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {post.shifts?.map(s => (
                      <span key={s} style={{
                        background: '#e0e7ff', color: '#3730a3', fontSize: 11, fontWeight: 600,
                        borderRadius: 5, padding: '3px 8px',
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {assignedGuards.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6, fontWeight: 600 }}>GUARDIAS ASIGNADOS</div>
                    {assignedGuards.map(emp => (
                      <div key={emp.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '4px 0', borderBottom: '1px solid #f5f5f5',
                        fontSize: 13,
                      }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: '#dbeafe', color: '#c9a000',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700,
                        }}>
                          {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span style={{ color: '#333' }}>{emp.name}</span>
                        <span style={{
                          marginLeft: 'auto', fontSize: 10, fontWeight: 600,
                          color: emp.type === 'full-time' ? '#F5C518' : '#92400e',
                          background: emp.type === 'full-time' ? '#dbeafe' : '#fef3c7',
                          padding: '1px 5px', borderRadius: 3,
                        }}>
                          {emp.type === 'full-time' ? 'FT' : 'PT'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => openEdit(post)} style={{
                  width: '100%', padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: '#f0f4ff', color: '#c9a000', border: 'none', cursor: 'pointer',
                }}>
                  Editar puesto
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: '28px 32px',
            width: '100%', maxWidth: 480,
          }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700 }}>
              {editingId ? 'Editar Puesto' : 'Nuevo Puesto'}
            </h2>

            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nombre del puesto *</label>
                <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Ubicación / Área</label>
                <input style={inputStyle} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Guardias requeridos</label>
                <input style={inputStyle} type="number" min={1} value={form.requiredGuards} onChange={e => setForm(f => ({ ...f, requiredGuards: parseInt(e.target.value) }))} />
              </div>

              <div>
                <label style={labelStyle}>Turnos</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {form.shifts?.map(s => (
                    <span key={s} style={{
                      background: '#e0e7ff', color: '#3730a3', fontSize: 12, fontWeight: 600,
                      borderRadius: 5, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      {s}
                      <button onClick={() => removeShift(s)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', fontSize: 14, padding: 0,
                      }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={{ ...inputStyle, flex: 1 }} placeholder="7:00-15:00"
                    value={newShift} onChange={e => setNewShift(e.target.value)}
                  />
                  <button onClick={addShift} style={{
                    padding: '9px 14px', background: '#e0e7ff', color: '#3730a3',
                    border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
                  }}>+</button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, padding: '10px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: '#f5f5f5', color: '#555', border: 'none', cursor: 'pointer',
              }}>Cancelar</button>
              <button onClick={handleSave} style={{
                flex: 1, padding: '10px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: '#F5C518', color: '#0d0d0d', border: 'none', cursor: 'pointer',
              }}>
                {editingId ? 'Guardar' : 'Crear puesto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, color: '#666', fontWeight: 600, marginBottom: 4 };
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 14,
  border: '1px solid #e0e0e0', outline: 'none', boxSizing: 'border-box',
};
