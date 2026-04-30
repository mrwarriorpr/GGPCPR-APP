// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { getEmployees, getPosts, getSchedules } from '../data/store';

const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
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

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [posts, setPosts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const today = new Date();
  const weekDays = getWeekDays();

  useEffect(() => {
    const loadData = async () => {
    try {
      const employeesData = await getEmployees();
      const postsData = await getPosts();
      const schedulesData = await getSchedules();

      setEmployees(employeesData);
      setPosts(postsData);
      setSchedules(schedulesData);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    }
  };

  loadData();
  }, []);

  // Map schedules by employeeId + date
  const schedMap = {};
  schedules.forEach(s => {
    const key = s.employeeId + '_' + s.date;
    schedMap[key] = s;
  });

  const postMap = {};
  posts.forEach(p => { postMap[p.id] = p; });

  const totalTurnos = schedules.filter(s => s.shift).length;
  const turnosHoy = schedules.filter(s => s.date === formatDate(today) && s.shift).length;
  const vacantes = schedules.filter(s => !s.employeeId && s.shift).length;

  return (
    <div style={{ color:'#fff', maxWidth:1200 }}>
      {/* Header con fecha */}
      <div style={{ marginBottom:'2rem' }}>
        <h1 style={{ fontSize:'1.8rem', fontWeight:800, color:'#F5C518', margin:0 }}>Dashboard</h1>
        <p style={{ color:'#888', marginTop:4, fontSize:15 }}>
          {DIAS[today.getDay()]}, {today.getDate()} de {MESES[today.getMonth()]} de {today.getFullYear()}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:'2rem' }}>
        {[
          { label:'Empleados', value: employees.length, color:'#F5C518' },
          { label:'Puestos activos', value: posts.filter(p=>p.active!==false).length, color:'#34d399' },
          { label:'Turnos esta semana', value: totalTurnos, color:'#60a5fa' },
          { label:'Turnos hoy', value: turnosHoy, color:'#f472b6' },
        ].map(s => (
          <div key={s.label} style={{ background:'#1a1a1a', border:'1px solid #222', borderRadius:12, padding:'1rem 1.25rem' }}>
            <div style={{ color:'#666', fontSize:12, marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Semana actual */}
      <div style={{ background:'#1a1a1a', border:'1px solid #222', borderRadius:12, padding:'1.5rem', marginBottom:'2rem' }}>
        <h2 style={{ margin:'0 0 1rem', fontSize:16, color:'#F5C518', fontWeight:600 }}>
          Semana actual — {formatDate(weekDays[0])} al {formatDate(weekDays[6])}
        </h2>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
            <thead>
              <tr>
                <th style={{ textAlign:'left', padding:'8px 12px', color:'#666', fontSize:13, borderBottom:'1px solid #333', whiteSpace:'nowrap' }}>Empleado</th>
                {weekDays.map(d => (
                  <th key={d} style={{
                    padding:'8px 8px', color: formatDate(d)===formatDate(today) ? '#F5C518' : '#666',
                    fontSize:12, borderBottom:'1px solid #333', textAlign:'center', whiteSpace:'nowrap',
                  }}>
                    <div style={{ fontWeight:600 }}>{DIAS[d.getDay()].slice(0,3)}</div>
                    <div style={{ fontSize:11 }}>{d.getDate()}/{d.getMonth()+1}</div>
                  </th>
                ))}
                <th style={{ padding:'8px 8px', color:'#666', fontSize:12, borderBottom:'1px solid #333', textAlign:'center' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => {
                let totalEmp = 0;
                return (
                  <tr key={emp.id} style={{ borderBottom:'1px solid #1f1f1f' }}>
                    <td style={{ padding:'8px 12px', fontSize:13, fontWeight:500, color:'#fff', whiteSpace:'nowrap' }}>
                      <div>{emp.name}</div>
                      <div style={{ color:'#666', fontSize:11 }}>{emp.position || 'Guardia'}</div>
                    </td>
                    {weekDays.map(d => {
                      const key = emp.id + '_' + formatDate(d);
                      const sched = schedMap[key];
                      const isToday = formatDate(d) === formatDate(today);
                      if(sched && sched.shift) totalEmp++;
                      return (
                        <td key={d} style={{
                          padding:'6px 4px', textAlign:'center',
                          background: isToday ? 'rgba(245,197,24,0.05)' : 'transparent',
                        }}>
                          {sched && sched.shift ? (
                            <div style={{ fontSize:10, background:'rgba(52,211,153,0.15)', border:'1px solid rgba(52,211,153,0.3)', borderRadius:4, padding:'2px 4px', color:'#34d399' }}>
                              <div style={{ fontWeight:600 }}>{sched.shift}</div>
                              {sched.postId && postMap[sched.postId] && (
                                <div style={{ color:'#6ee7b7', fontSize:9 }}>{postMap[sched.postId].name}</div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color:'#333', fontSize:14 }}>—</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ padding:'8px', textAlign:'center', color: totalEmp>0 ? '#F5C518' : '#333', fontWeight:600, fontSize:13 }}>
                      {totalEmp > 0 ? totalEmp : '—'}
                    </td>
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr><td colSpan={9} style={{ padding:'2rem', textAlign:'center', color:'#444' }}>No hay empleados. Ve a Empleados para añadir.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
