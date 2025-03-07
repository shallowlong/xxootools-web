import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 确保目录存在
const iconsDir = path.resolve(rootDir, 'public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 图标尺寸
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// 源图片
const sourceImage = path.resolve(rootDir, 'public/logo.png');

// 生成不同尺寸的图标
async function generateIcons() {
  try {
    for (const size of sizes) {
      const outputFile = path.join(iconsDir, `icon-${size}x${size}.png`);
      await sharp(sourceImage)
        .resize(size, size)
        .toFile(outputFile);
      console.log(`✅ Generated: ${outputFile}`);
    }

    // 生成 Apple Touch Icon
    await sharp(sourceImage)
      .resize(192, 192)
      .toFile(path.resolve(rootDir, 'public/apple-touch-icon.png'));
    console.log('✅ Generated: public/apple-touch-icon.png');

    console.log('🎉 All PWA icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
  }
}

generateIcons(); 