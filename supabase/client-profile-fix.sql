-- ============================================================
-- SERVI — Fix réservations : tout utilisateur doit avoir une ClientProfile
-- À exécuter dans Supabase → SQL Editor. Idempotent.
--
-- Cause du bug : la table Booking a une FK "Booking_clientProfile_fkey" qui
-- exige que le clientId existe dans ClientProfile.userId. Or les comptes créés
-- via l'app mobile n'ont qu'un User (+ parfois un PrestataireProfile), jamais
-- de ClientProfile → l'insert de réservation échoue (violation de FK) → aucune
-- réservation n'est créée. On garantit donc une ClientProfile pour chacun.
-- ============================================================

-- 1) Backfill : une ClientProfile pour chaque User qui n'en a pas encore.
insert into public."ClientProfile" (id, "userId", strengths, rating)
select gen_random_uuid()::text, u.id, '{}'::text[], 0
from public."User" u
where not exists (select 1 from public."ClientProfile" c where c."userId" = u.id);

-- 2) Trigger : tout nouvel utilisateur reçoit automatiquement sa ClientProfile.
create or replace function public.servi_ensure_client_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    insert into public."ClientProfile" (id, "userId", strengths, rating)
    values (gen_random_uuid()::text, new.id, '{}'::text[], 0)
    on conflict ("userId") do nothing;
  exception when others then
    null; -- ne bloque jamais la création du compte
  end;
  return new;
end; $$;

drop trigger if exists trg_servi_ensure_client_profile on public."User";
create trigger trg_servi_ensure_client_profile
  after insert on public."User"
  for each row execute function public.servi_ensure_client_profile();

-- Vérif : nombre de users encore sans ClientProfile (doit renvoyer 0)
-- select count(*) from public."User" u
--   where not exists (select 1 from public."ClientProfile" c where c."userId" = u.id);
