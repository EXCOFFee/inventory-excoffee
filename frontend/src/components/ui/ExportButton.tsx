/**
 * Export Button - Exportar datos a Excel/CSV
 */

import React, { useState } from 'react';
import { Button } from './Button';

interface ExportColumnObject {
  key: string;
  header: string;
  formatter?: (value: any) => string;
}

// Acepta strings simples o objetos con key/header
type ExportColumn = string | ExportColumnObject;

interface ExportButtonProps {
  data: any[];
  columns: ExportColumn[];
  filename: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

// Helper para normalizar columnas
const normalizeColumn = (col: ExportColumn): ExportColumnObject => {
  if (typeof col === 'string') {
    return { key: col, header: col };
  }
  return col;
};

// Iconos
const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ExcelIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM9.5 17.5L8 20H6l2.5-4L6 12h2l1.5 2.5L11 12h2l-2.5 4 2.5 4h-2l-1.5-2.5zM14 9h-1V4l5 5h-4z"/>
  </svg>
);

const CSVIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 9h-1V4l5 5h-4zM8 15.5c0 1.1.9 2 2 2h1v-1.5h-1c-.28 0-.5-.22-.5-.5v-2c0-.28.22-.5.5-.5h1v-1.5h-1c-1.1 0-2 .9-2 2v2zm7.5-3.5h-1.5v1.5h1v.5h-1v1.5h1.5v.5h-2v-5h2v1zm-4 0v4c0 .55-.45 1-1 1h-1v-1.5h.5v-3h-.5V11h1c.55 0 1 .45 1 1z"/>
  </svg>
);

export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  columns,
  filename,
  variant = 'outline',
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Normalizar columnas al inicio
  const normalizedColumns = columns.map(normalizeColumn);

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportToCSV = () => {
    setExporting(true);
    try {
      // Headers
      const headers = normalizedColumns.map((col) => escapeCSV(col.header)).join(',');
      
      // Rows
      const rows = data.map((row) => {
        return normalizedColumns
          .map((col) => {
            const value = row[col.key];
            const formatted = col.formatter ? col.formatter(value) : value;
            return escapeCSV(formatted);
          })
          .join(',');
      });

      const csv = [headers, ...rows].join('\n');
      
      // BOM for Excel UTF-8 compatibility
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
      
      downloadBlob(blob, `${filename}.csv`);
    } finally {
      setExporting(false);
      setShowMenu(false);
    }
  };

  const exportToExcel = () => {
    setExporting(true);
    try {
      // Create simple XML spreadsheet format
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<?mso-application progid="Excel.Sheet"?>\n';
      xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
      xml += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
      xml += '  <Styles>\n';
      xml += '    <Style ss:ID="Header">\n';
      xml += '      <Font ss:Bold="1" ss:Color="#FFFFFF"/>\n';
      xml += '      <Interior ss:Color="#0080ff" ss:Pattern="Solid"/>\n';
      xml += '    </Style>\n';
      xml += '  </Styles>\n';
      xml += '  <Worksheet ss:Name="Datos">\n';
      xml += '    <Table>\n';

      // Headers
      xml += '      <Row>\n';
      normalizedColumns.forEach((col) => {
        xml += `        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXML(col.header)}</Data></Cell>\n`;
      });
      xml += '      </Row>\n';

      // Data rows
      data.forEach((row) => {
        xml += '      <Row>\n';
        normalizedColumns.forEach((col) => {
          const value = row[col.key];
          const formatted = col.formatter ? col.formatter(value) : value;
          const type = typeof formatted === 'number' ? 'Number' : 'String';
          xml += `        <Cell><Data ss:Type="${type}">${escapeXML(String(formatted ?? ''))}</Data></Cell>\n`;
        });
        xml += '      </Row>\n';
      });

      xml += '    </Table>\n';
      xml += '  </Worksheet>\n';
      xml += '</Workbook>';

      const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
      downloadBlob(blob, `${filename}.xls`);
    } finally {
      setExporting(false);
      setShowMenu(false);
    }
  };

  const escapeXML = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <Button
        variant={variant}
        onClick={() => setShowMenu(!showMenu)}
        leftIcon={<DownloadIcon />}
        isLoading={exporting}
      >
        Exportar
      </Button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)} 
          />
          <div className="absolute right-0 mt-2 w-48 bg-dark-800 border border-dark-700 rounded-xl shadow-xl z-50 overflow-hidden animate-scale-in">
            <button
              onClick={exportToExcel}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-dark-700 hover:text-white transition-colors"
            >
              <span className="text-emerald-400"><ExcelIcon /></span>
              Exportar a Excel
            </button>
            <button
              onClick={exportToCSV}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-dark-700 hover:text-white transition-colors border-t border-dark-700"
            >
              <span className="text-blue-400"><CSVIcon /></span>
              Exportar a CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
};
