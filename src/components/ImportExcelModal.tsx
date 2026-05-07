import React, { useRef, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { X, Upload, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import { useAthletes } from '../hooks/useAthletes';
import { useAssessments } from '../hooks/useAssessments';
import type { Athlete } from '../types/athlete';
import type { Assessment } from '../types/assessment';
import './ImportExcelModal.css';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (firstAthleteId?: string) => void;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { athletes, addAthlete } = useAthletes();
  const { assessments: existingAssessments, addAssessment, updateAssessment } = useAssessments();
  
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  const [parsedData, setParsedData] = useState<{
    athletes: Map<string, Omit<Athlete, 'id'>>;
    assessments: { athleteName: string, data: Omit<Assessment, 'id' | 'athleteId'> }[];
    rawRows: any[];
    headers: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setParsedData(null);
      setError(null);
      setSuccess(false);
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const num = (val: any) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const excelDateToJSDate = (serial: any) => {
    if (!serial) return '';
    if (serial instanceof Date) {
      if (isNaN(serial.getTime())) return '';
      return serial.toISOString().split('T')[0];
    }
    if (typeof serial === 'number') {
      // Excel serial date (days since 1899-12-30)
      const utc_days = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      if (isNaN(date_info.getTime())) return '';
      return date_info.toISOString().split('T')[0];
    }
    if (typeof serial === 'string') {
      if (serial.includes('/')) {
        const parts = serial.split('/');
        if (parts.length === 3) {
          // Assumes DD/MM/YYYY or similar based on parsing possibilities, try DD/MM/YYYY
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      const d = new Date(serial);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    }
    return '';
  };

  const processFile = (file: File) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Defval: '' para preencher colunas vazias, facilitando leitura e nao omitindo chaves
        const rows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

        if (rows.length === 0) {
          throw new Error("O arquivo parece estar vazio.");
        }

        const normalizeStr = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s.]+/g, "");
        
        const getRowVal = (row: any, ...possibleKeys: string[]) => {
          // 1. Tentar match exato primeiro (evita falsos positivos onde Pantu D e Pantu. D convergem pra pantud no fuzzy)
          for (const targetKey of possibleKeys) {
            if (targetKey in row) {
              return row[targetKey];
            }
          }
          
          // 2. Fallback de Fuzzy Match apenas se a coluna exata nao existir
          const rowKeys = Object.keys(row);
          for (const targetKey of possibleKeys) {
            const normTarget = normalizeStr(targetKey);
            const foundKey = rowKeys.find(rk => normalizeStr(rk) === normTarget);
            if (foundKey !== undefined) return row[foundKey];
          }
          return ''; 
        };

        const normalizeGender = (val: string): string => {
          const v = val.trim().toLowerCase();
          if (v === 'h' || v === 'm') return 'Masculino';
          if (v === 'f') return 'Feminino';
          if (v === 'masculino') return 'Masculino';
          if (v === 'feminino') return 'Feminino';
          return val.trim();
        };

        const normalizeRace = (val: string): string => {
          const v = val.trim().toLowerCase();
          if (v === 'b') return 'Branco';
          if (v === 'n') return 'Negro';
          if (v === 'a') return 'Asiático';
          return val.trim();
        };

        const athletesMap = new Map<string, Omit<Athlete, 'id'>>();
        const assessmentsList: { athleteName: string, data: Omit<Assessment, 'id' | 'athleteId'> }[] = [];

        rows.forEach((row) => {
          const name = String(row['Nome'] || '').trim();
          if (!name) return; // Ignora linhas sem nome

          if (!athletesMap.has(name)) {
            let obs = '';
            const setor = String(row['Setor'] || '').trim();
            const pos = String(row['Posição'] || '').trim();
            if (setor && pos) obs = `${setor} - ${pos}`;
            else if (setor) obs = setor;
            else if (pos) obs = pos;

            let phase = String(row['Fase'] || '').trim();
            const phaseLower = phase.toLowerCase();
            if (phaseLower === 'competitiva') {
              phase = 'Competição';
            } else if (phaseLower === 'pré-competitiva' || phaseLower === 'pre-competitiva') {
              phase = 'Pré-temporada';
            }

            athletesMap.set(name, {
              name: name,
              gender: normalizeGender(String(row['Sexo'] || '')),
              race: normalizeRace(String(row['Raça'] || '')),
              category: String(row['Categoria'] || ''),
              birthDate: excelDateToJSDate(row['Nascimento']),
              competitivePhase: phase,
              sport: 'Futebol',
              sportObservation: obs,
            });
          }

          // Monta assessment
          const evaluationDate = excelDateToJSDate(row['Data avaliação']);
          // Pula se por acaso nao tiver data (embora pudesse criar sem, melhor requerer data mínima, ou deixar hj)
          
          assessmentsList.push({
            athleteName: name,
            data: {
              date: evaluationDate || new Date().toISOString().split('T')[0],
              weight: num(row['Peso']),
              height: num(row['Altura']),
              sittingHeight: num(row['Altura sentado']),
              skinfolds: {
                tricepsRight: num(getRowVal(row, 'Tricep D.', 'Triceps D', 'Tríceps Dir')),
                tricepsLeft: num(getRowVal(row, 'Tricep E.', 'Triceps E', 'Tríceps Esq')),
                subscapular: num(getRowVal(row, 'Sub esc', 'Subescapular')),
                chest: num(getRowVal(row, 'Torax', 'Tórax')),
                midaxillary: num(getRowVal(row, 'Sub. Axi', 'Sub. Axilar', 'Subaxilar')),
                suprailiac: num(getRowVal(row, 'Supra. lli', 'Supra. ili', 'Supra-ilíaca', 'Supra iliaca')),
                abdominal: num(getRowVal(row, 'abd', 'Abdominal')),
                thighRight: num(getRowVal(row, 'Coxa D', 'D. Coxa D', 'Coxa Dir', 'Dobra Coxa Direita')),
                thighLeft: num(getRowVal(row, 'Coxa E', 'D. Coxa E', 'Coxa Esq', 'Dobra Coxa Esquerda')),
                calfRight: num(getRowVal(row, 'Pantu D', 'D. Pantu D', 'Dobra Panturrilha Dir')),
                calfLeft: num(getRowVal(row, 'Pantu E', 'D. Pantu E', 'Dobra Panturrilha Esq'))
              },
              circumferences: {
                shoulder: num(getRowVal(row, 'C. ombro', 'Ombro', 'C. Ombro')),
                chest: num(getRowVal(row, 'C.Peitoral', 'Peitoral', 'C. Peitoral')),
                armRight: num(getRowVal(row, 'C.Braço D.', 'C. Braço Dir')),
                armLeft: num(getRowVal(row, 'C.Braço E.', 'C. Braço Esq')),
                waist: num(getRowVal(row, 'C.Cintura', 'Cintura', 'C. Cintura')),
                hip: num(getRowVal(row, 'C.Quadril', 'Quadril', 'C. Quadril')),
                thighMidRight: num(getRowVal(row, 'C. Medial D', 'C. Coxa Dir')),
                thighMidLeft: num(getRowVal(row, 'C.Medial E', 'C. Coxa Esq')),
                calfRight: num(getRowVal(row, 'Pantu. D.', 'C. Pantu D', 'C. Panturrilha Dir')),
                calfLeft: num(getRowVal(row, 'Pantu. E.', 'C. Pantu E', 'C. Panturrilha Esq')),
                wristRight: num(getRowVal(row, 'D.Punho', 'D. Punho', 'Punho')),
                kneeRight: num(getRowVal(row, 'D.Joelho', 'D. Joelho', 'Joelho')),
                ankle: num(getRowVal(row, 'D.Tornozelo', 'D. Tornozelo', 'Tornozelo'))
              }
            }
          });
        });

        if (assessmentsList.length === 0) {
          throw new Error("Não foi possível encontrar dados válidos (A coluna 'Nome' é obrigatória).");
        }

        setParsedData({
          athletes: athletesMap,
          assessments: assessmentsList,
          rawRows: rows,
          headers: Object.keys(rows[0] || {})
        });

      } catch (err: any) {
        setError(err.message || "Erro ao processar arquivo. Verifique se o template está correto.");
        setParsedData(null);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setError("Erro ao ler o arquivo.");
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    // Sempre reseta o element.value para permitir que o usuário selecione o MESMO arquivo novamente sem bugar
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = () => {
    if (!parsedData) return;
    setIsProcessing(true);

    try {
      // 1. Resolve Atletas
      const nameToIdMap = new Map<string, string>();
      let firstAthleteId: string | undefined;

      parsedData.athletes.forEach((athleteData, name) => {
        const existingAthlete = athletes.find(a => a.name.toLowerCase() === name.toLowerCase());
        
        let athleteId = '';
        if (existingAthlete) {
          athleteId = existingAthlete.id;
        } else {
          athleteId = addAthlete(athleteData);
        }

        if (!firstAthleteId) firstAthleteId = athleteId;
        nameToIdMap.set(name, athleteId);
      });

      // 2. Resolve Avaliações
      parsedData.assessments.forEach(assessmentItem => {
        const athleteId = nameToIdMap.get(assessmentItem.athleteName);
        if (athleteId) {
          const assessmentDate = assessmentItem.data.date;
          
          // Busca avaliação existente para o mesmo atleta na mesma data
          const existingEval = existingAssessments.find(
            ea => ea.athleteId === athleteId && ea.date === assessmentDate
          );

          if (existingEval) {
            // Se já existe, atualiza
            updateAssessment(existingEval.id, assessmentItem.data);
          } else {
            // Se não existe, cria nova
            addAssessment({
              ...assessmentItem.data,
              athleteId
            });
          }
        }
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess(firstAthleteId);
      }, 1500);

    } catch (err) {
      setError("Ocorreu um erro ao salvar os dados.");
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelAndReset = () => {
    setParsedData(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="import-modal-overlay" onClick={onClose}>
      <div className={`import-modal-content ${parsedData ? 'modal-expanded' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="import-modal-header">
          <h2 className="import-modal-title">
            <FileSpreadsheet className="text-primary" /> 
            Importar Histórico (Excel)
          </h2>
          <button className="close-btn" onClick={onClose} disabled={isProcessing}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="import-error-banner">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success ? (
          <div className="import-summary" style={{ textAlign: 'center', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Loader2 size={40} className="import-spinner" style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
            <h3 style={{ color: 'var(--color-text-main)', margin: 0, fontSize: '1.25rem' }}>Importação Concluída!</h3>
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Carregando dashboard do atleta...</p>
          </div>
        ) : (
          !parsedData ? (
            <div 
              className={`import-dropzone ${isDragging ? 'drag-active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".xlsx, .xls" 
                style={{ display: 'none' }} 
              />
              <div className="import-dropzone-icon">
                {isProcessing ? <Loader2 size={32} className="spinner" /> : <Upload size={32} />}
              </div>
              <p className="import-dropzone-text">
                {isProcessing ? 'Processando arquivo...' : 'Arraste e solte o arquivo Excel aqui'}
              </p>
              {!isProcessing && (
                <p className="import-dropzone-subtext">ou clique para procurar no seu computador (.xlsx ou .xls)</p>
              )}
            </div>
          ) : (
            <>
              <div className="import-success-layout">
                {/* Lado Esquerdo - Resumo */}
                <div className="import-summary-side">
                  <div className="import-summary">
                    <h3 className="import-summary-title">Resumo dos Dados Encontrados</h3>
                    <div className="import-summary-grid">
                      <div className="import-summary-item" style={{ padding: '1rem' }}>
                        <span className="import-summary-value">{parsedData.athletes.size}</span>
                        <span className="import-summary-label">Atleta(s)</span>
                      </div>
                      <div className="import-summary-item" style={{ padding: '1rem' }}>
                        <span className="import-summary-value">{parsedData.assessments.length}</span>
                        <span className="import-summary-label">Avaliação(ões)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lado Direito - Tabela */}
                <div className="import-preview-side">
                  <div className="import-preview-table-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 className="import-preview-title">Pré-visualização</h4>
                      <span className="import-preview-badge">{parsedData.rawRows.length} linhas lidas</span>
                    </div>
                    <div className="import-preview-scroll">
                      <table className="import-preview-table">
                        <thead>
                          <tr>
                            {parsedData.headers.map((h, i) => <th key={i}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.rawRows.slice(0, 10).map((row, rIndex) => (
                            <tr key={rIndex}>
                              {parsedData.headers.map((h, cIndex) => {
                                let cellData = row[h];
                                if (cellData instanceof Date) {
                                  cellData = cellData.toLocaleDateString();
                                }
                                return <td key={cIndex}>{String(cellData !== undefined && cellData !== null ? cellData : '')}</td>;
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parsedData.rawRows.length > 10 && (
                      <p className="import-preview-more">Exibindo as primeiras 10 linhas...</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="import-modal-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={cancelAndReset}
                  disabled={isProcessing}
                >
                  Cancelar
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleImport}
                  disabled={isProcessing}
                  style={{ minWidth: '200px' }}
                >
                  {isProcessing ? <Loader2 size={20} className="spinner" /> : <FileSpreadsheet size={20} />}
                  Confirmar Importação
                </button>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};
