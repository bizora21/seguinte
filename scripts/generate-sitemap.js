require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const siteUrl = process.env.VITE_SITE_URL || 'https://lojarapidamz.com';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para formatar data no formato ISO
const formatDate = (dateString) => {
  return new Date(dateString).toISOString();
};

// Função para gerar o XML do sitemap
const generateSitemapXml = (urls) => {
  const urlset = urls.map(url => {
    return `
    <url>
      <loc>${url.loc}</loc>
      <lastmod>${url.lastmod}</lastmod>
      <changefreq>${url.changefreq}</changefreq>
      <priority>${url.priority}</priority>
    </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;
};

// Função principal
const generateSitemap = async () => {
  console.log('🔍 Gerando sitemap...');
  
  const urls = [];

  // URLs estáticas
  const staticUrls = [
    { loc: `${siteUrl}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${siteUrl}/produtos`, changefreq: 'daily', priority: '0.9' },
    { loc: `${siteUrl}/lojas`, changefreq: 'daily', priority: '0.8' },
    { loc: `${siteUrl}/busca`, changefreq: 'daily', priority: '0.8' },
    { loc: `${siteUrl}/sobre-nos`, changefreq: 'monthly', priority: '0.6' },
    { loc: `${siteUrl}/blog`, changefreq: 'weekly', priority: '0.7' },
    { loc: `${siteUrl}/faq`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${siteUrl}/contato`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${siteUrl}/register`, changefreq: 'monthly', priority: '0.7' },
    { loc: `${siteUrl}/login`, changefreq: 'monthly', priority: '0.7' },
    { loc: `${siteUrl}/termos`, changefreq: 'monthly', priority: '0.4' },
    { loc: `${siteUrl}/privacidade`, changefreq: 'monthly', priority: '0.4' },
    { loc: `${siteUrl}/politica-vendedor`, changefreq: 'monthly', priority: '0.4' }
  ];

  urls.push(...staticUrls.map(url => ({
    ...url,
    lastmod: new Date().toISOString()
  })));

  try {
    // Buscar produtos
    console.log('📦 Buscando produtos...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, updated_at')
      .eq('stock', 0, 'neq') // Apenas produtos com estoque
      .order('updated_at', { ascending: false });

    if (productsError) {
      console.error('Erro ao buscar produtos:', productsError);
    } else if (products) {
      console.log(`✅ Encontrados ${products.length} produtos`);
      
      products.forEach(product => {
        urls.push({
          loc: `${siteUrl}/produto/${product.id}`,
          lastmod: formatDate(product.updated_at),
          changefreq: 'weekly',
          priority: '0.7'
        });
      });
    }

    // Buscar lojas (vendedores)
    console.log('🏪 Buscando lojas...');
    const { data: sellers, error: sellersError } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .eq('role', 'vendedor')
      .order('updated_at', { ascending: false });

    if (sellersError) {
      console.error('Erro ao buscar lojas:', sellersError);
    } else if (sellers) {
      console.log(`✅ Encontradas ${sellers.length} lojas`);
      
      sellers.forEach(seller => {
        urls.push({
          loc: `${siteUrl}/loja/${seller.id}`,
          lastmod: formatDate(seller.updated_at),
          changefreq: 'weekly',
          priority: '0.6'
        });
      });
    }

    // Gerar XML
    const sitemapXml = generateSitemapXml(urls);
    
    // Salvar arquivo
    const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapXml);
    
    console.log(`🎉 Sitemap gerado com sucesso!`);
    console.log(`📄 Total de URLs: ${urls.length}`);
    console.log(`📍 Caminho: ${sitemapPath}`);
    
  } catch (error) {
    console.error('❌ Erro ao gerar sitemap:', error);
    process.exit(1);
  }
};

// Executar
generateSitemap();