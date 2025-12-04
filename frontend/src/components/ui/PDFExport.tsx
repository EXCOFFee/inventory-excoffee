/**
 * Generador de reportes PDF
 * Usa html2canvas y jspdf para generar PDFs
 */

import React, { useRef, useState } from 'react';

interface PDFExportProps {
  children: React.ReactNode;
  filename?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
}

export const PDFExport: React.FC<PDFExportProps> = ({
  children,
  filename = 'reporte',
  title = 'Reporte',
  orientation = 'portrait',
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    if (!contentRef.current) return;

    setIsGenerating(true);

    try {
      // Dynamic imports para reducir bundle size
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = contentRef.current;
      
      // Crear canvas del contenido
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#1e1e2e',
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Crear PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calcular dimensiones
      const imgWidth = pageWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Header
      pdf.setFillColor(30, 30, 46);
      pdf.rect(0, 0, pageWidth, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text(title, 10, 15);
      
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 170);
      pdf.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - 50, 15);

      // Content
      let yPosition = 30;
      
      if (imgHeight > pageHeight - 40) {
        // Contenido necesita múltiples páginas
        let remainingHeight = imgHeight;
        let sourceY = 0;
        
        while (remainingHeight > 0) {
          const sliceHeight = Math.min(remainingHeight, pageHeight - 40);
          
          pdf.addImage(
            imgData,
            'PNG',
            10,
            yPosition,
            imgWidth,
            imgHeight,
            undefined,
            'FAST',
            0
          );
          
          remainingHeight -= sliceHeight;
          sourceY += sliceHeight;
          
          if (remainingHeight > 0) {
            pdf.addPage();
            yPosition = 10;
          }
        }
      } else {
        pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight);
      }

      // Footer
      const pageCount = pdf.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 120);
        pdf.text(
          `InventoryPro - Página ${i} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }

      // Descargar
      pdf.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <button
        onClick={generatePDF}
        disabled={isGenerating}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-medium text-sm hover:from-red-500 hover:to-red-400 transition-all disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <div className="spinner w-4 h-4 border-white/30 border-t-white"></div>
            Generando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Exportar PDF
          </>
        )}
      </button>

      {/* Contenido para exportar (puede estar oculto) */}
      <div ref={contentRef} className="pdf-content">
        {children}
      </div>
    </div>
  );
};

// Botón simple para exportar PDF sin wrapper
interface PDFButtonProps {
  elementId: string;
  filename?: string;
  title?: string;
}

export const PDFButton: React.FC<PDFButtonProps> = ({
  elementId,
  filename = 'reporte',
  title = 'Reporte',
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    const element = document.getElementById(elementId);
    if (!element) return;

    setIsGenerating(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#1e1e2e',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('portrait', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Header
      pdf.setFillColor(30, 30, 46);
      pdf.rect(0, 0, pageWidth, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.text(title, 10, 13);

      pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight);
      pdf.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-medium text-sm hover:from-red-500 hover:to-red-400 transition-all disabled:opacity-50"
    >
      {isGenerating ? (
        <>
          <div className="spinner w-4 h-4 border-white/30 border-t-white"></div>
          Generando...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          PDF
        </>
      )}
    </button>
  );
};
