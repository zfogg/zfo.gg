create table email_signups (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null unique,
  token      uuid        not null default gen_random_uuid(),
  confirmed  boolean     not null default false,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table email_signups enable row level security;

-- Allow service role to manage email signups
create policy "Service role can manage email signups"
  on email_signups
  for all
  using (true)
  with check (true);
