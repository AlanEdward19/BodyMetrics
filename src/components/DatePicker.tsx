import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import './DatePicker.css';

interface DatePickerProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({ id, name, value, onChange, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(value ? value + 'T00:00:00' : new Date().toISOString()));
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDayClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, '0');
    const dd = String(newDate.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;
    
    // Create a synthetic event
    const event = {
      target: { name, value: formatted }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(event);
    setIsOpen(false);
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    dayNames.forEach(name => {
      days.push(<div key={`header-${name}`} className="datepicker-day-name">{name}</div>);
    });

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="datepicker-day empty"></div>);
    }

    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = selectedDate?.getDate() === i && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
      const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
      
      days.push(
        <div 
          key={i} 
          className={`datepicker-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => handleDayClick(i)}
        >
          {i}
        </div>
      );
    }
    return days;
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <div className="custom-datepicker-container" ref={containerRef}>
      <input 
        type="date" 
        id={id} 
        name={name} 
        value={value} 
        onChange={onChange} 
        required={required}
        max="9999-12-31" 
        className="custom-datepicker-input"
        style={{ backgroundImage: 'none' }}
      />
      <button 
        type="button" 
        className="datepicker-icon-button"
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={-1}
      >
        <CalendarIcon size={20} />
      </button>

      {isOpen && (
        <div className="datepicker-popover">
          <div className="datepicker-header">
            <button type="button" onClick={prevMonth}><ChevronLeft size={20} /></button>
            <div className="datepicker-month-year">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button type="button" onClick={nextMonth}><ChevronRight size={20} /></button>
          </div>
          <div className="datepicker-grid">
            {renderCalendar()}
          </div>
        </div>
      )}
    </div>
  );
};
