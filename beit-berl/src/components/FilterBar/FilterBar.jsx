
import React from 'react';
import './FilterBar.css';
import { HiOutlineSearch } from "react-icons/hi";

const FilterBar = ({ 
  searchTerm = '', 
  setSearchTerm = () => {}, 
  filterFirstName = '',
  setFilterFirstName = () => {},
  filterLastName = '',
  setFilterLastName = () => {},
  filterRole = '', 
  setFilterRole = () => {}, 
  filterStatus = '', 
  setFilterStatus = () => {},
  uniqueRoles = [],
  uniqueStatuses = [],
  clearFilters = () => {}
}) => {
  
  const handleClearFilters = () => {
    clearFilters();
  };

  return (
    <div className="filter-bar">
      <input
        type="text"
        placeholder="Search by email or phone..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      
      <input
        type="text"
        placeholder="Filter by first name"
        value={filterFirstName}
        onChange={(e) => setFilterFirstName(e.target.value)}
        className="search-input"
      />
      
      <input
        type="text"
        placeholder="Filter by last name"
        value={filterLastName}
        onChange={(e) => setFilterLastName(e.target.value)}
        className="search-input"
      />
      
      <select
        value={filterRole}
        onChange={(e) => setFilterRole(e.target.value)}
        className="filter-select"
      >
        <option value="">All Roles</option>
        {uniqueRoles.map(role => (
          <option key={role} value={role}>{role}</option>
        ))}
      </select>
      
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="filter-select"
      >
        <option value="">All Statuses</option>
        {uniqueStatuses.map(status => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>
      
      {(searchTerm || filterFirstName || filterLastName || filterRole || filterStatus) && (
        <button 
          className="search-btn clear-filter-btn" 
          onClick={handleClearFilters}
        >
          Clear Filters
        </button>
      )}
      
      <button className="search-btn" onClick={() => console.log("Filters applied")}>
        <HiOutlineSearch />
      </button>
    </div>
  );
};

export default FilterBar;