create table email_signups (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null unique,
  token      uuid        not null default gen_random_uuid(),
  confirmed  boolean     not null default false,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table email_signups enable row level security;
