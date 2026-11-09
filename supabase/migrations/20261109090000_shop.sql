-- Isolated shop tables: leaves the portfolio CMS and storage untouched.
begin;

create table if not exists public.shop_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.shop_admins enable row level security;
-- Existing accounts belong to the private portfolio admin (public signup is disabled).
-- Future accounts must be deliberately added by the owner in the SQL editor.
insert into public.shop_admins(user_id) select id from auth.users on conflict do nothing;
create policy "Shop admins can see their membership" on public.shop_admins
  for select to authenticated using (user_id = (select auth.uid()));
grant select on public.shop_admins to authenticated;
revoke all on public.shop_admins from anon;

create table if not exists public.shop_products (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 100),
  published boolean not null default false,
  sort_order integer not null default 10,
  details jsonb not null check (jsonb_typeof(details) = 'object' and length(details->>'title') between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.shop_products enable row level security;
create policy "Published resources are public" on public.shop_products
  for select to anon, authenticated using (published);
create policy "Shop admins manage resources" on public.shop_products
  for all to authenticated
  using (exists (select 1 from public.shop_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.shop_admins where user_id = (select auth.uid())));
grant select on public.shop_products to anon;
grant select, insert, update, delete on public.shop_products to authenticated;

create table if not exists public.shop_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('shop_view','product_view','sample_click','download','checkout_click','test_checkout')),
  product_slug text not null default '',
  source text not null default '' check (length(source) <= 80),
  campaign text not null default '' check (length(campaign) <= 80),
  created_at timestamptz not null default now()
);
create index shop_events_created_at_idx on public.shop_events(created_at);
alter table public.shop_events enable row level security;
-- Only the bounded functions below expose analytics. No client can read raw events.
revoke all on public.shop_events from anon, authenticated;

create or replace function public.record_shop_event(p_event text, p_slug text default '', p_source text default '', p_campaign text default '')
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_event is null or p_event not in ('shop_view','product_view','sample_click','download','checkout_click','test_checkout')
    or p_slug is null or length(p_slug) > 100
    or p_source is null or length(p_source) > 80 or (p_source <> '' and p_source !~ '^[A-Za-z0-9_-]+$')
    or p_campaign is null or length(p_campaign) > 80 or (p_campaign <> '' and p_campaign !~ '^[A-Za-z0-9_-]+$')
  then return; end if;
  if p_event = 'shop_view' then
    if p_slug <> '' then return; end if;
  elsif not exists(select 1 from public.shop_products where slug = p_slug and published) then return;
  end if;
  insert into public.shop_events(event_type,product_slug,source,campaign) values(p_event,p_slug,p_source,p_campaign);
  delete from public.shop_events where created_at < now() - interval '90 days';
end;
$$;
revoke all on function public.record_shop_event(text,text,text,text) from public;
grant execute on function public.record_shop_event(text,text,text,text) to anon, authenticated;

create or replace function public.shop_stats()
returns table(product_slug text, event_type text, source text, campaign text, total bigint)
language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.shop_admins where user_id = (select auth.uid())) then
    raise exception 'Shop admin required' using errcode = '42501';
  end if;
  return query select e.product_slug,e.event_type,e.source,e.campaign,count(*)
    from public.shop_events e where e.created_at >= now() - interval '30 days'
    group by e.product_slug,e.event_type,e.source,e.campaign order by count(*) desc limit 500;
end;
$$;
revoke all on function public.shop_stats() from public;
grant execute on function public.shop_stats() to authenticated;

-- Free launch resource. No placeholder paid products or active payment links.
insert into public.shop_products(slug, published, sort_order, details)
values ('problem-to-product-planner', true, 1, '{"title":"Problem-to-Product Planner","summary":"Start with a real problem. Turn scattered ideas into one small, testable offer.","description":"Too many product ideas, and no clear place to start? This printable planner helps you capture evidence of a problem, choose who to help, and design a small experiment before spending weeks building. Work through three practical pages at your own pace.","audience":"For first-time creators, freelancers and curious builders deciding what to make next.","format":"Template","price":"0","currency":"USD","checkout_mode":"free","checkout_url":"","delivery_ready":false,"cover_url":"/shop-assets/planner-cover.svg","sample_url":"/shop-assets/problem-to-product-planner.pdf","download_url":"/shop-assets/problem-to-product-planner.pdf","includes":["Problem evidence worksheet","One-page offer brief","Seven-day experiment tracker"],"previews":["/shop-assets/planner-preview-1.png","/shop-assets/planner-preview-2.png","/shop-assets/planner-preview-3.png"],"file_note":"3-page PDF · A4 · English · Print or annotate digitally"}'::jsonb)
on conflict (slug) do nothing;
commit;
