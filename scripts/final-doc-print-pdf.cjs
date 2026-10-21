'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const srcPath = process.argv[2];
  const outPath = process.argv[3];
  if (!srcPath || !outPath) throw new Error('usage: PRINT_DOC.SRC PRINT_DOC.OUT');
  const abs = path.resolve(srcPath);
  if (!fs.existsSync(abs)) throw new Error('src not found: ' + abs);
  const browser = await chromium.launch({ executablePath: "/home/guts/.local/bin/google-chrome" });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
    await page.goto('file://' + abs, { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print' });
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '14mm', bottom: '15mm', left: '13mm', right: '13mm' },
    });
  } finally {
    await browser.close();
  }
  console.log('PDF_OK ' + path.resolve(outPath) + ' bytes=' + fs.statSync(outPath).size);
}

main().catch((e) => { console.error('PDF_ERR ' + e.message); process.exit(1); });
