import React from 'react';
import './FilterPanel.css';

function FilterPanel({ filters, handleFilterChange, handleClearFilters }) {
  return (
    <div className="filter-panel">
      <label>
        Start Date:
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
          className="filter-input"
        />
      </label>
      <label>
        End Date:
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          className="filter-input"
        />
      </label>
      {filters.userRole === 'Manager' && (
        <label>
          Cluster:
          <input
            type="text"
            name="cluster"
            value={filters.cluster}
            onChange={handleFilterChange}
            placeholder="Cluster"
            className="filter-input"
          />
        </label>
      )}
      <button className="clear-filters-button" onClick={handleClearFilters}>
        Clear All Filters
      </button>
    </div>
  );
}

export default FilterPanel;
