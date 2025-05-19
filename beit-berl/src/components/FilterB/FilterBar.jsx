import React, { useState } from 'react';
import './FilterBar.css';
import { HiOutlineSearch } from "react-icons/hi";

const FilterBar = () => {
  const [filters, setFilters] = useState({
    firstName: '',
    lastName: '',
    role: '',
    org: '',
    status: ''
  });

  const handleChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleSearch = () => {
    console.log("🔍 תוצאות סינון:", filters);
  };

  return (
    <div className="filter-bar">
      <input
        type="text"
        placeholder="שם פרטי"
        value={filters.firstName}
        onChange={(e) => handleChange('firstName', e.target.value)}
      />
      <input
        type="text"
        placeholder="שם משפחה"
        value={filters.lastName}
        onChange={(e) => handleChange('lastName', e.target.value)}
      />
      <input
        type="text"
        placeholder="תפקיד"
        value={filters.role}
        onChange={(e) => handleChange('role', e.target.value)}
      />
      <input
        type="text"
        placeholder="ארגון"
        value={filters.org}
        onChange={(e) => handleChange('org', e.target.value)}
      />
      <input
        type="text"
        placeholder="סטטוס"
        value={filters.status}
        onChange={(e) => handleChange('status', e.target.value)}
      />
      <button className="search-btn" onClick={handleSearch}>
        <HiOutlineSearch />
      </button>
    </div>
  );
};

export default FilterBar;
