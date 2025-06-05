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
        console.log('🔄 Loading organizations and users...');
        
        // Load organizations if we don't have them yet
        if (organizations.length === 0 && !loading) {
          await getOrganizations();
        }
        
        // Load users if we don't have them yet
        if (users.length === 0 && !usersLoading) {
          await getUsers();
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    loadData();
  }, []); // Empty dependency array to run only once

  // Debug effect to track state changes
  useEffect(() => {
    console.log('📊 Organizations state - loading:', loading, 'count:', organizations.length, 'error:', error);
    console.log('👥 Users state - loading:', usersLoading, 'count:', users.length);
  }, [loading, organizations, error, usersLoading, users]);

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

    console.log('🔍 Filtered organizations:', filtered.length, 'out of', organizations.length);
    setFilteredOrgs(filtered);
  }, [organizations, searchTerm, cityFilter]);

  const handleDeleteOrg = async (orgId) => {
    if (window.confirm("האם את בטוחה שברצונך למחוק את הארגון?")) {
      try {
        await deleteOrganization(orgId);
        setSelectedOrg(null);
        console.log('Organization deleted successfully');
      } catch (err) {
        console.error('Failed to delete organization:', err);
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
        console.log('Organization updated successfully');
      } else {
        // Create new organization
        const { id, ...createData } = orgData;
        await createOrganization(createData);
        console.log('Organization created successfully');
      }
      
      setSelectedOrg(null);
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to save organization:', err);
      alert('שגיאה בשמירת הארגון');
    }
  };

  const handleSearch = async () => {
    if (cityFilter && !searchTerm) {
      // Search by city using the specific method
      try {
        await getOrganizationsByCity(cityFilter);
      } catch (err) {
        console.error('Failed to search by city:', err);
      }
    } else {
      // For general search, we rely on the useEffect filtering
      console.log('🔍 Performing client-side search with filters:', {
        searchTerm,
        cityFilter
      });
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
              console.log('🔄 Manual refresh triggered');
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
      <div className="organizations-container">
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