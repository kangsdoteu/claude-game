-- Migration 004: Dino-Evo – ENUM-Erweiterung + Score-Caps + RLS-Policy-Update
--
-- WICHTIG – Ausführungsreihenfolge im Supabase-SQL-Editor:
--
--   Section A muss SEPARAT und ZUERST ausgeführt werden (vor Section B).
--   Grund: ALTER TYPE … ADD VALUE darf in PostgreSQL nicht innerhalb einer
--   Transaktion laufen (PG-Constraint seit PG 12). Supabase wrapped jede
--   SQL-Editor-Ausführung implizit – daher Section A als eigener Run.
--
--   Section B danach als separater Run ausführen. DROP POLICY + CREATE POLICY
--   liegen in einer expliziten Transaktion, damit kein Default-Deny-Fenster
--   zwischen DROP und CREATE entsteht (prod-Inserts würden sonst kurz blockieren).


-- ============================================================
-- Section A: ENUM erweitern (außerhalb Transaktion ausführen)
-- ============================================================

ALTER TYPE public.game_type ADD VALUE IF NOT EXISTS 'dinos_realtime';
ALTER TYPE public.game_type ADD VALUE IF NOT EXISTS 'dinos_turn';


-- ============================================================
-- Section B: Constraints + Policy (als eigenen Run ausführen)
-- ============================================================

BEGIN;

-- Score-Caps für die zwei neuen Spielmodi
ALTER TABLE public.scores
    ADD CONSTRAINT dinos_realtime_score_limit
        CHECK (game <> 'dinos_realtime' OR score <= 200),
    ADD CONSTRAINT dinos_turn_score_limit
        CHECK (game <> 'dinos_turn'     OR score <= 5000);

-- Insert-Policy neu erstellen, um die neuen Caps + dinos_realtime-Plausibilität
-- abzudecken. DROP + CREATE in einer Transaktion verhindert das Default-Deny-Fenster.
DROP POLICY IF EXISTS "scores: insert own" ON public.scores;

CREATE POLICY "scores: insert own"
    ON public.scores FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        -- Score limits per game
        AND (game <> 'tetris'          OR score <= 10000000)
        AND (game <> 'snake'           OR score <= 100000)
        AND (game <> 'dinos_realtime'  OR score <= 200)
        AND (game <> 'dinos_turn'      OR score <= 5000)
        -- Score/time plausibility (global)
        AND (score::float / duration_seconds) <= 100000
        -- dinos_realtime: max 0.05 Generationen/Sekunde (sehr langsamer Prozess)
        AND (game <> 'dinos_realtime' OR (score::float / duration_seconds) <= 0.05)
        -- Rate limiting
        AND public.count_recent_scores(auth.uid(), 3600) < 10
        AND public.count_recent_scores(auth.uid(), 60)   < 2
    );

COMMIT;
