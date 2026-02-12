-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables to perform a clean reset (ORDER MATTERS due to foreign keys)
drop table if exists public.attendance;
drop table if exists public.attendance_sessions;
drop table if exists public.students;

-- Create 'students' table
create table public.students (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create 'attendance_sessions' table
create table public.attendance_sessions (
  id uuid default uuid_generate_v4() primary key,
  -- Removed strict foreign key to auth.users to allow 'Dev Bypass' with mock UUIDs
  created_by uuid, 
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create 'attendance' table
create table public.attendance (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.attendance_sessions(id) not null,
  student_id uuid references public.students(id) not null,
  marked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, student_id)
);

-- Enable Row Level Security (RLS)
alter table public.students enable row level security;
alter table public.attendance_sessions enable row level security;
alter table public.attendance enable row level security;

-- Create Policies
create policy "Public students are viewable by everyone" on students for select using ( true );
-- Allow public insert for sessions to support the bypass mode (since auth.role() might be anon)
create policy "Public can insert sessions" on attendance_sessions for insert with check ( true ); 
create policy "Public sessions are viewable by everyone" on attendance_sessions for select using ( true );
create policy "Students can mark attendance" on attendance for insert with check ( true );
create policy "Public attendance is viewable by everyone" on attendance for select using ( true );

-- Insert sample students
insert into public.students (email, name) values 
  ('student1@gmail.com', 'Student One'),
  ('student2@gmail.com', 'Student Two');
