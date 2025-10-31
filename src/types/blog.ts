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
  suggested_category: string // Name of the suggested category
  seo_score: number
  readability_score: string
}