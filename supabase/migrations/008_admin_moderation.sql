-- Migration 008: Admin – Score-Moderation + Soft-Ban
--
-- Führt folgende Änderungen durch:
--   1. profiles: banned_at, banned_reason (Soft-Ban)
--   2. scores Insert-Policy: gebannte User dürfen keine Scores submitten
--   3. RPC admin_delete_score
--   4. RPCs admin_ban_user, admin_unban_user
--   5. RPC admin_rate_limit_recent
--   6. View admin_users_overview + RPC admin_list_users neu erstellt mit neuen Spalten
--
-- Ausführung im Supabase-SQL-Editor: vollständigen Inhalt als einen Run einfügen.
-- DROP POLICY + CREATE POLICY liegen in einer Transaktion – kein Default-Deny-Fenster.

BEGIN;

-- ============================================================
-- 1. profiles: Soft-Ban-Spalten
-- ============================================================

ALTER TABLE public.profiles
    ADD COLUMN banned_at     TIMESTAMPTZ,
    ADD COLUMN banned_reason TEXT CHECK (banned_reason IS NULL OR char_length(banned_reason) <= 500);

CREATE INDEX idx_profiles_banned
    ON public.profiles(banned_at)
    WHERE banned_at IS NOT NULL;

-- ============================================================
-- 2. scores Insert-Policy: Ban-Check ergänzen
--    DROP + CREATE in derselben Transaktion, damit kein Default-Deny-Fenster entsteht.
-- ============================================================

DROP POLICY "scores: insert own" ON public.scores;

CREATE POLICY "scores: insert own"
    ON public.scores FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        -- Score limits per game
        AND (game <> 'tetris'          OR score <= 10000000)
        AND (game <> 'snake'           OR score <= 100000)
        AND (game <> 'dinos_realtime'  OR score <= 400)
        AND (game <> 'dinos_turn'      OR score <= 5000)
        -- Score/time plausibility (global)
        AND (score::float / duration_seconds) <= 100000
        -- dinos_realtime: kalibriert auf Phase-0-Formel (max ~0.5 Pkt/s legitim)
        AND (game <> 'dinos_realtime' OR (score::float / duration_seconds) <= 0.4)
        -- Rate limiting
        AND public.count_recent_scores(auth.uid(), 3600) < 10
        AND public.count_recent_scores(auth.uid(), 60)   < 2
        -- Gebannte User dürfen keine Scores submitten
        AND (SELECT banned_at FROM public.profiles WHERE id = auth.uid()) IS NULL
    );

-- ============================================================
-- 3. RPC admin_delete_score
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_delete_score(p_score_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
    END IF;
    DELETE FROM public.scores WHERE id = p_score_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_score(UUID, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_delete_score(UUID, TEXT) TO authenticated;

-- ============================================================
-- 4. RPCs admin_ban_user, admin_unban_user
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_ban_user(p_user_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
    END IF;
    -- Self-Ban verhindern: ein Admin darf sich nicht selbst sperren
    IF p_user_id = auth.uid() THEN
        RAISE EXCEPTION 'cannot ban self' USING ERRCODE = '22023';
    END IF;
    UPDATE public.profiles
        SET banned_at     = NOW(),
            banned_reason = p_reason
        WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_unban_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
    END IF;
    UPDATE public.profiles
        SET banned_at     = NULL,
            banned_reason = NULL
        WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_ban_user(UUID, TEXT)  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_ban_user(UUID, TEXT)  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_unban_user(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_unban_user(UUID) TO authenticated;

-- ============================================================
-- 5. RPC admin_rate_limit_recent
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_rate_limit_recent(p_hours INT DEFAULT 1)
RETURNS TABLE (
    user_id      UUID,
    display_name VARCHAR,
    score_count  BIGINT,
    last_at      TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
    END IF;
    RETURN QUERY
    SELECT
        s.user_id,
        p.display_name,
        COUNT(*) AS score_count,
        MAX(s.created_at) AS last_at
    FROM public.scores s
    JOIN public.profiles p ON p.id = s.user_id
    WHERE s.created_at > NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY s.user_id, p.display_name
    HAVING COUNT(*) >= 3
    ORDER BY COUNT(*) DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_rate_limit_recent(INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_rate_limit_recent(INT) TO authenticated;

-- ============================================================
-- 6. admin_users_overview View neu erstellen (mit banned_at, banned_reason)
--    + admin_list_users RPC anpassen
-- ============================================================

DROP VIEW public.admin_users_overview;

CREATE VIEW public.admin_users_overview
WITH (security_invoker = true)
AS
SELECT
    p.id,
    p.display_name,
    u.email,
    u.created_at          AS registered_at,
    u.last_sign_in_at,
    p.is_admin,
    COALESCE(sc.score_count, 0) AS score_count,
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

-- DROP zwingend vor CREATE — CREATE OR REPLACE darf in Postgres den Return-Type
-- einer existierenden Funktion nicht ändern (42P13). admin_list_users existiert
-- aus 006 mit 8 Spalten; wir erweitern auf 10.
DROP FUNCTION IF EXISTS public.admin_list_users(INT, INT);

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
