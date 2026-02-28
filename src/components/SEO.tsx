import { Helmet } from 'react-helmet-async'
import { getFirstImageUrl } from '../utils/images'

interface SEOProps {
  title: string
  description: string
  image?: string
  url?: string
  type?: string
  jsonLd?: object[]
  noIndex?: boolean
}

const DEFAULT_SITE = 'LojaRápida'
const BASE_URL = 'https://lojarapidamz.com'
// Imagem padrão robusta para compartilhamento
const DEFAULT_IMAGE_PATH = 'https://lojarapidamz.com/og-image.jpg'

function isAbsoluteUrl(input: string) {
  return input.startsWith('http://') || input.startsWith('https://')
}

function ensureAbsoluteUrl(input?: string) {
  if (!input) return DEFAULT_IMAGE_PATH
  
  let processedInput = input;

  // Lógica para extrair URL limpa se vier em formato JSON stringify (comum no banco)
  if (input.startsWith('[') && input.endsWith(']')) {
    const extractedUrl = getFirstImageUrl(input);
    if (extractedUrl) {
        processedInput = extractedUrl;
    }
  }
  
  if (isAbsoluteUrl(processedInput)) {
    return processedInput
  }
  
  if (processedInput.startsWith('/')) {
    return `${BASE_URL}${processedInput}`
  }
  
  return `${BASE_URL}/${processedInput}`
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  image,
  url,
  type = 'website',
  jsonLd,
  noIndex = false
}) => {
  
  let finalImage = image && image.trim() !== '' ? image : DEFAULT_IMAGE_PATH;
  const absoluteImage = ensureAbsoluteUrl(finalImage)
  const absoluteUrl = url ? (isAbsoluteUrl(url) ? url : `${BASE_URL}${url.startsWith('/') ? url : '/' + url}`) : BASE_URL
  const canonicalUrl = absoluteUrl;

  return (
    <Helmet>
      {/* Meta Tags Básicas */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Favicon */}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
      <link rel="apple-touch-icon" sizes="192x192" href="/favicon-192x192.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Alternate Language Tags (para expandir no futuro) */}
      <link rel="alternate" hreflang="pt-MZ" href={canonicalUrl} />
      <link rel="alternate" hreflang="pt" href={canonicalUrl} />
      <link rel="alternate" hreflang="x-default" href={canonicalUrl} />

      {/* Controle de Robôs */}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />

      {/* Open Graph (Facebook, LinkedIn, WhatsApp) */}
      <meta property="og:locale" content="pt_MZ" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={DEFAULT_SITE} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:secure_url" content={absoluteImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/jpeg" />
      
      {/* Dados de Produto (Se aplicável) */}
      {type === 'product' && (
        <>
          <meta property="product:brand" content={DEFAULT_SITE} />
          <meta property="product:price:currency" content="MZN" />
          <meta property="product:availability" content="instock" />
        </>
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />

      {/* Localização e Autor */}
      <meta name="author" content={DEFAULT_SITE} />
      <meta name="geo.region" content="MZ" />
      <meta name="geo.placename" content="Maputo" />
      <meta name="geo.position" content="-25.9692;32.5732" />
      <meta name="ICBM" content="-25.9692, 32.5732" />

      {/* Meta Tags para Google Discover */}
      <meta name="news_keywords" content={type === 'article' ? "marketplace, Moçambique, compras online, LojaRápida" : ""} />
      {type === 'article' && (
        <meta name="article:published_time" content={new Date().toISOString()} />
      )}
      <meta name="article:author" content={DEFAULT_SITE} />
      <meta name="article:section" content="Marketplace" />
      <meta name="article:tag" content="Moçambique" />

      {/* Schema.org JSON-LD */}
      {jsonLd && !noIndex &&
        jsonLd.map((schema, index) => {
          if (!schema) return null;
          try {
            const cloned = JSON.parse(JSON.stringify(schema), (key, value) => {
              if ((key === 'image' || key === 'url') && typeof value === 'string') {
                return ensureAbsoluteUrl(value)
              }
              return value
            })
            return (
              <script key={index} type="application/ld+json">
                {JSON.stringify(cloned)}
              </script>
            )
          } catch {
            return null
          }
        })}
    </Helmet>
  )
}

// --- Geradores de Schema Avançados ---

export const generateWebSiteSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "LojaRápida Moçambique",
    "alternateName": "Loja Rapida MZ",
    "url": `${BASE_URL}/`,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${BASE_URL}/busca?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  }
}

