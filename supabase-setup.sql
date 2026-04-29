-- =============================================
-- GGPC Security Management System
-- Ejecutar en Supabase > SQL Editor
-- =============================================

-- USERS (acceso al sistema)
create table if not exists users (
  id bigint primary key generated always as identity,
  username text unique not null,
  password text not null,
  name text not null,
  role text not null default 'supervisor'
);

-- EMPLOYEES (guardias)
create table if not exists employees (
  id bigint primary key generated always as identity,
  name text not null,
  badge text unique not null,
  type text not null default 'full-time',
  phone text,
  email text,
  available_days text[] default '{}',
  max_hours_per_week int default 40,
  preferred_shifts text[] default '{}',
  post_assignment bigint,
  status text default 'active',
  hire_date text,
  hourly_rate numeric(6,2) default 11.00
);

-- POSTS (puestos de seguridad)
create table if not exists posts (
  id bigint primary key generated always as identity,
  name text not null,
  location text,
  shifts text[] default '{}',
  required_guards int default 1
);

-- SCHEDULES (turnos bisemana)
create table if not exists schedules (
  id text primary key,
  employee_id bigint,
  employee_name text,
  post_id bigint,
  post_name text,
  date text not null,
  day_of_week text,
  shift text,
  hours numeric(4,1),
  is_overtime boolean default false,
  is_vacancy boolean default false,
  is_sunday boolean default false,
  week_num int default 0
);

-- APPOINTMENTS (citas / ausencias)
create table if not exists appointments (
  id bigint primary key generated always as identity,
  employee_id bigint not null,
  date text not null,
  type text default 'Médica',
  notes text
);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Usuarios del sistema
insert into users (username, password, name, role) values
  ('admin',      'GGPC2024!',     'Administrador',  'admin'),
  ('supervisor1','Super2024!',    'Supervisor 1',   'supervisor'),
  ('supervisor2','Super2024!',    'Supervisor 2',   'supervisor'),
  ('manager',    'Manager2024!',  'Gerente RRHH',   'manager'),
  ('director',   'Director2024!', 'Director',       'admin')
on conflict (username) do nothing;

-- Puestos
insert into posts (name, location, shifts, required_guards) values
  ('Entrada Principal',    'Edificio A',   ARRAY['7:00-15:00','15:00-23:00','23:00-7:00'], 1),
  ('Estacionamiento Norte','Área Externa', ARRAY['7:00-15:00','15:00-23:00'],              1),
  ('Torre de Control',     'Centro',       ARRAY['7:00-15:00','15:00-23:00','23:00-7:00'], 1),
  ('Acceso Empleados',     'Edificio B',   ARRAY['6:00-14:00','14:00-22:00'],              1),
  ('Área de Carga',        'Muelle',       ARRAY['6:00-18:00'],                            1)
on conflict do nothing;

-- Empleados de ejemplo
insert into employees (name, badge, type, phone, available_days, max_hours_per_week, preferred_shifts, post_assignment, hourly_rate) values
  ('Carlos Rivera',  'G-001', 'full-time',  '787-555-0101', ARRAY['L','M','X','J','V'],         40, ARRAY['7:00-15:00'],  1, 12.50),
  ('María González', 'G-002', 'full-time',  '787-555-0102', ARRAY['L','M','X','J','V','S'],      40, ARRAY['15:00-23:00'], 1, 12.50),
  ('Juan Martínez',  'G-003', 'part-time',  '787-555-0103', ARRAY['L','M','X'],                  24, ARRAY['7:00-15:00'],  2, 11.00),
  ('Ana López',      'G-004', 'full-time',  '787-555-0104', ARRAY['M','X','J','V','S'],           40, ARRAY['23:00-7:00'],  3, 13.00),
  ('Pedro Sánchez',  'G-005', 'part-time',  '787-555-0105', ARRAY['X','J','V','S','D'],           20, ARRAY['15:00-23:00'], 2, 11.00),
  ('Rosa Colón',     'G-006', 'full-time',  '787-555-0106', ARRAY['L','M','X','J','V','S','D'],   40, ARRAY['7:00-15:00'],  4, 14.00)
on conflict (badge) do nothing;

-- =============================================
-- SEGURIDAD: deshabilitar RLS para uso interno
-- =============================================
alter table users        disable row level security;
alter table employees    disable row level security;
alter table posts        disable row level security;
alter table schedules    disable row level security;
alter table appointments disable row level security;
