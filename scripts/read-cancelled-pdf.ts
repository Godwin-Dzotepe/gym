import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';

async function main() {
  const doc = await (pdfjsLib as any).getDocument('members-report (1) (1).pdf').promise;
  console.log('Pages:', doc.numPages);
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    console.log(`\n=== PAGE ${i} ===`);
    (content.items as any[]).forEach((it: any) => {
      if (it.str && it.str.trim()) {
        console.log(`${Math.round(it.transform[5])}\t${Math.round(it.transform[4])}\t${it.str.trim()}`);
      }
    });
  }
}
main().catch(console.error);
