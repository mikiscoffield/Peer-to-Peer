-- Run once in your Supabase project's SQL Editor.
-- No public or anonymous read/write policies: only the server-side service role.
create table if not exists public.orders (
 id uuid primary key,
 amount numeric not null check (amount >= 6 and amount <= 100000),
 network text not null,
 wallet text not null,
 memo text not null default '',
 rate numeric not null check (rate > 0),
 "totalETB" numeric not null,
 type text not null check (type in ('image/png','image/jpeg','image/webp')),
 status text not null default 'pending',
 "createdAt" timestamptz not null default now()
);
alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
grant select, insert, update, delete on public.orders to service_role;
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('receipts','receipts',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
