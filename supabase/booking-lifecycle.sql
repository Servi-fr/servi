-- ============================================================
-- SERVI — Cycle de vie de mission « façon Uber » (B-lifecycle)
-- À exécuter dans Supabase → SQL Editor. Idempotent.
--
-- Sous-états d'exécution + journal d'événements JSON + preuves de fin
-- (photos + signature du client dans l'app).
-- Statut global (Booking.status) inchangé : PENDING/CONFIRMED/COMPLETED/CANCELLED.
-- Sous-état (Booking.phase) quand CONFIRMED : EN_ROUTE → IN_PROGRESS.
-- ============================================================

-- 1) Colonnes de cycle de vie + preuves sur Booking
alter table public."Booking" add column if not exists phase          text;        -- EN_ROUTE | IN_PROGRESS (null sinon)
alter table public."Booking" add column if not exists "proofPhotos"  text[];      -- photos de fin de mission (URLs)
alter table public."Booking" add column if not exists signature      text;        -- signature client (JSON de traits, dessinée dans l'app)
alter table public."Booking" add column if not exists "signedAt"     timestamptz; -- horodatage de la signature

-- 2) Journal d'événements (timeline JSON, à la Uber)
create table if not exists public."BookingEvent" (
  id          text primary key default gen_random_uuid()::text,
  "bookingId" text not null references public."Booking"(id) on delete cascade,
  type        text not null,   -- CREATED | ACCEPTED | CANCELLED | EN_ROUTE | STARTED | COMPLETED
  meta        jsonb,
  "createdAt" timestamptz not null default now()
);
create index if not exists idx_bookingevent_booking on public."BookingEvent"("bookingId", "createdAt");

alter table public."BookingEvent" enable row level security;
grant select on public."BookingEvent" to authenticated;

-- Lecture : uniquement les deux parties de la réservation.
drop policy if exists "servi_bookingevent_read" on public."BookingEvent";
create policy "servi_bookingevent_read" on public."BookingEvent"
  for select to authenticated
  using (exists (
    select 1 from public."Booking" b
    where b.id = "bookingId"
      and (b."clientId" = auth.uid()::text or b."prestataireId" = auth.uid()::text)
  ));
-- Écriture : PAS de policy insert → seuls les triggers (security definer) écrivent.

-- 3) Trigger : nouvelle réservation → événement CREATED
create or replace function public.servi_event_booking_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into public."BookingEvent" ("bookingId", type, meta)
    values (new.id, 'CREATED', jsonb_build_object('service', new.service, 'price', new.price));
  exception when others then null;
  end;
  return new;
end; $$;

drop trigger if exists trg_servi_event_created on public."Booking";
create trigger trg_servi_event_created
  after insert on public."Booking"
  for each row execute function public.servi_event_booking_created();

-- 4) Trigger : changements de statut/phase → événements + notifications de trajet
create or replace function public.servi_event_booking_updated()
returns trigger language plpgsql security definer set search_path = public as $$
declare pro_name text;
begin
  -- Événements de statut
  begin
    if new.status is distinct from old.status then
      insert into public."BookingEvent" ("bookingId", type, meta)
      values (new.id,
        case new.status::text
          when 'CONFIRMED' then 'ACCEPTED'
          when 'CANCELLED' then 'CANCELLED'
          when 'COMPLETED' then 'COMPLETED'
          else new.status::text end,
        case when new.status::text = 'COMPLETED'
          then jsonb_build_object('photos', coalesce(array_length(new."proofPhotos", 1), 0), 'signed', new.signature is not null)
          else null end);
    end if;
  exception when others then null;
  end;

  -- Événements de phase (trajet / travail) + notification au client
  begin
    if new.phase is distinct from old.phase and new.phase is not null then
      insert into public."BookingEvent" ("bookingId", type)
      values (new.id, case new.phase when 'EN_ROUTE' then 'EN_ROUTE' when 'IN_PROGRESS' then 'STARTED' else new.phase end);

      select coalesce(name, 'Votre prestataire') into pro_name from public."User" where id = new."prestataireId";
      insert into public."Notification" (id, "userId", type, title, message, read, link, "createdAt", "updatedAt")
      values (gen_random_uuid()::text, new."clientId", 'booking',
        case new.phase when 'EN_ROUTE' then 'Votre prestataire est en route 🚗' else 'La prestation a commencé 🔧' end,
        pro_name || ' — « ' || new.service || ' »',
        false, '/booking/' || new.id, now(), now());
    end if;
  exception when others then null;
  end;

  return new;
end; $$;

drop trigger if exists trg_servi_event_updated on public."Booking";
create trigger trg_servi_event_updated
  after update on public."Booking"
  for each row execute function public.servi_event_booking_updated();
