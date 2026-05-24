import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const svgPath = resolve(__dirname, '../public/favicon.svg')
const outDir = resolve(__dirname, '../public/icons')

mkdirSync(outDir, { recursive: true })

const svg = readFileSync(svgPath)

for (const size of [192, 512]) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(resolve(outDir, `pwa-${size}.png`))
  console.log(`✓ pwa-${size}.png generato`)
}
