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
    return Array.from({length:14}, (_,i) => {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          return d;
    });
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
                setPosts(p || []);
                setSchedules(s || []);
                setEmployees(e || []);
                setAppointments(a || []);
        } catch (err) {
                console.error('Error cargando vacantes:', err);
        } finally {
                setLoading(false);
        }
  };

  useEffect(() => { reload(); }, []);

  // Calcular vacantes reales: por cada puesto + día + turno, ver cuántos guardias faltan
  const vacancies = [];
    posts.forEach(post => {
          const shifts = post.shifts || [];
          const guardsNeeded = post.guards_per_shift || post.guardsPerShift || 1;
          const coverage = post.coverage || '24/7';
          const activeDays = post.days || [0,1,2,3,4,5,6];

                      days.forEach(day => {
                              const dow = day.getDay();
                              const dateStr = fmt(day);
                              // Si el puesto no trabaja ese día, saltar
                                         if (coverage === 'weekly' && !activeDays.includes(dow)) return;

                                         shifts.forEach(shift => {
                                                   // Contar guardias asignados a este puesto/turno/día
                                                                const assigned = schedules.filter(s => {
                                                                            const sPostId = s.post_id || s.postId;
                                                                            return String(sPostId) === String(post.id) &&
                                                                                               s.date === dateStr &&
                                                                                               s.shift === shift;
                                                                });
                                                   const missing = guardsNeeded - assigned.length;
                                                   if (missing > 0) {
                                                               for (let i = 0; i < missing; i++) {
                                                                             vacancies.push({
                                                                                             key: `${post.id}_${dateStr}_${shift}_${i}`,
                                                                                             post,
                                                                                             date: dateStr,
                                                                                             day,
                                                                                             shift,
                                                                                             guardsNeeded,
                                                                                             guardsAssigned: assigned.length,
                                                                                             slotIndex: i,
                                                                             });
                                                               }
                                                   }
                                         });
                      });
    });

  // Filtrar empleados disponibles para una vacante
  const getAvailable = (vacancy) => {
        return employees.filter(emp => {
                // No asignado ya ese día y turno en ese puesto
                                      const alreadyAssigned = schedules.some(s =>
                                                String(s.employee_id || s.employeeId) === String(emp.id) &&
                                                s.date === vacancy.date &&
                                                s.shift === vacancy.shift
                                                                                   );
                if (alreadyAssigned) return false;
                // No tiene cita ese día
                                      const hasCita = appointments.some(a =>
                                                String(a.employee_id || a.employeeId) === String(emp.id) &&
                                                a.date === vacancy.date
                                                                              );
                if (hasCita) return false;
                return true;
        });
  };

  const handleAssign = async (vacancy, emp) => {
        await saveSchedule({
                id: Date.now().toString(),
                employee_id: emp.id,
                post_id: vacancy.post.id,
                post_name: vacancy.post.name,
                date: vacancy.date,
                shift: vacancy.shift,
        });
        setSelectedVacancy(null);
        await reload();
  };

  // Agrupar vacantes 
