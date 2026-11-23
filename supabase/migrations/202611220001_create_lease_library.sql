create table public.lease_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  promise text not null check (length(trim(promise)) > 0 and length(promise) <= 1500),
  lease text not null check (length(trim(lease)) > 0 and length(lease) <= 50000),
  revised text not null default '' check (length(revised) <= 50000),
  title text generated always as (left(promise, 80)) stored,
  created_at timestamptz not null default now()
);
create table public.lease_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_reference text unique not null,
  title text not null,
  amount_mnt integer not null check (amount_mnt >= 0),
  purchased_at timestamptz not null default now(),
  file_path text
);
create index on public.lease_comparisons(user_id, created_at desc);
create index on public.lease_purchases(user_id, purchased_at desc);
alter table public.lease_comparisons enable row level security;
alter table public.lease_purchases enable row level security;
revoke all on public.lease_comparisons, public.lease_purchases from public, anon, authenticated;
grant select, delete on public.lease_comparisons to authenticated;
grant insert (promise, lease, revised) on public.lease_comparisons to authenticated;
grant select (id, user_id, title, amount_mnt, purchased_at, file_path) on public.lease_purchases to authenticated;
grant all on public.lease_purchases, public.lease_comparisons to service_role;
create policy comparison_read on public.lease_comparisons for select to authenticated using (user_id = (select auth.uid()));
create policy comparison_save on public.lease_comparisons for insert to authenticated with check (user_id = (select auth.uid()));
create policy comparison_delete on public.lease_comparisons for delete to authenticated using (user_id = (select auth.uid()));
create policy purchase_read on public.lease_purchases for select to authenticated using (user_id = (select auth.uid()));
insert into storage.buckets(id,name,public) values ('lease-purchases','lease-purchases',false);
create policy purchased_file_read on storage.objects for select to authenticated using (
  bucket_id = 'lease-purchases' and exists (
    select 1 from public.lease_purchases p where p.user_id = (select auth.uid()) and p.file_path = objects.name
  )
);
