import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAthletes } from '../hooks/useAthletes';
import { Card } from '../components/Card';
import { DatePicker } from '../components/DatePicker';
import { ImageCropperModal } from '../components/ImageCropperModal';
import { AthletePhoto } from '../components/AthletePhoto';
import { Scissors, Link as LinkIcon } from 'lucide-react';
import './AddAthlete.css';
import type { Athlete } from '../types/athlete';

export default function AddAthlete() {
  const { addAthlete, updateAthlete, getAthleteById } = useAthletes();
  const navigate = useNavigate();
  const { athleteId } = useParams<{ athleteId: string }>();
  const isEditing = !!athleteId;

  const [formData, setFormData] = useState({
    name: '',
    photoUrl: '',
    sport: '',
    sportObservation: '',
    category: 'Profissional',
    competitivePhase: '',
    birthDate: '',
    gender: 'Masculino',
    race: 'Branco',
    cropSettings: undefined as Athlete['cropSettings'],
  });

  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState('');
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    if (isEditing && athleteId) {
      const athlete = getAthleteById(athleteId);
      if (athlete) {
        let phase = athlete.competitivePhase || '';
        const phaseLower = phase.toLowerCase();
        if (phaseLower === 'competitiva') {
          phase = 'Competição';
        } else if (phaseLower === 'pre-competitiva' || phaseLower === 'pré-competitiva') {
          phase = 'Pré-temporada';
        }

        setFormData({
          name: athlete.name,
          photoUrl: athlete.photoUrl || '',
          cropSettings: athlete.cropSettings,
          sport: (athlete as any).sport || '',
          sportObservation: (athlete as any).sportObservation || (athlete as any).position || (athlete as any).sector || '',
          category: athlete.category,
          competitivePhase: phase,
          birthDate: athlete.birthDate,
          gender: athlete.gender || 'Masculino',
          race: athlete.race || 'Branco',
        });
        setUrlInput(athlete.photoUrl || '');
      }
    }
  }, [isEditing, athleteId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const athleteData: Omit<Athlete, 'id'> = {
      name: formData.name,
      photoUrl: urlInput || formData.photoUrl || '',
      cropSettings: formData.cropSettings,
      sport: formData.sport,
      sportObservation: formData.sportObservation,
      category: formData.category,
      competitivePhase: formData.competitivePhase,
      birthDate: formData.birthDate,
      gender: formData.gender,
      race: formData.race,
    };

    if (isEditing && athleteId) {
      updateAthlete(athleteId, athleteData);
    } else {
      addAthlete(athleteData);
    }

    // Navigate back
    navigate(-1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUrlBlur = () => {
    if (urlInput && urlInput.startsWith('http')) {
      setImageToCrop(urlInput);
      setIsCropModalOpen(true);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value);
  };


  return (
    <div className="container add-athlete-container">
      <div className="add-athlete-header">
        <h1>{isEditing ? 'Editar Atleta' : 'Adicionar Novo Atleta'}</h1>
        <p>{isEditing ? 'Atualize os dados do atleta no sistema.' : 'Preencha os dados básicos para cadastrar um novo atleta no sistema.'}</p>
      </div>

      <Card className="add-athlete-card">
        <form onSubmit={handleSubmit} className="add-athlete-form">
          <div className="form-group">
            <label htmlFor="name">Nome Completo</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              required 
              placeholder="Ex: João Silva"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sport">Esporte</label>
              <input 
                list="sports"
                id="sport" 
                name="sport" 
                required 
                placeholder="Ex: Futebol, Basquete..."
                value={formData.sport}
                onChange={handleChange}
              />
              <datalist id="sports">
                <option value="Futebol" />
                <option value="Basquete" />
                <option value="Vôlei" />
                <option value="Natação" />
                <option value="Atletismo" />
                <option value="Ciclismo" />
                <option value="Lutas / Artes Marciais" />
                <option value="Crossfit" />
                <option value="Musculação" />
              </datalist>
            </div>

            <div className="form-group">
              <label htmlFor="sportObservation">Observação do Esporte</label>
              <input 
                type="text" 
                id="sportObservation" 
                name="sportObservation" 
                placeholder="Ex: Posição, Setor..."
                value={formData.sportObservation}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Categoria</label>
              <select id="category" name="category" value={formData.category} onChange={handleChange}>
                <option value="Profissional">Profissional</option>
                <option value="Sub-20">Sub-20</option>
                <option value="Sub-17">Sub-17</option>
                <option value="Sub-15">Sub-15</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="competitivePhase">Fase / Objetivo</label>
              <select 
                id="competitivePhase" 
                name="competitivePhase" 
                required 
                value={formData.competitivePhase}
                onChange={handleChange}
              >
                <option value="" disabled>Selecione uma fase</option>
                <option value="Pré-temporada">Pré-temporada</option>
                <option value="Competição">Competição</option>
                <option value="Transição">Transição</option>
                <option value="Férias">Férias</option>
                <option value="Ganho de peso">Ganho de peso</option>
                <option value="Perda de peso">Perda de peso</option>
                <option value="Manutenção">Manutenção</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gender">Sexo</label>
              <select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="race">Raça / Etnia</label>
              <select id="race" name="race" value={formData.race} onChange={handleChange}>
                <option value="Branco">Branco</option>
                <option value="Negro">Negro</option>
                <option value="Asiático">Asiático</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="birthDate">Data de Nascimento</label>
              <DatePicker 
                id="birthDate" 
                name="birthDate" 
                value={formData.birthDate} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="photoUrl">URL da Foto do Atleta</label>
              <div className="url-input-container">
                <div className="input-with-icon">
                  <LinkIcon size={18} className="input-icon" />
                  <input 
                    type="url" 
                    id="photoUrl" 
                    placeholder="Cole o link da imagem aqui (ex: https://...)"
                    value={urlInput}
                    onChange={handleUrlChange}
                    onBlur={handleUrlBlur}
                  />
                </div>
                
                {formData.photoUrl && (
                  <div className="photo-preview-box">
                    <div className="photo-preview-avatar">
                      <AthletePhoto 
                        athlete={{ ...formData, id: 'temp' } as Athlete} 
                        size={72} 
                      />
                    </div>
                    <div className="photo-preview-info">
                      <span>Imagem Ajustada</span>
                      <button 
                        type="button" 
                        className="btn-link"
                        onClick={() => {
                          setImageToCrop(urlInput || formData.photoUrl);
                          setIsCropModalOpen(true);
                        }}
                      >
                        <Scissors size={14} /> Reajustar Recorte
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isCropModalOpen && (
            <ImageCropperModal
              image={imageToCrop}
              initialSettings={formData.cropSettings}
              onClose={() => setIsCropModalOpen(false)}
              onCropComplete={(settings) => {
                setFormData(prev => ({ 
                  ...prev, 
                  photoUrl: imageToCrop,
                  cropSettings: settings 
                }));
              }}
            />
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Salvar Alterações' : 'Salvar Atleta'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
