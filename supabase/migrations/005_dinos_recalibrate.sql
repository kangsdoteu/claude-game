-- Migration 005: Dino-Evo – Score-Cap-Recalibration
--
-- Hintergrund: Phase-0-Score-Formel (gen*10 + biomes*5 + floor(peak_pop/50))
-- ist mit der Plausibilität aus 004_dinos.sql nicht kompatibel: schon nach
-- einer Generation (60 s) erreicht der Score ~20 Punkte → ratio 0.33, also
-- 6× über dem alten Cap von 0.05. Der 0.05-Wert war ein Einheitenfehler
-- (Generations-Rate vs. Score-Rate).
--
-- Diese Migration hebt die DB-Caps auf realistische Phase-0-Werte und macht
-- den runtime-defensiven Cap in src/pages/dinos.js zur stillen Defense-in-Depth
-- statt zur regulär greifenden Begrenzung. Anti-Cheat bleibt erhalten:
-- - Absoluter Cap 400 (statt 200) – Endgame-Score sitzt bei ~328, also ~82 %
-- - Ratio 0.4 statt 0.05 – legitimer Spike liegt bei ≤0.5, trivialer Spoof bei ≥3
-- - Rate-Limit (max 9/h, max 1/min) bleibt unverändert
--
-- Idempotenz: DROP CONSTRAINT IF EXISTS + DROP POLICY IF EXISTS machen die
-- Migration re-runnable. ALTER TYPE ist hier nicht nötig (ENUM-Werte stehen
-- bereits aus 004), daher nur eine Section.

BEGIN;

ALTER TABLE public.scores
    DROP CONSTRAINT IF EXISTS dinos_realtime_score_limit;

ALTER TABLE public.scores
    ADD CONSTRAINT dinos_realtime_score_limit
        CHECK (game <> 'dinos_realtime' OR score <= 400);

DROP POLICY IF EXISTS "scores: insert own" ON public.scores;

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
    );

COMMIT;
