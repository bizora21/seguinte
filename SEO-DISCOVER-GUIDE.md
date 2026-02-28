# 🎯 Guia de SEO Local e Google Discover - LojaRápida

## 📍 Otimizações Implementadas

### 1. Favicon e Identidade Visual ✅

**Arquivos Criados:**
- `favicon.svg` (128x128) - Formato vetorial, qualidade infinita
- `favicon-192x192.png` - Para Android/Chrome
- `favicon-512x512.png` - Para PWA maskable icons
- `site.webmanifest` - Configuração PWA completa

**Benefícios:**
- ✅ Maior CTR (Click-Through Rate) nos resultados de busca
- ✅ Reconhecimento de marca imediato
- ✅ Aparência profissional em navegadores
- ✅ Instalação como app em dispositivos móveis

### 2. Schema.org para SEO Local ✅

**Schemas Implementados:**
- `Organization` - Marca e identidade
- `WebSite` - Busca interna
- `LocalBusiness` - Presença local
- `Product` - Produtos com preço em MZN
- `Article` - Posts de blog
- `NewsArticle` - **NOVO: Para Google Discover**
- `FAQPage` - Perguntas frequentes
- `BreadcrumbList` - Navegação

**Dados Locais:**
```json
{
  "addressCountry": "MZ",
  "addressLocality": "Maputo",
  "geo": {
    "latitude": -25.9692,
    "longitude": 32.5732
  },
  "priceCurrency": "MZN",
  "areaServed": "MZ"
}
```

### 3. Meta Tags para Google Discover ✅

**Meta Tags Adicionadas:**
```html
<meta name="news_keywords" content="marketplace, Moçambique, compras online, LojaRápida" />
<meta name="article:published_time" content="2026-02-28" />
<meta name="article:author" content="LojaRápida" />
<meta name="article:section" content="Marketplace" />
<meta name="article:tag" content="Moçambique" />
```

### 4. PWA (Progressive Web App) ✅

