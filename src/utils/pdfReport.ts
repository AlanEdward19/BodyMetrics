import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generatePdfFromNode(node: HTMLElement): Promise<jsPDF> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 15; // mm
  const innerWidth = pdfWidth - (margin * 2);

  // Seletores usados pelos relatórios individuais
  const selectors = [
    '.report-header',
    '.report-athlete-info',
    '.report-section'
  ];

  const elements = node.querySelectorAll(selectors.join(','));

  // ── Fallback: captura o node inteiro quando não há sub-elementos identificados
  if (elements.length === 0) {
    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: node.scrollWidth,
      windowHeight: node.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const totalImgHeight = (canvas.height * innerWidth) / canvas.width;

    let yPosition = margin;
    let remainingHeight = totalImgHeight;
    let srcY = 0;

    while (remainingHeight > 0) {
      const availableHeight = pdfHeight - margin * 2;
      const sliceHeight = Math.min(remainingHeight, availableHeight);

      // Desenha apenas a fatia da imagem que cabe nesta página
      const sliceCanvas = document.createElement('canvas');
      const sliceScale = canvas.width / innerWidth;
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeight * sliceScale;

      const ctx = sliceCanvas.getContext('2d')!;
      ctx.drawImage(
        canvas,
        0, srcY * sliceScale,           // sx, sy
        canvas.width, sliceCanvas.height, // sWidth, sHeight
        0, 0,                            // dx, dy
        sliceCanvas.width, sliceCanvas.height // dWidth, dHeight
      );

      const sliceData = sliceCanvas.toDataURL('image/png');
      pdf.addImage(sliceData, 'PNG', margin, yPosition, innerWidth, sliceHeight);

      remainingHeight -= sliceHeight;
      srcY += sliceHeight;

      if (remainingHeight > 0) {
        pdf.addPage();
        yPosition = margin;
      }
    }

    return pdf;
  }

  // ── Fluxo original: captura elemento por elemento
  let yPosition = margin;

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
