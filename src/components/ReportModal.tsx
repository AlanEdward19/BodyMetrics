import { useState, useRef } from 'react';
import { X, Download } from 'lucide-react';
import { Loading } from './Loading';
import { ReportPaper } from './ReportPaper';
import { ReportOptionsSidebar } from './ReportOptionsSidebar';
import type { Assessment } from '../types/assessment';
import type { Athlete } from '../types/athlete';
import { createDefaultReportSelections } from '../types/report';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generatePdfFromNode } from '../utils/pdfReport';
import './ReportModal.css';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  athlete: Athlete;
  currentEval?: Assessment;
  compareEval?: Assessment;
  currentMetrics: any;
  compareMetrics: any;
  formula: string;
}

export function ReportModal({
  isOpen,
  onClose,
  athlete,
  currentEval,
  compareEval,
  currentMetrics,
  compareMetrics,
  formula
}: ReportModalProps) {
  const [logos, setLogos] = useLocalStorage<string[]>('@BodyMetrics:reportLogos', []);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const [selections, setSelections] = useState(createDefaultReportSelections());

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    composition: true,
    symmetry: true,
    relations: true,
    skinfolds: false,
    circumferences: false
  });

  if (!isOpen) return null;

  const generatePDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    try {
      const pdf = await generatePdfFromNode(reportRef.current);
      pdf.save(`Relatorio_${athlete.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Ocorreu um erro ao gerar o PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="report-modal-overlay">
      <div className="report-modal-container">
        <div className="report-modal-header">
          <h2>Exportar Relatório PDF</h2>
          <button className="btn-close" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="report-modal-content">
          {isGenerating && (
            <div className="report-loading-overlay">
              <Loading
                message="Gerando Relatório PDF. Processando imagens e tabelas... Isso pode levar alguns segundos."
              />
            </div>
          )}

          <ReportOptionsSidebar
            logos={logos}
            setLogos={setLogos}
            selections={selections}
            setSelections={setSelections}
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            footer={
              <button className="btn btn-primary w-full" onClick={generatePDF} disabled={isGenerating}>
                {isGenerating ? 'Gerando...' : <><Download size={18} /> Baixar PDF</>}
              </button>
            }
          />

          <div className="report-preview-area">
            <ReportPaper
              ref={reportRef}
              athlete={athlete}
              currentEval={currentEval}
              compareEval={compareEval}
              currentMetrics={currentMetrics}
              compareMetrics={compareMetrics}
              formula={formula}
              logos={logos}
              selections={selections}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
