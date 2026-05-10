import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, User2 } from 'lucide-react';
import './SearchableSelect.css';

interface Option {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  noOptionsMessage?: string;
  onSearch?: (term: string) => void;
}

export function SearchableSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Selecionar...', 
  noOptionsMessage = 'Nenhum resultado encontrado',
  onSearch
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSearchedTerm, setLastSearchedTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
      setLastSearchedTerm('');
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  useEffect(() => {
    if (onSearch && searchTerm.length > 3 && filteredOptions.length <= 1 && searchTerm !== lastSearchedTerm) {
      const timer = setTimeout(() => {
        onSearch(searchTerm);
        setLastSearchedTerm(searchTerm);
      }, 2000); // Debounce de 2 segundos (2000ms)
      return () => clearTimeout(timer);
    }
  }, [searchTerm, filteredOptions.length, onSearch, lastSearchedTerm]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="searchable-select-container" ref={containerRef}>
      <div 
        className={`searchable-select-trigger ${isOpen ? 'active' : ''}`} 
        onClick={handleToggle}
      >
        <div className="trigger-content">
          <User2 size={18} className="trigger-icon" />
          <span className={`trigger-text ${!selectedOption ? 'placeholder' : ''}`}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
        </div>
        <ChevronDown size={20} className={`chevron-icon ${isOpen ? 'rotate' : ''}`} />
      </div>

      {isOpen && (
        <div className="searchable-select-dropdown">
          <div className="dropdown-search-wrapper">
            <Search size={16} className="dropdown-search-icon" />
            <input
              ref={inputRef}
              type="text"
              className="dropdown-search-input"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="dropdown-options-list">
            <div
              className={`dropdown-option ${value === '' ? 'selected' : ''}`}
              onClick={() => handleSelect('')}
              style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              <span className="option-name">-- Limpar seleção --</span>
              {value === '' && <Check size={16} className="check-icon" />}
            </div>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div
                  key={option.id}
                  className={`dropdown-option ${option.id === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(option.id)}
                >
                  <span className="option-name">{option.name}</span>
                  {option.id === value && <Check size={16} className="check-icon" />}
                </div>
              ))
            ) : (
              <div className="dropdown-no-results">{noOptionsMessage}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
