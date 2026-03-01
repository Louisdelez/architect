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
