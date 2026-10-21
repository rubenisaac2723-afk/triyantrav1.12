const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const mediaDir = path.join(__dirname, '../../public/assets/media');
const files = [
  'hero-workplace-1080.mp4',
  'hero-workplace-1080.webm',
  'hero-workplace-720.mp4',
  'hero-workplace-720.webm',
  'hero-workplace-mobile.mp4',
  'hero-workplace-mobile.webm',
  'hero-workplace-poster.webp'
];

for (const file of files) {
  const filePath = path.join(mediaDir, file);
  console.log(`\n=== ${file} ===`);
  try {
    const out = execSync(`ffprobe -v error -show_entries format=duration,size,bit_rate -show_entries stream=width,height,r_frame_rate,codec_name -of default=noprint_wrappers=1 "${filePath}"`).toString().trim();
    console.log(out);
  } catch (err) {
    const stats = fs.statSync(filePath);
    console.log(`Size: ${stats.size} bytes`);
  }
}
