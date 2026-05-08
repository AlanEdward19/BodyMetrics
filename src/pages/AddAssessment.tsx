import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAthletes } from '../hooks/useAthletes';
import * as ApiTypes from '../types/api';
import * as Mapper from '../utils/mapper';
import { Card } from '../components/Card';
import { DatePicker } from '../components/DatePicker';
import { Activity, Scale, Ruler, Droplets, User2 } from 'lucide-react';
import './AddAssessment.css';

export default function AddAssessment() {
  const { athletes, getAthleteById, updateAthlete, loading: athletesLoading } = useAthletes();
  const navigate = useNavigate();
  const { athleteId, assessmentId } = useParams<{ athleteId?: string, assessmentId?: string }>();

  const isEditing = !!assessmentId;

  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(athleteId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    height: '',
    sittingHeight: '',
    
    // Dobras
    tricepsRight: '', tricepsLeft: '',
    subscapular: '', chestSkinfold: '',
    midaxillary: '', suprailiac: '',
    abdominal: '', thighRightSkinfold: '',
    thighLeftSkinfold: '', calfRightSkinfold: '',
    calfLeftSkinfold: '',

    // Circunferencias
    shoulder: '', chest: '',
    armRight: '', armLeft: '',
    waist: '', hip: '',
    thighMidRight: '', thighMidLeft: '',
    calfRight: '', calfLeft: '',
    wristRight: '', kneeRight: '',
    ankle: ''
  });

  useEffect(() => {
    if (athleteId) {
      setSelectedAthleteId(athleteId);
    } else if (athletes.length > 0 && !selectedAthleteId) {
      setSelectedAthleteId(athletes[0].id);
    }
  }, [athleteId, athletes]);

  useEffect(() => {
    if (assessmentId && selectedAthleteId) {
      const athlete = getAthleteById(selectedAthleteId);
      if (athlete) {
        // Busca a avaliação no array do atleta (assessmentId aqui é a data no formato ISO)
        const existingApi = athlete.physicalAssessments.find(pa => pa.assessmentDate === assessmentId);
        
        if (existingApi) {
          const existing = Mapper.mapPhysicalAssessmentToAssessment(existingApi, selectedAthleteId);
          setFormData({
            date: existing.date,
            weight: existing.weight?.toString() || '',
            height: existing.height?.toString() || '',
            sittingHeight: existing.sittingHeight?.toString() || '',
            
            tricepsRight: existing.skinfolds?.tricepsRight?.toString() || '',
            tricepsLeft: existing.skinfolds?.tricepsLeft?.toString() || '',
            subscapular: existing.skinfolds?.subscapular?.toString() || '',
            chestSkinfold: existing.skinfolds?.chest?.toString() || '',
            midaxillary: existing.skinfolds?.midaxillary?.toString() || '',
            suprailiac: existing.skinfolds?.suprailiac?.toString() || '',
            abdominal: existing.skinfolds?.abdominal?.toString() || '',
            thighRightSkinfold: existing.skinfolds?.thighRight?.toString() || '',
            thighLeftSkinfold: existing.skinfolds?.thighLeft?.toString() || '',
            calfRightSkinfold: existing.skinfolds?.calfRight?.toString() || '',
            calfLeftSkinfold: existing.skinfolds?.calfLeft?.toString() || '',

            shoulder: existing.circumferences?.shoulder?.toString() || '',
            chest: existing.circumferences?.chest?.toString() || '',
            armRight: existing.circumferences?.armRight?.toString() || '',
            armLeft: existing.circumferences?.armLeft?.toString() || '',
            waist: existing.circumferences?.waist?.toString() || '',
            hip: existing.circumferences?.hip?.toString() || '',
            thighMidRight: existing.circumferences?.thighMidRight?.toString() || '',
            thighMidLeft: existing.circumferences?.thighMidLeft?.toString() || '',
            calfRight: existing.circumferences?.calfRight?.toString() || '',
            calfLeft: existing.circumferences?.calfLeft?.toString() || '',
            wristRight: existing.circumferences?.wristRight?.toString() || '',
            kneeRight: existing.circumferences?.kneeRight?.toString() || '',
            ankle: existing.circumferences?.ankle?.toString() || ''
          });
        }
      }
    }
  }, [assessmentId, selectedAthleteId, getAthleteById]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthleteId) return;
    setIsSubmitting(true);

    try {
      const athlete = getAthleteById(selectedAthleteId);
      if (!athlete) throw new Error('Atleta não encontrado');

      const parseNum = (val: string) => parseFloat(val) || 0;

      const newAssessment: ApiTypes.PhysicalAssessment = {
        assessmentDate: formData.date,
        generalMeasurements: {
          weightKg: parseNum(formData.weight),
          heightCm: parseNum(formData.height),
          sittingHeightCm: parseNum(formData.sittingHeight)
        },
        skinfolds: {
          rightTricepsMm: parseNum(formData.tricepsRight),
          leftTricepsMm: parseNum(formData.tricepsLeft),
          subscapularMm: parseNum(formData.subscapular),
          thoraxMm: parseNum(formData.chestSkinfold),
          subaxillaryMm: parseNum(formData.midaxillary),
          suprailiacMm: parseNum(formData.suprailiac),
          abdominalMm: parseNum(formData.abdominal),
          rightThighMm: parseNum(formData.thighRightSkinfold),
          leftThighMm: parseNum(formData.thighLeftSkinfold),
          rightCalfMm: parseNum(formData.calfRightSkinfold),
          leftCalfMm: parseNum(formData.calfLeftSkinfold)
        },
        circumferences: {
          shoulderCm: parseNum(formData.shoulder),
          chestCm: parseNum(formData.chest),
          rightArmCm: parseNum(formData.armRight),
          leftArmCm: parseNum(formData.armLeft),
          waistCm: parseNum(formData.waist),
          hipCm: parseNum(formData.hip),
          rightMidThighCm: parseNum(formData.thighMidRight),
          leftMidThighCm: parseNum(formData.thighMidLeft),
          rightCalfCm: parseNum(formData.calfRight),
          leftCalfCm: parseNum(formData.calfLeft),
          rightWristCm: parseNum(formData.wristRight),
          rightKneeCm: parseNum(formData.kneeRight),
          rightAnkleCm: parseNum(formData.ankle)
        }
      };

      let updatedAssessments = [...athlete.physicalAssessments];
      if (isEditing && assessmentId) {
        // Substitui a existente
        updatedAssessments = updatedAssessments.map(pa => 
          pa.assessmentDate === assessmentId ? newAssessment : pa
        );
      } else {
        // Adiciona nova
        updatedAssessments.push(newAssessment);
      }

      await updateAthlete(athlete.id, {
        ...athlete,
        physicalAssessments: updatedAssessments
      });

      navigate(-1);
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      alert('Não foi possível salvar a avaliação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (name: string, label: string, unit: string = '') => (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <div className={unit ? "input-with-unit" : ""}>
        <input 
          type="number" 
          step="0.01"
          id={name} 
          name={name} 
          value={(formData as any)[name]}
          onChange={handleChange}
          placeholder="0.00"
          required
        />
        {unit && <span className="unit">{unit}</span>}
      </div>
    </div>
  );

  if (athletesLoading && athletes.length === 0) {
    return <div className="container" style={{ padding: '2rem' }}>Carregando atletas...</div>;
  }

  if (athletes.length === 0) {
    return (
      <div className="container add-assessment-container">
        <div className="add-assessment-header">
          <h1>{isEditing ? 'Editar Avaliação' : 'Nova Avaliação Antropométrica'}</h1>
          <p>Registre ou atualize as medidas, dobras e circunferências do atleta.</p>
        </div>
        <Card style={{ textAlign: 'center', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-bg-page)', padding: '1rem', borderRadius: '50%', display: 'inline-flex', marginBottom: '0.5rem' }}>
            <User2 size={48} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--color-text-main)', margin: 0 }}>Nenhum Atleta Disponível</h2>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 auto 1rem', lineHeight: 1.5 }}>
            Para registrar uma nova avaliação, é necessário ter pelo menos um atleta cadastrado no sistema.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/add')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            Cadastrar Atleta
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container add-assessment-container">
      <div className="add-assessment-header">
        <h1>{isEditing ? 'Editar Avaliação' : 'Nova Avaliação Antropométrica'}</h1>
        <p>Registre ou atualize as medidas, dobras e circunferências do atleta.</p>
      </div>

      <form onSubmit={handleSubmit} className="assessment-form-layout">
        
        <Card className="assessment-section-card">
          <div className="section-title" style={{ marginTop: 0 }}>
            <div className="section-icon-wrapper">
              <Activity size={20} />
            </div>
            Identificação e Data
          </div>
          <div className="grid-2-cols">
            <div className="form-group">
              <label htmlFor="athleteId">Atleta</label>
              <select 
                id="athleteId" 
                name="athleteId" 
                value={selectedAthleteId} 
                onChange={(e) => setSelectedAthleteId(e.target.value)}
                required
                disabled={isEditing}
              >
                {athletes.map(a => (
                  <option key={a.id} value={a.id}>{a.fullName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="date">Data da Avaliação</label>
              <div className="input-with-unit">
                <DatePicker 
                  id="date" 
                  name="date" 
                  value={formData.date}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="assessment-section-card">
          <div className="section-title" style={{ marginTop: 0 }}>
            <div className="section-icon-wrapper">
              <Scale size={20} />
            </div>
            Medidas Gerais
          </div>
          <div className="grid-3-cols">
            {renderInput('weight', 'Peso', 'kg')}
            {renderInput('height', 'Altura', 'cm')}
            {renderInput('sittingHeight', 'Alt. Sentado', 'cm')}
          </div>
        </Card>

        <div className="assessment-split-layout">
          <Card className="assessment-section-card">
            <div className="section-title" style={{ marginTop: 0 }}>
              <div className="section-icon-wrapper">
                <Droplets size={20} />
              </div>
              Dobras Cutâneas
            </div>
            <div className="grid-3-cols">
              {renderInput('tricepsRight', 'Tríceps Dir.', 'mm')}
              {renderInput('tricepsLeft', 'Tríceps Esq.', 'mm')}
              {renderInput('subscapular', 'Subescapular', 'mm')}
              {renderInput('chestSkinfold', 'Tórax', 'mm')}
              {renderInput('midaxillary', 'Subaxilar', 'mm')}
              {renderInput('suprailiac', 'Supra-ilíaca', 'mm')}
              {renderInput('abdominal', 'Abdominal', 'mm')}
              {renderInput('thighRightSkinfold', 'Coxa Dir.', 'mm')}
              {renderInput('thighLeftSkinfold', 'Coxa Esq.', 'mm')}
              {renderInput('calfRightSkinfold', 'Panturrilha Dir.', 'mm')}
              {renderInput('calfLeftSkinfold', 'Panturrilha Esq.', 'mm')}
            </div>
          </Card>

          <Card className="assessment-section-card">
            <div className="section-title" style={{ marginTop: 0 }}>
              <div className="section-icon-wrapper">
                <Ruler size={20} />
              </div>
              Circunferências
            </div>
            <div className="grid-3-cols">
              {renderInput('shoulder', 'Ombro', 'cm')}
              {renderInput('chest', 'Peitoral', 'cm')}
              {renderInput('armRight', 'Braço Dir.', 'cm')}
              {renderInput('armLeft', 'Braço Esq.', 'cm')}
              {renderInput('waist', 'Cintura', 'cm')}
              {renderInput('hip', 'Quadril', 'cm')}
              {renderInput('thighMidRight', 'Medial Dir.', 'cm')}
              {renderInput('thighMidLeft', 'Medial Esq.', 'cm')}
              {renderInput('calfRight', 'Pantu Dir.', 'cm')}
              {renderInput('calfLeft', 'Pantu Esq.', 'cm')}
              {renderInput('wristRight', 'D. Punho', 'cm')}
              {renderInput('kneeRight', 'D. Joelho', 'cm')}
              {renderInput('ankle', 'D. Tornozelo', 'cm')}
            </div>
          </Card>
        </div>

        <div className="sticky-form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} disabled={isSubmitting}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || athletes.length === 0}>
            {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar Avaliação' : 'Salvar Avaliação')}
          </button>
        </div>
      </form>
    </div>
  );
}
