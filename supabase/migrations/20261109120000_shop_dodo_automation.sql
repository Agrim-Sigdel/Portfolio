begin;

-- Paid masters and sync bookkeeping are never part of the public catalogue.
create table public.shop_product_files (
  product_slug text primary key references public.shop_products(slug) on update cascade on delete cascade,
  storage_path text not null,
  filename text not null,
  content_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 20971520),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  updated_at timestamptz not null default now()
);
create table public.shop_dodo_sync (
  product_slug text not null references public.shop_products(slug) on update cascade on delete cascade,
  mode text not null check (mode in ('test', 'live')),
  state jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (product_slug, mode)
);
create table public.shop_product_locks (
  product_slug text primary key,
  token uuid not null,
  expires_at timestamptz not null
);
alter table public.shop_product_files enable row level security;
alter table public.shop_dodo_sync enable row level security;
alter table public.shop_product_locks enable row level security;
revoke all on public.shop_product_files, public.shop_dodo_sync, public.shop_product_locks from anon, authenticated;
grant all on public.shop_product_files, public.shop_dodo_sync, public.shop_product_locks to service_role;

create function public.acquire_shop_product_lock(p_slug text, p_token uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare affected integer;
begin
  insert into public.shop_product_locks(product_slug, token, expires_at)
  values(p_slug, p_token, now() + interval '120 seconds')
  on conflict (product_slug) do update set token = excluded.token, expires_at = excluded.expires_at
  where public.shop_product_locks.expires_at < now();
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;
create function public.release_shop_product_lock(p_slug text, p_token uuid)
returns void language sql security definer set search_path = '' as $$
  delete from public.shop_product_locks where product_slug = p_slug and token = p_token;
$$;
revoke all on function public.acquire_shop_product_lock(text, uuid), public.release_shop_product_lock(text, uuid) from public;
grant execute on function public.acquire_shop_product_lock(text, uuid), public.release_shop_product_lock(text, uuid) to service_role;

-- Service-only access: uploads are authenticated and validated by the Edge Function.
insert into storage.buckets(id, name, public, file_size_limit)
values ('shop-paid-files', 'shop-paid-files', false, 20971520)
on conflict (id) do nothing;
commit;
