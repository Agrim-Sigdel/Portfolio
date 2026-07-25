-- Reply log + a "has been answered" marker for the admin inbox.

-- A separate column rather than a 'replied' status: status drives the
-- Inbox/Archived filters, so folding replies into it would make answered
-- messages vanish from the inbox the moment you reply to them.
alter table public.contact_messages
  add column if not exists replied_at timestamptz;

create table if not exists public.contact_replies (
  id          bigint generated always as identity primary key,
  message_id  bigint not null references public.contact_messages(id) on delete cascade,
  to_email    text not null,
  subject     text not null,
  body        text not null,
  resend_id   text,          -- Resend's message id, for tracing a send in their dashboard
  sent_by     text,          -- admin email that sent it
  sent_at     timestamptz not null default now()
);

create index if not exists contact_replies_message_id_idx
  on public.contact_replies (message_id);

alter table public.contact_replies enable row level security;

-- Read: admin only. Write: deliberately NO insert policy — replies are written
-- exclusively by the send-reply Edge Function using the service_role key, which
-- bypasses RLS. That means nothing client-side can forge a reply record, so the
-- log is trustworthy evidence of what was actually sent.
drop policy if exists "contact_replies admin read" on public.contact_replies;
create policy "contact_replies admin read"
  on public.contact_replies for select
  to authenticated using (true);
