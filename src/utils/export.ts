import { saveAs } from 'file-saver';
import type { Project, Document, JournalEntry } from '../types';
import { slugify } from '../store';

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export function downloadMarkdown(document: Document): void {
  const blob = new Blob([document.content], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `${document.name}.md`);
}

export async function downloadPdf(document: Document): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 6;
  let y = margin;

  const lines = document.content.split('\n');

  for (const line of lines) {
    // Handle headings
    if (line.startsWith('# ')) {
      if (y > margin) y += 4;
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      const text = line.replace(/^#+\s*/, '');
      const wrapped = pdf.splitTextToSize(text, maxWidth);
      for (const wl of wrapped) {
        if (y + 10 > pageHeight - margin) { pdf.addPage(); y = margin; }
        pdf.text(wl, margin, y);
        y += 10;
      }
      y += 2;
    } else if (line.startsWith('## ')) {
      if (y > margin) y += 3;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const text = line.replace(/^#+\s*/, '');
      const wrapped = pdf.splitTextToSize(text, maxWidth);
      for (const wl of wrapped) {
        if (y + 8 > pageHeight - margin) { pdf.addPage(); y = margin; }
        pdf.text(wl, margin, y);
        y += 8;
      }
      y += 2;
    } else if (line.startsWith('### ')) {
      if (y > margin) y += 2;
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      const text = line.replace(/^#+\s*/, '');
      const wrapped = pdf.splitTextToSize(text, maxWidth);
      for (const wl of wrapped) {
        if (y + 7 > pageHeight - margin) { pdf.addPage(); y = margin; }
        pdf.text(wl, margin, y);
        y += 7;
      }
      y += 1;
    } else if (line.trim() === '') {
      y += lineHeight * 0.5;
    } else {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      // Strip basic markdown formatting for PDF
      const clean = line
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1');
      const wrapped = pdf.splitTextToSize(clean, maxWidth);
      for (const wl of wrapped) {
        if (y + lineHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(wl, margin, y);
        y += lineHeight;
      }
    }
  }

  pdf.save(`${document.name}.pdf`);
}

function formatDateFr(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function downloadJournalEntry(entry: JournalEntry): void {
  const date = entry.createdAt.slice(0, 10);
  const slug = slugify(entry.title) || 'sans-titre';
  const frontmatter = [
    '---',
    `title: "${entry.title}"`,
    `date: ${formatDateFr(entry.createdAt)}`,
    `updated: ${formatDateFr(entry.updatedAt)}`,
    '---',
    '',
  ].join('\n');
  const blob = new Blob([frontmatter + entry.content], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `${date}-${slug}.md`);
}

export function buildAllJournalMarkdown(entries: JournalEntry[]): string {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const parts = sorted.map((e) =>
    [
      `# ${e.title}`,
      `> ${formatDateFr(e.createdAt)}` +
        (e.updatedAt !== e.createdAt ? ` — mis à jour le ${formatDateFr(e.updatedAt)}` : ''),
      '',
      e.content,
    ].join('\n')
  );
  return parts.join('\n\n---\n\n');
}

export function downloadAllJournalEntries(entries: JournalEntry[]): void {
  const content = buildAllJournalMarkdown(entries);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, 'journal-de-bord.md');
}

export async function printMarkdownPreview(content: string, title: string): Promise<void> {
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { default: ReactMarkdown } = await import('react-markdown');
  const { default: remarkGfm } = await import('remark-gfm');

  const html = renderToStaticMarkup(
    createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, content)
  );

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`<!DOCTYPE html>
<html><head><title>${title}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 780px; margin: 0 auto; padding: 40px 24px; color: #1d1d1f; line-height: 1.6; }
  h1 { font-size: 28px; margin: 1.5em 0 0.5em; }
  h2 { font-size: 22px; margin: 1.3em 0 0.4em; }
  h3 { font-size: 18px; margin: 1.2em 0 0.3em; }
  p { margin: 0.6em 0; }
  code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
  pre { background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 3px solid #d1d1d6; margin: 1em 0; padding: 0.5em 1em; color: #6e6e73; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #d1d1d6; padding: 8px 12px; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; }
  ul, ol { padding-left: 1.5em; }
  li { margin: 0.3em 0; }
  hr { border: none; border-top: 1px solid #d1d1d6; margin: 2em 0; }
  a { color: #0071e3; }
  img { max-width: 100%; }
  @media print { body { padding: 0; } }
</style>
</head><body>${html}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export async function downloadProjectZip(project: Project): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const folder = zip.folder(project.name);
  if (!folder) return;

  for (const doc of project.documents) {
    const content = doc.content || '';
    folder.file(`${doc.name}.md`, content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${project.name}.zip`);
}
