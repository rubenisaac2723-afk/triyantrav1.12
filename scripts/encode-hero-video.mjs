import { execSync } from "node:child_process";
import { statSync, existsSync } from "node:fs";

const master = "E:\\Siddu2.mp4";
const outDir = "public/assets/media";

console.log("[ENCODE] Starting full 10.02s master derivative encoding from:", master);

// 1. Poster: frame 0.0s of master video (WebP)
console.log("[ENCODE] 1/7 Generating poster (WebP) from frame 00:00:00.000...");
execSync(
  `ffmpeg -ss 00:00:00.000 -i "${master}" -vframes 1 -vf "scale=1920:1080" -c:v libwebp -quality 85 "${outDir}/hero-workplace-poster.webp" -y`,
  { stdio: "inherit" }
);

// 2. Desktop 1080p MP4 (Full length, H.264, 30fps, faststart, controlled bitrate)
console.log("[ENCODE] 2/7 Generating full-length 1080p MP4 (10.02s)...");
execSync(
  `ffmpeg -i "${master}" -vf "scale=1920:1080" -r 30 -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p -movflags +faststart -an "${outDir}/hero-workplace-1080.mp4" -y`,
  { stdio: "inherit" }
);

// 3. Desktop 1080p WebM (Full length, VP9, 30fps)
console.log("[ENCODE] 3/7 Generating full-length 1080p WebM (10.02s)...");
execSync(
  `ffmpeg -i "${master}" -vf "scale=1920:1080" -r 30 -c:v libvpx-vp9 -b:v 2000k -crf 32 -deadline good -cpu-used 2 -pix_fmt yuv420p -an "${outDir}/hero-workplace-1080.webm" -y`,
  { stdio: "inherit" }
);

// 4. Tablet 720p MP4 (Full length, 1280x720, 30fps)
console.log("[ENCODE] 4/7 Generating full-length 720p MP4 (10.02s)...");
execSync(
  `ffmpeg -i "${master}" -vf "scale=1280:720" -r 30 -c:v libx264 -crf 24 -preset medium -pix_fmt yuv420p -movflags +faststart -an "${outDir}/hero-workplace-720.mp4" -y`,
  { stdio: "inherit" }
);

// 5. Tablet 720p WebM (Full length, 1280x720, 30fps)
console.log("[ENCODE] 5/7 Generating full-length 720p WebM (10.02s)...");
execSync(
  `ffmpeg -i "${master}" -vf "scale=1280:720" -r 30 -c:v libvpx-vp9 -b:v 1100k -crf 34 -deadline good -cpu-used 2 -pix_fmt yuv420p -an "${outDir}/hero-workplace-720.webm" -y`,
  { stdio: "inherit" }
);

// 6. Mobile MP4 (Full length, 854x480, 30fps)
console.log("[ENCODE] 6/7 Generating full-length Mobile MP4 (10.02s)...");
execSync(
  `ffmpeg -i "${master}" -vf "scale=854:480" -r 30 -c:v libx264 -crf 25 -preset medium -pix_fmt yuv420p -movflags +faststart -an "${outDir}/hero-workplace-mobile.mp4" -y`,
  { stdio: "inherit" }
);

// 7. Mobile WebM (Full length, 854x480, 30fps)
console.log("[ENCODE] 7/7 Generating full-length Mobile WebM (10.02s)...");
execSync(
  `ffmpeg -i "${master}" -vf "scale=854:480" -r 30 -c:v libvpx-vp9 -b:v 600k -crf 36 -deadline good -cpu-used 2 -pix_fmt yuv420p -an "${outDir}/hero-workplace-mobile.webm" -y`,
  { stdio: "inherit" }
);

console.log("\n[ENCODE COMPLETED] Generated Derivatives Audit:\n");
const files = [
  "hero-workplace-poster.webp",
  "hero-workplace-1080.mp4",
  "hero-workplace-1080.webm",
  "hero-workplace-720.mp4",
  "hero-workplace-720.webm",
  "hero-workplace-mobile.mp4",
  "hero-workplace-mobile.webm"
];

for (const f of files) {
  const p = `${outDir}/${f}`;
  if (existsSync(p)) {
    const s = statSync(p);
    console.log(`- ${f}: ${(s.size / 1024 / 1024).toFixed(2)} MB (${s.size} bytes)`);
  }
}
