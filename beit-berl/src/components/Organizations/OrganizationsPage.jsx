import React, { useState } from 'react';
import OrgCard from './OrgCard';
import OrgDetailsModal from './OrgDetailsModal';
import { HiOutlineSearch } from "react-icons/hi";
import './Organizations.css';

const OrganizationsPage = () => {
  const [orgs, setOrgs] = useState([
  { 
    id: 1, 
    name: 'שם הארגון', 
    description: 'כאן נשים תיאור של הארגון. אם זה ארגון או עמותה את כמות הנושאים שחיים בתחילות רחו.', 
    city: 'עיר',
    contact: 'רכז המתנדבים: שם של הרכז',
    additionalInfo: 'פרטי יצירת קשר - טלפון או מייל (מה שהרכז הכניסף)'
  },
  { 
    id: 2, 
    name: 'שם הארגון', 
    description: 'כאן נשים תיאור של הארגון. אם זה ארגון או עמותה את כמות הנושאים שחיים בתחילות רחו.', 
    city: 'עיר',
    contact: 'רכז המתנדבים: שם של הרכז',
    additionalInfo: 'פרטי יצירת קשר - טלפון או מייל (מה שהרכז הכניסף)'
  },
  { 
    id: 3, 
    name: 'שם הארגון', 
    description: 'כאן נשים תיאור של הארגון. אם זה ארגון או עמותה את כמות הנושאים שחיים בתחילות רחו.', 
    city: 'עיר',
    contact: 'רכז המתנדבים: שם של הרכז',
    additionalInfo: 'פרטי יצירת קשר - טלפון או מייל (מה שהרכז הכניסף)'
  },
  { 
    id: 4, 
    name: 'שם הארגון', 
    description: 'כאן נשים תיאור של הארגון. אם זה ארגון או עמותה את כמות הנושאים שחיים בתחילות רחו.', 
    city: 'עיר',
    contact: 'רכז המתנדבים: שם של הרכז',
    additionalInfo: 'פרטי יצירת קשר - טלפון או מייל (מה שהרכז הכניסף)'
  },
  { 
    id: 5, 
    name: 'שם הארגון', 
    description: 'כאן נשים תיאור של הארגון. אם זה ארגון או עמותה את כמות הנושאים שחיים בתחילות רחו.', 
    city: 'עיר',
    contact: 'רכז המתנדבים: שם של הרכז',
    additionalInfo: 'פרטי יצירת קשר - טלפון או מייל (מה שהרכז הכניסף)'
  },
  { 
    id: 6, 
    name: 'שם הארגון', 
    description: 'כאן נשים תיאור של הארגון. אם זה ארגון או עמותה את כמות הנושאים שחיים בתחילות רחו.', 
    city: 'עיר',
    contact: 'רכז המתנדבים: שם של הרכז',
    additionalInfo: 'פרטי יצירת קשר - טלפון או מייל (מה שהרכז הכניסף)'
  }
]);

  const [selectedOrg, setSelectedOrg] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleDeleteOrg = (orgId) => {
    const updated = orgs.filter(org => org.id !== orgId);
    setOrgs(updated);
    setSelectedOrg(null);
  };

  const handleSaveOrg = (newOrg) => {
    const exists = orgs.find(o => o.id === newOrg.id);
    if (exists) {
      setOrgs(orgs.map(o => (o.id === newOrg.id ? newOrg : o)));
    } else {
      setOrgs([...orgs, newOrg]);
    }
    setSelectedOrg(null);
    setIsAdding(false);
  };

  const filteredOrgs = orgs.filter((org) => 
    org.name.includes(searchTerm) && org.city.includes(cityFilter)
  );

  return (
    <div className="organizations-page" dir="rtl">
      {/* Header */}
      <div className="page-header">
        {/* Search and Filter Section */}
        <div className="search-section">
          <div className="search-inputs">
            <input
              type="text"
              placeholder="שם הארגון"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <input
              type="text"
              placeholder="עיר"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="search-input"
            />
            <button className="search-button">
              <HiOutlineSearch className="search-icon" />
            </button>
          </div>

          <button
            className="add-org-button"
            onClick={() => setIsAdding(true)}
          >
            הוספת ארגון חדש
          </button>
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="organizations-container">
        <div className="org-grid">
          {filteredOrgs.map((org) => (
            <OrgCard
              key={org.id}
              org={org}
              onShowDetails={setSelectedOrg}
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      {(selectedOrg || isAdding) && (
        <OrgDetailsModal
          org={
            selectedOrg || {
              id: Date.now(),
              name: '',
              description: '',
              city: '',
              contact: '',
              additionalInfo: ''
            }
          }
          onClose={() => {
            setSelectedOrg(null);
            setIsAdding(false);
          }}
          onSave={handleSaveOrg}
          onDelete={handleDeleteOrg}
        />
      )}
    </div>
  );
};

export default OrganizationsPage;
