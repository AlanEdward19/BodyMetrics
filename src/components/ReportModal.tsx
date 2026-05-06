import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { X, Upload, ChevronLeft, ChevronRight, Trash2, Download } from 'lucide-react';
import type { Assessment } from '../types/assessment';
import type { Athlete } from '../types/athlete';
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
  const [logos, setLogos] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setLogos(prev => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeLogo = (index: number) => {
    setLogos(prev => prev.filter((_, i) => i !== index));
  };

  const moveLogo = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index > 0) {
      setLogos(prev => {
        const newLogos = [...prev];
        const temp = newLogos[index - 1];
        newLogos[index - 1] = newLogos[index];
        newLogos[index] = temp;
        return newLogos;
      });
    } else if (direction === 'right' && index < logos.length - 1) {
      setLogos(prev => {
        const newLogos = [...prev];
        const temp = newLogos[index + 1];
        newLogos[index + 1] = newLogos[index];
        newLogos[index] = temp;
        return newLogos;
      });
    }
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    
    try {
      if (!reportRef.current) return;
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: reportRef.current.scrollWidth,
        windowHeight: reportRef.current.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 1) { // > 1 to avoid rounding creating an empty page
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Relatorio_${athlete.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Ocorreu um erro ao gerar o PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const [yyyy, mm, dd] = dateStr.split('T')[0].split('-');
    return `${dd}/${mm}/${yyyy}`;
  };

  const calculateAge = (birthDateStr: string, evalDateStr?: string) => {
    if (!birthDateStr || !evalDateStr) return '-';
    const birthDate = new Date(birthDateStr);
    const evalDate = new Date(evalDateStr);
    let age = evalDate.getFullYear() - birthDate.getFullYear();
    const m = evalDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && evalDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const currentAge = calculateAge(athlete.birthDate, currentEval?.date);
  const compareAge = calculateAge(athlete.birthDate, compareEval?.date);

  const getDiff = (cur?: number, cmp?: number, unit?: string) => {
    if (cur === undefined || cmp === undefined) return '-';
    const diff = cur - cmp;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff.toFixed(1).replace('.', ',')} ${unit || ''}`.trim();
  };

  const renderTableSection = (title: string, items: { label: string, cur?: number, cmp?: number, unit: string }[]) => (
    <div className="report-section">
      <h3 className="report-section-title">{title}</h3>
      <table className="report-table">
        <thead>
          <tr>
            <th>Medida</th>
            <th>Atual ({formatDate(currentEval?.date)})</th>
            <th>Anterior ({formatDate(compareEval?.date)})</th>
            <th>Evolução</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td>{item.label}</td>
              <td>{item.cur !== undefined ? `${item.cur.toFixed(1).replace('.', ',')} ${item.unit}` : '-'}</td>
              <td>{item.cmp !== undefined ? `${item.cmp.toFixed(1).replace('.', ',')} ${item.unit}` : '-'}</td>
              <td>{getDiff(item.cur, item.cmp, item.unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSymmetryTableSection = () => {
    if (!currentMetrics) return null;
    const { coxa, pantu, braco } = currentMetrics.simetria;
    const items = [
      { label: 'Coxa', data: coxa },
      { label: 'Panturrilha', data: pantu },
      { label: 'Braço', data: braco }
    ];
    return (
      <div className="report-section">
        <h3 className="report-section-title">Índices de Simetria (Medidas Corrigidas)</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Região</th>
              <th>Lado Direito</th>
              <th>Lado Esquerdo</th>
              <th>Diferença</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td><strong>{item.label}</strong></td>
                <td>{item.data.d.toFixed(2).replace('.', ',')} cm</td>
                <td>{item.data.e.toFixed(2).replace('.', ',')} cm</td>
                <td>{item.data.diff.toFixed(2).replace('.', ',')} cm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderRelationTableSection = () => {
    if (!currentMetrics) return null;
    const r = currentMetrics.relacao;
    const items = [
      { label: 'Coxa / Fêmur', media: r.ccCoxa, osso: r.diamJoelho, relacao: r.coxa },
      { label: 'Panturrilha / Tornozelo', media: r.ccPantu, osso: r.diamTornozelo, relacao: r.pantu },
      { label: 'Braço / Úmero', media: r.ccBraco, osso: r.diamPunho, relacao: r.braco }
    ];
    return (
      <div className="report-section">
        <h3 className="report-section-title">Relação Cineantropométrica</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Relação</th>
              <th>Média Corrigida</th>
              <th>Diâmetro Ósseo</th>
              <th>Índice</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td><strong>{item.label}</strong></td>
                <td>{item.media.toFixed(2).replace('.', ',')} cm</td>
                <td>{item.osso > 0 ? `${item.osso.toFixed(2).replace('.', ',')} cm` : '-'}</td>
                <td>{item.relacao > 0 ? item.relacao.toFixed(2).replace('.', ',') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="report-modal-overlay">
      <div className="report-modal-container">
        <div className="report-modal-header">
          <h2>Exportar Relatório PDF</h2>
          <button className="btn-close" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="report-modal-content">
          <div className="report-sidebar">
            <div className="logos-manager">
              <h3>Logos do Relatório</h3>
              <p>Adicione logos para o cabeçalho do relatório (PNG).</p>
              
              <div className="logos-list">
                {logos.map((logo, idx) => (
                  <div key={idx} className="logo-item-wrapper">
                    <img src={logo} alt={`Logo ${idx}`} className="logo-thumbnail" />
                    <div className="logo-actions">
                      <button onClick={() => moveLogo(idx, 'left')} disabled={idx === 0}><ChevronLeft size={16}/></button>
                      <button onClick={() => removeLogo(idx)} className="btn-danger"><Trash2 size={16}/></button>
                      <button onClick={() => moveLogo(idx, 'right')} disabled={idx === logos.length - 1}><ChevronRight size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>

              <input 
                type="file" 
                accept="image/png, image/jpeg" 
                multiple 
                ref={fileInputRef} 
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button className="btn btn-secondary w-full" onClick={() => fileInputRef.current?.click()}>
                <Upload size={18} /> Adicionar Logo
              </button>
            </div>

            <div className="report-actions">
              <button className="btn btn-primary w-full" onClick={generatePDF} disabled={isGenerating}>
                {isGenerating ? 'Gerando...' : <><Download size={18} /> Baixar PDF</>}
              </button>
            </div>
          </div>

          <div className="report-preview-area">
            <div className="report-paper" ref={reportRef}>
              
              {/* HEADER */}
              <div className="report-header">
                <div className="report-logos">
                  {logos.map((logo, idx) => (
                    <img key={idx} src={logo} alt="Logo" className="report-logo-img" />
                  ))}
                </div>
                <div className="report-title-area">
                  <h1>Relatório de Avaliação Antropométrica</h1>
                  <p>Gerado em {formatDate(new Date().toISOString())}</p>
                </div>
              </div>

              {/* ATHLETE INFO */}
              <div className="report-athlete-info">
                <div className="info-grid">
                  <div className="info-item"><strong>Atleta:</strong> {athlete.name}</div>
                  <div className="info-item"><strong>Esporte:</strong> {(athlete as any).sport || 'Futebol'} {((athlete as any).sportObservation || (athlete as any).position || (athlete as any).sector) && `(${(athlete as any).sportObservation || (athlete as any).position || (athlete as any).sector})`}</div>
                  <div className="info-item"><strong>Categoria:</strong> {athlete.category}</div>
                  
                  <div className="info-item"><strong>Idade Atual:</strong> {currentAge} anos</div>
                  <div className="info-item"><strong>Fase / Obj.:</strong> {athlete.competitivePhase || '-'}</div>
                  <div className="info-item"><strong>Sexo:</strong> {athlete.gender || '-'}</div>
                  
                  <div className="info-item"><strong>Raça / Etnia:</strong> {athlete.race || '-'}</div>
                  <div className="info-item"><strong>Alt. Sentado:</strong> {currentEval?.sittingHeight ? `${currentEval.sittingHeight} cm` : '-'}</div>
                  <div className="info-item"><strong>Fórmula:</strong> {formula === 'pollock' ? 'Pollock 7 Dobras' : 'Faulkner'}</div>
                </div>
              </div>

              {/* METRICS SUMMARY */}
              {currentMetrics && (
                <div className="report-metrics-summary">
                  <div className="report-metric-box">
                    <span className="report-metric-label">Peso Corporal</span>
                    <span className="report-metric-value">{currentMetrics.peso.toFixed(1).replace('.', ',')} kg</span>
                  </div>
                  <div className="report-metric-box">
                    <span className="report-metric-label">Altura</span>
                    <span className="report-metric-value">{currentMetrics.altura.toFixed(1).replace('.', ',')} cm</span>
                  </div>
                  <div className="report-metric-box">
                    <span className="report-metric-label">% Gordura</span>
                    <span className="report-metric-value">{currentMetrics.percentualGordura.toFixed(1).replace('.', ',')} %</span>
                  </div>
                  <div className="report-metric-box">
                    <span className="report-metric-label">Soma das Dobras</span>
                    <span className="report-metric-value">{currentMetrics.sumDobras.toFixed(1).replace('.', ',')} mm</span>
                  </div>
                  <div className="report-metric-box">
                    <span className="report-metric-label">Massa Gorda</span>
                    <span className="report-metric-value">{currentMetrics.gordura.toFixed(1).replace('.', ',')} kg</span>
                  </div>
                  <div className="report-metric-box">
                    <span className="report-metric-label">Massa Livre Gord.</span>
                    <span className="report-metric-value">{currentMetrics.mlg.toFixed(1).replace('.', ',')} kg</span>
                  </div>
                  <div className="report-metric-box">
                    <span className="report-metric-label">Massa Óssea</span>
                    <span className="report-metric-value">{currentMetrics.ossos.toFixed(1).replace('.', ',')} kg</span>
                  </div>
                  <div className="report-metric-box">
                    <span className="report-metric-label">Massa Muscular</span>
                    <span className="report-metric-value">{currentMetrics.massaMuscular.toFixed(1).replace('.', ',')} kg</span>
                  </div>
                </div>
              )}

              {/* TABLES */}
              {renderTableSection('Medidas Gerais', [
                { label: 'Água Corporal', cur: currentEval?.bodyWater, cmp: compareEval?.bodyWater, unit: 'kg' },
                { label: 'Gordura Visceral', cur: currentEval?.visceralFat, cmp: compareEval?.visceralFat, unit: 'kg' },
                { label: 'Massa Proteica', cur: currentEval?.proteinMass, cmp: compareEval?.proteinMass, unit: 'kg' },
                { label: 'Massa Muscular', cur: currentEval?.muscleMass, cmp: compareEval?.muscleMass, unit: 'kg' }
              ])}

              {renderTableSection('Dobras Cutâneas', [
                { label: 'Tríceps Dir.', cur: currentEval?.skinfolds?.tricepsRight, cmp: compareEval?.skinfolds?.tricepsRight, unit: 'mm' },
                { label: 'Tríceps Esq.', cur: currentEval?.skinfolds?.tricepsLeft, cmp: compareEval?.skinfolds?.tricepsLeft, unit: 'mm' },
                { label: 'Subescapular', cur: currentEval?.skinfolds?.subscapular, cmp: compareEval?.skinfolds?.subscapular, unit: 'mm' },
                { label: 'Tórax', cur: currentEval?.skinfolds?.chest, cmp: compareEval?.skinfolds?.chest, unit: 'mm' },
                { label: 'Subaxilar', cur: currentEval?.skinfolds?.midaxillary, cmp: compareEval?.skinfolds?.midaxillary, unit: 'mm' },
                { label: 'Supra-ilíaca', cur: currentEval?.skinfolds?.suprailiac, cmp: compareEval?.skinfolds?.suprailiac, unit: 'mm' },
                { label: 'Abdominal', cur: currentEval?.skinfolds?.abdominal, cmp: compareEval?.skinfolds?.abdominal, unit: 'mm' },
                { label: 'Panturrilha Dir.', cur: currentEval?.skinfolds?.calfRight, cmp: compareEval?.skinfolds?.calfRight, unit: 'mm' },
                { label: 'Panturrilha Esq.', cur: currentEval?.skinfolds?.calfLeft, cmp: compareEval?.skinfolds?.calfLeft, unit: 'mm' }
              ])}

              {renderTableSection('Circunferências', [
                { label: 'Ombro', cur: currentEval?.circumferences?.shoulder, cmp: compareEval?.circumferences?.shoulder, unit: 'cm' },
                { label: 'Peitoral', cur: currentEval?.circumferences?.chest, cmp: compareEval?.circumferences?.chest, unit: 'cm' },
                { label: 'Braço Dir.', cur: currentEval?.circumferences?.armRight, cmp: compareEval?.circumferences?.armRight, unit: 'cm' },
                { label: 'Braço Esq.', cur: currentEval?.circumferences?.armLeft, cmp: compareEval?.circumferences?.armLeft, unit: 'cm' },
                { label: 'Cintura', cur: currentEval?.circumferences?.waist, cmp: compareEval?.circumferences?.waist, unit: 'cm' },
                { label: 'Quadril', cur: currentEval?.circumferences?.hip, cmp: compareEval?.circumferences?.hip, unit: 'cm' },
                { label: 'Medial Dir.', cur: currentEval?.circumferences?.thighMidRight, cmp: compareEval?.circumferences?.thighMidRight, unit: 'cm' },
                { label: 'Medial Esq.', cur: currentEval?.circumferences?.thighMidLeft, cmp: compareEval?.circumferences?.thighMidLeft, unit: 'cm' },
                { label: 'Panturrilha Dir.', cur: currentEval?.circumferences?.calfRight, cmp: compareEval?.circumferences?.calfRight, unit: 'cm' },
                { label: 'Panturrilha Esq.', cur: currentEval?.circumferences?.calfLeft, cmp: compareEval?.circumferences?.calfLeft, unit: 'cm' },
                { label: 'D. Punho', cur: currentEval?.circumferences?.wristRight, cmp: compareEval?.circumferences?.wristRight, unit: 'cm' },
                { label: 'D. Joelho', cur: currentEval?.circumferences?.kneeRight, cmp: compareEval?.circumferences?.kneeRight, unit: 'cm' },
                { label: 'D. Tornozelo', cur: (currentEval?.circumferences as any)?.ankle, cmp: (compareEval?.circumferences as any)?.ankle, unit: 'cm' }
              ])}

              {renderSymmetryTableSection()}
              {renderRelationTableSection()}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
