// src/data/store.js — Supabase backend
const SUPABASE_URL = 'https://wlyxomrzcwfamyjzdjhq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndseXhvbXJ6Y3dmYW15anpkamhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MjMyNjYsImV4cCI6MjA5Mjk5OTI2Nn0.IvrmlKYl8L-8izARg-bzchKsq5Ku5Ztw5UXrnP4X0DI';

const H = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };

async function q(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { ...H, ...(opts.headers||{}) }, ...opts });
  if (!res.ok) { const e = await res.text(); throw new Error(e); }
  const t = await res.text(); return t ? JSON.parse(t) : [];
}

const fromEmp = r => ({ id:r.id, name:r.name, badge:r.badge, type:r.type, phone:r.phone, email:r.email, availableDays:r.available_days||[], maxHoursPerWeek:r.max_hours_per_week, preferredShifts:r.preferred_shifts||[], postAssignment:r.post_assignment, status:r.status, hireDate:r.hire_date, hourlyRate:parseFloat(r.hourly_rate) });
const toEmp = e => ({ name:e.name, badge:e.badge, type:e.type, phone:e.phone||'', email:e.email||'', available_days:e.availableDays||[], max_hours_per_week:e.maxHoursPerWeek||40, preferred_shifts:e.preferredShifts||[], post_assignment:e.postAssignment||null, status:e.status||'active', hire_date:e.hireDate||'', hourly_rate:e.hourlyRate||11 });
const fromPost = r => ({ id:r.id, name:r.name, location:r.location, shifts:r.shifts||[], requiredGuards:r.required_guards });
const toPost = p => ({ name:p.name, location:p.location||'', shifts:p.shifts||[], required_guards:p.requiredGuards||1 });
const fromSched = r => ({ id:r.id, employeeId:r.employee_id, employeeName:r.employee_name, postId:r.post_id, postName:r.post_name, date:r.date, dayOfWeek:r.day_of_week, shift:r.shift, hours:parseFloat(r.hours), isOvertime:r.is_overtime, isVacancy:r.is_vacancy, isSunday:r.is_sunday, weekNum:r.week_num });
const toSched = s => ({ id:s.id, employee_id:s.employeeId||null, employee_name:s.employeeName||'', post_id:s.postId||null, post_name:s.postName||'', date:s.date, day_of_week:s.dayOfWeek||'', shift:s.shift||'', hours:s.hours||0, is_overtime:s.isOvertime||false, is_vacancy:s.isVacancy||false, is_sunday:s.isSunday||false, week_num:s.weekNum||0 });

export function initializeStorage() {}

export async function authenticateUser(username, password) {
  try { const r = await q(`users?username=eq.${encodeURIComponent(username)}&password=eq.${encodeURIComponent(password)}&select=id,username,name,role`); return r[0]||null; }
  catch { return null; }
}

export async function getEmployees() { return (await q('employees?order=name')).map(fromEmp); }
export async function addEmployee(emp) { const r = await q('employees', { method:'POST', headers:{'Prefer':'return=representation'}, body:JSON.stringify(toEmp(emp)) }); return fromEmp(r[0]); }
export async function updateEmployee(id, u) { await q(`employees?id=eq.${id}`, { method:'PATCH', headers:{'Prefer':'return=minimal'}, body:JSON.stringify(toEmp(u)) }); }
export async function deleteEmployee(id) { await q(`employees?id=eq.${id}`, { method:'DELETE', headers:{'Prefer':'return=minimal'} }); }
export async function saveEmployees() {}

export async function getPosts() { return (await q('posts?order=name')).map(fromPost); }
export async function addPost(p) { const r = await q('posts', { method:'POST', headers:{'Prefer':'return=representation'}, body:JSON.stringify(toPost(p)) }); return fromPost(r[0]); }
export async function updatePost(id, u) { await q(`posts?id=eq.${id}`, { method:'PATCH', headers:{'Prefer':'return=minimal'}, body:JSON.stringify(toPost(u)) }); }
export async function savePosts() {}

export async function getSchedules() { return (await q('schedules?order=date')).map(fromSched); }
export async function saveSchedules(schedules) {
  await q('schedules', { method:'DELETE', headers:{'Prefer':'return=minimal', 'apikey':SUPABASE_KEY, 'Authorization':`Bearer ${SUPABASE_KEY}`} });
  if (!schedules.length) return;
  const data = schedules.map(toSched);
  for (let i=0; i<data.length; i+=50) await q('schedules', { method:'POST', headers:{'Prefer':'return=minimal'}, body:JSON.stringify(data.slice(i,i+50)) });
}

export async function getAppointments() { return (await q('appointments?order=date')).map(r => ({ id:r.id, employeeId:r.employee_id, date:r.date, type:r.type, notes:r.notes||'' })); }
export async function addAppointment(a) { const r = await q('appointments', { method:'POST', headers:{'Prefer':'return=representation'}, body:JSON.stringify({ employee_id:a.employeeId, date:a.date, type:a.type, notes:a.notes||'' }) }); return r[0]; }
export async function deleteAppointment(id) { await q(`appointments?id=eq.${id}`, { method:'DELETE', headers:{'Prefer':'return=minimal'} }); }
