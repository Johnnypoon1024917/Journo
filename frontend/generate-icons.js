import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const iconDir = './public/icons';

// Create a simple colored square as base icon
function createIconSvg(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${size * 0.1}" fill="#3b82f6"/>
    <circle cx="${size * 0.5}" cy="${size * 0.3}" r="${size * 0.15}" fill="white" opacity="0.9"/>
    <path d="M${size * 0.2} ${size * 0.5} Q${size * 0.5} ${size * 0.6} ${size * 0.8} ${size * 0.7}" stroke="white" stroke-width="${size * 0.02}" fill="none"/>
    <text x="${size * 0.5}" y="${size * 0.85}" text-anchor="middle" fill="white" font-family="Arial" font-size="${size * 0.1}" font-weight="bold">J</text>
  </svg>`;
}

// Generate PNG icons using Sharp
async function generateIcons() {
  for (const size of sizes) {
    const svg = createIconSvg(size);
    const filename = `icon-${size}x${size}.png`;
    const outputPath = path.join(iconDir, filename);
    
    try {
      await sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`Generated ${filename}`);
    } catch (error) {
      console.error(`Error generating ${filename}:`, error);
    }
  }
  
  console.log('Icon generation complete!');
}

generateIcons().catch(console.error);