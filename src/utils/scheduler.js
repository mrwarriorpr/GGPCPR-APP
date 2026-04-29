// src/utils/scheduler.js
const DAY_MAP = { 0:'D',1:'L',2:'M',3:'X',4:'J',5:'V',6:'S' };
export const DAY_NAMES_FULL = { L:'Lunes',M:'Martes',X:'Miércoles',J:'Jueves',V:'Viernes',S:'Sábado',D:'Domingo' };

export function parseShiftHours(shift) {
  const [start, end] = shift.split('-');
  const [sh] = start.split(':').map(Number);
  const [eh] = end.split(':').map(Number);
  let s = sh*60, e = eh*60;
  if (e <= s) e += 1440;
  return (e - s) / 60;
}
export function getWeekDates(startDate) {
  return Array.from({length:7}, (_,i) => { const d=new Date(startDate); d.setDate(d.getDate()+i); return d; });
}
export function getBiweekStart(date = new Date()) {
  const d = new Date(date); d.setHours(0,0,0,0);
  const day = d.getDay(); d.setDate(d.getDate() + (day===0 ? -6 : 1-day));
  return d;
}
export function formatDate(date) { return date.toISOString().split('T')[0]; }
export function formatDateDisplay(date) { return new Date(date).toLocaleDateString('es-PR',{month:'short',day:'numeric'}); }

export function generateBiweeklySchedule(startDate = null, employees = [], posts = [], appointments = []) {
  const schedule = [];
  const biweekStart = startDate ? new Date(startDate) : getBiweekStart();
  const activeEmps = employees.filter(e => e.status === 'active');

  for (let day = 0; day < 14; day++) {
    const currentDate = new Date(biweekStart);
    currentDate.setDate(currentDate.getDate() + day);
    const dateStr = formatDate(currentDate);
    const dayOfWeek = DAY_MAP[currentDate.getDay()];
    const weekNum = Math.floor(day / 7);
    const weekStart = new Date(biweekStart); weekStart.setDate(weekStart.getDate() + weekNum*7);
    const weekDateStrs = Array.from({length:7},(_,i)=>{ const d=new Date(weekStart); d.setDate(d.getDate()+i); return formatDate(d); });

    posts.forEach(post => {
      (post.shifts||[]).forEach(shift => {
        const shiftHours = parseShiftHours(shift);
        const eligible = activeEmps.filter(emp => {
          if (!emp.availableDays?.includes(dayOfWeek)) return false;
          if (appointments.some(a => a.employeeId===emp.id && a.date===dateStr)) return false;
          const wkHrs = schedule.filter(s => s.employeeId===emp.id && weekDateStrs.includes(s.date)).reduce((a,s)=>a+s.hours,0);
          if (wkHrs + shiftHours > emp.maxHoursPerWeek + 8) return false;
          return emp.postAssignment===post.id || emp.preferredShifts?.includes(shift);
        }).sort((a,b) => {
          const ah = schedule.filter(s=>s.employeeId===a.id&&weekDateStrs.includes(s.date)).reduce((x,s)=>x+s.hours,0);
          const bh = schedule.filter(s=>s.employeeId===b.id&&weekDateStrs.includes(s.date)).reduce((x,s)=>x+s.hours,0);
          return (ah-(a.postAssignment===post.id?10:0)) - (bh-(b.postAssignment===post.id?10:0));
        });

        let assigned = 0;
        for (let i = 0; i < Math.min(post.requiredGuards, eligible.length); i++) {
          const emp = eligible[i];
          if (schedule.some(s => s.employeeId===emp.id && s.date===dateStr)) continue;
          const wkHrs = schedule.filter(s=>s.employeeId===emp.id&&weekDateStrs.includes(s.date)).reduce((a,s)=>a+s.hours,0);
          schedule.push({ id:`${emp.id}-${dateStr}-${post.id}-${shift}`, employeeId:emp.id, employeeName:emp.name, postId:post.id, postName:post.name, date:dateStr, dayOfWeek, shift, hours:shiftHours, isOvertime:wkHrs+shiftHours>40, isSunday:currentDate.getDay()===0, weekNum });
          assigned++;
        }
        if (assigned < post.requiredGuards) {
          schedule.push({ id:`VAC-${dateStr}-${post.id}-${shift}`, employeeId:null, employeeName:'VACANTE', postId:post.id, postName:post.name, date:dateStr, dayOfWeek, shift, hours:shiftHours, isVacancy:true, weekNum });
        }
      });
    });
  }
  return { schedule, biweekStart, biweekEnd: new Date(biweekStart.getTime()+13*86400000) };
}

export function findAvailableForVacancy(vacancy, currentSchedule, employees, appointments) {
  const vacancyDate = new Date(vacancy.date+'T12:00');
  const dayOfWeek = DAY_MAP[vacancyDate.getDay()];
  const weekStart = getBiweekStart(vacancyDate);
  const weekStart2 = new Date(weekStart); weekStart2.setDate(weekStart2.getDate() + vacancy.weekNum*7);
  const weekDateStrs = Array.from({length:7},(_,i)=>{ const d=new Date(weekStart2); d.setDate(d.getDate()+i); return formatDate(d); });
  const shiftHours = parseShiftHours(vacancy.shift);

  return employees.filter(e => e.status==='active').filter(emp => {
    if (!emp.availableDays?.includes(dayOfWeek)) return false;
    if (appointments.some(a=>a.employeeId===emp.id&&a.date===vacancy.date)) return false;
    if (currentSchedule.some(s=>s.employeeId===emp.id&&s.date===vacancy.date&&!s.isVacancy)) return false;
    return true;
  }).map(emp => {
    const wkH = currentSchedule.filter(s=>s.employeeId===emp.id&&weekDateStrs.includes(s.date)).reduce((a,s)=>a+s.hours,0);
    const ot = wkH + shiftHours > 40;
    const isSunday = vacancyDate.getDay()===0;
    const rate = emp.hourlyRate||11;
    const cost = ot ? (Math.max(0,40-wkH)*rate + Math.max(0,wkH+shiftHours-40)*rate*1.5) : shiftHours*rate;
    return { ...emp, currentWeekHours:wkH, wouldBeOvertime:ot, isSunday, totalShiftCost:cost.toFixed(2) };
  }).sort((a,b) => a.wouldBeOvertime-b.wouldBeOvertime || a.currentWeekHours-b.currentWeekHours);
}

export function getEmployeeWeekSummary(employeeId, schedules) {
  const bw = getBiweekStart();
  const w1 = Array.from({length:7},(_,i)=>{ const d=new Date(bw); d.setDate(d.getDate()+i); return formatDate(d); });
  const w2s = new Date(bw); w2s.setDate(w2s.getDate()+7);
  const w2 = Array.from({length:7},(_,i)=>{ const d=new Date(w2s); d.setDate(d.getDate()+i); return formatDate(d); });
  const sum = wds => ({ count:schedules.filter(s=>s.employeeId===employeeId&&wds.includes(s.date)).length, hours:schedules.filter(s=>s.employeeId===employeeId&&wds.includes(s.date)).reduce((a,s)=>a+s.hours,0) });
  return { week1:sum(w1), week2:sum(w2) };
}
