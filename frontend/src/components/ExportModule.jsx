import React from 'react';
import { FileText, FileSpreadsheet } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ExportModule = ({ data, columns, filename }) => {
  
  const exportCSV = () => {
    if (!data || data.length === 0) return;
    
    // Convert object keys to header array if columns aren't provided
    const cols = columns || Object.keys(data[0]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + cols.join(",") + "\n"
      + data.map(row => cols.map(col => `"${String(row[col] || '').replace(/"/g, '""')}"`).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (!data || data.length === 0) return;
    const cols = columns || Object.keys(data[0]);
    
    const doc = new jsPDF();
    doc.text(filename.replace(/_/g, ' ').toUpperCase(), 14, 15);
    
    autoTable(doc, {
      head: [cols],
      body: data.map(row => cols.map(col => String(row[col] || ''))),
      startY: 20,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo
      styles: { fontSize: 8 }
    });
    
    doc.save(`${filename}.pdf`);
  };

  return (
    <div className="flex gap-3 bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border)] shadow-sm">
      <button 
        onClick={exportCSV} 
        className="flex items-center justify-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-semibold transition-colors flex-1 sm:flex-none"
      >
        <FileSpreadsheet size={16} /> Export CSV
      </button>
      <button 
        onClick={exportPDF} 
        className="flex items-center justify-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-sm font-semibold transition-colors flex-1 sm:flex-none"
      >
        <FileText size={16} /> Export PDF
      </button>
    </div>
  );
};

export default ExportModule;
