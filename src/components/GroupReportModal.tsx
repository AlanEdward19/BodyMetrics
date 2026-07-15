import { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import JSZip from 'jszip';
import { X, Download, CheckCircle2, Users as UsersIcon } from 'lucide-react';
import { Loading } from './Loading';
import { ReportPaper } from './ReportPaper';
import { ReportOptionsSidebar } from './ReportOptionsSidebar';
import { createDefaultReportSelections } from '../types/report';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generatePdfFromNode } from '../utils/pdfReport';
import { calculateMetrics } from '../utils/metrics';
import * as Mapper from '../utils/mapper';
import apiService from '../services/api.service';
import type { AthleteGroupViewModel } from '../types/api';
import type { Athlete } from '../types/athlete';
import type { Assessment } from '../types/assessment';
import './ReportModal.css';
import './GroupReportModal.css';

interface GroupReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: AthleteGroupViewModel;
}

interface RenderData {
  athlete: Athlete;
  currentEval?: Assessment;
  compareEval?: Assessment;
  currentMetrics: any;
  compareMetrics: any;
}

const sanitizeFileName = (name: string) => name.replace(/\s+/g, '_').replace(/[\\/:*?"<>|]/g, '');

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function GroupReportModal({ isOpen, onClose, group }: GroupReportModalProps) {
  const [logos, setLogos] = useLocalStorage<string[]>('@BodyMetrics:reportLogos', []);
  const [selections, setSelections] = useState(createDefaultReportSelections());
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    composition: true,
    symmetry: true,
    relations: true,
    skinfolds: false,
    circumferences: false
  });
  const [formula, setFormula] = useState<'pollock' | 'faulkner'>('pollock');

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [finished, setFinished] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [renderData, setRenderData] = useState<RenderData | null>(null);

  const hiddenReportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsGenerating(false);
      setProgress(null);
      setFinished(false);
      setSuccessCount(0);
      setSkipped([]);
      setRenderData(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (group.members.length === 0) return;

    setIsGenerating(true);
    setFinished(false);
    setSkipped([]);

    const zip = new JSZip();
    const skippedNames: string[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < group.members.length; i++) {
      const member = group.members[i];
      setProgress({ current: i + 1, total: group.members.length, name: member.fullName });

      try {
        const fullAthlete = await apiService.getAthleteById(member.id);
        const mappedAthlete = Mapper.mapNewToOldAthlete(fullAthlete);
        const assessments = fullAthlete.physicalAssessments
          .map(pa => Mapper.mapPhysicalAssessmentToAssessment(pa, fullAthlete.id))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (assessments.length === 0) {
          skippedNames.push(member.fullName);
          continue;
        }

        const currentEval = assessments[0];
        const compareEval = assessments[1];
        const currentMetrics = calculateMetrics(currentEval, mappedAthlete, formula);
        const compareMetrics = calculateMetrics(compareEval, mappedAthlete, formula);

        flushSync(() => {
          setRenderData({ athlete: mappedAthlete, currentEval, compareEval, currentMetrics, compareMetrics });
        });

        if (!hiddenReportRef.current) {
          skippedNames.push(member.fullName);
          continue;
        }

        const pdf = await generatePdfFromNode(hiddenReportRef.current);
        const blob = pdf.output('blob');

        let fileName = sanitizeFileName(member.fullName) || member.id;
        if (usedNames.has(fileName)) {
          let n = 2;
          while (usedNames.has(`${fileName}_${n}`)) n++;
          fileName = `${fileName}_${n}`;
        }
        usedNames.add(fileName);
        zip.file(`${fileName}.pdf`, blob);
      } catch (err) {
        console.error('Erro ao gerar relatório do atleta', member.fullName, err);
        skippedNames.push(member.fullName);
      }
    }

    setRenderData(null);

    if (usedNames.size > 0) {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `Relatorios_${sanitizeFileName(group.name)}_${new Date().toISOString().split('T')[0]}.zip`);
    }

    setSuccessCount(usedNames.size);
    setSkipped(skippedNames);
    setProgress(null);
    setIsGenerating(false);
    setFinished(true);
  };

  return (
    <div className="report-modal-overlay">
      <div className="report-modal-container">
        <div className="report-modal-header">
          <h2>Exportar Relatórios do Grupo</h2>
          <button className="btn-close" onClick={onClose} disabled={isGenerating}><X size={24} /></button>
        </div>

        <div className="report-modal-content">
          <ReportOptionsSidebar
            logos={logos}
            setLogos={setLogos}
            selections={selections}
            setSelections={setSelections}
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            footer={
              <>
                <div className="group-report-formula">
                  <label htmlFor="group-report-formula-select">Fórmula %G</label>
                  <select
                    id="group-report-formula-select"
                    value={formula}
                    onChange={e => setFormula(e.target.value as 'pollock' | 'faulkner')}
                    disabled={isGenerating}
                  >
                    <option value="pollock">Pollock</option>
                    <option value="faulkner">Faulkner</option>
                  </select>
                </div>
                <button
                  className="btn btn-primary w-full"
                  onClick={handleGenerate}
                  disabled={isGenerating || group.members.length === 0}
                >
                  {isGenerating ? 'Gerando...' : <><Download size={18} /> Baixar ZIP ({group.members.length})</>}
                </button>
              </>
            }
          />

          <div className="group-report-preview-area">
            {isGenerating && progress && (
              <Loading message={`Gerando relatório ${progress.current}/${progress.total}: ${progress.name}...`} />
            )}

            {!isGenerating && finished && (
              <div className="group-report-summary">
                <div className="group-report-summary-icon">
                  <CheckCircle2 size={48} />
                </div>
                <h3>Exportação concluída!</h3>
                <p>{successCount} de {group.members.length} relatório(s) gerado(s) e baixado(s) em .zip.</p>
                {skipped.length > 0 && (
                  <div className="group-report-skipped">
                    <p className="group-report-skipped-title">Sem avaliação cadastrada (ignorados):</p>
                    <ul>
                      {skipped.map(name => <li key={name}>{name}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!isGenerating && !finished && (
              <div className="group-report-intro">
                <div className="group-report-intro-icon">
                  <UsersIcon size={40} />
                </div>
                <h3>{group.name}</h3>
                <p>{group.members.length} {group.members.length === 1 ? 'atleta' : 'atletas'} — um PDF será gerado para cada um com avaliações cadastradas, reunidos em um único arquivo .zip.</p>
                <ul className="group-report-member-list">
                  {group.members.map(m => <li key={m.id}>{m.fullName}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', top: 0, left: '-99999px', pointerEvents: 'none' }} aria-hidden="true">
        {renderData && (
          <ReportPaper
            ref={hiddenReportRef}
            athlete={renderData.athlete}
            currentEval={renderData.currentEval}
            compareEval={renderData.compareEval}
            currentMetrics={renderData.currentMetrics}
            compareMetrics={renderData.compareMetrics}
            formula={formula}
            logos={logos}
            selections={selections}
          />
        )}
      </div>
    </div>
  );
}
