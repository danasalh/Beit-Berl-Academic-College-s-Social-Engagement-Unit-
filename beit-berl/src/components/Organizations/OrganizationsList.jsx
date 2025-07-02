import { useState, useEffect, useMemo, useCallback } from 'react';
import OrgCard from './OrgCard';
import OrgDetailsModal from './OrgDetailsModal';
import { HiOutlineSearch } from "react-icons/hi";
import { useOrganizations } from '../../Contexts/OrganizationsContext';
import { useUsers } from '../../Contexts/UsersContext';
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
    loading: usersLoading,
    currentUser,
    currentUserHasRole
  } = useUsers();

  const [selectedOrg, setSelectedOrg] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [isAdding, setIsAdding] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Memoize user roles to prevent recalculation on every render
  const userRoles = useMemo(() => ({
    isVolunteer: currentUserHasRole('volunteer') || currentUserHasRole('Volunteer'),
    isOrgRep: currentUserHasRole('orgRep') || currentUserHasRole('OrgRep'),
    isVc: currentUserHasRole('vc') || currentUserHasRole('Vc'),
    isAdmin: currentUserHasRole('admin') || currentUserHasRole('Admin')
  }), [currentUserHasRole]);

  const { isVolunteer, isOrgRep, isVc, isAdmin } = userRoles;

  // Memoize user's organization IDs
  const userOrgIds = useMemo(() => {
    if (!currentUser?.orgId) return [];
    return Array.isArray(currentUser.orgId) ? currentUser.orgId : [currentUser.orgId];
  }, [currentUser?.orgId]);

  // Helper function to get city value - memoized
  const getCityValue = useCallback((org) => {
    return org.City || org.city || org.CITY || org.location || org.Location || '';
  }, []);

  // Memoize role-based filtering
  const roleFilteredOrgs = useMemo(() => {
    if (!isOrgRep && !isVc) {
      return organizations;
    }

    if (userOrgIds.length === 0) {
      return [];
    }

    const filtered = organizations.filter(org => userOrgIds.includes(org.id));

    return filtered;
  }, [organizations, isOrgRep, isVc, userOrgIds]);

  // Memoize search and city filtering
  const filteredOrgs = useMemo(() => {
    let filtered = roleFilteredOrgs;

    // Only apply search, city, and status filters if user is not a VC or OrgRep
    if (!isVc && !isOrgRep) {
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(org => 
          org.name?.toLowerCase().includes(searchLower) ||
          org.description?.toLowerCase().includes(searchLower)
        );
      }

      if (cityFilter.trim()) {
        const cityLower = cityFilter.toLowerCase();
        filtered = filtered.filter(org => {
          const cityValue = getCityValue(org);
          return cityValue?.toLowerCase().includes(cityLower);
        });
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(org => {
          if (statusFilter === 'active') return org.status === true;
          if (statusFilter === 'inactive') return org.status === false;
          return true;
        });
      }
    }

    return filtered;
  }, [roleFilteredOrgs, searchTerm, cityFilter, statusFilter, isVc, isOrgRep, getCityValue, organizations.length, currentUser?.role]);

  // Load organizations and users when component mounts - optimized
  useEffect(() => {
    const loadData = async () => {
      if (dataLoaded) return; // Prevent multiple loads

      try {        
        const promises = [];
        
        // Load organizations if we don't have them yet
        if (organizations.length === 0 && !loading) {
          promises.push(getOrganizations());
        }
        
        // Load users if we don't have them yet
        if (users.length === 0 && !usersLoading) {
          promises.push(getUsers());
        }

        if (promises.length > 0) {
          await Promise.all(promises);
        }
        
        setDataLoaded(true);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    loadData();
  }, []); // Keep empty dependency array

  // Simplified debug effect - only log when loading states change
  useEffect(() => {
    if (loading || usersLoading) {
      // Debug logging can be added here if needed
    }
  }, [loading, usersLoading]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleDeleteOrg = useCallback(async (orgId) => {
    // Only allow admins to delete organizations
    if (!isAdmin) {
      alert('אין לך הרשאה למחוק ארגונים');
      return;
    }

    if (window.confirm("האם אתה בטוח שברצונך למחוק את הארגון?")) {
      try {
        await deleteOrganization(orgId);
        setSelectedOrg(null);
      } catch (err) {
        console.error('Failed to delete organization:', err);
        alert('שגיאה במחיקת הארגון');
      }
    }
  }, [isAdmin, deleteOrganization]);

  const handleSaveOrg = useCallback(async (orgData) => {
    // Prevent volunteers from saving organizations
    if (isVolunteer) {
      alert('אין לך הרשאה לשמור שינויים בארגונים');
      return;
    }

    try {
      if (orgData.id && organizations.find(o => o.id === orgData.id)) {
        // Update existing organization
        const { id, ...updateData } = orgData;
        await updateOrganization(id, updateData);
      } else {
        // Create new organization - set default values for new fields
        const { id, ...createData } = orgData;
        // Ensure new organizations have default status and link values
        const newOrgData = {
          ...createData,
          status: createData.status !== undefined ? createData.status : true, // Default to active
          link: createData.link || '' // Default to empty string
        };
        await createOrganization(newOrgData);
      }
      
      setSelectedOrg(null);
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to save organization:', err);
      alert('שגיאה בשמירת הארגון');
    }
  }, [isVolunteer, organizations, updateOrganization, createOrganization]);

  // Handle status change (admin only)
  const handleStatusChange = useCallback(async (orgId, newStatus) => {
    if (!isAdmin) {
      alert('אין לך הרשאה לשנות סטטוס ארגונים');
      return;
    }

    try {
      await updateOrganization(orgId, { status: newStatus });
      
      // Update the selected org if it's currently displayed
      if (selectedOrg && selectedOrg.id === orgId) {
        setSelectedOrg(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Failed to update organization status:', err);
      throw err; // Re-throw to let the modal handle the error display
    }
  }, [isAdmin, updateOrganization, selectedOrg]);

  const handleSearch = useCallback(async () => {
    if (cityFilter && !searchTerm) {
      // Search by city using the specific method
      try {
        await getOrganizationsByCity(cityFilter);
      } catch (err) {
        console.error('Failed to search by city:', err);
      }
    } else {
      // For general search, we rely on the memoized filtering
    }
  }, [cityFilter, searchTerm, getOrganizationsByCity]);

  const handleRefresh = useCallback(() => {
    setDataLoaded(false);
    getOrganizations();
    getUsers();
  }, [getOrganizations, getUsers]);

  // Early returns for loading and error states
  if (loading || usersLoading) {
    return (
      <div className="organizations-page" dir="rtl">
        <div className="loading-container">
          <div className="loading-message">
            {loading && 'טוען ארגונים...'}
            {usersLoading && 'טוען משתמשים...'}
          </div>
          <button onClick={handleRefresh} className="retry-button">
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
        <button onClick={handleRefresh} className="retry-button">
          נסה שוב
        </button>
      </div>
    );
  }

  return (
    <div className="organizations-page" dir="rtl">
      {/* Only show header for admin and volunteer users (not VC or OrgRep) */}
      {!isVc && !isOrgRep && (
        <div className="page-header">
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
              <select
                className="search-input"
                style={{ maxWidth: '10rem', minWidth: '7rem', fontWeight: 600 }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">הכל</option>
                <option value="active">פעיל</option>
                <option value="inactive">לא פעיל</option>
              </select>
              <button className="search-button" onClick={handleSearch}>
                <HiOutlineSearch className="search-icon" />
              </button>
            </div>

            {/* Only show "Add Organization" button if user is admin */}
            {isAdmin && (
              <button
                className="add-org-button"
                onClick={() => setIsAdding(true)}
              >
                הוספת ארגון חדש
              </button>
            )}
          </div>
        </div>
      )}

      {/* Organizations Grid */}
      <div className="organizations-container">
        {filteredOrgs.length === 0 ? (
          <div className="no-results">
            {isOrgRep ? (
              userOrgIds.length > 0 
                ? 'לא נמצאו סניפים המתאימים לחיפוש'
                : 'לא הוגדרו ארגונים עבור המשתמש שלך'
            ) : (
              organizations.length === 0 ? 'אין ארגונים רשומים' : 'לא נמצאו ארגונים המתאימים לחיפוש'
            )}
          </div>
        ) : (
          <div className="org-grid">
            {filteredOrgs.map((org) => (
              <OrgCard
                key={org.id}
                org={org}
                onShowDetails={setSelectedOrg}
                allUsers={users}
                isVolunteer={isVolunteer}
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
              vcId: [],
              link: '', // Default empty link
              status: true // Default to active status
            }
          }
          onClose={() => {
            setSelectedOrg(null);
            setIsAdding(false);
          }}
          onSave={handleSaveOrg}
          onDelete={handleDeleteOrg}
          onStatusChange={handleStatusChange} // Pass the status change handler
          isNew={isAdding}
          allUsers={users}
          isVolunteer={isVolunteer}
        />
      )}
    </div>
  );
};

export default OrganizationsList;