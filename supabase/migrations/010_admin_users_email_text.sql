-- Migration 010: Fix admin_list_users Type-Mismatch
--
-- Symptom: `admin_list_users()` schlägt mit
--   "structure of query does not match function result type"
-- fehl, sobald reale Daten geladen werden.
--
-- Ursache: Die View `admin_users_overview` selektiert `auth.users.email`
-- direkt. Supabase deklariert diese Spalte als `varchar`. Die RPC
-- `admin_list_users` deklariert ihre Return-Spalte aber als `TEXT`. In
-- Postgres sind `varchar` und `text` getrennte Typen — `RETURNS TABLE`
-- führt einen strikten Strukturvergleich durch und lehnt die Differenz ab.
--
-- Fix: Cast in der View (`u.email::text AS email`). Damit ist die View
-- die Typ-Normalisierungs-Schicht; die RPC bleibt unverändert in der
-- Signatur.
--
-- Die View hat eine abhängige Funktion (`admin_list_users`), deshalb muss
-- die Funktion erst gedroppt werden, bevor die View gedroppt werden kann.

BEGIN;

DROP FUNCTION IF EXISTS public.admin_list_users(INT, INT);
DROP VIEW IF EXISTS public.admin_users_overview;

CREATE VIEW public.admin_users_overview
WITH (security_invoker = true)
AS
SELECT
    p.id,
    p.display_name,
    u.email::text                        AS email,
    u.created_at                         AS registered_at,
    u.last_sign_in_at,
    p.is_admin,
    COALESCE(sc.score_count, 0)          AS score_count,
    sc.last_score_at,
    p.banned_at,
    p.banned_reason
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN (
    SELECT
        user_id,
        COUNT(*)        AS score_count,
        MAX(created_at) AS last_score_at
    FROM public.scores
    GROUP BY user_id
) sc ON sc.user_id = p.id;

CREATE FUNCTION public.admin_list_users(
    p_limit  INT DEFAULT 100,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id              UUID,
    display_name    VARCHAR,
    email           TEXT,
    registered_at   TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    is_admin        BOOLEAN,
    score_count     BIGINT,
    last_score_at   TIMESTAMPTZ,
    banned_at       TIMESTAMPTZ,
    banned_reason   TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT
        v.id,
        v.display_name,
        v.email,
        v.registered_at,
        v.last_sign_in_at,
        v.is_admin,
        v.score_count,
        v.last_score_at,
        v.banned_at,
        v.banned_reason
    FROM public.admin_users_overview v
    ORDER BY v.registered_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users(INT, INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_list_users(INT, INT) TO authenticated;

COMMIT;
