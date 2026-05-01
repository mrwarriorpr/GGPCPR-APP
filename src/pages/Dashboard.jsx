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

function formatShift12h(shift) {
    if (!shift) return '';
    if (shift.includes('AM') || shift.includes('PM')) return shift.replace('/', ' - ');
    let start = '', end = '';
    if (shift.includes('/')) { [start, end] = shift.split('/'); }
    else if (shift.includes('-')) { [start, end] = shift.split('-'); }
    else return shift;
    const convert = (time) => {
          if (!time) return '';
          let [h, m] = time.split(':');
          h = parseInt(h, 10); m = m || '00';
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12 || 12;
          return `${h}${m === '00' ? '' : ':' + m} ${ampm}`;
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

  const schedMap = {};
    schedules.forEach(s => {
          const empId = s.employee_id || s.employeeId;
          const key = empId + '_' + s.date;
          schedMap[key] = s;
    });

  const postMap = {};
    posts.forEach(p => { postMap[p.id] = p; });

  const totalTurnos = schedules.filter(s => s.shift).length;
    const turnosHoy = schedules.filter(s => s.date === formatDate(today) && s.shift).length;

  // Calcular vacantes reales: puestos con turnos no cubiertos hoy
  const vacantesHoy = posts.reduce((acc, post) => {
        const guardsNeeded = post.guards_per_shift || post.guardsPerShift || 1;
        const assignedToday = schedules.filter(s =>
                (s.post_id || s.postId) === post.id &&
                s.date === formatDate(today) &&
                s.shift
                                                   ).length;
        const missing = guardsNeeded - assignedToday;
        return acc + (missing > 0 ? missing : 0);
  }, 0);

  return (
        <div style={{ color:'#fff', maxWidth:1200 }}>
                <div style={{ marginBottom:'2rem' }}>
                          <h1 style={{ fontSize:'1.8rem', fontWeight:800, color:'#F5C518', margin:0 }}>Dashboard</h1>h1>
                          <p style={{ color:'#888', marginTop:4, fontSize:15 }}>
                            {DIAS[today.getDay()]}, {today.getDate()} de {MESES[today.getMonth()]} de {today.getFullYear()}
                          </p>p>
                </div>div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:16, marginBottom:'2rem' }}>
                  {[
          { label:'Empleados', value: employees.length, color:'#F5C518' },
          { label:'Puestos activos', value: posts.filter(p=>p.active!==false).length, color:'#34d399' },
          { label:'Turnos esta semana', value: totalTurnos, color:'#60a5fa' },
          { label:'Turnos hoy', value: turnosHoy, color:'#f472b6' },
          { label:'Vacantes hoy', value: vacantesHoy, color: vacantesHoy > 0 ? '#f87171' : '#34d399' },
                  ].map(s => (
                              <div key={s.label} style={{ background:'#1a1a1a', border:'1px solid #222', borderRadius:12, padding:'1rem 1.25re
