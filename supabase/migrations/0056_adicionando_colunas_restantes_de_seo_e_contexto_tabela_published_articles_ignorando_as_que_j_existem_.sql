-- Adicionando colunas que estavam faltando na tabela published_articles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='published_articles' AND column_name='keyword') THEN
        ALTER TABLE published_articles ADD COLUMN keyword TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='published_articles' AND column_name='image_prompt') THEN
        ALTER TABLE published_articles ADD COLUMN image_prompt TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='published_articles' AND column_name='secondary_keywords') THEN
        ALTER TABLE published_articles ADD COLUMN secondary_keywords TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='published_articles' AND column_name='external_links') THEN
        ALTER TABLE published_articles ADD COLUMN external_links JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='published_articles' AND column_name='internal_links') THEN
        ALTER TABLE published_articles ADD COLUMN internal_links JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='published_articles' AND column_name='readability_score') THEN
        ALTER TABLE published_articles ADD COLUMN readability_score TEXT;
    END IF;
END $$;