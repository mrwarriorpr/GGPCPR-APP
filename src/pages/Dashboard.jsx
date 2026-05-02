// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { getEmployees, getPosts, getSchedules } from '../data/store';

const DIAS = ['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'];
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function getWeekDays() {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({length:7}, (_,i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDate(d) {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
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

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [posts, setPosts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const today = new Date();
  const weekDays = getWeekDays();

  useEffect(() => {
    const load = async () => {
      try {
        const [e, p, s] = await Promise.all([getEmployees(), getPosts(), getSchedules()]);
        setEmployees(e || []);
        setPosts(p || []);
        setSchedules(s || []);
      } catch(err) { console.error('Dashboard error:', err); }
    };
    load();
  }, []);

  const schedMap = {};
  schedules.forEach(s => {
    const empId = s.employee_id || s.employeeId;
    const key = empId + '_' + s.date;
    if (!schedMap[key]) schedMap[key] = [];
    schedMap[key].push(s);
  });

  const postMap = {};
  posts.forEach(p => { postMap[p.id] = p; });

  const totalTurnos = schedules.filter(s => s.shift).length;
  const turnosHoy = schedules.filter(s => s.date === formatDate(today) && s.shift).length;
  const vacantesHoy = posts.reduce((acc, post) => {
    const needed = post.guards_per_shift || post.guardsPerShift || 1;
    const assigned = schedules.filter(s =>
      String(s.post_id || s.postId) === String(post.id) &&
      s.date === formatDate(today) && s.shift
    ).length;
    return acc + Math.max(0, needed - assigned);
  }, 0);

  return (
    <div style={{ color:'#fff', maxWidth:1200 }}>
      <div style={{ marginBottom:'2rem' }}>
        <h1 style={{ fontSize:'1.8rem', fontWeight:800, color:'#F5C518', margin:0 }}>Dashboard</h1>
        <p style={{ color:'#888', marginTop:4, fontSize:15 }}>
          {DIAS[today.getDay()]}, {today.getDate()} de {MESES[today.getMonth()]} de {today.getFullYear()}
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:'2rem' }}>
        {[
          { label:'Empleados', value: employees.length, color:'#F5C518' },
          { label:'Puestos activos', value: posts.length, color:'#34d399' },
          { label:'Turnos semana', value: totalTurnos, color:'#60a5fa' },
          { label:'Turnos hoy', value: turnosHoy, color:'#f472b6' },
          { label:'Vacantes hoy', value: vacantesHoy, color: vacantesHoy > 0 ? '#f87171' : '#34d399' },
        ].map(s => (
          <div key={s.label} style={{ background:'#1a1a1a', border:'1px solid #222', borderRadius:12, padding:'1rem 1.25rem' }}>
            <div style={{ color:'#666', fontSize:12, marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:'#1a1a1a', border:'1px solid #222', borderRadius:12, padding:'1.5rem' }}>
        <h2 style={{ margin:'0 0 1rem', fontSize:16, color:'#F5C518', fontWeight:600 }}>
          Semana actual - {formatDate(weekDays[0])} al {formatDate(weekDays[6])}
        </h2>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
            <thead>
              <tr>
                <th style={{ textAlign:'left', padding:'8px 12px', color:'#666', fontSize:13, borderBottom:'1px solid #333' }}>Empleado</th>
                {weekDays.map(d => (
                  <th key={formatDate(d)} style={{ padding:'8px 6px', color: formatDate(d)===formatDate(today) ? '#F5C518' : '#666', fontSize:12, borderBottom:'1px solid #333', textAlign:'center', whiteSpace:'nowrap' }}>
                    <div style={{ fontWeight:600 }}>{DIAS[d.getDay()].slice(0,3)}</div>
                    <div style={{ fontSize:11 }}>{d.getDate()}/{d.getMonth()+1}</div>
                  </th>
                ))}
                <th style={{ padding:'8px', color:'#666', fontSize:12, borderBottom:'1px solid #333', textAlign:'center' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => {
                let total = 0;
                return (
                  <tr key={emp.id} style={{ borderBottom:'1px solid #1f1f1f' }}>
                    <td style={{ padding:'8px 12px', fontSize:13, fontWeight:500, color:'#fff', whiteSpace:'nowrap' }}>
                      <div>{emp.name}</div>
                      <div style={{ color:'#666', fontSize:11 }}>{emp.position || 'Guardia'}</div>
                    </td>
                    {weekDays.map(d => {
                      const key = emp.id + '_' + formatDate(d);
                      const shifts = schedMap[key] || [];
                      if (shifts.length > 0) total += shifts.length;
                      const isToday = formatDate(d) === formatDate(today);
                      return (
                        <td key={formatDate(d)} style={{ padding:'4px', textAlign:'center', background: isToday ? 'rgba(245,197,24,0.05)' : 'transparent', verticalAlign:'top' }}>
                          {shifts.length > 0 ? shifts.map((sc, si) => (
                            <div key={si} style={{ fontSize:10, background:'rgba(52,211,153,0.15)', border:'1px solid rgba(52,211,153,0.3)', borderRadius:4, padding:'2px 4px', color:'#34d399', marginBottom:2, whiteSpace:'nowrap' }}>
                              <div style={{ fontWeight:600 }}>{formatShift12h(sc.shift)}</div>
                              {postMap[sc.post_id || sc.postId] && (
                                <div style={{ color:'#6ee7b7', fontSize:9 }}>{postMap[sc.post_id || sc.postId].name}</div>
                              )}
                            </div>
                          )) : <span style={{ color:'#333' }}>-</span>}
                        </td>
                      );
                    })}
                    <td style={{ padding:'8px', textAlign:'center', color: total>0 ? '#F5C518' : '#333', fontWeight:600, fontSize:13 }}>
                      {total > 0 ? total : '-'}
                    </td>
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding:'2rem', textAlign:'center', color:'#444' }}>
                    No hay empleados registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
