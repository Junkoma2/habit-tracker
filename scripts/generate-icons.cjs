const { Jimp } = require('jimp')
const path = require('path')

const SRC = 'C:/Users/sharo/MyFiles/Project/APP/habit-tracker/アイコン候補.png'
const OUT = path.resolve(__dirname, '../public')

// インディゴ背景色 (#6366F1)
const BG_R = 99, BG_G = 102, BG_B = 241

const SIZES = [
  { name: 'icon-512.png',         size: 512 },
  { name: 'icon-192.png',         size: 192 },
  { name: 'apple-touch-icon.png', size: 180 },
]

async function main() {
  const src = await Jimp.read(SRC)
  const w = src.bitmap.width
  const h = src.bitmap.height
  console.log(`元画像サイズ: ${w}x${h}`)

  // iOS角丸フレームの余白をクロップ（約8%）
  const pad = Math.round(w * 0.08)
  const cw = w - pad * 2
  const ch = h - pad * 2
  src.crop({ x: pad, y: pad, w: cw, h: ch })

  // 白・近白ピクセルを透明化
  src.scan(0, 0, src.bitmap.width, src.bitmap.height, function(x, y, idx) {
    const r = this.bitmap.data[idx]
    const g = this.bitmap.data[idx + 1]
    const b = this.bitmap.data[idx + 2]
    if (r > 200 && g > 200 && b > 200) {
      this.bitmap.data[idx + 3] = 0
    }
  })

  for (const { name, size } of SIZES) {
    // インディゴ背景を作成
    const bg = new Jimp({ width: size, height: size, color: 0x6366F1FF })

    // デザインをリサイズして重ねる
    const icon = src.clone()
    icon.resize({ w: size, h: size })
    bg.composite(icon)

    const outPath = path.join(OUT, name)
    await bg.write(outPath)
    console.log(`✓ ${name} (${size}x${size})`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
