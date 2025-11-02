-- 1. RENAME existing blog_posts table to published_articles
ALTER TABLE public.blog_posts RENAME TO published_articles;

-- 2. RENAME existing RLS policies for the new table name
ALTER POLICY "Admin full access to blog posts" ON public.published_articles RENAME TO "Admin full access to published articles";
ALTER POLICY "Public read access to published blog posts" ON public.published_articles RENAME TO "Public read access to published articles";

-- 3. CREATE the content_drafts table (for the AI generation stage)
CREATE TABLE public.content_drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    
    -- Content fields (copied from old blog_posts structure)
    title TEXT,
    slug TEXT,
    meta_description TEXT,
    content TEXT,
    featured_image_url TEXT,
    image_alt_text TEXT,
    external_links JSONB DEFAULT '[]'::jsonb,
    internal_links JSONB DEFAULT '[]'::jsonb,
    secondary_keywords TEXT[] DEFAULT '{}'::text[],
    seo_score INTEGER DEFAULT 0,
    readability_score TEXT DEFAULT 'N/A',
    category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
    image_prompt TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- 4. Enable RLS on content_drafts
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for content_drafts (Admin only access for now, as it's a backend tool)
CREATE POLICY "Admin full access to drafts" ON public.content_drafts 
FOR ALL TO authenticated USING (auth.email() = 'lojarapidamz@outlook.com'::text) WITH CHECK (auth.email() = 'lojarapidamz@outlook.com'::text);

-- 6. Add trigger to update 'updated_at' on content_drafts
CREATE TRIGGER update_content_drafts_updated_at
  BEFORE UPDATE ON public.content_drafts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();