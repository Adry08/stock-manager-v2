// scripts/generate-icons.js
// Script pour générer toutes les icônes à partir d'une icône source

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceIcon = path.join(__dirname, '../public/bloomy-logo.png'); // Votre logo Bloomy
const outputDir = path.join(__dirname, '../public/icons');

// Créer le dossier icons s'il n'existe pas
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  if (!fs.existsSync(sourceIcon)) {
    console.error('❌ Fichier source introuvable: bloomy-logo.png');
    console.log('📝 Assurez-vous que bloomy-logo.png est dans le dossier public/');
    return;
  }

  console.log('🌸 Génération des icônes PWA Bloomy...\n');

  for (const size of sizes) {
    try {
      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Fond transparent
        })
        .png()
        .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
      
      console.log(`✅ Généré: icon-${size}x${size}.png (transparent)`);
    } catch (error) {
      console.error(`❌ Erreur pour icon-${size}x${size}.png:`, error.message);
    }
  }

  // Générer aussi une version avec padding pour certains OS
  console.log('\n🎨 Génération des icônes avec padding...');
  
  for (const size of [192, 512]) {
    try {
      const paddedSize = Math.floor(size * 0.8); // 80% de la taille
      const padding = Math.floor((size - paddedSize) / 2);
      
      await sharp(sourceIcon)
        .resize(paddedSize, paddedSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent aussi pour le padding
        })
        .png()
        .toFile(path.join(outputDir, `icon-${size}x${size}-padded.png`));
      
      console.log(`✅ Généré: icon-${size}x${size}-padded.png (transparent)`);
    } catch (error) {
      console.error(`❌ Erreur pour icon-${size}x${size}-padded.png:`, error.message);
    }
  }

  console.log('\n✨ Toutes les icônes Bloomy ont été générées avec fond transparent !');
  console.log('🌸 Votre PWA est prête avec le logo Bloomy !');
}

generateIcons();