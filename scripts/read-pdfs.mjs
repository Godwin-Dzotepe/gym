import { readFileSync } from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractText(file) {
  const data = new Uint8Array(readFileSync(file));
  const doc = await getDocument({ data }).promise;
  let full = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    full += content.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
  }
  return full;
}

const files = ['members-report.pdf', 'members-report (2).pdf', 'members-report (3).pdf'];
for (const f of files) {
  console.log(`\n=== ${f} ===`);
  const text = await extractText(f);
  console.log(text);
}
