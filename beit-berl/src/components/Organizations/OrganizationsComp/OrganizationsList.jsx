import React, { useState, useEffect } from 'react';
import OrgCard from './OrgCard';
import OrgDetailsModal from './OrgDetailsModal';
import { HiOutlineSearch } from "react-icons/hi";
import { useOrganizations } from '../../../Contexts/OrganizationsContext';
import { useUsers } from '../../../Contexts/UsersContext';
import './Organizations.css';

const OrganizationsList = () => {
  const {
    organizations,
    loading,
    error,
    getOrganizations,
    getOrganizationsByCity,
    createOrganization,
    updateOrganization,
    deleteOrganization
  } = useOrganizations();

  const {
    users,
    getUsers,
    loading: usersLoading
  } = useUsers();

  const [selectedOrg, setSelectedOrg] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [filteredOrgs, setFilteredOrgs] = useState([]);

  // Helper function to get city value - handles different possible field names
  const getCityValue = (org) => {
    return org.City || org.city || org.CITY || org.location || org.Location || '';
  };

  // Load organizations and users when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        if (organizations.length === 0 && !loading) {
          await getOrganizations();
        }
        if (users.length === 0 && !usersLoading) {
          await getUsers();
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    loadData();
    // eslint-disable-next-line
  }, []);

  // Filter organizations based on search and city filter
  useEffect(() => {
    let filtered = organizations;

    if (searchTerm) {
      filtered = filtered.filter(org => 
        org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (cityFilter) {
      filtered = filtered.filter(org => {
        const cityValue = getCityValue(org);
        return cityValue?.toLowerCase().includes(cityFilter.toLowerCase());
      });
    }

    setFilteredOrgs(filtered);
  }, [organizations, searchTerm, cityFilter]);

  const handleDeleteOrg = async (orgId) => {
    if (window.confirm("האם את בטוחה שברצונך למחוק את הארגון?")) {
      try {
        await deleteOrganization(orgId);
        setSelectedOrg(null);
      } catch (err) {
        alert('שגיאה במחיקת הארגון');
      }
    }
  };

  const handleSaveOrg = async (orgData) => {
    try {
      if (orgData.id && organizations.find(o => o.id === orgData.id)) {
        // Update existing organization
        const { id, ...updateData } = orgData;
        await updateOrganization(id, updateData);
      } else {
        // Create new organization
        const { id, ...createData } = orgData;
        await createOrganization(createData);
      }
      setSelectedOrg(null);
      setIsAdding(false);
    } catch (err) {
      alert('שגיאה בשמירת הארגון');
    }
  };

  const handleSearch = async () => {
    if (cityFilter && !searchTerm) {
      try {
        await getOrganizationsByCity(cityFilter);
      } catch (err) {
        console.error('Failed to search by city:', err);
      }
    }
  };

  if (loading || usersLoading) {
    return (
      <div className="organizations-page" dir="rtl">
        <div className="loading-container">
          <div className="loading-message">
            {loading && 'טוען ארגונים...'}
            {usersLoading && 'טוען משתמשים...'}
          </div>
          <button 
            onClick={() => {
              getOrganizations();
              getUsers();
            }}
            className="retry-button"
          >
            רענן
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="organizations-page" dir="rtl">
        <div className="error-message">שגיאה בטעינת הארגונים: {error}</div>
        <button onClick={() => {
          getOrganizations();
          getUsers();
        }} className="retry-button">
          נסה שוב
        </button>
      </div>
    );
  }

  return (
    <div className="organizations-page" dir="rtl" style={{ background: "#f9fafb", minHeight: "100vh" }}>
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
            <button className="search-button" onClick={handleSearch}>
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
      <div className="organizations-container" style={{ background: "transparent" }}>
        {filteredOrgs.length === 0 ? (
          <div className="no-results">
            {organizations.length === 0 ? 'אין ארגונים רשומים' : 'לא נמצאו ארגונים המתאימים לחיפוש'}
          </div>
        ) : (
          <div className="org-grid">
            {filteredOrgs.map((org) => (
              <OrgCard
                key={org.id}
                org={org}
                onShowDetails={setSelectedOrg}
                allUsers={users}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {(selectedOrg || isAdding) && (
        <OrgDetailsModal
          org={
            selectedOrg || {
              name: '',
              description: '',
              City: '',
              contactInfo: '',
              orgRepId: null,
              vcId: []
            }
          }
          onClose={() => {
            setSelectedOrg(null);
            setIsAdding(false);
          }}
          onSave={handleSaveOrg}
          onDelete={handleDeleteOrg}
          isNew={isAdding}
          allUsers={users}
        />
      )}
    </div>
  );
};

export default OrganizationsList;