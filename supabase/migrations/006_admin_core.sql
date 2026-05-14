-- Migration 006: Admin-Bereich – Kern-Infrastruktur
--
-- WICHTIG – Ausführungsreihenfolge im Supabase-SQL-Editor:
--
--   Diese Migration enthält KEINE ENUM-Änderungen und kann daher in einem
--   einzigen Run als vollständige Transaktion ausgeführt werden. Einfach den
--   gesamten Inhalt im Supabase-SQL-Editor einfügen und ausführen.
--
--   Was diese Migration tut:
--   - Fügt is_admin-Spalte zur profiles-Tabelle hinzu
--   - Erstellt die Helper-Funktion public.is_admin()
--   - Erstellt die Tabelle game_settings mit RLS
--   - Erstellt Admin-Views (admin_users_overview, admin_stats_daily,
--     admin_stats_active_users) mit security_invoker = true
--   - Erstellt SECURITY DEFINER RPCs für Admin-Datenzugriff
--   - Fügt eine zusätzliche RLS-Policy für Admin-Lesezugriff auf profiles hinzu

BEGIN;

-- ============================================================
-- 1. profiles: is_admin-Spalte
-- ============================================================

ALTER TABLE public.profiles
    ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_profiles_is_admin
    ON public.profiles(is_admin)
    WHERE is_admin = TRUE;

-- ============================================================
-- 2. Helper-Funktion is_admin()
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = p_user_id), FALSE);
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- ============================================================
-- 3. game_settings-Tabelle
-- ============================================================

CREATE TABLE public.game_settings (
    game             public.game_type PRIMARY KEY,
    enabled          BOOLEAN NOT NULL DEFAULT TRUE,
    disabled_message TEXT,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by       UUID REFERENCES public.profiles(id)
);

INSERT INTO public.game_settings (game) VALUES
    ('tetris'),
    ('snake'),
    ('dinos_realtime'),
    ('dinos_turn');

ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_settings: public read"
    ON public.game_settings FOR SELECT
    USING (true);

CREATE POLICY "game_settings: admin update"
    ON public.game_settings FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================
-- 4. Admin-Views (security_invoker = true, PG15+)
-- ============================================================

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
    sc.last_score_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN (
    SELECT
        user_id,
        COUNT(*)              AS score_count,
        MAX(created_at)       AS last_score_at
    FROM public.scores
    GROUP BY user_id
) sc ON sc.user_id = p.id;

CREATE VIEW public.admin_stats_daily
WITH (security_invoker = true)
AS
SELECT
    date_trunc('day', created_at)::date  AS day,
    game,
    COUNT(*)                             AS scores,
    COUNT(DISTINCT user_id)              AS unique_players,
    AVG(duration_seconds)                AS avg_duration
FROM public.scores
GROUP BY date_trunc('day', created_at)::date, game;

CREATE VIEW public.admin_stats_active_users
WITH (security_invoker = true)
AS
SELECT
    COUNT(DISTINCT user_id) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day')   AS dau,
    COUNT(DISTINCT user_id) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')  AS wau,
    COUNT(DISTINCT user_id) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS mau
FROM public.scores;

-- ============================================================
-- 5. Admin-RPCs (SECURITY DEFINER, mit is_admin()-Guard)
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_list_users(
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
    last_score_at   TIMESTAMPTZ
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
        v.last_score_at
    FROM public.admin_users_overview v
    ORDER BY v.registered_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_stats_daily_fn(p_days INT DEFAULT 30)
RETURNS TABLE (
    day            DATE,
    game           public.game_type,
    scores         BIGINT,
    unique_players BIGINT,
    avg_duration   NUMERIC
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
        v.day,
        v.game,
        v.scores,
        v.unique_players,
        v.avg_duration
    FROM public.admin_stats_daily v
    WHERE v.day >= (CURRENT_DATE - (p_days - 1))
    ORDER BY v.day DESC, v.game;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_stats_active_users_fn()
RETURNS TABLE (dau BIGINT, wau BIGINT, mau BIGINT)
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
    SELECT v.dau, v.wau, v.mau
    FROM public.admin_stats_active_users v;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_top_players(
    p_game  public.game_type,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    display_name VARCHAR,
    score        INTEGER,
    created_at   TIMESTAMPTZ
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
    SELECT p.display_name, s.score, s.created_at
    FROM public.scores s
    JOIN public.profiles p ON p.id = s.user_id
    WHERE s.game = p_game
    ORDER BY s.score DESC
    LIMIT p_limit;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_users(INT, INT)        FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_list_users(INT, INT)        TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_stats_daily_fn(INT)         FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_stats_daily_fn(INT)         TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_stats_active_users_fn()     FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_stats_active_users_fn()     TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_top_players(public.game_type, INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_top_players(public.game_type, INT) TO authenticated;

-- ============================================================
-- 6. RLS: Admin darf alle Profile lesen
-- ============================================================

-- Additiv zur bestehenden "profiles: select own"-Policy — RLS-Policies sind
-- OR-verknüpft (permissive), diese Schicht erlaubt Admins Lesezugriff auf
-- alle Zeilen und bereitet strikte Verschärfung für andere Rollen vor.
CREATE POLICY "profiles: admin read all"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

COMMIT;
