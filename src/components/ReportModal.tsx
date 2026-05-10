import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { X, Upload, ChevronLeft, ChevronRight, Trash2, Download, Scale, Ruler, Percent, Activity, Shield, Dumbbell, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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

  const [selections, setSelections] = useState({
    composition: { 
      items: { 
        peso: true, altura: true, percentualGordura: true, sumDobras: true, 
        gordura: true, mlg: true, ossos: true, massaMuscular: true 
      } 
    },
    symmetry: { 
      items: { Coxa: true, Panturrilha: true, Braço: true } 
    },
    relations: { 
      items: { 'Coxa / Fêmur': true, 'Panturrilha / Tornozelo': true, 'Braço / Úmero': true } 
    },
    skinfolds: {
      items: { 
        tricepsRight: true, tricepsLeft: true, subscapular: true, chest: true, 
        midaxillary: true, suprailiac: true, abdominal: true, thighRight: true, 
        thighLeft: true, calfRight: true, calfLeft: true 
      }
    },
    circumferences: {
      items: {
        shoulder: true, chest: true, armRight: true, armLeft: true, waist: true, 
        hip: true, thighMidRight: true, thighMidLeft: true, calfRight: true, 
        calfLeft: true, wristRight: true, kneeRight: true, ankle: true
      }
    }
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    composition: true,
    symmetry: true,
    relations: true,
    skinfolds: false,
    circumferences: false
  });

  if (!isOpen) return null;

  const toggleSectionExpand = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleAllInSection = (section: keyof typeof selections, value: boolean) => {
    setSelections(prev => {
      const newItems = { ...prev[section].items };
      Object.keys(newItems).forEach(key => {
        (newItems as any)[key] = value;
      });
      return {
        ...prev,
        [section]: { ...prev[section], items: newItems }
      };
    });
  };

  const toggleItem = (section: keyof typeof selections, itemKey: string) => {
    setSelections(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        items: {
          ...prev[section].items,
          [itemKey]: !(prev[section].items as any)[itemKey]
        }
      }
    }));
  };

  const isAnySelected = (section: keyof typeof selections) => {
    return Object.values(selections[section].items).some(v => v);
  };

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

      const elements = reportRef.current.querySelectorAll(selectors.join(','));
      
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

  const calculateAge = (birthDateStr: string | undefined, evalDateStr: string | undefined) => {
    if (!birthDateStr || !evalDateStr) return 0;
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


  const formatNumber = (val: any) => {
    if (val === null || val === undefined || isNaN(val) || typeof val !== 'number' || val <= 0) return '-';
    return val.toFixed(2).replace('.', ',');
  };

  const getDiff = (cur?: number, cmp?: number, unit?: string) => {
    if (cur === undefined || cur === null || cmp === undefined || cmp === null) return '-';
    const diff = cur - cmp;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${formatNumber(diff)} ${unit || ''}`.trim();
  };

  const renderTableSection = (title: string, items: { label: string, cur?: number, cmp?: number, unit: string }[]) => (
    <div className="report-section">
      <div className="report-section-card">
        <div className="report-section-header">
          <h3 className="report-section-title">{title}</h3>
        </div>
        <div className="report-section-body">
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
                  <td className={!item.cur || item.cur <= 0 ? 'is-na' : ''}>{formatNumber(item.cur)} {item.cur != null && item.cur > 0 ? item.unit : ''}</td>
                  <td className={!item.cmp || item.cmp <= 0 ? 'is-na' : ''}>{formatNumber(item.cmp)} {item.cmp != null && item.cmp > 0 ? item.unit : ''}</td>
                  <td>{getDiff(item.cur, item.cmp, item.unit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );


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
              <div className="report-loader-container">
                <div className="report-spinner"></div>
                <h3>Gerando Relatório PDF</h3>
                <p>Processando imagens e tabelas... Isso pode levar alguns segundos.</p>
              </div>
            </div>
          )}

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

            <div className="report-sections-manager">
              <h3>Conteúdo do Relatório</h3>
              
              {/* Composição Corporal */}
              <div className={`section-control ${expandedSections.composition ? 'expanded' : ''}`}>
                <div className="section-control-header" onClick={() => toggleSectionExpand('composition')}>
                  <div className="section-title-with-badge">
                    <strong>Composição Corporal</strong>
                    {isAnySelected('composition') && <span className="selection-badge">{Object.values(selections.composition.items).filter(v => v).length}</span>}
                  </div>
                  <div className="section-header-actions">
                    <button className="btn-text" onClick={e => { e.stopPropagation(); toggleAllInSection('composition', !Object.values(selections.composition.items).every(v => v)); }}>
                      {Object.values(selections.composition.items).every(v => v) ? 'Nenhum' : 'Todos'}
                    </button>
                    {expandedSections.composition ? <ChevronRight size={16} className="rotate-90" /> : <ChevronRight size={16} />}
                  </div>
                </div>
                {expandedSections.composition && (
                  <div className="items-control">
                    {[
                      { id: 'peso', label: 'Peso' }, { id: 'altura', label: 'Altura' },
                      { id: 'percentualGordura', label: '% Gordura' }, { id: 'sumDobras', label: 'Soma Dobras' },
                      { id: 'gordura', label: 'Massa Gorda' }, { id: 'mlg', label: 'MLG' },
                      { id: 'ossos', label: 'Massa Óssea' }, { id: 'massaMuscular', label: 'Massa Muscular' }
                    ].map(item => (
                      <label key={item.id} className="item-checkbox">
                        <input type="checkbox" checked={(selections.composition.items as any)[item.id]} onChange={() => toggleItem('composition', item.id)} />
                        {item.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Simetria */}
              <div className={`section-control ${expandedSections.symmetry ? 'expanded' : ''}`}>
                <div className="section-control-header" onClick={() => toggleSectionExpand('symmetry')}>
                  <div className="section-title-with-badge">
                    <strong>Simetria</strong>
                    {isAnySelected('symmetry') && <span className="selection-badge">{Object.values(selections.symmetry.items).filter(v => v).length}</span>}
                  </div>
                  <div className="section-header-actions">
                    <button className="btn-text" onClick={e => { e.stopPropagation(); toggleAllInSection('symmetry', !Object.values(selections.symmetry.items).every(v => v)); }}>
                      {Object.values(selections.symmetry.items).every(v => v) ? 'Nenhum' : 'Todos'}
                    </button>
                    {expandedSections.symmetry ? <ChevronRight size={16} className="rotate-90" /> : <ChevronRight size={16} />}
                  </div>
                </div>
                {expandedSections.symmetry && (
                  <div className="items-control">
                    {['Coxa', 'Panturrilha', 'Braço'].map(item => (
                      <label key={item} className="item-checkbox">
                        <input type="checkbox" checked={(selections.symmetry.items as any)[item]} onChange={() => toggleItem('symmetry', item)} />
                        {item}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Relações */}
              <div className={`section-control ${expandedSections.relations ? 'expanded' : ''}`}>
                <div className="section-control-header" onClick={() => toggleSectionExpand('relations')}>
                  <div className="section-title-with-badge">
                    <strong>Relações</strong>
                    {isAnySelected('relations') && <span className="selection-badge">{Object.values(selections.relations.items).filter(v => v).length}</span>}
                  </div>
                  <div className="section-header-actions">
                    <button className="btn-text" onClick={e => { e.stopPropagation(); toggleAllInSection('relations', !Object.values(selections.relations.items).every(v => v)); }}>
                      {Object.values(selections.relations.items).every(v => v) ? 'Nenhum' : 'Todos'}
                    </button>
                    {expandedSections.relations ? <ChevronRight size={16} className="rotate-90" /> : <ChevronRight size={16} />}
                  </div>
                </div>
                {expandedSections.relations && (
                  <div className="items-control">
                    {['Coxa / Fêmur', 'Panturrilha / Tornozelo', 'Braço / Úmero'].map(item => (
                      <label key={item} className="item-checkbox">
                        <input type="checkbox" checked={(selections.relations.items as any)[item]} onChange={() => toggleItem('relations', item)} />
                        {item}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Dobras */}
              <div className={`section-control ${expandedSections.skinfolds ? 'expanded' : ''}`}>
                <div className="section-control-header" onClick={() => toggleSectionExpand('skinfolds')}>
                  <div className="section-title-with-badge">
                    <strong>Dobras Cutâneas</strong>
                    {isAnySelected('skinfolds') && <span className="selection-badge">{Object.values(selections.skinfolds.items).filter(v => v).length}</span>}
                  </div>
                  <div className="section-header-actions">
                    <button className="btn-text" onClick={e => { e.stopPropagation(); toggleAllInSection('skinfolds', !Object.values(selections.skinfolds.items).every(v => v)); }}>
                      {Object.values(selections.skinfolds.items).every(v => v) ? 'Nenhum' : 'Todos'}
                    </button>
                    {expandedSections.skinfolds ? <ChevronRight size={16} className="rotate-90" /> : <ChevronRight size={16} />}
                  </div>
                </div>
                {expandedSections.skinfolds && (
                  <div className="items-control">
                    {[
                      { id: 'tricepsRight', label: 'Tríceps D.' }, { id: 'tricepsLeft', label: 'Tríceps E.' },
                      { id: 'subscapular', label: 'Subesc.' }, { id: 'chest', label: 'Tórax' },
                      { id: 'midaxillary', label: 'Subax.' }, { id: 'suprailiac', label: 'Supra-ilí.' },
                      { id: 'abdominal', label: 'Abd.' }, { id: 'thighRight', label: 'Coxa D.' },
                      { id: 'thighLeft', label: 'Coxa E.' }, { id: 'calfRight', label: 'Pantu. D.' },
                      { id: 'calfLeft', label: 'Pantu. E.' }
                    ].map(item => (
                      <label key={item.id} className="item-checkbox">
                        <input type="checkbox" checked={(selections.skinfolds.items as any)[item.id]} onChange={() => toggleItem('skinfolds', item.id)} />
                        {item.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Circunferências */}
              <div className={`section-control ${expandedSections.circumferences ? 'expanded' : ''}`}>
                <div className="section-control-header" onClick={() => toggleSectionExpand('circumferences')}>
                  <div className="section-title-with-badge">
                    <strong>Circunferências</strong>
                    {isAnySelected('circumferences') && <span className="selection-badge">{Object.values(selections.circumferences.items).filter(v => v).length}</span>}
                  </div>
                  <div className="section-header-actions">
                    <button className="btn-text" onClick={e => { e.stopPropagation(); toggleAllInSection('circumferences', !Object.values(selections.circumferences.items).every(v => v)); }}>
                      {Object.values(selections.circumferences.items).every(v => v) ? 'Nenhum' : 'Todos'}
                    </button>
                    {expandedSections.circumferences ? <ChevronRight size={16} className="rotate-90" /> : <ChevronRight size={16} />}
                  </div>
                </div>
                {expandedSections.circumferences && (
                  <div className="items-control">
                    {[
                      { id: 'shoulder', label: 'Ombro' }, { id: 'chest', label: 'Peitoral' },
                      { id: 'armRight', label: 'Braço D.' }, { id: 'armLeft', label: 'Braço E.' },
                      { id: 'waist', label: 'Cintura' }, { id: 'hip', label: 'Quadril' },
                      { id: 'thighMidRight', label: 'Medial D.' }, { id: 'thighMidLeft', label: 'Medial E.' },
                      { id: 'calfRight', label: 'Pantu. D.' }, { id: 'calfLeft', label: 'Pantu. E.' },
                      { id: 'wristRight', label: 'D. Punho' }, { id: 'kneeRight', label: 'D. Joelho' },
                      { id: 'ankle', label: 'D. Torno.' }
                    ].map(item => (
                      <label key={item.id} className="item-checkbox">
                        <input type="checkbox" checked={(selections.circumferences.items as any)[item.id]} onChange={() => toggleItem('circumferences', item.id)} />
                        {item.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
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

              {/* COMPOSIÇÃO CORPORAL (PAG 1) */}
              {isAnySelected('composition') && (
                <div className="report-section">
                  <div className="report-section-card">
                    <div className="report-section-header">
                      <h3 className="report-section-title">Composição Corporal</h3>
                    </div>
                    <div className="report-section-body" style={{ padding: '20px' }}>
                      {currentMetrics && (
                        <div className="report-metrics-summary">
                          {[
                            { id: 'peso', label: 'Peso Corporal', key: 'peso', unit: 'kg', icon: <Scale size={18} /> },
                            { id: 'altura', label: 'Altura', key: 'altura', unit: 'cm', icon: <Ruler size={18} /> },
                            { id: 'percentualGordura', label: '% Gordura', key: 'percentualGordura', unit: '%', icon: <Percent size={18} /> },
                            { id: 'sumDobras', label: 'Soma das Dobras', key: 'sumDobras', unit: 'mm', icon: <Activity size={18} /> },
                            { id: 'gordura', label: 'Massa Gorda', key: 'gordura', unit: 'kg', icon: <Shield size={18} /> },
                            { id: 'mlg', label: 'Massa Livre Gord.', key: 'mlg', unit: 'kg', icon: <Dumbbell size={18} /> },
                            { id: 'ossos', label: 'Massa Óssea', key: 'ossos', unit: 'kg', icon: <Shield size={18} /> },
                            { id: 'massaMuscular', label: 'Massa Muscular', key: 'massaMuscular', unit: 'kg', icon: <Dumbbell size={18} /> },
                          ].filter(m => (selections.composition.items as any)[m.id]).map((m) => {
                            const curVal = currentMetrics[m.key];
                            const cmpVal = compareMetrics ? compareMetrics[m.key] : undefined;
                            const diff = cmpVal !== undefined ? curVal - cmpVal : 0;
                            const trendClass = diff > 0 ? 'trend-up' : diff < 0 ? 'trend-down' : 'trend-neutral';
                            const TrendIcon = diff > 0 ? ArrowUpRight : ArrowDownRight;
                            const isNA = !curVal || curVal <= 0;
                            
                            return (
                              <div key={m.key} className={`report-metric-box ${isNA ? 'is-na' : ''}`}>
                                <div className="report-metric-header">
                                  <div className="report-metric-icon-wrapper">
                                    {m.icon}
                                  </div>
                                  <span className="report-metric-label">{m.label}</span>
                                </div>
                                
                                <div className="report-metric-body">
                                  <span className="report-metric-value">{formatNumber(curVal)}</span>
                                  <span className="report-metric-unit">{m.unit}</span>
                                </div>

                                <div className="report-metric-footer">
                                  {compareMetrics && curVal != null && cmpVal != null && diff !== 0 ? (
                                    <span className={`report-metric-trend ${trendClass}`}>
                                      <TrendIcon size={12} />
                                      {formatNumber(diff)}
                                    </span>
                                  ) : <span />}
                                  <span style={{ fontSize: '6pt', color: '#94a3b8' }}>vs. anterior</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SIMETRIA (PAG 2) */}
              {isAnySelected('symmetry') && (
                <div className="report-section">
                  <div className="report-section-card">
                    <div className="report-section-header">
                      <h3 className="report-section-title">Índices de Simetria (Medidas Corrigidas)</h3>
                    </div>
                    <div className="report-section-body" style={{ padding: '20px' }}>
                      <div className="report-symmetry-container">
                        {[
                          { label: 'Coxa', data: currentMetrics?.simetria?.coxa },
                          { label: 'Panturrilha', data: currentMetrics?.simetria?.pantu },
                          { label: 'Braço', data: currentMetrics?.simetria?.braco }
                        ].filter(item => (selections.symmetry.items as any)[item.label]).map((item, idx) => {
                          const isD_NA = !item.data?.d || item.data?.d <= 0;
                          const isE_NA = !item.data?.e || item.data?.e <= 0;
                          const isDiff_NA = isD_NA || isE_NA;
                          
                          return (
                            <div key={idx} className="report-metrics-summary grid-3" style={{ marginBottom: idx === 2 ? 0 : '15px' }}>
                              <div className={`report-metric-box ${isD_NA ? 'is-na' : ''}`}>
                                <div className="report-metric-header">
                                  <div className="report-metric-icon-wrapper"><Ruler size={14} /></div>
                                  <span className="report-metric-label">C/C {item.label} D</span>
                                </div>
                                <div className="report-metric-body">
                                  <span className="report-metric-value">{formatNumber(item.data?.d)}</span>
                                  <span className="report-metric-unit">cm</span>
                                </div>
                                <div className="report-metric-footer"><span style={{ fontSize: '6pt', color: '#94a3b8' }}>Lado Direito</span></div>
                              </div>
                              
                              <div className={`report-metric-box ${isE_NA ? 'is-na' : ''}`}>
                                <div className="report-metric-header">
                                  <div className="report-metric-icon-wrapper"><Ruler size={14} /></div>
                                  <span className="report-metric-label">C/C {item.label} E</span>
                                </div>
                                <div className="report-metric-body">
                                  <span className="report-metric-value">{formatNumber(item.data?.e)}</span>
                                  <span className="report-metric-unit">cm</span>
                                </div>
                                <div className="report-metric-footer"><span style={{ fontSize: '6pt', color: '#94a3b8' }}>Lado Esquerdo</span></div>
                              </div>
                              
                              <div className={`report-metric-box ${isDiff_NA ? 'is-na' : ''}`}>
                                <div className="report-metric-header">
                                  <div className="report-metric-icon-wrapper"><Activity size={14} /></div>
                                  <span className="report-metric-label">Diferença D/E</span>
                                </div>
                                <div className="report-metric-body">
                                  <span className="report-metric-value">{(item.data?.d ?? 0) > (item.data?.e ?? 0) ? '+' : ''}{formatNumber(item.data?.diff)}</span>
                                  <span className="report-metric-unit">cm</span>
                                </div>
                                <div className="report-metric-footer"><span style={{ fontSize: '6pt', color: '#94a3b8' }}>Assimetria</span></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* RELAÇÕES (PAG 3) */}
              {isAnySelected('relations') && (
                <div className="report-section">
                  <div className="report-section-card">
                    <div className="report-section-header">
                      <h3 className="report-section-title">Relação Cineantropométrica</h3>
                    </div>
                    <div className="report-section-body" style={{ padding: '20px' }}>
                      <div className="report-relations-container">
                        {[
                          { label: 'Coxa / Fêmur', titleMedia: 'Coxa', titleOsso: 'Fêmur', media: currentMetrics?.relacao?.ccCoxa, osso: currentMetrics?.relacao?.diamJoelho, relacao: currentMetrics?.relacao?.coxa },
                          { label: 'Panturrilha / Tornozelo', titleMedia: 'Pantu.', titleOsso: 'Tornozelo', media: currentMetrics?.relacao?.ccPantu, osso: currentMetrics?.relacao?.diamTornozelo, relacao: currentMetrics?.relacao?.pantu },
                          { label: 'Braço / Úmero', titleMedia: 'Braço', titleOsso: 'Úmero', media: currentMetrics?.relacao?.ccBraco, osso: currentMetrics?.relacao?.diamPunho, relacao: currentMetrics?.relacao?.braco }
                        ].filter(item => (selections.relations.items as any)[item.label]).map((item, idx) => {
                          const isMedia_NA = !item.media || item.media <= 0;
                          const isOsso_NA = !item.osso || item.osso <= 0;
                          const isRel_NA = isMedia_NA || isOsso_NA;
                          
                          return (
                            <div key={idx} className="report-metrics-summary grid-3" style={{ marginBottom: idx === 2 ? 0 : '15px' }}>
                              <div className={`report-metric-box ${isMedia_NA ? 'is-na' : ''}`}>
                                <div className="report-metric-header">
                                  <div className="report-metric-icon-wrapper"><Ruler size={14} /></div>
                                  <span className="report-metric-label">Média {item.titleMedia}</span>
                                </div>
                                <div className="report-metric-body">
                                  <span className="report-metric-value">{formatNumber(item.media)}</span>
                                  <span className="report-metric-unit">cm</span>
                                </div>
                                <div className="report-metric-footer"><span style={{ fontSize: '6pt', color: '#94a3b8' }}>Média Corrigida</span></div>
                              </div>
                              
                              <div className={`report-metric-box ${isOsso_NA ? 'is-na' : ''}`}>
                                <div className="report-metric-header">
                                  <div className="report-metric-icon-wrapper"><Shield size={14} /></div>
                                  <span className="report-metric-label">Osso {item.titleOsso}</span>
                                </div>
                                <div className="report-metric-body">
                                  <span className="report-metric-value">{formatNumber(item.osso)}</span>
                                  <span className="report-metric-unit">cm</span>
                                </div>
                                <div className="report-metric-footer"><span style={{ fontSize: '6pt', color: '#94a3b8' }}>Diâmetro Ósseo</span></div>
                              </div>
                              
                              <div className={`report-metric-box ${isRel_NA ? 'is-na' : ''}`}>
                                <div className="report-metric-header">
                                  <div className="report-metric-icon-wrapper"><Activity size={14} /></div>
                                  <span className="report-metric-label">Relação</span>
                                </div>
                                <div className="report-metric-body">
                                  <span className="report-metric-value">{formatNumber(item.relacao)}</span>
                                  <span className="report-metric-unit">índice</span>
                                </div>
                                <div className="report-metric-footer"><span style={{ fontSize: '6pt', color: '#94a3b8' }}>Índice Cine.</span></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TABLES (END) */}
              {isAnySelected('skinfolds') && renderTableSection('Dobras Cutâneas', [
                { id: 'tricepsRight', label: 'Tríceps Dir.', cur: currentEval?.skinfolds?.tricepsRight, cmp: compareEval?.skinfolds?.tricepsRight, unit: 'mm' },
                { id: 'tricepsLeft', label: 'Tríceps Esq.', cur: currentEval?.skinfolds?.tricepsLeft, cmp: compareEval?.skinfolds?.tricepsLeft, unit: 'mm' },
                { id: 'subscapular', label: 'Subescapular', cur: currentEval?.skinfolds?.subscapular, cmp: compareEval?.skinfolds?.subscapular, unit: 'mm' },
                { id: 'chest', label: 'Tórax', cur: currentEval?.skinfolds?.chest, cmp: compareEval?.skinfolds?.chest, unit: 'mm' },
                { id: 'midaxillary', label: 'Subaxilar', cur: currentEval?.skinfolds?.midaxillary, cmp: compareEval?.skinfolds?.midaxillary, unit: 'mm' },
                { id: 'suprailiac', label: 'Supra-ilíaca', cur: currentEval?.skinfolds?.suprailiac, cmp: compareEval?.skinfolds?.suprailiac, unit: 'mm' },
                { id: 'abdominal', label: 'Abdominal', cur: currentEval?.skinfolds?.abdominal, cmp: compareEval?.skinfolds?.abdominal, unit: 'mm' },
                { id: 'thighRight', label: 'Coxa Dir.', cur: currentEval?.skinfolds?.thighRight, cmp: compareEval?.skinfolds?.thighRight, unit: 'mm' },
                { id: 'thighLeft', label: 'Coxa Esq.', cur: currentEval?.skinfolds?.thighLeft, cmp: compareEval?.skinfolds?.thighLeft, unit: 'mm' },
                { id: 'calfRight', label: 'Panturrilha Dir.', cur: currentEval?.skinfolds?.calfRight, cmp: compareEval?.skinfolds?.calfRight, unit: 'mm' },
                { id: 'calfLeft', label: 'Panturrilha Esq.', cur: currentEval?.skinfolds?.calfLeft, cmp: compareEval?.skinfolds?.calfLeft, unit: 'mm' }
              ].filter(item => (selections.skinfolds.items as any)[item.id]))}

              {isAnySelected('circumferences') && renderTableSection('Circunferências', [
                { id: 'shoulder', label: 'Ombro', cur: currentEval?.circumferences?.shoulder, cmp: compareEval?.circumferences?.shoulder, unit: 'cm' },
                { id: 'chest', label: 'Peitoral', cur: currentEval?.circumferences?.chest, cmp: compareEval?.circumferences?.chest, unit: 'cm' },
                { id: 'armRight', label: 'Braço Dir.', cur: currentEval?.circumferences?.armRight, cmp: compareEval?.circumferences?.armRight, unit: 'cm' },
                { id: 'armLeft', label: 'Braço Esq.', cur: currentEval?.circumferences?.armLeft, cmp: compareEval?.circumferences?.armLeft, unit: 'cm' },
                { id: 'waist', label: 'Cintura', cur: currentEval?.circumferences?.waist, cmp: compareEval?.circumferences?.waist, unit: 'cm' },
                { id: 'hip', label: 'Quadril', cur: currentEval?.circumferences?.hip, cmp: compareEval?.circumferences?.hip, unit: 'cm' },
                { id: 'thighMidRight', label: 'Medial Dir.', cur: currentEval?.circumferences?.thighMidRight, cmp: compareEval?.circumferences?.thighMidRight, unit: 'cm' },
                { id: 'thighMidLeft', label: 'Medial Esq.', cur: currentEval?.circumferences?.thighMidLeft, cmp: compareEval?.circumferences?.thighMidLeft, unit: 'cm' },
                { id: 'calfRight', label: 'Panturrilha Dir.', cur: currentEval?.circumferences?.calfRight, cmp: compareEval?.circumferences?.calfRight, unit: 'cm' },
                { id: 'calfLeft', label: 'Panturrilha Esq.', cur: currentEval?.circumferences?.calfLeft, cmp: compareEval?.circumferences?.calfLeft, unit: 'cm' },
                { id: 'wristRight', label: 'D. Punho', cur: currentEval?.circumferences?.wristRight, cmp: compareEval?.circumferences?.wristRight, unit: 'cm' },
                { id: 'kneeRight', label: 'D. Joelho', cur: currentEval?.circumferences?.kneeRight, cmp: compareEval?.circumferences?.kneeRight, unit: 'cm' },
                { id: 'ankle', label: 'D. Tornozelo', cur: (currentEval?.circumferences as any)?.ankle, cmp: (compareEval?.circumferences as any)?.ankle, unit: 'cm' }
              ].filter(item => (selections.circumferences.items as any)[item.id]))}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
