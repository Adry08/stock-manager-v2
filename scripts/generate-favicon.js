// scripts/generate-favicon.js
// Script pour générer le favicon à partir du logo

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceIcon = path.join(__dirname, '../public/bloomy-logo.png');
const outputFavicon = path.join(__dirname, '../public/favicon.ico');
const outputAppleTouchIcon = path.join(__dirname, '../public/apple-touch-icon.png');

async function generateFavicon() {
  console.log('🌸 Génération du favicon Bloomy...\n');

  try {
    // Générer favicon.ico (32x32) avec fond transparent
    await sharp(sourceIcon)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputFavicon);
    
    console.log('✅ favicon.ico créé (transparent)');

    // Générer apple-touch-icon.png (180x180) avec fond transparent
    await sharp(sourceIcon)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputAppleTouchIcon);
    
    console.log('✅ apple-touch-icon.png créé (transparent)');

    console.log('\n✨ Favicon Bloomy généré avec succès (fond transparent) !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

generateFavicon();