import { jsPDF } from "jspdf";
import { ProcessedImage } from "../types";

export const generatePDF = async (images: ProcessedImage[], includeCaptions: boolean): Promise<Blob> => {
  // A4 size in mm: 210 x 297
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const maxContentWidth = pageWidth - margin * 2;
  const maxContentHeight = pageHeight - margin * 2;

  for (let i = 0; i < images.length; i++) {
    const imgData = images[i];
    
    if (i > 0) {
      doc.addPage();
    }

    // Helper to load image dimensions
    const dimensions = await getImageDimensions(imgData.previewUrl);
    
    let imgHeight = (dimensions.height * maxContentWidth) / dimensions.width;
    let imgWidth = maxContentWidth;

    // If image is too tall, scale it down
    const availableHeight = includeCaptions ? maxContentHeight - 30 : maxContentHeight; 
    // -30 for caption space

    if (imgHeight > availableHeight) {
      imgWidth = (dimensions.width * availableHeight) / dimensions.height;
      imgHeight = availableHeight;
    }

    const x = (pageWidth - imgWidth) / 2;
    const y = margin;

    doc.addImage(imgData.previewUrl, "JPEG", x, y, imgWidth, imgHeight);

    if (includeCaptions && imgData.aiDescription) {
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      
      const captionY = y + imgHeight + 10;
      const splitText = doc.splitTextToSize(imgData.aiDescription, maxContentWidth);
      
      doc.text(splitText, margin, captionY);
    }
  }

  return doc.output("blob");
};

const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = url;
  });
};
