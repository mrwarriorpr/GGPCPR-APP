// src/data/store.js
import { supabase } from '../supabaseClient';

export const getEmployees = async () => {
  const { data, error } = await supabase.from('employees').select('*').order('id');
  if (error) throw error;
  return data || [];
};
export const saveEmployee = async (emp) => {
  const { data, error } = await supabase.from('employees').upsert(emp).select();
  if (error) throw error;
  return data?.[0];
};
export const deleteEmployee = async (id) => {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw error;
};

export const getPosts = async () => {
  const { data, error } = await supabase.from('posts').select('*').order('id');
  if (error) throw error;
  return (data || []).map(p => ({
    ...p,
    guardsPerShift: p.guards_per_shift ?? p.guardsPerShift ?? 1,
  }));
};
export const savePost = async (post) => {
  const dbPost = {
    name: post.name,
    location: post.location || null,
    address: post.address || null,
    armed: post.armed ?? false,
    notes: post.notes || null,
    shifts: post.shifts || [],
    coverage: post.coverage || '24/7',
    days: post.days || [0,1,2,3,4,5,6],
    guards_per_shift: post.guardsPerShift || post.guards_per_shift || 1,
    required_guards: post.guardsPerShift || post.guards_per_shift || 1,
  };
  if (post.id) dbPost.id = post.id;
  const { data, error } = await supabase.from('posts').upsert(dbPost).select();
  if (error) throw error;
  return data?.[0];
};
export const deletePost = async (id) => {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
};

export const getSchedules = async () => {
  const { data, error } = await supabase.from('schedules').select('*').order('date');
  if (error) throw error;
  return (data || []).map(s => ({
    ...s,
    employeeId: s.employee_id || s.employeeId,
    postId: s.post_id || s.postId,
    isVacancy: s.is_vacancy || s.isVacancy || false,
  }));
};
export const saveSchedule = async (sched) => {
  const dbSched = {
    employee_id: sched.employee_id || sched.employeeId || null,
    employee_name: sched.employee_name || sched.employeeName || null,
    post_id: sched.post_id || sched.postId || null,
    post_name: sched.post_name || sched.postName || null,
    date: sched.date,
    day_of_week: sched.day_of_week || sched.dayOfWeek || null,
    shift: sched.shift || null,
    hours: sched.hours || null,
    is_overtime: sched.is_overtime || sched.isOvertime || false,
    is_vacancy: sched.is_vacancy || sched.isVacancy || false,
    is_sunday: sched.is_sunday || sched.isSunday || false,
    week_num: sched.week_num || sched.weekNum || 0,
  };
  if (sched.id) dbSched.id = sched.id;
  const { data, error } = await supabase.from('schedules').upsert(dbSched).select();
  if (error) throw error;
  return data?.[0];
};
export const saveSchedules = async (schedules) => {
  const dbScheds = schedules.map(sched => {
    const s = {
      employee_id: sched.employee_id || sched.employeeId || null,
      employee_name: sched.employee_name || sched.employeeName || null,
      post_id: sched.post_id || sched.postId || null,
      post_name: sched.post_name || sched.postName || null,
      date: sched.date,
      day_of_week: sched.day_of_week || sched.dayOfWeek || null,
      shift: sched.shift || null,
      hours: sched.hours || null,
      is_overtime: sched.is_overtime || sched.isOvertime || false,
      is_vacancy: sched.is_vacancy || sched.isVacancy || false,
      is_sunday: sched.is_sunday || sched.isSunday || false,
      week_num: sched.week_num || sched.weekNum || 0,
    };
    if (sched.id) s.id = sched.id;
    return s;
  });
  const { data, error } = await supabase.from('schedules').upsert(dbScheds).select();
  if (error) throw error;
  return data || [];
};
export const deleteSchedule = async (id) => {
  const { error } = await supabase.from('schedules').delete().eq('id', id);
  if (error) throw error;
};

export const getAppointments = async () => {
  const { data, error } = await supabase.from('appointments').select('*').order('date');
  if (error) throw error;
  return (data || []).map(a => ({
    ...a,
    employeeId: a.employee_id || a.employeeId,
  }));
};
export const addAppointment = async (appt) => {
  const dbAppt = {
    employee_id: appt.employee_id || appt.employeeId,
    date: appt.date,
    type: appt.type || 'Medica',
    notes: appt.notes || null,
  };
  const { data, error } = await supabase.from('appointments').upsert(dbAppt).select();
  if (error) throw error;
  return data?.[0];
};
export const saveAppointment = addAppointment;
export const deleteAppointment = async (id) => {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) throw error;
};
export const initializeStorage = async () => { return true; };
