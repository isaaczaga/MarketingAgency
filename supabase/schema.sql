-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Strategies Table
create table strategies (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  brand_profile jsonb not null,
  objectives text[]
);

-- Phases Table
create table phases (
  id uuid primary key default uuid_generate_v4(),
  strategy_id uuid references strategies(id) on delete cascade not null,
  title text not null,
  "order" integer not null
);

-- Tasks Table
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  phase_id uuid references phases(id) on delete cascade not null,
  type text not null,
  title text not null,
  description text,
  status text not null default 'PLANNED',
  scheduled_date date,
  content_id uuid -- Will verify FK later or keep loose for flexibility
);

-- Content Items Table
create table content_items (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references tasks(id) on delete set null,
  type text not null,
  title text not null,
  content text, -- Can store JSON string or HTML
  status text not null default 'DRAFT',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb
);

-- Add indexes for performance
create index idx_phases_strategy_id on phases(strategy_id);
create index idx_tasks_phase_id on tasks(phase_id);
create index idx_content_items_task_id on content_items(task_id);

-- Enable RLS (Row Level Security) - Optional for now, but good practice
alter table strategies enable row level security;
alter table phases enable row level security;
alter table tasks enable row level security;
alter table content_items enable row level security;

-- Create policy to allow public access (Since auth isn't set up yet)
-- WARNING: For production, you should restrict this to authenticated users only.
create policy "Allow public access strategies" on strategies for all using (true);
create policy "Allow public access phases" on phases for all using (true);
create policy "Allow public access tasks" on tasks for all using (true);
create policy "Allow public access content_items" on content_items for all using (true);
