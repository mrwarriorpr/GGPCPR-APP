// src/pages/Empleados.jsx
import { useState, useEffect } from 'react';
import { getEmployees, getPosts, addEmployee, updateEmployee, deleteEmployee } from '../data/store';

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_LABELS = { L: 'Lun', M: 'Mar', X: 'Mié', J: 'Jue', V: 'Vie', S: 'Sáb', D: 'Dom' };

const EMPTY_FORM = {
  name: '', badge: '', type: 'full-time', phone: '', email: '',
  availableDays: ['L', 'M', 'X', 'J', 'V'], maxHoursPerWeek: 40,
  preferredShifts: [], postAssignment: '', status: 'active',
  hireDate: '', hourlyRate: 11.00,
};

export default function Empleados() {
  const [employees, setEmployees] = useState([]);
  const [posts, setPosts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const reload = () => {
    setEmployees(getEmployees());
    setPosts(getPosts());
  };

  useEffect(() => { reload(); }, []);

  const filtered = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.badge?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || e.type === filterType;
    return matchSearch && matchType;
  });

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setForm({ ...emp });
    setEditingId(emp.id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.badge) return alert('Nombre y placa son requeridos.');
    if (editingId) {
      updateEmployee(editingId, form);
    } else {
      addEmployee(form);
    }
    reload();
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Eliminar este empleado?')) {
      deleteEmployee(id);
      reload();
    }
  };

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      availableDays: f.availableDays.includes(day)
        ? f.availableDays.filter(d => d !== day)
        : [...f.availableDays, day],
    }));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0a1628' }}>Empleados</h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>{employees.filter(e => e.status === 'active').length} guardias activos</p>
        </div>
        <button onClick={openAdd} style={{
          background: '#F5C518', color: '#0d0d0d', border: 'none', borderRadius: 10,
          padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          + Añadir Empleado
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar por nombre o placa..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 220, padding: '9px 14px', borderRadius: 8, fontSize: 14,
            border: '1px solid #e0e0e0', outline: 'none',
          }}
        />
        {['all', 'full-time', 'part-time'].map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={{
            padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: filterType === t ? '#F5C518' : 'white',
            color: filterType === t ? 'white' : '#555',
            border: '1px solid ' + (filterType === t ? '#F5C518' : '#e0e0e0'),
          }}>
            {t === 'all' ? 'Todos' : t === 'full-time' ? 'Full-Time' : 'Part-Time'}
          </button>
        ))}
      </div>

      {/* Employee cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filtered.map(emp => {
          const post = posts.find(p => p.id === emp.postAssignment);
          return (
            <div key={emp.id} style={{
              background: 'white', borderRadius: 14, padding: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              border: emp.status === 'inactive' ? '1px solid #fee2e2' : '1px solid transparent',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: emp.type === 'full-time' ? '#dbeafe' : '#fef3c7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 700,
                    color: emp.type === 'full-time' ? '#F5C518' : '#92400e',
                  }}>
                    {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0a1628', fontSize: 15 }}>{emp.name}</div>
                    <div style={{ color: '#888', fontSize: 12 }}>{emp.badge}</div>
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 8px',
                  background: emp.type === 'full-time' ? '#dbeafe' : '#fef3c7',
                  color: emp.type === 'full-time' ? '#F5C518' : '#92400e',
                }}>
                  {emp.type === 'full-time' ? 'FULL-TIME' : 'PART-TIME'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, fontSize: 12 }}>
                <div><span style={{ color: '#aaa' }}>Teléfono:</span> <span style={{ color: '#333' }}>{emp.phone}</span></div>
                <div><span style={{ color: '#aaa' }}>Hrs/Sem:</span> <span style={{ color: '#333', fontWeight: 600 }}>{emp.maxHoursPerWeek}h</span></div>
                <div><span style={{ color: '#aaa' }}>Puesto:</span> <span style={{ color: '#333' }}>{post?.name || '—'}</span></div>
                <div><span style={{ color: '#aaa' }}>Tarifa:</span> <span style={{ color: '#333', fontWeight: 600 }}>${emp.hourlyRate}/h</span></div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>Días disponibles:</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {DAYS.map(d => (
                    <span key={d} style={{
                      width: 22, height: 22, borderRadius: 4, fontSize: 10, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: emp.availableDays?.includes(d) ? '#dbeafe' : '#f0f0f0',
                      color: emp.availableDays?.includes(d) ? '#F5C518' : '#ccc',
                    }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(emp)} style={{
                  flex: 1, padding: '7px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  background: '#f0f4ff', color: '#c9a000', border: 'none', cursor: 'pointer',
                }}>
                  Editar
                </button>
                <button onClick={() => handleDelete(emp.id)} style={{
                  flex: 1, padding: '7px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                  background: '#fff5f5', color: '#b91c1c', border: 'none', cursor: 'pointer',
                }}>
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: 20,
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: '28px 32px',
            width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700 }}>
              {editingId ? 'Editar Empleado' : 'Nuevo Empleado'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Nombre completo *</label>
                <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Número de Placa *</label>
                <input style={inputStyle} value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Tipo</label>
                <select style={inputStyle} value={form.type} onChange={e => {
                  const t = e.target.value;
                  setForm(f => ({ ...f, type: t, maxHoursPerWeek: t === 'full-time' ? 40 : 24 }));
                }}>
                  <option value="full-time">Full-Time</option>
                  <option value="part-time">Part-Time</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Puesto Asignado</label>
                <select style={inputStyle} value={form.postAssignment} onChange={e => setForm(f => ({ ...f, postAssignment: Number(e.target.value) }))}>
                  <option value="">Sin asignar</option>
                  {posts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tarifa por hora ($)</label>
                <input style={inputStyle} type="number" step="0.25" value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: parseFloat(e.target.value) }))} />
              </div>
              <div>
                <label style={labelStyle}>Máx. horas/semana</label>
                <input style={inputStyle} type="number" value={form.maxHoursPerWeek} onChange={e => setForm(f => ({ ...f, maxHoursPerWeek: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label style={labelStyle}>Fecha de contratación</label>
                <input style={inputStyle} type="date" value={form.hireDate} onChange={e => setForm(f => ({ ...f, hireDate: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Estado</label>
                <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Días disponibles para trabajar</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  {DAYS.map(d => (
                    <button key={d} type="button" onClick={() => toggleDay(d)} style={{
                      width: 44, height: 36, borderRadius: 7, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', border: 'none',
                      background: form.availableDays?.includes(d) ? '#F5C518' : '#f0f0f0',
                      color: form.availableDays?.includes(d) ? 'white' : '#888',
                    }}>
                      {DAY_LABELS[d]}
                    </button>
                  ))}
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
                {editingId ? 'Guardar cambios' : 'Añadir empleado'}
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
