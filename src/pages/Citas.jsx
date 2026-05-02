// src/pages/Citas.jsx
import { useState, useEffect } from 'react';
import { getAppointments, addAppointment, deleteAppointment, getEmployees } from '../data/store';

const APPT_TYPES = ['Medica', 'Dental', 'Legal', 'Personal', 'Vacaciones', 'Otro'];
const EMPTY_FORM = { employeeId: '', date: '', type: 'Medica', notes: '' };

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
      setEmployees(Array.isArray(emps) ? emps : []);
    } catch (error) {
      console.error('Error cargando citas:', error);
      setAppointments([]);
      setEmployees([]);
    }
  };

  useEffect(() => { reload(); }, []);

  const handleSave = async () => {
    if (!form.employeeId || !form.date) {
      alert('Empleado y fecha son requeridos.');
      return;
    }
    try {
      await addAppointment({
        employee_id: parseInt(form.employeeId),
        date: form.date,
        type: form.type,
        notes: form.notes || null,
      });
      await reload();
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error('Error guardando cita:', err);
      alert('Error: ' + (err.message || err));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Eliminar esta cita?')) {
      await deleteAppointment(id);
      await reload();
    }
  };

  const filtered = appointments
    .filter(a => !filterEmp || String(a.employee_id || a.employeeId) === filterEmp)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const grouped = filtered.reduce((acc, appt) => {
    const month = appt.date ? appt.date.substring(0, 7) : 'sin-fecha';
    if (!acc[month]) acc[month] = [];
    acc[month].push(appt);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ margin:0, fontSize:26, fontWeight:700, color:'#F5C518' }}>Citas y Ausencias</h1>
          <p style={{ margin:'4px 0 0', color:'#ccc', fontSize:14 }}>Registro de citas que afectan la disponibilidad</p>
        </div>
        <button onClick={() => { setShowModal(true); setForm(EMPTY_FORM); }}
          style={{ background:'#F5C518', color:'#0d0d0d', border:'none', borderRadius:10, padding:'10px 20px', fontSize:14, fontWeight:600, cursor:'pointer' }}>
          + Registrar Cita
        </button>
      </div>

      <div style={{ marginBottom:20 }}>
        <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)}
          style={{ padding:'9px 14px', borderRadius:8, fontSize:14, border:'1px solid #333', background:'#1a1a1a', color:'#fff', minWidth:220 }}>
          <option value="">Todos los empleados</option>
          {employees.map(e => <option key={e.id} value={String(e.id)}>{e.name}</option>)}
        </select>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div style={{ background:'#1a1a1a', borderRadius:14, padding:'40px', textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📅</div>
          <h2 style={{ color:'#888', margin:0 }}>No hay citas registradas</h2>
        </div>
      ) : (
        Object.entries(grouped).map(([month, appts]) => {
          const [year, m] = month.split('-');
          const monthName = year ? new Date(parseInt(year), parseInt(m) - 1, 1).toLocaleDateString('es-PR', { month:'long', year:'numeric' }) : month;
          return (
            <div key={month} style={{ marginBottom:20 }}>
              <h2 style={{ margin:'0 0 12px', fontSize:15, fontWeight:700, color:'#F5C518', textTransform:'capitalize' }}>{monthName}</h2>
              <div style={{ background:'#1a1a1a', borderRadius:14, overflow:'hidden', border:'1px solid #222' }}>
                {appts.map((appt, idx) => {
                  const empId = appt.employee_id || appt.employeeId;
                  const emp = employees.find(e => String(e.id) === String(empId));
                  return (
                    <div key={appt.id} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 20px', borderTop: idx > 0 ? '1px solid #222' : 'none' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, color:'#fff', fontSize:14 }}>{emp ? emp.name : 'Empleado no encontrado'}</div>
                        <div style={{ fontSize:12, color:'#888', marginTop:2 }}>{appt.type} — {appt.date}</div>
                        {appt.notes && <div style={{ fontSize:11, color:'#666', marginTop:2 }}>{appt.notes}</div>}
                      </div>
                      <button onClick={() => handleDelete(appt.id)}
                        style={{ padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:600, background:'rgba(220,38,38,0.15)', color:'#f87171', border:'1px solid rgba(220,38,38,0.3)', cursor:'pointer' }}>
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

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div style={{ background:'#1a1a1a', borderRadius:16, padding:'28px 32px', width:'100%', maxWidth:440, border:'1px solid #333' }}>
            <h2 style={{ margin:'0 0 20px', fontSize:20, fontWeight:700, color:'#F5C518' }}>Registrar Cita</h2>
            <label style={{ display:'block', fontSize:12, color:'#888', marginBottom:4 }}>Empleado *</label>
            <select style={iStyle} value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}>
              <option value="">Seleccionar empleado...</option>
              {employees.map(e => <option key={e.id} value={String(e.id)}>{e.name}</option>)}
            </select>
            <label style={{ display:'block', fontSize:12, color:'#888', marginBottom:4, marginTop:14 }}>Fecha *</label>
            <input style={iStyle} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <label style={{ display:'block', fontSize:12, color:'#888', marginBottom:4, marginTop:14 }}>Tipo</label>
            <select style={iStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {APPT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <label style={{ display:'block', fontSize:12, color:'#888', marginBottom:4, marginTop:14 }}>Notas</label>
            <textarea style={{ ...iStyle, height:70, resize:'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={() => setShowModal(false)}
                style={{ flex:1, padding:'10px', borderRadius:8, fontSize:14, background:'#333', color:'#fff', border:'none', cursor:'pointer' }}>Cancelar</button>
              <button onClick={handleSave}
                style={{ flex:1, padding:'10px', borderRadius:8, fontSize:14, fontWeight:700, background:'#F5C518', color:'#0d0d0d', border:'none', cursor:'pointer' }}>
                Registrar cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const iStyle = { width:'100%', padding:'9px 12px', borderRadius:8, fontSize:14, border:'1px solid #333', background:'#0d0d0d', color:'#fff', boxSizing:'border-box' };
