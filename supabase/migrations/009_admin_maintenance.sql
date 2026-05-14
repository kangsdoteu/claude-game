-- Migration 009: Maintenance-Banner – site_announcements-Tabelle
--
-- Nummerierungs-Hinweis:
--   007 ist für Phase 7 (Audit-Log) reserviert,
--   008 für Phase 8 (Moderation). Diese Migration nimmt 009.
--
-- Ausführung: Gesamten Inhalt im Supabase-SQL-Editor einfügen und ausführen.

BEGIN;

-- ============================================================
-- 1. site_announcements-Tabelle
-- ============================================================

CREATE TABLE public.site_announcements (
    id         BIGSERIAL PRIMARY KEY,
    message    TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 500),
    severity   TEXT NOT NULL CHECK (severity IN ('info','warning','critical')) DEFAULT 'info',
    active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id)
);

-- Partial Index für schnelle Abfragen auf aktive, nicht-abgelaufene Einträge
CREATE INDEX idx_site_announcements_active_expires
    ON public.site_announcements (active, expires_at)
    WHERE active = TRUE;

ALTER TABLE public.site_announcements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. RLS-Policies
-- ============================================================

CREATE POLICY "site_announcements: public read active"
    ON public.site_announcements FOR SELECT
    USING (active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "site_announcements: admin read all"
    ON public.site_announcements FOR SELECT
    USING (public.is_admin());

CREATE POLICY "site_announcements: admin insert"
    ON public.site_announcements FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "site_announcements: admin update"
    ON public.site_announcements FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "site_announcements: admin delete"
    ON public.site_announcements FOR DELETE
    USING (public.is_admin());

COMMIT;
