// src/data/store.js
import { supabase } from '../supabaseClient';

// Employees
export const getEmployees = async () => {
  const { data, error } = await supabase.from('employees').select('*').order('id');
  if (error) throw error;
  return data || [];
};

export const saveEmployee = async (emp) => {
  const { data, error } = await supabase
    .from('employees')
    .upsert(emp)
    .select();

  if (error) throw error;
  return data?.[0];
};

export const deleteEmployee = async (id) => {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw error;
};

// Posts
export const getPosts = async () => {
  const { data, error } = await supabase.from('posts').select('*').order('id');
  if (error) throw error;
  return data || [];
};

export const savePost = async (post) => {
  const { data, error } = await supabase
    .from('posts')
    .upsert(post)
    .select();

  if (error) throw error;
  return data?.[0];
};

export const deletePost = async (id) => {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
};

// Schedules
export const getSchedules = async () => {
  const { data, error } = await supabase.from('schedules').select('*').order('date');
  if (error) throw error;
  return data || [];
};

export const saveSchedule = async (sched) => {
  const { data, error } = await supabase
    .from('schedules')
    .upsert(sched)
    .select();

  if (error) throw error;
  return data?.[0];
};

export const saveSchedules = saveSchedule;

export const deleteSchedule = async (id) => {
  const { error } = await supabase.from('schedules').delete().eq('id', id);
  if (error) throw error;
};

// Appointments
export const getAppointments = async () => {
  const { data, error } = await supabase.from('appointments').select('*').order('date');
  if (error) throw error;
  return data || [];
};

export const saveAppointment = async (appt) => {
  const { data, error } = await supabase
    .from('appointments')
    .upsert(appt)
    .select();

  if (error) throw error;
  return data?.[0];
};

export const addAppointment = saveAppointment;

export const deleteAppointment = async (id) => {
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) throw error;
};

export const initializeStorage = async () => {
  return true;
};
