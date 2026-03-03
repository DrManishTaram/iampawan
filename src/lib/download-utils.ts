/**
 * File download utilities for .DOC and .PDF generation
 */
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import jsPDF from 'jspdf';

/**
 * Download text as a .DOCX file with optional Kruti Dev 010 font
 */
export async function downloadAsDoc(
  text: string,
  filename: string,
  useKrutiDev: boolean = false
): Promise<void> {
  const fontName = useKrutiDev ? 'Kruti Dev 010' : 'Mangal';
  const fontSize = useKrutiDev ? 28 : 24; // Kruti Dev needs larger size
  
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: text.split('\n').map(
          (line) =>
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  font: fontName,
                  size: fontSize,
                }),
              ],
              spacing: { after: 200 },
            })
        ),
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}

/**
 * Download text as a PDF file
 * Note: For Kruti Dev font in PDF, the font must be embedded.
 * This uses the default font with Unicode Hindi support.
 */
export function downloadAsPdf(
  text: string,
  filename: string,
  useKrutiDev: boolean = false
): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Set up page margins
  const marginLeft = 20;
  const marginTop = 25;
  const pageWidth = 170; // A4 width - margins
  const lineHeight = 8;
  let currentY = marginTop;

  // Add header
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Hindi Correspondence Document', marginLeft, 15);
  pdf.setFont('helvetica', 'normal');
  
  // Add content
  pdf.setFontSize(useKrutiDev ? 14 : 12);
  
  const lines = text.split('\n');
  for (const line of lines) {
    if (currentY > 270) {
      pdf.addPage();
      currentY = marginTop;
    }
    
    // Word wrap
    const splitLines = pdf.splitTextToSize(line || ' ', pageWidth);
    for (const splitLine of splitLines) {
      if (currentY > 270) {
        pdf.addPage();
        currentY = marginTop;
      }
      pdf.text(splitLine, marginLeft, currentY);
      currentY += lineHeight;
    }
  }

  pdf.save(`${filename}.pdf`);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}
