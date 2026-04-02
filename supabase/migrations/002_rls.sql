ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores   ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "profiles: public read"
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "profiles: insert own"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: update own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Rate limiting helper (index on user_id + created_at is required)
CREATE OR REPLACE FUNCTION public.count_recent_scores(p_user_id UUID, p_seconds INTEGER)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.scores
    WHERE user_id = p_user_id
      AND created_at > NOW() - (p_seconds || ' seconds')::INTERVAL;
$$;

-- scores policies
CREATE POLICY "scores: public read"
    ON public.scores FOR SELECT USING (true);

CREATE POLICY "scores: insert own"
    ON public.scores FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        -- Score limits per game
        AND (game <> 'tetris' OR score <= 10000000)
        AND (game <> 'snake'  OR score <= 100000)
        -- Score/time plausibility
        AND (score::float / duration_seconds) <= 100000
        -- Rate limiting
        AND public.count_recent_scores(auth.uid(), 3600) < 10
        AND public.count_recent_scores(auth.uid(), 60)   < 2
    );
-- No UPDATE or DELETE policy = denied by default
