import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAthletes } from '../hooks/useAthletes';
import type { AthleteSpreadsheetImportViewModel } from '../types/api';
import { useSports } from '../contexts/SportContext';
import './ImportExcelModal.css';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (firstAthleteId?: string) => void;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { importAthletes } = useAthletes();
  const { sports } = useSports();
  
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [sportName, setSportName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<AthleteSpreadsheetImportViewModel | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setError(null);
      setSuccess(false);
      setIsProcessing(false);
      setSportName('');
      setImportResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    setSelectedFile(file);
    setError(null);
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

  const handleImport = async () => {
    if (!selectedFile || !sportName.trim()) {
      setError("Por favor, selecione um esporte e um arquivo.");
      return;
    }
    setIsProcessing(true);
    setError(null);

    try {
      const result = await importAthletes(sportName.trim(), selectedFile);
      setImportResult(result);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 3000);

    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.title || "Ocorreu um erro ao salvar os dados.");
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelAndReset = () => {
    setSelectedFile(null);
    setError(null);
    setSportName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="import-modal-overlay" onClick={onClose}>
      <div className="import-modal-content" onClick={(e) => e.stopPropagation()}>
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
          <div className="import-error-banner" style={{ margin: '0 1.5rem 1rem' }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success ? (
          <div className="import-summary" style={{ textAlign: 'center', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <div className="success-icon-container" style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '50%', color: '#15803d' }}>
              <CheckCircle2 size={48} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h3 style={{ color: 'var(--color-text-main)', margin: 0, fontSize: '1.5rem' }}>Importação Finalizada!</h3>
              <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>A planilha foi processada com sucesso.</p>
            </div>
            
            {importResult && (
              <div className="import-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', width: '100%', maxWidth: '400px' }}>
                <div className="stat-item" style={{ backgroundColor: 'var(--color-bg-page)', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>{importResult.createdAthletes}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Atletas Criados</span>
                </div>
                <div className="stat-item" style={{ backgroundColor: 'var(--color-bg-page)', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>{importResult.importedAssessments}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Avaliações</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              <Loader2 size={16} className="spinner" />
              <span>Redirecionando para o dashboard...</span>
            </div>
          </div>
        ) : (
          <div className="import-flow-container">
            <div className="import-form-section" style={{ padding: '0 1.5rem 1.5rem' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                Esporte
              </label>
              <div className="sport-input-group" style={{ position: 'relative' }}>
                <input 
                  type="text"
                  list="sports-list"
                  className="form-input"
                  placeholder="Selecione ou digite o nome do esporte..."
                  value={sportName}
                  onChange={(e) => setSportName(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-page)' }}
                />
                <datalist id="sports-list">
                  {sports.map(s => <option key={s.id} value={s.name} />)}
                </datalist>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                  Você pode escolher um esporte existente ou cadastrar um novo apenas digitando o nome.
                </p>
              </div>
            </div>

            <div 
              className={`import-dropzone ${isDragging ? 'drag-active' : ''} ${selectedFile ? 'file-selected' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              style={{ margin: '0 1.5rem 1.5rem', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".xlsx, .xls" 
                style={{ display: 'none' }} 
                disabled={isProcessing}
              />
              <div className="import-dropzone-icon">
                {isProcessing ? (
                  <Loader2 size={32} className="spinner" />
                ) : selectedFile ? (
                  <CheckCircle2 size={32} style={{ color: 'var(--color-primary)' }} />
                ) : (
                  <Upload size={32} />
                )}
              </div>
              <p className="import-dropzone-text">
                {isProcessing ? 'Enviando para o servidor...' : selectedFile ? selectedFile.name : 'Arraste e solte o arquivo Excel aqui'}
              </p>
              {!isProcessing && !selectedFile && (
                <p className="import-dropzone-subtext">ou clique para procurar (.xlsx ou .xls)</p>
              )}
            </div>

            <div className="import-modal-actions" style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={selectedFile ? cancelAndReset : onClose}
                disabled={isProcessing}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                {selectedFile ? 'Trocar Arquivo' : 'Cancelar'}
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleImport}
                disabled={isProcessing || !selectedFile || !sportName.trim()}
                style={{ minWidth: '180px', padding: '0.75rem 1.5rem' }}
              >
                {isProcessing ? <Loader2 size={20} className="spinner" /> : <FileSpreadsheet size={20} />}
                {isProcessing ? 'Processando...' : 'Iniciar Importação'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
