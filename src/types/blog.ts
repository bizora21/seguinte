export interface BlogCategory {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface LinkItem {
  title: string
  url: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  meta_description: string
  content: string
  status: 'draft' | 'published'
  featured_image_url: string | null
  image_alt_text: string | null
  external_links: LinkItem[]
  internal_links: LinkItem[]
  secondary_keywords: string[]
  seo_score: number
  readability_score: string
  category_id: string | null
  image_prompt: string | null
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface BlogPostWithCategory extends BlogPost {
  category: BlogCategory | null
}

export interface AIGeneratedContent {
  title: string
  slug: string
  meta_description: string
  content: string
  image_prompt: string
  secondary_keywords: string[]
  external_links: LinkItem[]
  internal_links: LinkItem[]
  suggested_category: string
  seo_score: number
  readability_score: string
}

// Novo tipo para rascunhos (usado no ContentManagerTab)
export interface ContentDraft {
  id: string
  user_id: string | null
  keyword: string
  context: string
  audience: string
  status: 'draft' | 'published'
  title: string
  slug: string | null
  meta_description: string | null
  content: string | null
  featured_image_url: string | null
  image_alt_text: string | null
  external_links: LinkItem[] | null
  internal_links: LinkItem[] | null
  secondary_keywords: string[] | null
  seo_score: number
  readability_score: string | null
  category_id: string | null
  image_prompt: string | null
  created_at: string
  updated_at: string
  published_at: string | null
}