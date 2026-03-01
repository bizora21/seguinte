/**
 * Gerador de Favicon PNG usando Canvas API
 * Executar no navegador: node scripts/generate-favicon-png.js
 */

const fs = require('fs')
const { createCanvas } = require('canvas')

async function generateFavicon() {
  // Tamanhos a gerar
  const sizes = [16, 32, 192, 512]

  for (const size of sizes) {
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')

    // Fundo azul com bordas arredondadas
    const radius = size * 0.2
    ctx.beginPath()
    ctx.roundRect(0, 0, size, size, radius)
    ctx.fillStyle = '#0A2540'
    ctx.fill()

    // Sacola de compras (proporção ajustada)
    const scale = size / 40
    ctx.strokeStyle = 'white'
    ctx.fillStyle = 'white'
    ctx.lineWidth = 2 * scale

    // Alça da sacola
    ctx.beginPath()
    ctx.moveTo(16 * scale, 15 * scale)
    ctx.lineTo(16 * scale, 13 * scale)
    ctx.arc(18 * scale, 13 * scale, 2 * scale, Math.PI, 0)
    ctx.lineTo(20 * scale, 15 * scale)
    ctx.stroke()

    // Corpo da sacola
    ctx.beginPath()
    ctx.moveTo(13 * scale, 15 * scale)
    ctx.lineTo(15 * scale, 30 * scale)
    ctx.lineTo(25 * scale, 30 * scale)
    ctx.lineTo(27 * scale, 15 * scale)
    ctx.closePath()
    ctx.fill()

    // Raio/flash verde
    ctx.strokeStyle = '#00D4AA'
    ctx.fillStyle = '#00D4AA'
    ctx.lineWidth = 2 * scale

    ctx.beginPath()
    ctx.moveTo(20 * scale, 20 * scale)
    ctx.lineTo(18 * scale, 25 * scale)
    ctx.lineTo(22 * scale, 25 * scale)
    ctx.lineTo(20 * scale, 30 * scale)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Salvar como PNG
    const buffer = canvas.toBuffer('image/png')
    const filename = size === 192 ? 'apple-touch-icon.png' : `favicon-${size}x${size}.png`
    fs.writeFileSync(`public/${filename}`, buffer)
    console.log(`✅ Gerado: ${filename} (${size}x${size})`)
  }

  console.log('\n✨ Favicons PNG gerados com sucesso!')
}

generateFavicon().catch(console.error)
