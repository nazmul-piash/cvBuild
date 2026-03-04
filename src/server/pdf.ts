import PDFDocument from 'pdfkit';
import fs from 'fs';

export const generatePDF = (content: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);
    
    doc.pipe(stream);

    doc.fontSize(25).text('Lebenslauf', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(content, {
      align: 'justify'
    });

    doc.end();

    stream.on('finish', () => {
      resolve();
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
};
