create table import_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  file_name text not null,
  file_type text not null,
  status text not null check (status in ('pending', 'completed', 'failed')),
  transaction_count integer default 0,
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table import_history enable row level security;

create policy "Users can view their own import history"
  on import_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own import history"
  on import_history for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own import history"
  on import_history for update
  using (auth.uid() = user_id);
