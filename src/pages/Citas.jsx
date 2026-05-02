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
                setEmployees(Array.isArray(emps) ? emps : []);
        } catch (error) {
                console.error('Error cargando citas:', error);
                setAppointments([]);
                setEmployees([]);
        }
  };

  useEffect(() => { reload(); }, []);

  const handleSave = async () => {
        if (!form.employeeId || !form.date) return alert('Empleado y fecha son requeridos.');
        try {
                await addAppointment({
                          employee_id: parseInt(form.employeeId),
                          employeeId: parseInt(form.employeeId),
                          date: form.date,
                          type: form.type,
                          notes: form.notes || null,
                });
                await reload();
                setShowModal(false);
                setForm(EMPTY_FORM);
        } catch (err) {
                console.error('Error guardando cita:', err);
                alert('Error al guardar la cita: ' + (err.message || err));
        }
  };

  const handleDelete = async (id) => {
        if (window.confirm('¿Eliminar esta cita?')) {
                await deleteAppointment(id);
                await reload();
        }
  };

  const filtered = Array.isArray(appointments)
      ? appointments
            .filter(a => !filterEmp || String(a.employee_id || a.employeeId) === filterEmp)
            .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        : [];

  const grouped = filtered.reduce((acc, appt) => {
        const month = appt.date.substring(0, 7);
        if (!acc[month]) acc[month] = [];
        acc[month].push(appt);
        return acc;
  }, {});

  const TYPE_COLORS = {
        'Médica': { bg: '#dbeafe', text: '#1e40af' },
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
                                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#F5C518' }}>Citas y Ausencias</h1>h1>
                                <p style={{ margin: '4px 0 0', color: '#ccc', fontSize: 14 }}>Registro de citas que afectan la disponibilidad de guardias</p>p>
                      </div>div>
                      <button onClick={() => { setShowModal(true); setForm(EMPTY_FORM); }}
                                  style={{ background: '#F5C518', color: '#0d0d0d', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                                + Registrar Cita
                      </button>button>
              </div>div>
        
              <div style={{ marginBottom: 20 }}>
                      <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)}
                                  style={{ padding: '9px 14px', borderRadius: 8, fontSize: 14, border: '1px solid #333', outline: 'none', minWidth: 220, background: '#1a1a1a', color: '#fff' }}>
                                <option value="">Todos los empleados</option>option>
                        {employees.map(e => <option key={e.id} value={String(e.id)}>{e.name}</option>option>)}
                      </select>select>
              </div>div>
        
          {Object.keys(grouped).length === 0 ? (
                  <div style={{ background: '#1a1a1a', borderRadius: 14, padding: '40px', textAlign: 'center' }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>div>
                            <h2 style={{ color: '#888', margin: 0, fontWeight: 500 }}>No hay citas registradas</h2>h2>
                  </div>div>
                ) : (
                  Object.entries(grouped).map(([month, appts]) => {
                              const [year, m] = month.split('-');
                              const monthName = new Date(parseInt(year), parseInt(m) - 1, 1).toLocaleDateString('es-PR',</div>
