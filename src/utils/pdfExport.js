import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const generatePdfFromElement = async (elementId, fileName = 'relatorio.pdf') => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Element with id ${elementId} not found.`);
    return;
  }

  try {
    const canvas = await html2canvas(input, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: true,
      windowWidth: input.scrollWidth, // Capture full width
      windowHeight: input.scrollHeight, // Capture full height
    });
    
    const imgData = canvas.toDataURL('image/png');
    
    // A4 paper size: 210mm x 297mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pdfWidth - 20; // pdfWidth minus margins (10mm each side)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    heightLeft -= pdfHeight - 20; // Subtract first page's usable height

    while (heightLeft >= 0) {
      position -= (pdfHeight - 20); // Move up by usable page height
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position + 10, imgWidth, imgHeight); // Adjust position for new page
      heightLeft -= (pdfHeight - 20);
    }

    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};

export default generatePdfFromElement;