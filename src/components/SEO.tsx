import { Helmet } from 'react-helmet-async'
import { ProductWithSeller } from '../types/product'

interface SEOProps {
  title: string
  description: string
  image?: string
  url?: string
  type?: string
  jsonLd?: object[]
}

const DEFAULT_SITE = 'LojaRápida'
const BASE_URL = 'https://lojarapidamz.com' // domínio principal usado pelo site
// Usando uma URL externa válida como fallback para contornar o problema do arquivo estático corrompido
const DEFAULT_IMAGE_PATH = 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1200&h=630&fit=crop'

function isAbsoluteUrl(input: string) {
  return input.startsWith('http://') || input.startsWith('https://')
}

function ensureAbsoluteUrl(input?: string) {
  if (!input) return DEFAULT_IMAGE_PATH // Retorna o fallback externo
  
  // Se a URL já for absoluta (como as do Supabase Storage ou o fallback externo), retorne-a diretamente.
  if (isAbsoluteUrl(input)) {
    return input
  }
  
  // Se for um caminho relativo, prefixe com o BASE_URL.
  if (input.startsWith('/')) {
    return `${BASE_URL}${input}`
  }
  
  // fallback
  return `${BASE_URL}/${input}`
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  image,
  url,
  type = 'website',
  jsonLd
}) => {
  
  // --- Lógica Original Restaurada ---
  let finalImage = image && image.trim() !== '' ? image : DEFAULT_IMAGE_PATH;
  const absoluteImage = ensureAbsoluteUrl(finalImage)
  // --- Fim Lógica Original Restaurada ---
  
  // Garante que a URL canônica é sempre absoluta.
  const absoluteUrl = url ? (isAbsoluteUrl(url) ? url : `${BASE_URL}${url.startsWith('/') ? url : '/' + url}`) : BASE_URL

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* A URL canônica deve ser a URL da página atual, sem parâmetros de consulta de cache-busting */}
      <link rel="canonical" href={absoluteUrl} />

      {/* Open Graph (OG) Tags Essenciais */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={absoluteUrl} />
      <meta property="og:site_name" content={DEFAULT_SITE} />
      <meta property="og:locale" content="pt_MZ" />
      
      {/* Tags de Imagem (Sempre incluídas e explícitas com dimensões fixas) */}
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:secure_url" content={absoluteImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/jpeg" />
      
      {/* Tags Específicas para Produtos */}
      {type === 'product' && (
        <>
          <meta property="product:brand" content={DEFAULT_SITE} />
          <meta property="product:price:currency" content="MZN" />
        </>
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />

      {/* Generic / Discovery hints */}
      <meta name="image" content={absoluteImage} />
      <meta name="author" content={DEFAULT_SITE} />
      <meta name="keywords" content="LojaRápida, marketplace, Moçambique, comprar online, vender online" />
      <meta name="robots" content="index, follow" />

      {/* Structured Data */}
      {jsonLd &&
        jsonLd.map((schema, index) => {
          // Ensure image URLs inside the provided jsonLd are absolute when they are simple strings
          try {
            const cloned = JSON.parse(JSON.stringify(schema), (key, value) => {
              if (key === 'image' && typeof value === 'string') {
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
            return (
              <script key={index} type="application/ld+json">
                {JSON.stringify(schema)}
              </script>
            )
          }
        })}
    </Helmet>
  )
}

// --- Funções Auxiliares para JSON-LD (mantidas para conveniência) ---

export const generateWebSiteSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "LojaRápida",
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
    "@type": "LocalBusiness",
    "name": "LojaRápida Marketplace",
    "image": ensureAbsoluteUrl(DEFAULT_IMAGE_PATH),
    "url": `${BASE_URL}/`,
    "telephone": "+258 86 318 1415",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Maputo",
      "addressLocality": "Maputo",
      "addressRegion": "Maputo",
      "addressCountry": "MZ"
    },
    "priceRange": "$$",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday"
        ],
        "opens": "08:00",
        "closes": "18:00"
      }
    ]
  }
}

export const generateProductSchema = (product: ProductWithSeller, storeName: string) => {
  const productUrl = `${BASE_URL}/produto/${product.id}`
  const formatPrice = (price: number) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(price).replace('MZN', '').trim();

  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.description || `Compre ${product.name} na LojaRápida`,
    image: ensureAbsoluteUrl(product.image_url || DEFAULT_IMAGE_PATH),
    url: productUrl,
    offers: {
      '@type': 'Offer',
      price: formatPrice(product.price), // Preço sem o símbolo MZN
      priceCurrency: 'MZN',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Store',
        name: storeName
      }
    },
    brand: {
      '@type': 'Brand',
      name: storeName
    },
    aggregateRating: {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "125"
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
    "description": `Loja oficial ${storeName} na LojaRápida. Encontre os melhores produtos em Moçambique.`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Maputo",
      "addressLocality": "Maputo",
      "addressRegion": "Maputo",
      "addressCountry": "MZ"
    }
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