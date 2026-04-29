// src/data/supabase.js
const SUPABASE_URL = 'https://wlyxomrzcwfamyjzdjhq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndseXhvbXJ6Y3dmYW15anpkamhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MjMyNjYsImV4cCI6MjA5Mjk5OTI2Nn0.IvrmlKYl8L-8izARg-bzchKsq5Ku5Ztw5UXrnP4X0DI';

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=representation',
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error: ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// ── EMPLOYEES ──
export async function getEmployees() {
  return sb('employees?order=name');
}
export async function addEmployee(emp) {
  const { id, ...data } = emp;
  const rows = await sb('employees', { method: 'POST', body: JSON.stringify(data) });
  return rows[0];
}
export async function updateEmployee(id, updates) {
  const { id: _, ...data } = updates;
  return sb(`employees?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}
export async function deleteEmployee(id) {
  return sb(`employees?id=eq.${id}`, { method: 'DELETE', prefer: 'return=minimal', headers: { 'Prefer': 'return=minimal' } });
}

// ── POSTS ──
export async function getPosts() {
  return sb('posts?order=name');
}
export async function addPost(post) {
  const { id, ...data } = post;
  const rows = await sb('posts', { method: 'POST', body: JSON.stringify(data) });
  return rows[0];
}
export async function updatePost(id, updates) {
  const { id: _, ...data } = updates;
  return sb(`posts?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

// ── SCHEDULES ──
export async function getSchedules() {
  return sb('schedules?order=date');
}
export async function saveSchedules(schedules) {
  await sb('schedules', { method: 'DELETE', headers: { 'Prefer': 'return=minimal' } });
  if (!schedules.length) return;
  const chunks = [];
  for (let i = 0; i < schedules.length; i += 50) chunks.push(schedules.slice(i, i + 50));
  for (const chunk of chunks) {
    await sb('schedules', { method: 'POST', body: JSON.stringify(chunk), headers: { 'Prefer': 'return=minimal' } });
  }
}

// ── APPOINTMENTS ──
export async function getAppointments() {
  return sb('appointments?order=date');
}
export async function addAppointment(appt) {
  const { id, ...data } = appt;
  const rows = await sb('appointments', { method: 'POST', body: JSON.stringify(data) });
  return rows[0];
}
export async function deleteAppointment(id) {
  return sb(`appointments?id=eq.${id}`, { method: 'DELETE', headers: { 'Prefer': 'return=minimal' } });
}

// ── AUTH (uses local users table) ──
export async function authenticateUser(username, password) {
  const rows = await sb(`users?username=eq.${username}&password=eq.${password}&select=id,username,name,role`);
  return rows[0] || null;
}

// ── INIT: create tables if needed ──
export async function initSupabase() {
  // Tables are created via SQL in Supabase dashboard
  // This just verifies connection
  try {
    await getEmployees();
    return true;
  } catch {
    return false;
  }
}
