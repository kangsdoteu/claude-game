-- 007_admin_audit.sql
-- Phase 7 (Audit-Log): Tabelle, RLS, RPCs für admin_log_action und admin_list_audit_log.
-- Manuell im Supabase-SQL-Editor ausführen. Alte Migrationen nicht editieren.

BEGIN;

-- ============================================================
-- Tabelle
-- ============================================================
CREATE TABLE public.admin_audit_log (
    id          BIGSERIAL PRIMARY KEY,
    admin_id    UUID NOT NULL REFERENCES public.profiles(id),
    action      TEXT NOT NULL,
    target_type TEXT,
    target_id   TEXT,
    payload     JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_log_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_admin   ON public.admin_audit_log(admin_id, created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS: nur SELECT für Admins; INSERT ausschließlich via SECURITY DEFINER RPC
-- ============================================================
CREATE POLICY "admin_audit_log: admin read"
    ON public.admin_audit_log FOR SELECT USING (public.is_admin());

-- ============================================================
-- RPC: admin_log_action
-- Schreibt einen Audit-Eintrag. Nur für authentifizierte Admins.
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_log_action(
    p_action      TEXT,
    p_target_type TEXT DEFAULT NULL,
    p_target_id   TEXT DEFAULT NULL,
    p_payload     JSONB DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id BIGINT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
    END IF;
    IF p_action IS NULL OR length(p_action) = 0 OR length(p_action) > 100 THEN
        RAISE EXCEPTION 'invalid action' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.admin_audit_log (admin_id, action, target_type, target_id, payload)
    VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_payload)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_log_action(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_log_action(TEXT, TEXT, TEXT, JSONB) TO authenticated;

-- ============================================================
-- RPC: admin_list_audit_log
-- Gibt paginierte Audit-Einträge inkl. Admin-Name zurück.
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_list_audit_log(
    p_limit  INT DEFAULT 100,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id                 BIGINT,
    admin_id           UUID,
    admin_display_name VARCHAR,
    action             TEXT,
    target_type        TEXT,
    target_id          TEXT,
    payload            JSONB,
    created_at         TIMESTAMPTZ
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
        l.id,
        l.admin_id,
        p.display_name,
        l.action,
        l.target_type,
        l.target_id,
        l.payload,
        l.created_at
    FROM public.admin_audit_log l
    LEFT JOIN public.profiles p ON p.id = l.admin_id
    ORDER BY l.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_audit_log(INT, INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_list_audit_log(INT, INT) TO authenticated;

COMMIT;
