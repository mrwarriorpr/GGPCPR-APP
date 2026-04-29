// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { getEmployees, getSchedules, getPosts, saveSchedules } from '../data/store';
import { generateBiweeklySchedule, getEmployeeWeekSummary, getBiweekStart, formatDateDisplay, formatDate, getWeekDates } from '../utils/scheduler';

const C = { gold:'#F5C518', black:'#0d0d0d', grn:'#2d7a3a', red:'#c0392b', orn:'#e67e22' };

const StatCard = ({ label, value, sub, color }) => (
  <div style={{ background:'white', borderRadius:10, padding:'13px 15px', borderTop:`3px solid ${color||C.gold}` }}>
    <div style={{ fontSize:10, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3 }}>{label}</div>
    <div style={{ fontSize:26, fontWeight:900, color: color===C.red ? C.red : color===C.orn ? C.orn : C.black, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:10, color:'#ccc', marginTop:2 }}>{sub}</div>}
  </div>
);

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [posts, setPosts] = useState([]);
  const [biweekStart, setBiweekStart] = useState(null);
  const [biweekEnd, setBiweekEnd] = useState(null);
  const [activeWeek, setActiveWeek] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [emps, pts, existing] = await Promise.all([getEmployees(), getPosts(), getSchedules()]);
      setEmployees(emps); setPosts(pts);
      const bw = getBiweekStart();
      setBiweekStart(bw);
      setBiweekEnd(new Date(bw.getTime() + 13*86400000));
      if (existing.length === 0) {
        const result = generateBiweeklySchedule(null, emps, pts, []);
        await saveSchedules(result.schedule);
        setSchedule(result.schedule);
      } else {
        setSchedule(existing);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const handleRegenerate = async () => {
    if (!window.confirm('¿Regenerar el horario bisemanal?')) return;
    const [emps, pts, appts] = await Promise.all([getEmployees(), getPosts(), (await import('../data/store')).getAppointments()]);
    const result = generateBiweeklySchedule(null, emps, pts, appts);
    await saveSchedules(result.schedule);
    setSchedule(result.schedule);
  };

  const active = employees.filter(e => e.status === 'active');
  const vacancies = schedule.filter(s => s.isVacancy);
  const overtimes = schedule.filter(s => s.isOvertime);
  const wkDates = biweekStart ? getWeekDates(new Date(biweekStart.getTime() + activeWeek*7*86400000)) : [];

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:'#aaa', fontSize:14 }}>Cargando datos...</div>;

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ margin:0, fontSize:22, fontWeight:900, color:C.black }}>Dashboard</h1>
        {biweekStart && <p style={{ margin:'3px 0 0', color:'#888', fontSize:12 }}>Bisemana activa: <strong>{formatDateDisplay(biweekStart)} – {formatDateDisplay(biweekEnd)}</strong></p>}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        {[0,1].map(w => (
          <button key={w} onClick={() => setActiveWeek(w)} style={{ padding:'7px 16px', borderRadius:8, fontSize:12, fontWeight:700, border:'1.5px solid', cursor:'pointer', background: activeWeek===w ? C.gold : 'white', color: activeWeek===w ? C.black : '#888', borderColor: activeWeek===w ? C.gold : '#ddd' }}>
            Semana {w+1}
          </button>
        ))}
        <button onClick={handleRegenerate} style={{ marginLeft:'auto', background:C.black, color:C.gold, border:'none', borderRadius:8, padding:'7px 16px', fontSize:12, fontWeight:800, cursor:'pointer' }}>
          ⟳ Regenerar horario
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
        <StatCard label="Guardias activos" value={active.length} sub={`${active.filter(e=>e.type==='full-time').length} FT · ${active.filter(e=>e.type==='part-time').length} PT`} />
        <StatCard label="Puestos" value={posts.length} sub="configurados" />
        <StatCard label="Vacantes" value={vacancies.length} sub="bisemana" color={vacancies.length > 0 ? C.red : C.grn} />
        <StatCard label="Overtime" value={overtimes.length} sub="turnos" color={overtimes.length > 0 ? C.orn : C.grn} />
        <StatCard label="Total turnos" value={schedule.filter(s=>!s.isVacancy).length} sub="bisemana" color={C.grn} />
      </div>

      {vacancies.length > 0 && (
        <div style={{ background:C.black, borderLeft:`4px solid ${C.gold}`, borderRadius:8, padding:'11px 16px', display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <div style={{ width:30, height:30, background:C.gold, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, color:C.black, flexShrink:0 }}>!</div>
          <div>
            <div style={{ color:'white', fontSize:12, fontWeight:700 }}>{vacancies.length} vacante(s) detectadas esta bisemana</div>
            <div style={{ color:'#666', fontSize:11, marginTop:1 }}>{vacancies.slice(0,3).map(v=>`${v.postName} · ${new Date(v.date+'T12:00').toLocaleDateString('es-PR',{month:'short',day:'numeric'})} · ${v.shift}`).join('  ·  ')}</div>
          </div>
        </div>
      )}

      <div style={{ background:'white', borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'11px 16px', background:C.black, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ color:'white', fontSize:13, fontWeight:700 }}>Estado de empleados</span>
          <span style={{ background:C.gold, color:C.black, fontSize:9, fontWeight:800, padding:'3px 8px', borderRadius:5 }}>Semana {activeWeek+1} de 2</span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#f8f8f6' }}>
                <th style={TH}>Guardia</th><th style={TH}>Tipo</th><th style={TH}>Puesto</th>
                {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => <th key={d} style={{...TH,textAlign:'center',minWidth:55}}>{d}</th>)}
                <th style={{...TH,textAlign:'center'}}>Hrs</th>
                <th style={{...TH,textAlign:'center'}}>Disponibilidad</th>
              </tr>
            </thead>
            <tbody>
              {active.map((emp, idx) => {
                const post = posts.find(p => p.id === emp.postAssignment);
                const wkHrs = schedule.filter(s => s.employeeId===emp.id && wkDates.map(formatDate).includes(s.date)).reduce((a,s)=>a+s.hours,0);
                const pct = Math.min(100, Math.round(wkHrs/emp.maxHoursPerWeek*100));
                const isOT = wkHrs > 40;
                return (
                  <tr key={emp.id} style={{ borderTop:'1px solid #f0f0f0', background: idx%2===0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding:'8px 10px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={{ width:28, height:28, borderRadius:7, background: emp.type==='full-time'?'#fffbcc':'#eaf4ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color: emp.type==='full-time'?'#7a5f00':'#1a56a0' }}>
                          {emp.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, color:'#111', fontSize:12 }}>{emp.name}</div>
                          <div style={{ fontSize:10, color:'#bbb' }}>{emp.badge}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'8px 10px' }}>
                      <span style={{ background: emp.type==='full-time'?'#fffbcc':'#eaf4ff', color: emp.type==='full-time'?'#7a5f00':'#1a56a0', fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4 }}>
                        {emp.type==='full-time'?'FT':'PT'}
                      </span>
                    </td>
                    <td style={{ padding:'8px 10px', fontSize:11, color:'#666' }}>{post?post.name.slice(0,14):'—'}</td>
                    {wkDates.map(d => {
                      const ds = formatDate(d);
                      const sh = schedule.filter(s => s.employeeId===emp.id && s.date===ds);
                      const COLORS = {'7:00-15:00':'#dbeafe','15:00-23:00':'#fce7f3','23:00-7:00':'#ede9fe','6:00-14:00':'#dcfce7','14:00-22:00':'#fef9c3','6:00-18:00':'#ffedd5','18:00-6:00':'#f1f5f9'};
                      const TCOLS = {'7:00-15:00':'#1e5fa8','15:00-23:00':'#9d174d','23:00-7:00':'#5b21b6','6:00-14:00':'#166534','14:00-22:00':'#854d0e','6:00-18:00':'#9a3412','18:00-6:00':'#475569'};
                      return (
                        <td key={ds} style={{ textAlign:'center', padding:'6px 3px' }}>
                          {sh.length > 0 ? (
                            <span style={{ background:COLORS[sh[0].shift]||'#f0f0f0', color:TCOLS[sh[0].shift]||'#555', borderRadius:3, padding:'2px 4px', fontSize:9, fontWeight:700 }}>
                              {sh[0].shift.replace(':00','').split('-')[0]}{sh[0].isOvertime?'*':''}
                            </span>
                          ) : <span style={{ color:'#ddd' }}>—</span>}
                        </td>
                      );
                    })}
                    <td style={{ textAlign:'center', padding:'8px 6px' }}>
                      <div style={{ fontSize:12, fontWeight:800, color: isOT ? C.red : C.grn }}>{Math.round(wkHrs)}h{isOT?'⚠':''}</div>
                      <div style={{ width:38, height:4, background:'#e5e7eb', borderRadius:3, margin:'3px auto 0' }}>
                        <div style={{ width:`${pct}%`, height:'100%', background: isOT?'#ef4444':'#22c55e', borderRadius:3 }} />
                      </div>
                    </td>
                    <td style={{ textAlign:'center', padding:'8px 6px' }}>
                      <div style={{ display:'flex', gap:2, justifyContent:'center' }}>
                        {['L','M','X','J','V','S','D'].map(d => (
                          <div key={d} style={{ width:15, height:15, borderRadius:3, background: emp.availableDays?.includes(d)?'#fffbcc':'#f0f0f0', color: emp.availableDays?.includes(d)?'#7a5f00':'#ccc', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:800 }}>{d}</div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
const TH = { padding:'7px 10px', textAlign:'left', color:'#aaa', fontWeight:700, fontSize:9, textTransform:'uppercase', letterSpacing:'.4px', borderBottom:'1px solid #eee' };
