import React from 'react';
import './Loading.css';

interface LoadingProps {
  fullScreen?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'white';
}

export const Loading: React.FC<LoadingProps> = ({ 
  fullScreen = false, 
  message = 'Carregando...', 
  size = 'md',
  variant = 'primary'
}) => {
  const containerClass = fullScreen ? 'loading-container-fullscreen' : 'loading-container-inline';
  
  return (
    <div className={containerClass}>
      <div className="loading-content">
        <div className={`loading-spinner spinner-${size} spinner-${variant}`}>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        {message && <p className="loading-message" style={{ marginTop: '0.75rem' }}>{message}</p>}
      </div>
    </div>
  );
};
