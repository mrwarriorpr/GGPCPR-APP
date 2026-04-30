// src/pages/Citas.jsx
import { useState, useEffect } from 'react';
import { getAppointments, addAppointment, deleteAppointment, getEmployees } from '../data/store';

const APPT_TYPES = ['Médica', 'Dental', 'Legal', 'Personal', 'Vacaciones', 'Otro'];

const EMPTY_FORM = { employeeId: '', date: '', type: 'Médica', notes: '' };

export default function Citas() {
  const [appointments, setAppointments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterEmp, setFilterEmp] = useState('');

  const reload = async () => {
  try {
    const appts = await getAppointments();
    const emps = await getEmployees();

    setAppointments(Array.isArray(appts) ? appts : []);
    setEmployees(Array.isArray(emps) ? emps.filter(e => e.status === 'active') : []);
  } catch (error) {
    console.error('Error cargando citas:', error);
    setAppointments([]);
    setEmployees([]);
  }
};

useEffect(() => {
  reload();
}, []);

  const handleSave = async () => {
    if (!form.employeeId || !form.date) return alert('Empleado y fecha son requeridos.');
    await addAppointment({ ...form, employeeId: parseInt(form.employeeId) });
    await reload();
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta cita?')) {
     await deleteAppointment(id);
     await reload();
    }
  };

  const filtered = Array.isArray(appointments)
  ? appointments
      .filter(a => !filterEmp || String(a.employeeId) === filterEmp)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  : [];

  // Group by month
  const grouped = filtered.reduce((acc, appt) => {
    const month = appt.date.substring(0, 7);
    if (!acc[month]) acc[month] = [];
    acc[month].push(appt);
    return acc;
  }, {});

  const TYPE_COLORS = {
    'Médica': { bg: '#dbeafe', text: '#F5C518' },
    'Dental': { bg: '#dcfce7', text: '#166534' },
    'Legal': { bg: '#ede9fe', text: '#5b21b6' },
    'Personal': { bg: '#fce7f3', text: '#9d174d' },
    'Vacaciones': { bg: '#fef3c7', text: '#92400e' },
    'Otro': { bg: '#f0f0f0', text: '#555' },
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0a1628' }}>Citas y Ausencias</h1>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>
            Registro de citas que afectan la disponibilidad de guardias
          </p>
        </div>
        <button onClick={() => { setShowModal(true); setForm(EMPTY_FORM); }} style={{
          background: '#F5C518', color: '#0d0d0d', border: 'none', borderRadius: 10,
          padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          + Registrar Cita
        </button>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 20 }}>
        <select
          value={filterEmp} onChange={e => setFilterEmp(e.target.value)}
          style={{
            padding: '9px 14px', borderRadius: 8, fontSize: 14,
            border: '1px solid #e0e0e0', outline: 'none', minWidth: 220, background: 'white',
          }}
        >
          <option value="">Todos los empleados</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      {/* Calendar view */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{
          background: 'white', borderRadius: 14, padding: '40px', textAlign: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <h2 style={{ color: '#888', margin: 0, fontWeight: 500 }}>No hay citas registradas</h2>
        </div>
      ) : (
        Object.entries(grouped).map(([month, appts]) => {
          const [year, m] = month.split('-');
          const monthName = new Date(parseInt(year), parseInt(m) - 1, 1).toLocaleDateString('es-PR', { month: 'long', year: 'numeric' });

          return (
            <div key={month} style={{ marginBottom: 20 }}>
              <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#5b21b6', textTransform: 'capitalize' }}>
                {monthName}
              </h2>
              <div style={{
                background: 'white', borderRadius: 14,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden',
              }}>
                {appts.map((appt, idx) => {
                  const emp = employees.find(e => e.id === appt.employeeId);
                  const colors = TYPE_COLORS[appt.type] || TYPE_COLORS['Otro'];
                  const dateObj = new Date(appt.date + 'T12:00:00');

                  return (
                    <div key={appt.id} style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
                      borderTop: idx > 0 ? '1px solid #f5f5f5' : 'none',
                    }}>
                      {/* Date box */}
                      <div style={{
                        width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                        background: '#0d0d0d', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600 }}>
                          {dateObj.toLocaleDateString('es-PR', { weekday: 'short' }).toUpperCase()}
                        </div>
                        <div style={{ color: 'white', fontSize: 18, fontWeight: 700, lineHeight: 1 }}>
                          {dateObj.getDate()}
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>
                            {emp ? emp.name : 'Empleado no encontrado'}
                          </span>
                          <span style={{
                            background: colors.bg, color: colors.text,
                            fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
                          }}>
                            {appt.type}
                          </span>
                        </div>
                        {appt.notes && (
                          <div style={{ fontSize: 12, color: '#888' }}>{appt.notes}</div>
                        )}
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                          {dateObj.toLocaleDateString('es-PR', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>

                      <button onClick={() => handleDelete(appt.id)} style={{
                        padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                        background: '#fff5f5', color: '#b91c1c', border: 'none', cursor: 'pointer',
                      }}>
                        Eliminar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: '28px 32px',
            width: '100%', maxWidth: 440,
          }}>
            <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700 }}>Registrar Cita</h2>

            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={labelStyle}>Empleado *</label>
                <select style={inputStyle} value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}>
                  <option value="">Seleccionar empleado...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.badge}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Fecha *</label>
                <input style={inputStyle} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Tipo de cita</label>
                <select style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {APPT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Notas (opcional)</label>
                <textarea
                  style={{ ...inputStyle, height: 70, resize: 'vertical' }}
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Descripción adicional..."
                />
              </div>
            </div>

            <div style={{ padding: '10px 0 6px', background: '#fffbeb', borderRadius: 8, margin: '16px 0 0', padding: '10px 14px' }}>
              <p style={{ margin: 0, fontSize: 12, color: '#92400e' }}>
                ⚠ Al registrar esta cita, el sistema automáticamente excluirá a este empleado de ser asignado en la fecha indicada.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, padding: '10px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: '#f5f5f5', color: '#555', border: 'none', cursor: 'pointer',
              }}>Cancelar</button>
              <button onClick={handleSave} style={{
                flex: 1, padding: '10px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: '#0d0d0d', color: '#F5C518', border: 'none', cursor: 'pointer',
              }}>
                Registrar cita
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
