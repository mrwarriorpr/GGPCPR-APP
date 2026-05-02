// src/pages/Vacantes.jsx
import { useState, useEffect } from 'react';
import { getSchedules, saveSchedule, getEmployees, getPosts, getAppointments } from '../data/store';

function fmt(d) {
  if (typeof d === 'string') return d;
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function getBisemana() {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({length:14}, (_,i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
}
function formatShift12h(shift) {
  if (!shift) return '';
  if (shift.includes('AM') || shift.includes('PM')) return shift.replace('/', ' - ');
  let start = '', end = '';
  if (shift.includes('/')) { [start, end] = shift.split('/'); }
  else if (shift.includes('-')) { [start, end] = shift.split('-'); }
  else return shift;
  const convert = (t) => {
    if (!t) return '';
    let [h, m] = t.split(':');
    h = parseInt(h, 10); m = m || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}${m === '00' ? '' : ':'+m} ${ampm}`;
  };
  return `${convert(start)} - ${convert(end)}`;
}

function normalizeShift(shift) {
  if (!shift) return '';

  let clean = shift
    .toString()
    .trim()
    .replace(/\s+/g, '')
    .replace('-', '/')
    .toUpperCase();

  const to24 = (time) => {
    const match = time.match(/^(\d{1,2})(?::(\d{2}))?(AM|PM)?$/);
    if (!match) return time;

    let h = parseInt(match[1], 10);
    const m = match[2] || '00';
    const ampm = match[3];

    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;

    return `${String(h).padStart(2, '0')}:${m}`;
  };

  const parts = clean.split('/');
  if (parts.length !== 2) return clean;

  return `${to24(parts[0])}/${to24(parts[1])}`;
}

export default function Vacantes() {
  const [posts, setPosts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedVacancy, setSelectedVacancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const days = getBisemana();

  const reload = async () => {
    try {
      const [p, s, e, a] = await Promise.all([getPosts(), getSchedules(), getEmployees(), getAppointments()]);
      setPosts(p || []); setSchedules(s || []); setEmployees(e || []); setAppointments(a || []);
    } catch (err) { console.error('Error cargando vacantes:', err); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const vacancies = [];
  posts.forEach(post => {
    const shifts = post.shifts || [];
    const guardsNeeded = post.guards_per_shift || post.guardsPerShift || 1;
    const coverage = post.coverage || '24/7';
    const activeDays = post.days || [0,1,2,3,4,5,6];
    days.forEach(day => {
      const dow = day.getDay();
      const dateStr = fmt(day);
      if (coverage === 'weekly' && !activeDays.includes(dow)) return;
      shifts.forEach(shift => {
        const assigned = schedules.filter(s => {
          const sPostId = s.post_id || s.postId;
          return String(sPostId) === String(post.id) &&
  s.date === dateStr &&
  normalizeShift(s.shift) === normalizeShift(shift);
        });
        const missing = guardsNeeded - assigned.length;
        if (missing > 0) {
          for (let i = 0; i < missing; i++) {
            vacancies.push({ key: `${post.id}_${dateStr}_${shift}_${i}`, post, date: dateStr, day, shift, guardsNeeded, guardsAssigned: assigned.length, slotIndex: i });
          }
        }
      });
    });
  });

  const getAvailable = (vacancy) => {
    return employees.filter(emp => {
      const alreadyAssigned = schedules.some(s =>
        String(s.employee_id || s.employeeId) === String(emp.id) &&
s.date === vacancy.date &&
normalizeShift(s.shift) === normalizeShift(vacancy.shift)
      );
      if (alreadyAssigned) return false;
      const hasCita = appointments.some(a =>
        String(a.employee_id || a.employeeId) === String(emp.id) && a.date === vacancy.date
      );
      if (hasCita) return false;
      return true;
    });
  };

 const handleAssign = async (vacancy, emp) => {
  const turnosHoy = schedules.filter(s =>
    String(s.employee_id || s.employeeId) === String(emp.id) &&
    s.date === vacancy.date
  );
  if (turnosHoy.length > 0) {
    const calcHours = (shift) => {
      if (!shift) return 0;
      const parts = shift.includes('/') ? shift.split('/') : shift.split('-');
      if (parts.length < 2) return 0;
      const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
      let diff = toMin(parts[1]) - toMin(parts[0]);
      if (diff < 0) diff += 24 * 60;
      return diff / 60;
    };
    const horasExistentes = turnosHoy.reduce((acc, s) => acc + calcHours(s.shift), 0);
    const horasNuevas = calcHours(vacancy.shift);
    const totalHoras = horasExistentes + horasNuevas;
    if (totalHoras >= 12) {
      const ok = window.confirm(`⚠️ AVISO: ${emp.name} va a trabajar ${totalHoras} horas este día.\nTurno existente + este turno = ${totalHoras}h.\n\n¿Confirmar turno extendido de ${totalHoras} horas?`);
      if (!ok) return;
    } else {
      const ok = window.confirm(`${emp.name} ya tiene un turno asignado el ${vacancy.date}.\nTotal con este turno: ${totalHoras}h.\n\n¿Agregar turno adicional?`);
      if (!ok) return;
    }
  }
  await saveSchedule({
    id: Date.now().toString(),
    employee_id: emp.id,
    post_id: vacancy.post.id,
    post_name: vacancy.post.name,
    date: vacancy.date,
    shift: normalizeShift(vacancy.shift)
  });
  setSelectedVacancy(null);
  await reload();
};

  const grouped = {};
  vacancies.forEach(v => { if (!grouped[v.post.name]) grouped[v.post.name] = []; grouped[v.post.name].push(v); });

  if (loading) return <div style={{ color:'#fff', padding:'2rem' }}>Cargando vacantes...</div>;

  return (
    <div style={{ color:'#fff' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#F5C518' }}>Gestión de Vacantes</h1>
        <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>
          {vacancies.length} vacante(s) en la bisemana — {fmt(days[0])} al {fmt(days[13])}
        </p>
      </div>

      {vacancies.length === 0 ? (
        <div style={{ background: '#1a1a1a', border:'1px solid #222', borderRadius: 14, padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
          <h2 style={{ color: '#34d399', margin: 0 }}>Sin vacantes</h2>
          <p style={{ color: '#888', marginTop: 8 }}>Todos los turnos están cubiertos esta bisemana.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedVacancy ? '1fr 1fr' : '1fr', gap: 20 }}>
          <div>
            {Object.entries(grouped).map(([postName, pvacs]) => (
              <div key={postName} style={{ background: '#1a1a1a', border:'1px solid #222', borderRadius: 14, marginBottom: 16, overflow: 'hidden' }}>
                <div style={{ background: '#0d0d0d', padding: '12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <h3 style={{ margin: 0, color: '#F5C518', fontSize: 15, fontWeight: 700 }}>{postName}</h3>
                  <span style={{ color: '#f87171', fontSize: 12, fontWeight:600 }}>{pvacs.length} vacante(s)</span>
                </div>
                {pvacs.map(v => (
                  <div key={v.key} onClick={() => setSelectedVacancy(selectedVacancy?.key === v.key ? null : v)}
                    style={{ padding: '14px 20px', borderBottom: '1px solid #222', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: selectedVacancy?.key === v.key ? 'rgba(248,113,113,0.08)' : 'transparent' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>
                        {new Date(v.date.split('/').reverse().join('-') + 'T12:00:00').toLocaleDateString('es-PR', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                        Turno: <strong style={{color:'#93c5fd'}}>{formatShift12h(v.shift)}</strong> · {v.guardsAssigned}/{v.guardsNeeded} guardias
                      </div>
                    </div>
                    <span style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border:'1px solid rgba(248,113,113,0.3)', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5 }}>VACANTE</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {selectedVacancy && (
            <div style={{ position:'sticky', top:24 }}>
              <div style={{ background: '#1a1a1a', border:'1px solid #333', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ background: '#0d0d0d', padding: '16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#F5C518', fontSize: 15, fontWeight: 700 }}>Empleados Disponibles</h3>
                    <p style={{ margin: '2px 0 0', color: '#888', fontSize: 12 }}>{selectedVacancy.post.name} · {formatShift12h(selectedVacancy.shift)} · {selectedVacancy.date}</p>
                  </div>
                  <button onClick={() => setSelectedVacancy(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
                <div style={{ padding: '12px 0' }}>
                  {getAvailable(selectedVacancy).length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#888' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>😔</div>
                      No hay empleados disponibles para este turno.
                    </div>
                  ) : (
                    getAvailable(selectedVacancy).map(emp => (
                      <div key={emp.id} style={{ padding: '12px 20px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#F5C518' }}>
                          {emp.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>{emp.name}</div>
                          <div style={{ fontSize: 11, color: '#888' }}>{emp.type === 'full-time' ? 'Full-Time' : 'Part-Time'} · {emp.badge}</div>
                        </div>
                        <button onClick={() => handleAssign(selectedVacancy, emp)}
                          style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', cursor: 'pointer' }}>
                          Asignar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
