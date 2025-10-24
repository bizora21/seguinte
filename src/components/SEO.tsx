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

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  jsonLd 
}) => {
  const siteName = 'LojaRápida'
  const defaultImage = 'https://lojarapida.co.mz/og-image.jpg'
  const baseUrl = 'https://lojarapida.co.mz'

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Canonical URL */}
      {url && <link rel="canonical" href={url} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={url || baseUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="pt_MZ" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image || defaultImage} />
      <meta property="twitter:url" content={url || baseUrl} />
      
      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content={siteName} />
      <meta name="keywords" content="marketplace Moçambique, comprar online Maputo, vender online Moçambique, LojaRápida, e-commerce Moçambique" />
      
      {/* Structured Data (JSON-LD) */}
      {jsonLd && jsonLd.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  )
}

// --- Funções Auxiliares para JSON-LD ---

// 1. Schema WebSite (Para a Homepage)
export const generateWebSiteSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "LojaRápida",
    "url": "https://lojarapida.co.mz/",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://lojarapida.co.mz/busca?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }
}

// 2. Schema LocalBusiness (Para a Homepage)
export const generateLocalBusinessSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "LojaRápida Marketplace",
    "image": "https://lojarapida.co.mz/og-image.jpg",
    "url": "https://lojarapida.co.mz/",
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

// 3. Schema Product (Para a Página de Detalhes do Produto)
export const generateProductSchema = (product: ProductWithSeller, storeName: string) => {
  const productUrl = `https://lojarapida.co.mz/produto/${product.id}`
  
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.description || `Compre ${product.name} na LojaRápida`,
    image: product.image_url || 'https://lojarapida.co.mz/og-image.jpg',
    url: productUrl,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'MZN',
      availability: product.stock > 0 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
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
      "ratingValue": "4.8", // Mocked rating
      "reviewCount": "125" // Mocked count
    }
  }
}

// 4. Schema Store (Para a Página da Loja do Vendedor)
export const generateStoreSchema = (storeName: string, sellerId: string) => {
  const storeUrl = `https://lojarapida.co.mz/loja/${sellerId}`
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": storeName,
    "url": storeUrl,
    "image": "https://lojarapida.co.mz/og-image.jpg",
    "description": `Loja oficial ${storeName} na LojaRápida. Encontre os melhores produtos em Moçambique.`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Maputo",
      "addressRegion": "Maputo",
      "addressCountry": "MZ"
    }
  }
}

// Função para gerar schema de breadcrumbs (já existente, mantida)
export const generateBreadcrumbSchema = (breadcrumbs: Array<{ name: string; url: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}