export const generateLocalBusinessSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization", // Organization é melhor para marcas nacionais online
    "name": "LojaRápida",
    "url": `${BASE_URL}/`,
    "logo": `${BASE_URL}/favicon.svg`, // Aponta para o SVG, Google aceita
    "description": "O maior marketplace de Moçambique com pagamento na entrega.",
    "foundingDate": "2024",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Maputo",
      "addressCountry": "MZ"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+258 86 318 1415",
      "contactType": "customer service",
      "areaServed": "MZ",
      "availableLanguage": ["Portuguese"]
    },
    // Links sociais ajudam o Google a verificar a identidade (Knowledge Graph)
    "sameAs": [
      "https://www.facebook.com/lojarapidamz",
      "https://www.instagram.com/lojarapidamz",
      "https://www.linkedin.com/company/lojarapidamz" 
    ]
  }
}

export const generateProductSchema = (product: any, storeName: string) => {
  const productUrl = `${BASE_URL}/produto/${product.id}`
  
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.description || `Compre ${product.name} na LojaRápida Moçambique.`,
    image: ensureAbsoluteUrl(getFirstImageUrl(product.image_url)),
    url: productUrl,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      price: parseFloat(product.price),
      priceCurrency: 'MZN',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: productUrl,
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: storeName
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": 0,
          "currency": "MZN"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "MZ"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 5,
            "unitCode": "DAY"
          }
        }
      }
    },
    brand: {
      '@type': 'Brand',
      name: storeName || 'Genérico'
    },
    aggregateRating: {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "15"
    }
  }
}

export const generateStoreSchema = (storeName: string, sellerId: string) => {
  const storeUrl = `${BASE_URL}/loja/${sellerId}`
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": storeName,
    "url": storeUrl,
    "image": ensureAbsoluteUrl(DEFAULT_IMAGE_PATH),
    "description": `Loja oficial ${storeName} na LojaRápida. Encontre os melhores produtos em Moçambique com entrega rápida.`,
    "telephone": "+258 86 318 1415",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "MZ"
    },
    "priceRange": "$$"
  }
}

export const generateBreadcrumbSchema = (breadcrumbs: Array<{ name: string; url: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url.startsWith('/') ? item.url : '/' + item.url}`
    }))
  }
}

// Schema para App Mobile
export const generateMobileAppSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "LojaRápida Moçambique",
    "operatingSystem": "Android",
    "applicationCategory": "ShoppingApplication",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "ratingCount": "250"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "MZN"
    },
    "description": "Baixe o app LojaRápida e compre produtos de todo Moçambique com entrega rápida e pagamento na entrega.",
    "url": "https://play.google.com/store/apps/details?id=com.app.github",
    "publisher": {
      "@type": "Organization",
      "name": "LojaRápida",
      "url": `${BASE_URL}/`
    }
  }
}

// Schema NewsArticle para Google Discover
export const generateNewsArticleSchema = (article: {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  url: string;
  headline?: string;
  articleSection?: string;
  keywords?: string[];
}) => {
  const articleUrl = article.url.startsWith('http') ? article.url : `${BASE_URL}${article.url}`

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.headline || article.title,
    "description": article.description,
    "image": ensureAbsoluteUrl(article.image),
    "datePublished": article.datePublished,
    "dateModified": article.dateModified || article.datePublished,
    "author": {
      "@type": "Person",
      "name": article.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "LojaRápida",
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_URL}/favicon.svg`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": articleUrl
    },
    // Campos importantes para Google Discover
    "articleSection": article.articleSection || "Marketplace",
    "keywords": article.keywords || ["marketplace", "Moçambique", "compras online", "LojaRápida"],
    "inLanguage": "pt-MZ",
    "isAccessibleForFree": true,
    "genre": ["Shopping", "Marketplace", "E-commerce"]
  }
}

// Schema Article para posts de blog
export const generateArticleSchema = (article: {
  title: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  url: string;
}) => {
  const articleUrl = article.url.startsWith('http') ? article.url : `${BASE_URL}${article.url}`

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.description,
    "image": ensureAbsoluteUrl(article.image),
    "datePublished": article.datePublished,
    "dateModified": article.dateModified || article.datePublished,
    "author": {
      "@type": "Person",
      "name": article.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "LojaRápida",
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_URL}/favicon.svg`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": articleUrl
    }
  }
}

// Schema Review para avaliações
export const generateReviewSchema = (product: any, storeName: string, reviews: any[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": ensureAbsoluteUrl(getFirstImageUrl(product.image_url)),
    "sku": product.id,
    "review": reviews.map(review => ({
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": "5"
      },
      "author": {
        "@type": "Person",
        "name": review.user_name || "Cliente Anônimo"
      },
      "reviewBody": review.comment,
      "datePublished": review.created_at
    })),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": reviews.length.toString(),
      "bestRating": "5",
      "worstRating": "1"
    }
  }
}