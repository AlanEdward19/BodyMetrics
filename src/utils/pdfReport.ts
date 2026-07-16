import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generatePdfFromNode(node: HTMLElement): Promise<jsPDF> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 15; // mm
  const innerWidth = pdfWidth - (margin * 2);

  let yPosition = margin;

  // Elementos que queremos capturar individualmente para evitar quebra de página no meio deles
  const selectors = [
    '.report-header',
    '.report-athlete-info',
    '.report-section'
  ];

  const elements = node.querySelectorAll(selectors.join(','));

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i] as HTMLElement;

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgHeight = (canvas.height * innerWidth) / canvas.width;

    // Se o elemento não couber na página atual, pula para a próxima
    if (yPosition + imgHeight > pdfHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.addImage(imgData, 'PNG', margin, yPosition, innerWidth, imgHeight);
    yPosition += imgHeight + 5; // 5mm de espaçamento entre seções
  }

  return pdf;
}
