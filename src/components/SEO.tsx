import { Helmet } from 'react-helmet-async'
import { getFirstImageUrl } from '../utils/images'

interface SEOProps {
  title: string
  description: string
  image?: string
  url?: string
  type?: string
  jsonLd?: object[]
  noIndex?: boolean // Novo: Controle de indexação
}

const DEFAULT_SITE = 'LojaRápida'
const BASE_URL = 'https://lojarapidamz.com'
const DEFAULT_IMAGE_PATH = 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1200&h=630&fit=crop'

function isAbsoluteUrl(input: string) {
  return input.startsWith('http://') || input.startsWith('https://')
}

function ensureAbsoluteUrl(input?: string) {
  if (!input) return DEFAULT_IMAGE_PATH
  
  let processedInput = input;

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
  const canonicalUrl = absoluteUrl === BASE_URL ? BASE_URL : absoluteUrl;

  return (
    <Helmet>
      {/* Meta Tags Básicas */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Controle de Robôs (Indexação) */}
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />

      {/* Open Graph (Facebook, WhatsApp, LinkedIn) */}
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
      
      {/* Dados Específicos de Produto para OG */}
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

      {/* Outros */}
      <meta name="author" content={DEFAULT_SITE} />
      <meta name="geo.region" content="MZ" />
      <meta name="geo.placename" content="Maputo" />

      {/* Schema.org JSON-LD (Dados Estruturados para Google Rich Snippets) */}
      {jsonLd && !noIndex &&
        jsonLd.map((schema, index) => {
          try {
            // Sanitização de URLs dentro do JSON-LD
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

// --- Geradores de Schema ---

export const generateWebSiteSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "LojaRápida",
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
    "@type": "Organization", // Alterado para Organization para ser mais genérico e aceito
    "name": "LojaRápida Marketplace",
    "url": `${BASE_URL}/`,
    "logo": `${BASE_URL}/apple-touch-icon.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+258 86 318 1415",
      "contactType": "customer service",
      "areaServed": "MZ",
      "availableLanguage": "Portuguese"
    },
    "sameAs": [
      "https://www.facebook.com/lojarapidamz",
      "https://www.instagram.com/lojarapidamz"
    ]
  }
}

export const generateProductSchema = (product: any, storeName: string) => {
  const productUrl = `${BASE_URL}/produto/${product.id}`
  const formatPrice = (price: number) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(price).replace('MZN', '').trim(); // Remover símbolo para schema

  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.description || `Compre ${product.name} na LojaRápida`,
    image: ensureAbsoluteUrl(getFirstImageUrl(product.image_url) || DEFAULT_IMAGE_PATH),
    url: productUrl,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      price: parseFloat(product.price), // Enviar número puro
      priceCurrency: 'MZN',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: productUrl,
      seller: {
        '@type': 'Organization',
        name: storeName
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 7,
        "returnMethod": "https://schema.org/ReturnInStore"
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
      name: storeName
    },
    aggregateRating: {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "12" // Idealmente dinâmico
    }
  }
}

export const generateStoreSchema = (storeName: string, sellerId: string) => {
  const storeUrl = `${BASE_URL}/loja/${sellerId}`
  return {
    "@context": "https://schema.org",
    "@type": "Store", // Ou ProfilePage
    "name": storeName,
    "url": storeUrl,
    "image": ensureAbsoluteUrl(DEFAULT_IMAGE_PATH),
    "description": `Loja oficial ${storeName} na LojaRápida. Encontre os melhores produtos em Moçambique.`,
    "telephone": "+258 86 318 1415",
    "address": {
      "@type": "PostalAddress",
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