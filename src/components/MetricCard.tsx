import React from 'react';
import { Card } from './Card';
import { ArrowUp, ArrowDown, CheckCircle2 } from 'lucide-react';
import './MetricCard.css';

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  unit: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
    text: string;
    isGood?: boolean;
  };
  status?: {
    label: string;
    description: string;
  };
}

export function MetricCard({ icon, title, value, unit, trend, status }: MetricCardProps) {
  return (
    <Card className="metric-card">
      <div className="metric-header">
        <div className="metric-icon-wrapper">{icon}</div>
        <h3 className="metric-title">{title}</h3>
      </div>
      
      <div className="metric-body">
        {status ? (
          <div className="metric-status-box">
            <span className="status-label">{status.label}</span>
            <span className="status-desc">{status.description}</span>
          </div>
        ) : (
          <div className="metric-value-box">
            <span className="metric-value">{value}</span>
            <span className="metric-unit">{unit}</span>
          </div>
        )}
      </div>

      <div className="metric-footer">
        {trend && (
          <div className="metric-trend">
            <div className={`trend-badge ${trend.isGood !== undefined ? (trend.isGood ? 'good' : 'bad') : trend.direction}`}>
              {trend.direction === 'up' && <ArrowUp size={14} strokeWidth={3} />}
              {trend.direction === 'down' && <ArrowDown size={14} strokeWidth={3} />}
              {trend.direction === 'neutral' && <span style={{ padding: '0 4px' }}>-</span>}
              <span>{trend.value}</span>
            </div>
            <span className="trend-text">{trend.text}</span>
          </div>
        )}
        
        {status && (
          <div className="metric-status-footer">
            <CheckCircle2 size={16} className="status-check-icon" />
            <span className="status-footer-text">Tudo dentro da normalidade</span>
          </div>
        )}
        
        {/* Placeholder for Sparkline Chart */}
        {!status && (
          <div className={`sparkline-placeholder ${trend?.isGood !== undefined ? (trend.isGood ? 'good' : 'bad') : trend?.direction || 'neutral'}`}>
            <svg viewBox="0 0 100 30" className="sparkline-svg" preserveAspectRatio="none">
              {trend?.direction === 'up' ? (
                <path d="M0 30 L10 25 L20 28 L30 20 L40 22 L50 15 L60 18 L70 10 L80 12 L90 5 L100 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M0 0 L10 5 L20 2 L30 10 L40 8 L50 15 L60 12 L70 20 L80 18 L90 25 L100 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </div>
        )}
      </div>
    </Card>
  );
}
