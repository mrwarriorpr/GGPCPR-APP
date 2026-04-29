// src/data/store.js
const KEYS = { EMP:'ggpc_employees', POSTS:'ggpc_posts', SCHED:'ggpc_schedules', APPTS:'ggpc_appointments' };

const get = (key) => { try { return JSON.parse(localStorage.getItem(key)||'[]'); } catch { return []; } };
const set = (key,val) => localStorage.setItem(key, JSON.stringify(val));

// Employees
export const getEmployees = () => get(KEYS.EMP);
export const saveEmployee = (emp) => {
  const list = get(KEYS.EMP);
  const idx = list.findIndex(e=>e.id===emp.id);
  if(idx>=0) list[idx]=emp; else list.push(emp);
  set(KEYS.EMP, list);
};
export const deleteEmployee = (id) => set(KEYS.EMP, get(KEYS.EMP).filter(e=>e.id!==id));

// Posts
export const getPosts = () => get(KEYS.POSTS);
export const savePost = (post) => {
  const list = get(KEYS.POSTS);
  const idx = list.findIndex(p=>p.id===post.id);
  if(idx>=0) list[idx]=post; else list.push(post);
  set(KEYS.POSTS, list);
};
export const deletePost = (id) => set(KEYS.POSTS, get(KEYS.POSTS).filter(p=>p.id!==id));

// Schedules
export const getSchedules = () => get(KEYS.SCHED);
export const saveSchedule = (sched) => {
  const list = get(KEYS.SCHED);
  const idx = list.findIndex(s=>s.id===sched.id);
  if(idx>=0) list[idx]=sched; else list.push(sched);
  set(KEYS.SCHED, list);
};

export const saveSchedules = saveSchedule;

export const deleteSchedule = (id) => set(KEYS.SCHED, get(KEYS.SCHED).filter(s=>s.id!==id));

// Appointments
export const getAppointments = () => get(KEYS.APPTS);
export const saveAppointment = (appt) => {
  const list = get(KEYS.APPTS);
  const idx = list.findIndex(a=>a.id===appt.id);
  if(idx>=0) list[idx]=appt; else list.push(appt);
  set(KEYS.APPTS, list);
};

export const addAppointment = saveAppointment;

export const deleteAppointment = (id) => set(KEYS.APPTS, get(KEYS.APPTS).filter(a=>a.id!==id));

export const initializeStorage = () => {
  // Initialize with empty arrays if not set
  if(!localStorage.getItem(KEYS.EMP)) set(KEYS.EMP, []);
  if(!localStorage.getItem(KEYS.POSTS)) set(KEYS.POSTS, []);
  if(!localStorage.getItem(KEYS.SCHED)) set(KEYS.SCHED, []);
  if(!localStorage.getItem(KEYS.APPTS)) set(KEYS.APPTS, []);
};
