-- Game type enum
CREATE TYPE public.game_type AS ENUM ('tetris', 'snake');

-- User profiles (linked to auth.users)
CREATE TABLE public.profiles (
    id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(30) NOT NULL
                    CHECK (char_length(display_name) >= 3)
                    CHECK (display_name ~ '^[a-zA-Z0-9_\-]+$'),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scores (immutable: no UPDATE/DELETE policies)
CREATE TABLE public.scores (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
    game             public.game_type NOT NULL,
    score            INTEGER NOT NULL CHECK (score >= 0),
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 5 AND duration_seconds <= 7200),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT tetris_score_limit CHECK (game <> 'tetris' OR score <= 10000000),
    CONSTRAINT snake_score_limit  CHECK (game <> 'snake'  OR score <= 100000)
);

CREATE INDEX idx_scores_game_score      ON public.scores(game, score DESC);
CREATE INDEX idx_scores_user_game_score ON public.scores(user_id, game, score DESC);
CREATE INDEX idx_scores_user_created    ON public.scores(user_id, created_at DESC);

-- Leaderboard: best score per user per game
-- IMPORTANT: ORDER BY must have DISTINCT ON columns as prefix
CREATE VIEW public.leaderboard AS
SELECT DISTINCT ON (s.game, s.user_id)
    s.game,
    s.user_id,
    p.display_name,
    s.score,
    s.duration_seconds,
    s.created_at
FROM public.scores s
JOIN public.profiles p ON p.id = s.user_id
ORDER BY s.game, s.user_id, s.score DESC;
