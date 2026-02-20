/**
 * Image Optimization Script
 * 
 * Converts images in the public directory to WebP and AVIF formats
 * for optimal performance and Core Web Vitals.
 * 
 * Usage: node scripts/optimize-images.js
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PUBLIC_DIR = join(__dirname, '..', 'public');
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const SIZES = [640, 750, 828, 1080, 1200, 1920]; // Responsive sizes

/**
 * Recursively find all image files in a directory
 */
async function findImages(dir, images = []) {
  const files = await readdir(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const fileStat = await stat(filePath);

    if (fileStat.isDirectory()) {
      // Skip node_modules and other build directories
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        await findImages(filePath, images);
      }
    } else {
      const ext = extname(file).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(ext)) {
        images.push(filePath);
      }
    }
  }

  return images;
}

/**
 * Optimize a single image to WebP and AVIF formats
 */
async function optimizeImage(imagePath) {
  const ext = extname(imagePath);
  const base = basename(imagePath, ext);
  const dir = dirname(imagePath);

  console.log(`Optimizing: ${imagePath}`);

  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    // Generate WebP version
    await image
      .webp({ quality: 80, effort: 6 })
      .toFile(join(dir, `${base}.webp`));
    console.log(`  ✓ Created WebP version`);

    // Generate AVIF version (best compression)
    await image
      .avif({ quality: 70, effort: 6 })
      .toFile(join(dir, `${base}.avif`));
    console.log(`  ✓ Created AVIF version`);

    // Generate responsive sizes for larger images
    if (metadata.width && metadata.width > 640) {
      for (const size of SIZES) {
        if (size < metadata.width) {
          // WebP responsive
          await sharp(imagePath)
            .resize(size, null, { withoutEnlargement: true })
            .webp({ quality: 80, effort: 6 })
            .toFile(join(dir, `${base}-${size}w.webp`));

          // AVIF responsive
          await sharp(imagePath)
            .resize(size, null, { withoutEnlargement: true })
            .avif({ quality: 70, effort: 6 })
            .toFile(join(dir, `${base}-${size}w.avif`));
        }
      }
      console.log(`  ✓ Created responsive versions`);
    }

    console.log(`  ✓ Optimization complete\n`);
  } catch (error) {
    console.error(`  ✗ Error optimizing ${imagePath}:`, error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🖼️  Image Optimization Script\n');
  console.log(`Scanning directory: ${PUBLIC_DIR}\n`);

  try {
    const images = await findImages(PUBLIC_DIR);

    if (images.length === 0) {
      console.log('No images found to optimize.');
      return;
    }

    console.log(`Found ${images.length} image(s) to optimize\n`);

    for (const imagePath of images) {
      await optimizeImage(imagePath);
    }

    console.log('✅ All images optimized successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your image references to use the OptimizedImage component');
    console.log('2. The component will automatically use WebP/AVIF with fallbacks');
    console.log('3. Test your application to ensure images load correctly');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
