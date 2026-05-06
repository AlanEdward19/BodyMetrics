import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAthletes } from '../hooks/useAthletes';
import { useAssessments } from '../hooks/useAssessments';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { MetricCard } from '../components/MetricCard';
import { ReportModal } from '../components/ReportModal';
import { User2, Calendar, Target, Shield, Clock, Scale, Percent, Dumbbell, Activity, Plus, ChevronDown, Droplets, Ruler, ArrowUpRight, ArrowDownRight, Minus, Pencil, Trash2, Download } from 'lucide-react';
import type { Assessment } from '../types/assessment';
import './AthleteDashboard.css';

export default function AthleteDashboard() {
  const navigate = useNavigate();
  const { athleteId } = useParams<{ athleteId?: string }>();
  const { athletes, getAthleteById, deleteAthlete } = useAthletes();
  const { getAssessmentsByAthleteId } = useAssessments();

  // Don't auto-select athlete, require explicit selection
  const currentAthleteId = athleteId || null;
  const athlete = currentAthleteId ? getAthleteById(currentAthleteId) : null;
  const assessments = currentAthleteId ? getAssessmentsByAthleteId(currentAthleteId) : [];

  const [selectedFormula, setSelectedFormula] = useState<'pollock' | 'faulkner'>('pollock');
  const [currentEvalId, setCurrentEvalId] = useState<string>('');
  const [compareEvalId, setCompareEvalId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'gerais' | 'dobras' | 'circunferencias'>('gerais');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [metricsPage, setMetricsPage] = useState<1 | 2 | 3>(1);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    // Extracts YYYY-MM-DD and converts to DD/MM/YYYY without Date parsing to avoid timezone shifts
    const [yyyy, mm, dd] = dateStr.split('T')[0].split('-');
    return `${dd}/${mm}/${yyyy}`;
  };

  const handleDeleteAthlete = () => {
    if (!athlete) return;
    deleteAthlete(athlete.id);
    setIsDeleteModalOpen(false);
    navigate('/dashboard');
  };

  useEffect(() => {
    if (assessments.length > 0) {
      setCurrentEvalId(assessments[0].id);
      setCompareEvalId(assessments.length > 1 ? assessments[1].id : assessments[0].id);
    } else {
      setCurrentEvalId('');
      setCompareEvalId('');
    }
  }, [assessments.length, currentAthleteId]);

  const currentEval = assessments.find(a => a.id === currentEvalId);
  const compareEval = assessments.find(a => a.id === compareEvalId);

  // Calculations
  const calculateMetrics = (evalData?: Assessment) => {
    if (!evalData) return null;

    let idade = 0;
    if (athlete && athlete.birthDate && evalData.date) {
      const evalDate = new Date(evalData.date);
      const birthDate = new Date(athlete.birthDate);
      const diffTime = evalDate.getTime() - birthDate.getTime();
      idade = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    }

    const peso = evalData.weight;
    const altura = evalData.height;

    // Somatorio das dobras (Tricep D.,Tricep E.,Sub esc,Torax,Sub. Axi,Supra. Ili,Abd,Coxa D)
    const sf = evalData.skinfolds || {};
    const sumDobras = (sf.tricepsRight || 0) +
      (sf.tricepsLeft || 0) +
      (sf.subscapular || 0) +
      (sf.chest || 0) +
      (sf.midaxillary || 0) +
      (sf.suprailiac || 0) +
      (sf.abdominal || 0) +
      (sf.thighRight || 0);

    // Formula de Pollock
    let pollock = 0;
    if (sumDobras > 0 && idade > 0) {
      const densidade = 1.112 - (0.00043499 * sumDobras) + (0.00000055 * Math.pow(sumDobras, 2)) - (0.00028826 * idade);
      pollock = (495 / densidade) - 450;
    }

    // Formula de Faulkner
    const faulknerSum = (sf.tricepsRight || 0) +
      (sf.subscapular || 0) +
      (sf.suprailiac || 0) +
      (sf.abdominal || 0);
    let faulkner = 0;
    if (faulknerSum > 0) {
      faulkner = (faulknerSum * 0.153) + 5.783;
    }

    let percentualGordura = 0;
    if (selectedFormula === 'pollock') {
      percentualGordura = Math.max(0, pollock);
    } else if (selectedFormula === 'faulkner') {
      percentualGordura = Math.max(0, faulkner);
    }

    const gordura = (peso * percentualGordura) / 100;

    const circ = evalData.circumferences || {};
    const punhoM = (circ.wristRight || 0) / 100;
    const joelhoM = (circ.kneeRight || 0) / 100;
    const alturaM = altura / 100;

    let ossos = 0;
    if (punhoM > 0 && joelhoM > 0 && alturaM > 0) {
      ossos = 3.02 * Math.pow(400 * punhoM * joelhoM * Math.pow(alturaM, 2), 0.712);
    }

    const mlg = peso - gordura - ossos;

    // Fatores
    const fatorSexo = athlete?.gender === 'Feminino' ? 0 : 1;
    const fatorRaca = athlete?.race === 'Negro' ? 1.1 : athlete?.race === 'Asiático' ? -2 : 0;

    // Medidas Corrigidas
    const coxaD_C = (circ.thighMidRight || 0) - (((sf.thighRight || 0) / 10) * 3.16);
    const coxaE_C = (circ.thighMidLeft || 0) - (((sf.thighLeft || 0) / 10) * 3.16);
    const pantuD_C = (circ.calfRight || 0) - (((sf.calfRight || 0) / 10) * 3.16);
    const pantuE_C = (circ.calfLeft || 0) - (((sf.calfLeft || 0) / 10) * 3.16);
    const bracoD_C = (circ.armRight || 0) - (((sf.tricepsRight || 0) / 10) * 3.16);
    const bracoE_C = (circ.armLeft || 0) - (((sf.tricepsLeft || 0) / 10) * 3.16);

    const ccBraco = (bracoD_C + bracoE_C) / 2;
    const ccCoxa = (coxaD_C + coxaE_C) / 2;
    const ccPantu = (pantuD_C + pantuE_C) / 2;

    // Massa Muscular
    const mmBraco = 0.00744 * Math.pow(ccBraco, 2);
    const mmCoxa = 0.00088 * Math.pow(ccCoxa, 2);
    const mmPantu = 0.00441 * Math.pow(ccPantu, 2);
    let massaMuscular = 0;
    if (alturaM > 0) {
      massaMuscular = (alturaM * 100 / 100) * (mmBraco + mmCoxa + mmPantu) + (2.4 * fatorSexo) - (0.048 * idade) + fatorRaca + 7.8;
    }

    // Diametros (Página 3)
    const diamJoelho = circ.kneeRight || 0;
    const diamPunho = circ.wristRight || 0;
    const diamTornozelo = (circ as any).ankle || 0;

    return {
      peso,
      altura,
      gordura,
      sumDobras,
      ossos,
      mlg,
      percentualGordura,
      massaMuscular,
      simetria: {
        coxa: { d: coxaD_C, e: coxaE_C, diff: Math.abs(coxaD_C - coxaE_C) },
        pantu: { d: pantuD_C, e: pantuE_C, diff: Math.abs(pantuD_C - pantuE_C) },
        braco: { d: bracoD_C, e: bracoE_C, diff: Math.abs(bracoD_C - bracoE_C) }
      },
      relacao: {
        coxa: diamJoelho > 0 ? ccCoxa / diamJoelho : 0,
        pantu: diamTornozelo > 0 ? ccPantu / diamTornozelo : 0,
        braco: diamPunho > 0 ? ccBraco / diamPunho : 0,
        ccCoxa, ccPantu, ccBraco,
        diamJoelho, diamTornozelo, diamPunho
      }
    };
  };

  const currentMetrics = calculateMetrics(currentEval);
  const compareMetrics = calculateMetrics(compareEval);

  let isCompositionGood = false;
  if (currentMetrics && compareMetrics) {
    const gorduraDiff = currentMetrics.gordura - compareMetrics.gordura;
    const mlgDiff = currentMetrics.mlg - compareMetrics.mlg;
    // O atleta ganhou mais massa e perdeu gordura, ou manteve massa e perdeu gordura
    isCompositionGood = gorduraDiff <= 0 && mlgDiff >= 0 && (gorduraDiff < 0 || mlgDiff > 0);
  }

  const getTrendUi = (currentVal: number, compareVal: number | undefined, inverseGood = false) => {
    if (compareVal === undefined || compareVal === null) return <span className="trend-neutral">-</span>;
    const diff = currentVal - compareVal;
    if (diff === 0) return <span className="trend-neutral"><Minus size={16} /> 0</span>;

    const isUp = diff > 0;
    const isGood = inverseGood ? !isUp : isUp;
    const className = isGood ? 'trend-good' : 'trend-bad';
    const Icon = isUp ? ArrowUpRight : ArrowDownRight;
    const sign = isUp ? '+' : '';

    return (
      <span className={className}>
        <Icon size={16} />
        {sign}{diff.toFixed(1).replace('.', ',')}
      </span>
    );
  };

  const renderSymmetryCards = () => {
    if (!currentMetrics) return null;
    const { coxa, pantu, braco } = currentMetrics.simetria;

    const renderRow = (title: string, data: { d: number, e: number, diff: number }) => {
      const diffSign = data.d > data.e ? '+' : data.d < data.e ? '-' : '';
      return (
        <div className="metrics-grid" style={{ marginBottom: '1.5rem' }}>
          <MetricCard
            icon={<Ruler size={24} />}
            title={`C/C ${title} D`}
            value={data.d.toFixed(2).replace('.', ',')}
            unit="cm"
          />
          <MetricCard
            icon={<Ruler size={24} />}
            title={`C/C ${title} E`}
            value={data.e.toFixed(2).replace('.', ',')}
            unit="cm"
          />
          <MetricCard
            icon={<Activity size={24} />}
            title="DIF D/E"
            value={`${diffSign}${data.diff.toFixed(2).replace('.', ',')}`}
            unit="cm"
          />
        </div>
      );
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {renderRow('Coxa', coxa)}
        {renderRow('Panturrilha', pantu)}
        {renderRow('Braço', braco)}
      </div>
    );
  };

  const renderRelationCards = () => {
    if (!currentMetrics) return null;
    const r = currentMetrics.relacao;

    const renderRow = (titleObj: string, titleOsso: string, media: number, osso: number, relacao: number) => (
      <div className="metrics-grid" style={{ marginBottom: '1.5rem' }}>
        <MetricCard
          icon={<Ruler size={24} />}
          title={`Média ${titleObj}`}
          value={media.toFixed(2).replace('.', ',')}
          unit="cm"
        />
        <MetricCard
          icon={<Shield size={24} />}
          title={`Osso ${titleOsso}`}
          value={osso > 0 ? osso.toFixed(2).replace('.', ',') : '-'}
          unit="cm"
        />
        <MetricCard
          icon={<Activity size={24} />}
          title="Relação"
          value={relacao > 0 ? relacao.toFixed(2).replace('.', ',') : '-'}
          unit="índice"
        />
      </div>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {renderRow('Coxa', 'Fêmur', r.ccCoxa, r.diamJoelho, r.coxa)}
        {renderRow('Panturrilha', 'Tornozelo', r.ccPantu, r.diamTornozelo, r.pantu)}
        {renderRow('Braço', 'Úmero', r.ccBraco, r.diamPunho, r.braco)}
      </div>
    );
  };

  const renderTableContent = (items: { label: string, cur: number | undefined, cmp: number | undefined, unit: string, inverseGood?: boolean }[]) => (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Medida</th>
            <th>Atual</th>
            <th>Comparação</th>
            <th>Evolução</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td>{item.label}</td>
              <td>{item.cur !== undefined ? `${item.cur.toFixed(1).replace('.', ',')} ${item.unit}` : '-'}</td>
              <td>{item.cmp !== undefined ? `${item.cmp.toFixed(1).replace('.', ',')} ${item.unit}` : '-'}</td>
              <td>{getTrendUi(item.cur || 0, item.cmp, item.inverseGood)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (athletes.length === 0) {
    return (
      <div className="container dashboard-container">
        <Card style={{ textAlign: 'center', padding: '4rem 2rem', marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-bg-page)', padding: '1rem', borderRadius: '50%', display: 'inline-flex', marginBottom: '0.5rem' }}>
            <User2 size={48} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text-main)', margin: 0 }}>Nenhum Atleta Cadastrado</h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 auto 1rem', lineHeight: 1.5 }}>
            Para visualizar o dashboard e acompanhar as avaliações antropométricas, você precisa primeiro cadastrar um atleta no sistema.
          </p>
          <Link to="/add" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} />
            Cadastrar Primeiro Atleta
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container dashboard-container">
      {/* Athlete Selector */}
      <div className="athlete-selector-container">
        <label htmlFor="athlete-select" className="athlete-selector-label">
          Atleta Selecionado
        </label>
        <select
          id="athlete-select"
          value={currentAthleteId || ''}
          onChange={(e) => navigate(`/dashboard/${e.target.value}`)}
          className="main-athlete-select"
        >
          <option value="" disabled>Selecione um atleta...</option>
          {athletes.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {!athlete ? (
        <Card style={{ textAlign: 'center', padding: '4rem 2rem', marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-bg-page)', padding: '1rem', borderRadius: '50%', display: 'inline-flex', marginBottom: '0.5rem' }}>
            <User2 size={48} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text-main)', margin: 0 }}>Selecione um Atleta</h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.5 }}>
            Utilize o menu acima para selecionar um atleta e visualizar seu dashboard de evolução antropométrica.
          </p>
        </Card>
      ) : (
        <>
          {/* Athlete Header Card */}
          <Card className="athlete-header-card">
            <div className="athlete-profile-section">
              <div className="athlete-photo-container">
                {athlete.photoUrl ? (
                  <img src={athlete.photoUrl} alt={athlete.name} className="athlete-photo" />
                ) : (
                  <div className="athlete-photo-placeholder">
                    <User2 size={64} className="placeholder-icon" />
                  </div>
                )}
                <div className="athlete-number-badge">
                  <span className="label">ATLETA</span>
                </div>
              </div>

              <div className="athlete-info-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h1 className="athlete-name" style={{ margin: 0 }}>{athlete.name}</h1>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', border: 'none', backgroundColor: 'var(--color-bg-page)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, fontSize: '0.875rem' }}
                      title="Exportar Relatório"
                    >
                      <Download size={18} /> Exportar Relatório
                    </button>
                    <button
                      onClick={() => navigate(`/edit/${athlete.id}`)}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem', border: 'none', backgroundColor: 'var(--color-bg-page)', color: 'var(--color-primary)' }}
                      title="Editar Atleta"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem', border: 'none', backgroundColor: '#fef2f2', color: '#dc2626' }}
                      title="Excluir Atleta"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="athlete-subtitle">Avaliação Antropométrica</p>

                <div className="athlete-badges">
                  <Badge icon={Target} label="ESPORTE" value={(athlete as any).sport || 'Futebol'} />
                  {((athlete as any).sportObservation || (athlete as any).position || (athlete as any).sector) && (
                    <>
                      <div className="badge-divider"></div>
                      <Badge icon={User2} label="OBS." value={(athlete as any).sportObservation || (athlete as any).position || (athlete as any).sector} />
                    </>
                  )}
                  <div className="badge-divider"></div>
                  <Badge icon={Shield} label="CATEGORIA" value={athlete.category} />
                  <div className="badge-divider"></div>
                  <Badge icon={User2} label="SEXO" value={athlete.gender || '-'} />
                  <div className="badge-divider"></div>
                  <Badge icon={Calendar} label="DATA NASC." value={formatDate(athlete.birthDate)} />
                </div>
              </div>
            </div>

            <div className="athlete-eval-summary">
              {assessments.length > 0 ? (
                <>
                  <div className="eval-item">
                    <Calendar className="eval-icon" size={24} />
                    <div className="eval-data">
                      <span className="eval-label">AVALIAÇÃO ATUAL</span>
                      <select
                        value={currentEvalId}
                        onChange={e => setCurrentEvalId(e.target.value)}
                        className="eval-select"
                      >
                        {assessments.map(a => (
                          <option key={a.id} value={a.id}>{formatDate(a.date)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="eval-divider"></div>
                  <div className="eval-item">
                    <Activity className="eval-icon" size={24} />
                    <div className="eval-data">
                      <span className="eval-label">COMPARAR COM</span>
                      <select
                        value={compareEvalId}
                        onChange={e => setCompareEvalId(e.target.value)}
                        className="eval-select"
                      >
                        {assessments.map(a => (
                          <option key={a.id} value={a.id}>{formatDate(a.date)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="eval-divider"></div>
                  <div className="eval-item">
                    <Percent className="eval-icon" size={24} />
                    <div className="eval-data">
                      <span className="eval-label">FÓRMULA %G</span>
                      <select
                        value={selectedFormula}
                        onChange={e => setSelectedFormula(e.target.value as any)}
                        className="eval-select"
                      >
                        <option value="pollock">Pollock</option>
                        <option value="faulkner">Faulkner</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-evals-message">
                  <p>Nenhuma avaliação cadastrada para este atleta.</p>
                </div>
              )}
              <div className="eval-actions" style={{ marginTop: '0.5rem', width: '100%' }}>
                <Link to={`/add-assessment/${athlete.id}`} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', width: '100%' }}>
                  <Plus size={18} /> Nova Avaliação
                </Link>
              </div>
            </div>
          </Card>

          {/* Main Content Layout */}
          {currentMetrics && (
            <div className="dashboard-content-layout">
              {/* Left Column: Metrics Grid */}
              <div className="dashboard-metrics-column">
                <div className="tabs-header" style={{ marginBottom: '1rem', backgroundColor: 'transparent', padding: 0 }}>
                  <button className={`tab-btn ${metricsPage === 1 ? 'active' : ''}`} onClick={() => setMetricsPage(1)}>Composição Corporal</button>
                  <button className={`tab-btn ${metricsPage === 2 ? 'active' : ''}`} onClick={() => setMetricsPage(2)}>Índices de Simetria</button>
                  <button className={`tab-btn ${metricsPage === 3 ? 'active' : ''}`} onClick={() => setMetricsPage(3)}>Rel. Cineantropométrica</button>
                </div>

                {metricsPage === 1 && (
                  <div className="metrics-grid">
                    <MetricCard
                      icon={<Scale size={24} />}
                      title="PESO CORPORAL"
                      value={currentMetrics.peso.toFixed(1).replace('.', ',')}
                      unit="kg"
                      trend={{
                        direction: currentMetrics.peso > compareMetrics.peso ? 'up' : currentMetrics.peso < compareMetrics.peso ? 'down' : 'neutral',
                        value: `${Math.abs(currentMetrics.peso - compareMetrics.peso).toFixed(1).replace('.', ',')} kg`,
                        text: 'vs. comparação',
                        isGood: currentMetrics.peso === compareMetrics.peso ? undefined : isCompositionGood
                      }}
                    />
                    <MetricCard
                      icon={<Ruler size={24} />}
                      title="ALTURA"
                      value={currentMetrics.altura.toFixed(1).replace('.', ',')}
                      unit="cm"
                      trend={{
                        direction: currentMetrics.altura > compareMetrics.altura ? 'up' : currentMetrics.altura < compareMetrics.altura ? 'down' : 'neutral',
                        value: `${Math.abs(currentMetrics.altura - compareMetrics.altura).toFixed(1).replace('.', ',')} cm`,
                        text: 'vs. comparação',
                        isGood: currentMetrics.altura > compareMetrics.altura
                      }}
                    />
                    <MetricCard
                      icon={<Percent size={24} />}
                      title="% GORDURA"
                      value={currentMetrics.percentualGordura.toFixed(1).replace('.', ',')}
                      unit="%"
                      trend={{
                        direction: currentMetrics.percentualGordura > compareMetrics.percentualGordura ? 'up' : currentMetrics.percentualGordura < compareMetrics.percentualGordura ? 'down' : 'neutral',
                        value: `${Math.abs(currentMetrics.percentualGordura - compareMetrics.percentualGordura).toFixed(1).replace('.', ',')} %`,
                        text: 'vs. comparação',
                        isGood: currentMetrics.percentualGordura < compareMetrics.percentualGordura
                      }}
                    />
                    <MetricCard
                      icon={<Activity size={24} />}
                      title="SOMA DAS DOBRAS"
                      value={currentMetrics.sumDobras.toFixed(1).replace('.', ',')}
                      unit="mm"
                      trend={{
                        direction: currentMetrics.sumDobras > compareMetrics.sumDobras ? 'up' : currentMetrics.sumDobras < compareMetrics.sumDobras ? 'down' : 'neutral',
                        value: `${Math.abs(currentMetrics.sumDobras - compareMetrics.sumDobras).toFixed(1).replace('.', ',')} mm`,
                        text: 'vs. comparação',
                        isGood: currentMetrics.sumDobras < compareMetrics.sumDobras
                      }}
                    />
                    <MetricCard
                      icon={<Shield size={24} />}
                      title="MASSA GORDA"
                      value={currentMetrics.gordura.toFixed(1).replace('.', ',')}
                      unit="kg"
                      trend={{
                        direction: currentMetrics.gordura > compareMetrics.gordura ? 'up' : currentMetrics.gordura < compareMetrics.gordura ? 'down' : 'neutral',
                        value: `${Math.abs(currentMetrics.gordura - compareMetrics.gordura).toFixed(1).replace('.', ',')} kg`,
                        text: 'vs. comparação',
                        isGood: currentMetrics.gordura < compareMetrics.gordura
                      }}
                    />
                    <MetricCard
                      icon={<Dumbbell size={24} />}
                      title="MASSA LIVRE DE GORDURA"
                      value={currentMetrics.mlg.toFixed(1).replace('.', ',')}
                      unit="kg"
                      trend={{
                        direction: currentMetrics.mlg > compareMetrics.mlg ? 'up' : currentMetrics.mlg < compareMetrics.mlg ? 'down' : 'neutral',
                        value: `${Math.abs(currentMetrics.mlg - compareMetrics.mlg).toFixed(1).replace('.', ',')} kg`,
                        text: 'vs. comparação',
                        isGood: currentMetrics.mlg > compareMetrics.mlg
                      }}
                    />
                    <MetricCard
                      icon={<Shield size={24} />}
                      title="MASSA ÓSSEA"
                      value={currentMetrics.ossos.toFixed(1).replace('.', ',')}
                      unit="kg"
                      trend={{
                        direction: currentMetrics.ossos > compareMetrics.ossos ? 'up' : currentMetrics.ossos < compareMetrics.ossos ? 'down' : 'neutral',
                        value: `${Math.abs(currentMetrics.ossos - compareMetrics.ossos).toFixed(1).replace('.', ',')} kg`,
                        text: 'vs. comparação',
                        isGood: currentMetrics.ossos > compareMetrics.ossos
                      }}
                    />
                    <MetricCard
                      icon={<Dumbbell size={24} />}
                      title="MASSA MUSCULAR"
                      value={currentMetrics.massaMuscular.toFixed(1).replace('.', ',')}
                      unit="kg"
                      trend={{
                        direction: currentMetrics.massaMuscular > compareMetrics.massaMuscular ? 'up' : currentMetrics.massaMuscular < compareMetrics.massaMuscular ? 'down' : 'neutral',
                        value: `${Math.abs(currentMetrics.massaMuscular - compareMetrics.massaMuscular).toFixed(1).replace('.', ',')} kg`,
                        text: 'vs. comparação',
                        isGood: currentMetrics.massaMuscular > compareMetrics.massaMuscular
                      }}
                    />
                  </div>
                )}

                {metricsPage === 2 && (
                  <div style={{ width: '100%' }}>
                    {renderSymmetryCards()}
                  </div>
                )}

                {metricsPage === 3 && (
                  <div style={{ width: '100%' }}>
                    {renderRelationCards()}
                  </div>
                )}
              </div>

              {/* Right Column: Data Tables Tabs */}
              <div className="dashboard-tables-column">
                <Card className="data-table-card" style={{ height: '100%' }}>
                  <div className="tabs-header">
                    <button className={`tab-btn ${activeTab === 'gerais' ? 'active' : ''}`} onClick={() => setActiveTab('gerais')}>M. Gerais</button>
                    <button className={`tab-btn ${activeTab === 'dobras' ? 'active' : ''}`} onClick={() => setActiveTab('dobras')}>Dobras</button>
                    <button className={`tab-btn ${activeTab === 'circunferencias' ? 'active' : ''}`} onClick={() => setActiveTab('circunferencias')}>Circunf.</button>
                  </div>

                  <div className="tab-content">
                    {activeTab === 'gerais' && renderTableContent([
                      { label: 'Água Corporal', cur: currentEval?.bodyWater, cmp: compareEval?.bodyWater, unit: 'kg', inverseGood: false },
                      { label: 'Gordura Visceral', cur: currentEval?.visceralFat, cmp: compareEval?.visceralFat, unit: 'kg', inverseGood: true },
                      { label: 'Massa Proteica', cur: currentEval?.proteinMass, cmp: compareEval?.proteinMass, unit: 'kg', inverseGood: false },
                      { label: 'Massa Muscular', cur: currentEval?.muscleMass, cmp: compareEval?.muscleMass, unit: 'kg', inverseGood: false }
                    ])}

                    {activeTab === 'dobras' && renderTableContent([
                      { label: 'Tríceps Dir.', cur: currentEval?.skinfolds?.tricepsRight, cmp: compareEval?.skinfolds?.tricepsRight, unit: 'mm', inverseGood: true },
                      { label: 'Tríceps Esq.', cur: currentEval?.skinfolds?.tricepsLeft, cmp: compareEval?.skinfolds?.tricepsLeft, unit: 'mm', inverseGood: true },
                      { label: 'Subescapular', cur: currentEval?.skinfolds?.subscapular, cmp: compareEval?.skinfolds?.subscapular, unit: 'mm', inverseGood: true },
                      { label: 'Tórax', cur: currentEval?.skinfolds?.chest, cmp: compareEval?.skinfolds?.chest, unit: 'mm', inverseGood: true },
                      { label: 'Subaxilar', cur: currentEval?.skinfolds?.midaxillary, cmp: compareEval?.skinfolds?.midaxillary, unit: 'mm', inverseGood: true },
                      { label: 'Supra-ilíaca', cur: currentEval?.skinfolds?.suprailiac, cmp: compareEval?.skinfolds?.suprailiac, unit: 'mm', inverseGood: true },
                      { label: 'Abdominal', cur: currentEval?.skinfolds?.abdominal, cmp: compareEval?.skinfolds?.abdominal, unit: 'mm', inverseGood: true },
                      { label: 'Panturrilha Dir.', cur: currentEval?.skinfolds?.calfRight, cmp: compareEval?.skinfolds?.calfRight, unit: 'mm', inverseGood: true },
                      { label: 'Panturrilha Esq.', cur: currentEval?.skinfolds?.calfLeft, cmp: compareEval?.skinfolds?.calfLeft, unit: 'mm', inverseGood: true }
                    ])}

                    {activeTab === 'circunferencias' && renderTableContent([
                      { label: 'Ombro', cur: currentEval?.circumferences?.shoulder, cmp: compareEval?.circumferences?.shoulder, unit: 'cm' },
                      { label: 'Peitoral', cur: currentEval?.circumferences?.chest, cmp: compareEval?.circumferences?.chest, unit: 'cm' },
                      { label: 'Braço Dir.', cur: currentEval?.circumferences?.armRight, cmp: compareEval?.circumferences?.armRight, unit: 'cm' },
                      { label: 'Braço Esq.', cur: currentEval?.circumferences?.armLeft, cmp: compareEval?.circumferences?.armLeft, unit: 'cm' },
                      { label: 'Cintura', cur: currentEval?.circumferences?.waist, cmp: compareEval?.circumferences?.waist, unit: 'cm', inverseGood: true },
                      { label: 'Quadril', cur: currentEval?.circumferences?.hip, cmp: compareEval?.circumferences?.hip, unit: 'cm' },
                      { label: 'Medial Dir.', cur: currentEval?.circumferences?.thighMidRight, cmp: compareEval?.circumferences?.thighMidRight, unit: 'cm' },
                      { label: 'Medial Esq.', cur: currentEval?.circumferences?.thighMidLeft, cmp: compareEval?.circumferences?.thighMidLeft, unit: 'cm' },
                      { label: 'Panturrilha Dir.', cur: currentEval?.circumferences?.calfRight, cmp: compareEval?.circumferences?.calfRight, unit: 'cm' },
                      { label: 'Panturrilha Esq.', cur: currentEval?.circumferences?.calfLeft, cmp: compareEval?.circumferences?.calfLeft, unit: 'cm' },
                      { label: 'D. Punho', cur: currentEval?.circumferences?.wristRight, cmp: compareEval?.circumferences?.wristRight, unit: 'cm' },
                      { label: 'D. Joelho', cur: currentEval?.circumferences?.kneeRight, cmp: compareEval?.circumferences?.kneeRight, unit: 'cm' }
                    ])}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {currentMetrics && (
            <div className="footer-info">
              <span className="info-icon">ⓘ</span>
              Os dados apresentados são referentes à avaliação selecionada. A tendência mostra a diferença para a avaliação de comparação.
            </div>
          )}

          <ReportModal 
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            athlete={athlete}
            currentEval={currentEval}
            compareEval={compareEval}
            currentMetrics={currentMetrics}
            compareMetrics={compareMetrics}
            formula={selectedFormula}
          />

          {/* Delete Confirmation Modal */}
          {isDeleteModalOpen && (
            <div className="delete-modal-overlay">
              <div className="delete-modal-content">
                <div className="delete-modal-icon">
                  <Trash2 size={32} />
                </div>
                <h2 className="delete-modal-title">Excluir Atleta</h2>
                <p className="delete-modal-text">
                  Tem certeza que deseja excluir <strong>{athlete.name}</strong>? Esta ação removerá também todas as avaliações dele e não poderá ser desfeita.
                </p>
                <div className="delete-modal-actions">
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setIsDeleteModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                    onClick={handleDeleteAthlete}
                  >
                    Sim, Excluir
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
