create table if not exists public.whatsapp_bot_health (
  id smallint primary key default 1 check (id = 1),
  heartbeat_at timestamptz,
  connected boolean not null default false,
  alerted_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_bot_health enable row level security;
revoke all on public.whatsapp_bot_health from anon, authenticated;
grant all on public.whatsapp_bot_health to service_role;