**Recursos Adicionados:**
- Shortcuts para produtos, busca e encomendas
- Screenshots para instalação
- Link para app Android
- Tema da marca (#0A2540)

---

## 🚀 Como Aparecer no Google Discover

### Requisitos do Google Discover:

1. ✅ **Conteúdo de Alta Qualidade**
   - Artigos originais e únicos
   - Informações úteis para Moçambique
   - Imagens de alta qualidade (mínimo 1200x630px)

2. ✅ **Dados Estruturados NewsArticle**
   - Título atraente (headline)
   - Descrição clara
   - Data de publicação atualizada
   - Autor definido
   - Imagem de destaque

3. ✅ **Meta Tags Específicas**
   - `news_keywords` com palavras-chave relevantes
   - `article:published_time` com data recente
   - `article:section` definida
   - `article:tag` com tags específicas

4. ✅ **SEO Técnico**
   - Sitemap.xml atualizado
   - Robots.txt permitindo bots
   - Tempo de carregamento < 3s
   - Mobile-friendly

### Exemplo de Uso do NewsArticle Schema:

```tsx
import { generateNewsArticleSchema } from '../components/SEO'

// Na página de blog/article
<SEO
  title="Como Comprar Online em Moçambique - Guia Completo 2026"
  description="Aprenda como comprar produtos online em Moçambique com segurança..."
  image="/blog/como-comprar-online-mocambique.jpg"
  url="/blog/como-comprar-online-mocambique"
  type="article"
  jsonLd={[
    generateNewsArticleSchema({
      title: "Como Comprar Online em Moçambique - Guia Completo 2026",
      headline: "Guia Completo para Compras Online em Moçambique",
      description: "Aprenda como comprar produtos online em Moçambique com segurança...",
      image: "/blog/como-comprar-online-mocambique.jpg",
      datePublished: "2026-02-28",
      author: "Equipe LojaRápida",
      url: "/blog/como-comprar-online-mocambique",
      articleSection: "Guias de Compra",
      keywords: [
        "compras online Moçambique",
        "marketplace Moçambique",
        "como comprar online",
        "LojaRápida"
      ]
    })
  ]}
/>
```

---

## 📈 Checklist de SEO Local

### Google Business Profile (Opcional mas Recomendado):

- [ ] Criar perfil no Google Business Profile
- [ ] Adicionar fotos do negócio
- [ ] Inserir horário de funcionamento
- [ ] Adicionar número de telefone
- [ ] Solicitar reviews de clientes

### Otimização de Conteúdo:

- [ ] Usar palavras-chave locais ("Moçambique", "Maputo", "Matola", "Beira")
- [ ] Criar conteúdo específico por região
- [ ] Incluir preços em MZN
- [ ] Mencionar "pagamento na entrega"
- [ ] Destacar "entrega rápida"

### Backlinks Locais:

- [ ] Listar em diretórios de Moçambique
- [ ] Parcerias com blogs locais
- [ ] Imprensa local
- [ ] Universidades de Moçambique

---

## 🔍 Palavras-chave para SEO Local

### Primárias:
- "Marketplace Moçambique"
- "Comprar online Moçambique"
- "LojaRápida Moçambique"
- "Vender online Moçambique"

### Secundárias:
- "Compras online Maputo"
- "Marketplace Maputo"
- "Comprar e vender em Moçambique"
- "App de compras Moçambique"

### Long-tail:
- "Como comprar online em Moçambique com segurança"
- "Melhor marketplace para comprar em Maputo"
- "Sites de compras online em Moçambique"
- "Onde comprar produtos online em Moçambique"

---

## 📝 Templates de Artigos para Discover

### Template 1: Guias de Compra

**Título:** "Como [Ação] em Moçambique - Guia Completo [Ano]"

**Exemplo:** "Como Comprar Eletrónicos em Moçambique - Guia Completo 2026"

**Estrutura:**
1. Introdução com problema comum
2. Solução (seu marketplace)
3. Passo a passo detalhado
4. Dicas de segurança
5. Conclusão com CTA

### Template 2: Listas de Produtos

**Título:** "[Número] Melhores [Categoria] para [Contexto] em Moçambique"

**Exemplo:** "10 Melhores Celulares para Trabalho Remoto em Moçambique"

**Estrutura:**
1. Introdução
2. Lista com produtos
3. Comparativo de preços
4. Onde comprar (LojaRápida)
5. FAQ

### Template 3: Notícias e Tendências

**Título:** "[Novidade] em Moçambique: [Assunto]"

**Exemplo:** "Compras Online Crescem 300% em Moçambique em 2025"

**Estrutura:**
1. Dado estatístico
2. Análise do mercado
3. Opinião de especialista
4. Tendências futuras
5. Como aproveitar

---

## 🎨 Recomendações de Imagens

### Para Google Discover:
- **Dimensão mínima:** 1200x630px
- **Ideal:** 1920x1080px
- **Formato:** JPG com qualidade 80%
- **Tamanho máximo:** 200KB
- **Texto na imagem:** Mínimo ou nenhum

### Para Thumbnails:
- **Dimensão:** 16:9 (ex: 1280x720)
- **Foco:** Objeto centralizado
- **Cores:** Cores vibrantes da marca (#00D4AA)
- **Logo:** Incluir logo discreto no canto

---

## 📊 Métricas para Acompanhar

### Google Search Console:
- Impressões
- CTR (Click-Through Rate)
- Posição média
- Páginas indexadas

### Analytics:
- Tráfego orgânico
- Tráfego do Discover
- Tempo na página
- Taxa de rejeição
- Conversões

### Ferramentas Recomendadas:
- Google Search Console
- Google Analytics
- Google Keyword Planner
- Ahrefs ou SEMrush (opcional)
- PageSpeed Insights

---

## ⚡ Otimizações de Performance

### Core Web Vitals:
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

### Como Melhorar:
1. Comprimir imagens (WebP)
2. Lazy loading
3. Minificar CSS/JS
4. Usar CDN (Cloudflare)
5. Cache agressivo

---

## 🔗 Próximos Passos

### Imediatos (Esta semana):
1. Gerar PNGs de favicon com sharp
2. Criar 5 artigos otimizados para Discover
3. Adicionar breadcrumbs em todas as páginas
4. Verificar Core Web Vitals

### Curto Prazo (Este mês):
1. Criar 20+ artigos de blog
2. Conquistar 10 backlinks locais
3. Atingir 90+ no PageSpeed Mobile
4. Implementar AMP para artigos

### Longo Prazo (Próximos 3 meses):
1. 100+ artigos indexados no Discover
2. 50+ produtos com schema Product
3. 100+ reviews no Google Business
4. Top 3 para "marketplace Moçambique"

---

## 📞 Suporte

Para dúvidas sobre SEO e implementações:
- E-mail: contato@lojarapidamz.com
- Site: https://lojarapidamz.com

---

**Última atualização:** 28/02/2026
**Versão:** 2.0
