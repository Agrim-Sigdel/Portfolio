-- Allow contact_replies to log mail that isn't a reply to anything.
--
-- Composing a fresh message from /admin still belongs in the same outbound log
-- (one place to see everything sent from contact@agrimsigdel.com.np), but it has
-- no incoming message to point at — hence a nullable FK rather than a second
-- table. The FK itself stays, so replies remain linked and cascade on delete.
alter table public.contact_replies
  alter column message_id drop not null;
