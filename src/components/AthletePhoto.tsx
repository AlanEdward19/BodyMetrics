import type { Athlete } from '../types/athlete';
import { User2 } from 'lucide-react';
import './AthletePhoto.css';

interface AthletePhotoProps {
  athlete: Athlete;
  size?: number;
  className?: string;
}

export function AthletePhoto({ athlete, size = 140, className = '' }: AthletePhotoProps) {
  if (!athlete.photoUrl) {
    return (
      <div 
        className={`athlete-photo-placeholder ${className}`}
        style={{ width: size, height: size }}
      >
        <User2 size={size * 0.45} />
      </div>
    );
  }

  const { cropSettings } = athlete;

  if (!cropSettings) {
    return (
      <div 
        className={`athlete-photo-container-css ${className}`}
        style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden' }}
      >
        <img 
          src={athlete.photoUrl} 
          alt={athlete.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  // Percentage-based crop calculation
  // scale = 100 / crop_width_percent
  const scale = 100 / cropSettings.width;
  
  // translate = -crop_coord_percent * scale
  const translateX = -cropSettings.x * scale;
  const translateY = -cropSettings.y * scale;

  return (
    <div 
      className={`athlete-photo-container-css ${className}`}
      style={{ 
        width: size, 
        height: size,
        overflow: 'hidden',
        position: 'relative',
        borderRadius: '50%',
        backgroundColor: '#f1f5f9'
      }}
    >
      <img 
        src={athlete.photoUrl} 
        alt={athlete.name}
        style={{
          position: 'absolute',
          width: `${scale * 100}%`,
          height: 'auto',
          minHeight: `${scale * 100}%`,
          top: `${translateY}%`,
          left: `${translateX}%`,
          transform: `rotate(${cropSettings.rotation}deg)`,
          transformOrigin: 'center center', // Note: rotation might need more complex math if not centered
          transition: 'none'
        }}
      />
    </div>
  );
}
