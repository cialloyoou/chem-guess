import { useState, useEffect, useRef } from 'react';
import { searchChemistry, validateFormula } from '../utils/chemistry';
import debounce from 'lodash.debounce';
import '../styles/SearchBar.css';

function ChemistrySearchBar({ onSelect, disabled }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced search function
  const debouncedSearch = useRef(
    debounce(async (query) => {
      if (query.trim().length === 0) {
        setSearchResults([]);
        return;
      }

      try {
        const results = await searchChemistry(query);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      }
    }, 300)
  ).current;

  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Click outside to close results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedIndex(-1);
  };

  const handleSelect = (compound) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    onSelect(compound);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showResults || searchResults.length === 0) {
      if (e.key === 'Enter' && searchQuery.trim()) {
        // Allow direct formula input
        if (validateFormula(searchQuery)) {
          handleSelect({ formula: searchQuery.trim(), name: '直接输入' });
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleSelect(searchResults[selectedIndex]);
        } else if (searchQuery.trim() && validateFormula(searchQuery)) {
          handleSelect({ formula: searchQuery.trim(), name: '直接输入' });
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div className="search-bar-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="输入化学式或名称 (例如: H2SO4, 硫酸)..."
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          disabled={disabled}
        />
        {searchQuery && (
          <button
            className="clear-button"
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
              setShowResults(false);
              inputRef.current?.focus();
            }}
            disabled={disabled}
          >
            ✕
          </button>
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((result, index) => (
            <div
              key={index}
              className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="result-formula">{result.formula}</div>
              <div className="result-details">
                <span className="result-name">{result.name}</span>
                <span className="result-state">{result.state}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && searchQuery.trim() && searchResults.length === 0 && (
        <div className="search-results">
          <div className="search-result-item no-results">
            <div className="no-results-text">
              未找到匹配的化合物
              {validateFormula(searchQuery) && (
                <div className="direct-input-hint">
                  按 Enter 直接输入 "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChemistrySearchBar;

