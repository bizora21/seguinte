/**
 * Gerador de PNGs de Favicon usando sharp
 * Cria PNGs em todos os tamanhos necessários
 *
 * Requisitos: npm install sharp
 * Uso: node scripts/generate-png-favicons.js
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const COLORS = {
  bg: '#0A2540',
  white: '#FFFFFF',
  green: '#00D4AA'
}

// SVG base com sacola e raio
const baseSvg = `
<svg width="512" height="512" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="40" rx="8" fill="${COLORS.bg}"/>
  <path d="M13 15H27L25 30H15L13 15Z" fill="${COLORS.white}"/>
  <path d="M16 15V13C16 11.3431 17.3431 10 19 10H21C22.6569 10 24 11.3431 24 13V15" stroke="${COLORS.white}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20 20L18 25H22L20 30" stroke="${COLORS.green}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20 20L22 25H18L20 30" fill="${COLORS.green}"/>
</svg>`

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 96, name: 'favicon-96x96.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'favicon-192x192.png' },
  { size: 512, name: 'favicon-512x512.png' }
]

const publicDir = path.join(__dirname, '..', 'public')

async function generateFavicons() {
  console.log('🎨 Gerando PNGs de favicon...\n')

  try {
    // Criar buffer do SVG base
    const svgBuffer = Buffer.from(baseSvg)

    for (const { size, name } of sizes) {
      const outputPath = path.join(publicDir, name)

      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 10, g: 37, b: 64, alpha: 1 }
        })
        .png()
        .toFile(outputPath)

      console.log(`✅ ${name} (${size}x${size})`)
    }

    // Criar favicon.ico com múltiplos tamanhos
    const icoPath = path.join(publicDir, 'favicon.ico')
    await sharp(svgBuffer)
      .resize(48, 48)
      .png()
      .toFile(icoPath)
    console.log(`✅ favicon.ico (48x48)`)

    console.log('\n✨ Todos os favicons foram gerados com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao gerar favicons:', error.message)
    console.log('\n💡 Certifique-se de instalar sharp: npm install sharp')
    process.exit(1)
  }
}

generateFavicons()
