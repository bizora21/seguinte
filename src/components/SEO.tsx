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
  publishedTime?: string
  modifiedTime?: string
  keywords?: string[]
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
  noIndex = false,
  publishedTime,
  modifiedTime,
  keywords,
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

      {/* Favicon - CRÍTICO para aparecer nos resultados de busca do Google */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
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
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      <meta name="article:author" content={DEFAULT_SITE} />
      <meta name="article:section" content="Marketplace" />
      <meta name="article:tag" content="Moçambique" />

      {/* Meta Tags Geográficas para Moçambique */}
      <meta name="geo.region" content="MZ" />
      <meta name="geo.placename" content="Maputo, Matola, Beira, Nampula, Quelimane" />
      <meta name="geo.position" content="-25.9692;32.5732" />
      <meta name="ICBM" content="-25.9692, 32.5732" />

      {/* Meta Tags de Negócios Locais */}
      <meta name="business:contact_data:street_address" content="Maputo, Moçambique" />
      <meta name="business:contact_data:locality" content="Maputo" />
      <meta name="business:contact_data:region" content="Maputo Cidade" />
      <meta name="business:contact_data:postal_code" content="1100" />
      <meta name="business:contact_data:country_name" content="Moçambique" />

      {/* Meta Tags de E-commerce */}
      <meta name="product:brand" content={DEFAULT_SITE} />
      <meta name="product:price:currency" content="MZN" />
      <meta name="product:availability" content="instock" />
      <meta name="product:condition" content="new" />
      <meta name="product:retailer_item_id" content={url?.split('/').pop()} />

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
    "alternateName": "LojaRápida Moçambique",
    "url": `${BASE_URL}/`,
    "logo": `${BASE_URL}/favicon.svg`,
    "description": "O maior marketplace de Moçambique com pagamento na entrega. Atende Maputo, Matola, Beira, Nampula, Quelimane e todo o país.",
    "foundingDate": "2024",
    "areaServed": [
      {
        "@type": "Country",
        "name": "Moçambique"
      },
      {
        "@type": "City",
        "name": "Maputo"
      },
      {
        "@type": "City",
        "name": "Matola"
      },
      {
        "@type": "City",
        "name": "Beira"
      },
      {
        "@type": "City",
        "name": "Nampula"
      },
      {
        "@type": "City",
        "name": "Quelimane"
      }
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Maputo",
      "addressRegion": "Maputo Cidade",
      "addressCountry": "MZ"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -25.9692,
      "longitude": 32.5732
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+258 86 318 1415",
      "contactType": "customer service",
      "areaServed": "MZ",
      "availableLanguage": ["Portuguese", "English"],
      "email": "contato@lojarapidamz.com"
    },
    "sameAs": [
      "https://www.facebook.com/lojarapidamz",
      "https://www.instagram.com/lojarapidamz",
      "https://www.linkedin.com/company/lojarapidamz"
    ],
    "knowsAbout": [
      "Marketplace",
      "E-commerce",
      "Compras online",
      "Vendas online",
      "Entrega em Moçambique"
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
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "MZ",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 7,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
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

// Schema FAQ para rich snippets - IMPORTANTE para SEO
export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }
}

// Schema VideoObject para vídeos
export const generateVideoSchema = (video: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration: string;
  url: string;
}) => {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.name,
    "description": video.description,
    "thumbnailUrl": ensureAbsoluteUrl(video.thumbnailUrl),
    "uploadDate": video.uploadDate,
    "duration": video.duration,
    "contentUrl": video.url,
    "embedUrl": video.url,
    "potentialAction": {
      "@type": "SeekToAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": video.url + "?seek={seek_to_second_number}",
        "actionPlatform": [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform"
        ]
      },
      "startOffset": {
        "@type": "PropertyValue",
        "valueTemplate": "seek_to_second_number",
        "unitCode": "s"
      }
    }
  }
}

// Schema HowTo para tutoriais
export const generateHowToSchema = (howto: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string; image?: string }>;
}) => {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": howto.name,
    "description": howto.description,
    "step": howto.steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      "image": step.image ? ensureAbsoluteUrl(step.image) : undefined
    }))
  }
}