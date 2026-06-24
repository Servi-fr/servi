// Génère les icônes de l'app à partir de la marque SERVI (logo).
// Usage : npm install --no-save sharp && node scripts/generate-icons.js
const sharp = require('sharp');
const path = require('path');

const A = (f) => path.join(__dirname, '..', 'assets', f);

// La marque SERVI (deux parallélogrammes), viewBox 44x30, comme components/Logo.tsx.
const mark = (fill) =>
  `<path d="M2 4 L42 4 L34 13 L2 13 Z" fill="${fill}"/>` +
  `<path d="M10 17 L42 17 L42 26 L2 26 Z" fill="${fill}"/>`;

// Icône pleine (iOS arrondit les coins) : dégradé bleu + marque blanche.
const iconSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#3366ff"/><stop offset="1" stop-color="#2347d9"/>
  </linearGradient></defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
  <g transform="translate(204,302) scale(14)">${mark('#ffffff')}</g>
</svg>`;

// Android adaptatif : marque blanche, transparente, plus petite (zone de sécurité).
const fgSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(270,347) scale(11)">${mark('#ffffff')}</g>
</svg>`;

// Splash : marque bleue sur transparent (s'affiche sur fond clair).
const splashSvg = `<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(204,302) scale(14)">${mark('#3366ff')}</g>
</svg>`;

async function run() {
  await sharp(Buffer.from(iconSvg)).png().toFile(A('icon.png'));
  await sharp(Buffer.from(fgSvg)).png().toFile(A('android-icon-foreground.png'));
  await sharp(Buffer.from(fgSvg)).png().toFile(A('android-icon-monochrome.png'));
  await sharp(Buffer.from(splashSvg)).png().toFile(A('splash-icon.png'));
  await sharp(Buffer.from(iconSvg)).resize(64, 64).png().toFile(A('favicon.png'));
  console.log('✅ icônes SERVI générées');
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
