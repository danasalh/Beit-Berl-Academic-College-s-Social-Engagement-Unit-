import { useState, useEffect, useMemo, useCallback } from 'react';
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
    loading: usersLoading,
    currentUser,
    currentUserHasRole
  } = useUsers();

  const [selectedOrg, setSelectedOrg] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Memoize user roles to prevent recalculation on every render
  const userRoles = useMemo(() => ({
    isVolunteer: currentUserHasRole('volunteer') || currentUserHasRole('Volunteer'),
    isOrgRep: currentUserHasRole('orgRep') || currentUserHasRole('OrgRep'),
    isVc: currentUserHasRole('vc') || currentUserHasRole('Vc')
  }), [currentUserHasRole]);

  const { isVolunteer, isOrgRep, isVc } = userRoles;

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
      console.log('⚠️ No organizations assigned to user');
      return [];
    }

    const filtered = organizations.filter(org => userOrgIds.includes(org.id));
    
    console.log('🔍 Role-filtered organizations:', {
      role: isVc ? 'VC' : 'OrgRep',
      userOrgIds,
      totalOrgs: organizations.length,
      filteredCount: filtered.length
    });

    return filtered;
  }, [organizations, isOrgRep, isVc, userOrgIds]);

  // Memoize search and city filtering
  const filteredOrgs = useMemo(() => {
    let filtered = roleFilteredOrgs;

    // Only apply search and city filters if user is not a VC
    if (!isVc) {
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
    }

    console.log('🔍 Final filtered organizations:', {
      original: organizations.length,
      roleFiltered: roleFilteredOrgs.length,
      final: filtered.length,
      userRole: currentUser?.role,
      isVc
    });

    return filtered;
  }, [roleFilteredOrgs, searchTerm, cityFilter, isVc, getCityValue, organizations.length, currentUser?.role]);

  // Load organizations and users when component mounts - optimized
  useEffect(() => {
    const loadData = async () => {
      if (dataLoaded) return; // Prevent multiple loads

      try {
        console.log('🔄 Loading organizations and users...');
        
        const promises = [];
        
        // Load organizations if we don't have them yet
        if (organizations.length === 0 && !loading) {
          promises.push(getOrganizations());
        }
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
      console.log('📊 Loading state - orgs:', loading, 'users:', usersLoading);
    }
  }, [loading, usersLoading]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleDeleteOrg = useCallback(async (orgId) => {
    // Prevent volunteers and orgReps from deleting organizations
    if (isVolunteer || isOrgRep) {
      console.log('❌ Volunteer and orgRep users cannot delete organizations');
      return;
    }

    if (window.confirm("האם את בטוחה שברצונך למחוק את הארגון?")) {
      try {
        await deleteOrganization(orgId);
        setSelectedOrg(null);
      } catch (err) {
        alert('שגיאה במחיקת הארגון');
      }
    }
  }, [isVolunteer, isOrgRep, deleteOrganization]);

  const handleSaveOrg = useCallback(async (orgData) => {
    // Prevent volunteers and orgReps from saving organizations
    if (isVolunteer || isOrgRep) {
      console.log('❌ Volunteer and orgRep users cannot create/edit organizations');
      return;
    }

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
  }, [isVolunteer, isOrgRep, organizations, updateOrganization, createOrganization]);

  const handleSearch = useCallback(async () => {
    if (cityFilter && !searchTerm) {
      try {
        await getOrganizationsByCity(cityFilter);
      } catch (err) {
        console.error('Failed to search by city:', err);
      }
    } else {
      // For general search, we rely on the memoized filtering
      console.log('🔍 Performing client-side search with filters:', {
        searchTerm,
        cityFilter
      });
    }
  }, [cityFilter, searchTerm, getOrganizationsByCity]);

  const handleRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
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
      {/* Only show header for non-VC users */}
      {!isVc && (
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
              <button className="search-button" onClick={handleSearch}>
                <HiOutlineSearch className="search-icon" />
              </button>
            </div>

            {/* Only show "Add Organization" button if user is admin */}
            {!isVolunteer && !isOrgRep && !isVc && (
              <button
                className="add-org-button"
                onClick={() => setIsAdding(true)}
              >
                הוספת ארגון חדש
              </button>
            )}
          </div>

          {/* Only show OrgRep info message if user is OrgRep */}
          {isOrgRep && (
            <div className="role-info-message">
              <p>מציג את רשימת הסניפים של הארגון שלך</p>
            </div>
          )}
        </div>
      )}

      {/* Organizations Grid */}
      <div className="organizations-container" style={{ background: "transparent" }}>
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
          isVolunteer={isVolunteer}
        />
      )}
    </div>
  );
};

export default OrganizationsList;