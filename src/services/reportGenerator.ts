import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DiffResult } from '../types/diff.types';

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

export function exportAsJson(
  result: DiffResult,
  filename = 'scm-diff-report.json',
): void {
  const blob = new Blob([JSON.stringify(result, null, 2)], {
    type: 'application/json',
  });
  saveAs(blob, filename);
}

export function exportAsPdf(
  result: DiffResult,
  filename = 'scm-diff-report.pdf',
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  }) as JsPDFWithAutoTable;

  const { summary, pathDiffs, schemaDiffs, tagDiffs } = result;

  // ── Title page header ─────────────────────────────────────────────────────
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Oracle Fusion SCM API Diff Report: 25C → 26B', 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

  // ── Summary table ─────────────────────────────────────────────────────────
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, 36);

  autoTable(doc, {
    startY: 40,
    head: [['Category', 'Added', 'Removed', 'Modified']],
    body: [
      ['Paths', summary.pathsAdded, summary.pathsRemoved, summary.pathsModified],
      [
        'Schemas',
        summary.schemasAdded,
        summary.schemasRemoved,
        summary.schemasModified,
      ],
      ['Tags', summary.tagsAdded, summary.tagsRemoved, '—'],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 121, 255] },
    margin: { left: 14 },
    tableWidth: 130,
  });

  // ── Path changes ──────────────────────────────────────────────────────────
  const summaryEndY = doc.lastAutoTable.finalY;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Path Changes', 14, summaryEndY + 10);

  autoTable(doc, {
    startY: summaryEndY + 14,
    head: [['Change', 'Path', 'Methods', 'Details']],
    body: pathDiffs.map((p) => [
      p.changeType.toUpperCase(),
      p.path,
      [
        ...(p.methods?.added ?? []).map((m) => `+${m}`),
        ...(p.methods?.removed ?? []).map((m) => `-${m}`),
        ...(p.methods?.modified ?? []).map((m) => `~${m}`),
      ].join(', ') || '—',
      p.details.join('; ') || '—',
    ]),
    styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
    headStyles: { fillColor: [41, 121, 255] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 100 },
      2: { cellWidth: 40 },
      3: { cellWidth: 'auto' },
    },
    margin: { left: 14 },
  });

  // ── Schema field changes ───────────────────────────────────────────────────
  const modifiedSchemas = schemaDiffs.filter(
    (s) => s.changeType === 'modified' && s.fieldDiffs.length > 0,
  );
  if (modifiedSchemas.length > 0) {
    doc.addPage();
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Schema Field Changes', 14, 18);

    const schemaRows: (string | number)[][] = [];
    for (const schema of modifiedSchemas) {
      for (const fd of schema.fieldDiffs) {
        schemaRows.push([
          schema.schemaName,
          fd.fieldName,
          fd.changeType.toUpperCase(),
          fd.oldType ?? '—',
          fd.newType ?? '—',
        ]);
      }
    }

    autoTable(doc, {
      startY: 22,
      head: [['Schema', 'Field', 'Change', 'Old Type', 'New Type']],
      body: schemaRows,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [41, 121, 255] },
      margin: { left: 14 },
    });
  }

  // ── Added/removed schemas ─────────────────────────────────────────────────
  const otherSchemas = schemaDiffs.filter((s) => s.changeType !== 'modified');
  if (otherSchemas.length > 0) {
    const schemaEndY =
      modifiedSchemas.length > 0 ? doc.lastAutoTable.finalY : 0;
    const startY =
      modifiedSchemas.length > 0 ? schemaEndY + 10 : 22;

    if (modifiedSchemas.length === 0) {
      doc.addPage();
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Schema Changes', 14, 18);
    } else {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Added / Removed Schemas', 14, startY - 6);
    }

    autoTable(doc, {
      startY,
      head: [['Change', 'Schema Name']],
      body: otherSchemas.map((s) => [s.changeType.toUpperCase(), s.schemaName]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 121, 255] },
      margin: { left: 14 },
    });
  }

  // ── Tag changes ───────────────────────────────────────────────────────────
  if (tagDiffs.length > 0) {
    doc.addPage();
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Tag Changes', 14, 18);

    autoTable(doc, {
      startY: 22,
      head: [['Change', 'Tag Name', 'Description']],
      body: tagDiffs.map((t) => [
        t.changeType.toUpperCase(),
        t.tagName,
        t.description ?? '—',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 121, 255] },
      margin: { left: 14 },
    });
  }

  doc.save(filename);
}
