import './FilterBar.css';
import { HiOutlineSearch} from "react-icons/hi";
import { getRoleLabel } from '../../utils/roleTranslations';

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
  filterOrganization = '',
  setFilterOrganization = () => {},
  uniqueRoles = [],
  uniqueStatuses = [],
  uniqueOrganizations = [],
  clearFilters = () => {}
}) => {
  
  const handleClearFilters = () => {
    clearFilters();
  };

  return (
    <div className="filter-bar">
      <input
        type="text"
        placeholder="חיפוש לפי טלפון או מייל"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />
      
      <input
        type="text"
        placeholder="חיפוש לפי שם פרטי" 
        value={filterFirstName}
        onChange={(e) => setFilterFirstName(e.target.value)}
        className="search-input"
      />
      
      <input
        type="text"
        placeholder="חיפוש לפי שם משפחה"  
        value={filterLastName}
        onChange={(e) => setFilterLastName(e.target.value)}
        className="search-input"
      />
      
      <select
        value={filterRole}
        onChange={(e) => setFilterRole(e.target.value)}
        className="filter-select"
      >
        <option value="">כל התפקידים</option>
        {uniqueRoles.map(role => (
          <option key={role} value={role}>{getRoleLabel(role)}</option>
        ))}
      </select>
      
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="filter-select"
      >
        <option value="">כל הסטטוסים</option>
        {uniqueStatuses.map(status => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>

      <select
        value={filterOrganization}
        onChange={(e) => setFilterOrganization(e.target.value)}
        className="filter-select"
      >
        <option value="">כל הארגונים</option>
        {uniqueOrganizations.map(org => (
          <option key={org.id} value={org.name}>{org.name}</option>
        ))}
      </select>
      
      {(searchTerm || filterFirstName || filterLastName || filterRole || filterStatus || filterOrganization) && (
        <button 
          className="search-btn clear-filter-btn" 
          onClick={handleClearFilters}
        >
          ניקוי סינון
        </button>
      )}
      
      <button className="search-btn">
        <HiOutlineSearch />
      </button>
    </div>
  );
};

export default FilterBar;