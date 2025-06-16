// src/components/UsersData/UsersData.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useUsers } from '../../Contexts/UsersContext';
import { useOrganizations } from '../../Contexts/OrganizationsContext';
import { getRoleLabel } from '../../utils/roleTranslations';
import UserProfile from '../UserProfile/UserProfile';
import FilterBar from '../FilterBar/FilterBar';
import FeedbackPopup from '../PopUps/FeedbackPopup/FeedbackPopup';
import HoursData from '../HoursData/HoursData'; 
import { exportUsersToExcel } from '../../utils/excelExport';
import UserEdit from './UserEdit';
import './UsersData.css';
import { HiOutlineEye, HiOutlinePencil, HiOutlineClock } from 'react-icons/hi';

const UsersData = () => {
  const {
    users,
    loading,
    error,
    getUsers,
    updateUser,
  } = useUsers();

  const {
    organizations,
    getOrganizations,
    loading: orgLoading
  } = useOrganizations();

  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFirstName, setFilterFirstName] = useState('');
  const [filterLastName, setFilterLastName] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrganization, setFilterOrganization] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [componentLoading, setComponentLoading] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);

  //feedback states
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [feedbackTargetUser, setFeedbackTargetUser] = useState(null);

  // Handle feedback for volunteer users
  const handleFeedback = useCallback((user) => {
    console.log('Opening feedback popup for user:', user.id);
    console.log('User data:', user);
    setFeedbackTargetUser(user);
    setShowFeedbackPopup(true);
    // Close the profile modal when opening feedback
    setShowProfile(false);
    console.log('State should be updated - showFeedbackPopup: true');
  }, []);

  // Close feedback popup
  const closeFeedbackPopup = useCallback(() => {
    setShowFeedbackPopup(false);
    setFeedbackTargetUser(null);
  }, []);

  // Handle hours management - UPDATED
  const handleHours = useCallback((user) => {
    console.log('Opening hours management for user:', user.id);
    setSelectedUser(user);
    setShowHoursModal(true);
    // Close other modals when opening hours
    setShowProfile(false);
    setShowEditModal(false);
  }, []);

  // Close hours modal
  const closeHoursModal = useCallback(() => {
    setShowHoursModal(false);
    setSelectedUser(null);
  }, []);

  // Success notification state
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Success notification handler
  const showSuccess = useCallback((message) => {
    setSuccessMessage(message);
    setShowSuccessPopup(true);
    setTimeout(() => {
      setShowSuccessPopup(false);
      setSuccessMessage('');
    }, 3000); // Hide after 3 seconds
  }, []);

  // Fetch users and organizations on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setComponentLoading(true);
        console.log('🚀 Fetching users and organizations on component mount...');

        // Fetch both users and organizations
        await Promise.all([
          users.length === 0 ? getUsers() : Promise.resolve(),
          organizations.length === 0 ? getOrganizations() : Promise.resolve()
        ]);

        console.log('✅ Data fetched successfully');
      } catch (error) {
        console.error('❌ Error fetching data:', error);
      } finally {
        setComponentLoading(false);
      }
    };

    // Only fetch if we don't have data already and not currently loading
    if ((users.length === 0 || organizations.length === 0) && !loading && !orgLoading) {
      fetchData();
    }
  }, []); // Empty dependency array - only run once on mount

  // Helper function to refresh data after updates
  const refreshData = useCallback(async () => {
    try {
      console.log('🔄 Refreshing users data after update...');
      await getUsers(); // This will fetch fresh data from Firebase
      console.log('✅ Users data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    }
  }, [getUsers]);

  // Helper function to get organization names from IDs
  const getOrganizationNames = useCallback((orgIds) => {
    if (!orgIds) return 'N/A';

    // Handle single orgId (backward compatibility)
    if (typeof orgIds === 'string' || typeof orgIds === 'number') {
      const org = organizations.find(o => o.id === orgIds || o.id === parseInt(orgIds));
      return org ? org.name || `Org ${org.id}` : `Unknown Org (${orgIds})`;
    }

    // Handle array of orgIds
    if (Array.isArray(orgIds)) {
      if (orgIds.length === 0) return 'N/A';

      const orgNames = orgIds.map(orgId => {
        const org = organizations.find(o => o.id === orgId || o.id === parseInt(orgId));
        return org ? org.name || `Org ${org.id}` : `Unknown Org (${orgId})`;
      });

      return orgNames.join(', ');
    }

    return 'N/A';
  }, [organizations]);

  // Get organization object by ID
  const getOrganizationById = useCallback((orgId) => {
    return organizations.find(o => o.id === orgId || o.id === parseInt(orgId));
  }, [organizations]);

  // Status management configuration
  const getStatusAction = useCallback((status) => {
    switch (status) {
      case 'pending':
      case 'waiting for approval':
        return { label: 'Approve', newStatus: 'approved', variant: 'success' };
      case 'approved':
        return { label: 'Deactivate', newStatus: 'inactive', variant: 'warning' };
      default:
        return null;
    }
  }, []);

  // Handle status update
  const handleStatusUpdate = useCallback(async (user) => {
    const statusAction = getStatusAction(user.status);
    if (!statusAction) return;

    // Use docId instead of id for status updating
    setStatusUpdating(user.docId);

    try {
      console.log(`Updating user ${user.docId} status from ${user.status} to ${statusAction.newStatus}`);

      // Use docId for the update
      await updateUser(user.docId, { status: statusAction.newStatus });

      // Refresh data after successful update
      await refreshData();

      // Show success message
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
      showSuccess(`${userName} status updated to ${statusAction.newStatus} successfully!`);

      console.log(`Successfully updated user ${user.docId} status to ${statusAction.newStatus}`);
    } catch (err) {
      console.error('Error updating user status:', err);
      alert(`Failed to update user status: ${err.message}`);
    } finally {
      setStatusUpdating(null);
    }
  }, [updateUser, getStatusAction, refreshData, showSuccess]);

  // Status update in modal
  const handleStatusUpdateInModal = useCallback(async (newStatus) => {
    if (!selectedUser?.docId) {
      console.error('No selected user document ID');
      return;
    }

    try {
      console.log(`Updating user ${selectedUser.docId} status from ${selectedUser.status} to ${newStatus}`);

      // Use docId for the update
      await updateUser(selectedUser.docId, { status: newStatus });

      // Update selected user object locally
      setSelectedUser(prev => ({
        ...prev,
        status: newStatus
      }));

      // Refresh data after successful update
      await refreshData();

      // Show success message
      const userName = `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser.email || 'User';
      showSuccess(`${userName} status updated to ${newStatus} successfully!`);

      console.log(`Successfully updated user ${selectedUser.docId} status to ${newStatus}`);
    } catch (err) {
      console.error('Error updating user status:', err);
      alert(`Failed to update user status: ${err.message}`);
    }
  }, [selectedUser, updateUser, refreshData, showSuccess]);

  // Handle watch user profile
  const handleWatch = useCallback((user) => {
    console.log('Viewing user profile for user ID:', user.id);
    setSelectedUser(user);
    setShowProfile(true);
  }, []);

  // Handle edit user
  const handleEdit = useCallback((user) => {
    console.log('Editing user with ID:', user.id, 'Document ID:', user.docId);

    // Get user's current organizations
    let userOrganizations = [];
    if (user.orgId) {
      if (Array.isArray(user.orgId)) {
        userOrganizations = user.orgId.map(orgId => {
          const org = getOrganizationById(orgId);
          return org ? { id: org.id, name: org.name || `Org ${org.id}` } : null;
        }).filter(Boolean);
      } else {
        const org = getOrganizationById(user.orgId);
        if (org) {
          userOrganizations = [{ id: org.id, name: org.name || `Org ${org.id}` }];
        }
      }
    }

    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      role: user.role || ''
    });
    setSelectedOrganizations(userOrganizations);
    setShowEditModal(true);
  }, [getOrganizationById]);

  // Handle form input change
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Handle organization selection
  const handleOrganizationSelect = useCallback((e) => {
    const orgId = parseInt(e.target.value);
    if (!orgId) return;

    // Check if organization is already selected
    if (selectedOrganizations.some(org => org.id === orgId)) {
      alert('This organization is already selected');
      return;
    }

    // Check max limit
    if (selectedOrganizations.length >= 3) {
      alert('Maximum 3 organizations allowed');
      return;
    }

    const org = getOrganizationById(orgId);
    if (org) {
      setSelectedOrganizations(prev => [...prev, { id: org.id, name: org.name || `Org ${org.id}` }]);
    }

    // Reset dropdown
    e.target.value = '';
  }, [selectedOrganizations, getOrganizationById]);

  // Remove selected organization
  const removeSelectedOrganization = useCallback((orgId) => {
    setSelectedOrganizations(prev => prev.filter(org => org.id !== orgId));
  }, []);

  // Handle save edit
  const handleSaveEdit = useCallback(async () => {
    if (!selectedUser?.docId) {
      console.error('No selected user document ID');
      return;
    }

    try {
      console.log('🔄 Starting user update:', {
        docId: selectedUser.docId,
        userId: selectedUser.id
      });

      // Ensure orgIds is an array of numbers
      const orgIds = selectedOrganizations.length > 0
        ? selectedOrganizations.map(org => Number(org.id))
        : [];

      console.log('📊 Organizations data:', {
        selectedOrgs: selectedOrganizations,
        convertedIds: orgIds
      });

      const updateData = {
        ...editFormData,
        // Always send an array of numbers for orgId
        orgId: orgIds,
        // Ensure all fields are strings
        firstName: String(editFormData.firstName || ''),
        lastName: String(editFormData.lastName || ''),
        email: String(editFormData.email || ''),
        phoneNumber: String(editFormData.phoneNumber || ''),
        role: String(editFormData.role || '')
      };

      console.log('📝 Update payload:', updateData);

      // Use the document ID instead of the user ID
      await updateUser(selectedUser.docId, updateData);

      // Refresh data after successful update
      await refreshData();

      // Show success message
      const userName = `${editFormData.firstName || ''} ${editFormData.lastName || ''}`.trim() || editFormData.email || 'User';
      showSuccess(`${userName} has been updated successfully!`);

      // Clear form state after successful update
      setShowEditModal(false);
      setSelectedUser(null);
      setEditFormData({});
      setSelectedOrganizations([]);

      console.log('✅ User updated successfully');
    } catch (err) {
      console.error('❌ Error updating user:', err);
      alert(`Failed to update user: ${err.message}`);
    }
  }, [selectedUser, editFormData, selectedOrganizations, updateUser, refreshData, showSuccess]);

  // Close modals
  const closeProfile = useCallback(() => {
    setShowProfile(false);
    setSelectedUser(null);
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedUser(null);
    setEditFormData({});
    setSelectedOrganizations([]);
  }, []);

  // Format date
  const formatDate = useCallback((timestamp) => {
    if (!timestamp) return 'N/A';

    try {
      // Handle Firestore timestamp
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
      }
      // Handle regular Date object
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      }
      // Handle string or number
      return new Date(timestamp).toLocaleDateString();
    } catch (error) {
      console.warn('Invalid date format:', timestamp);
      return 'Invalid Date';
    }
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterFirstName('');
    setFilterLastName('');
    setFilterRole('');
    setFilterStatus('');
    setFilterOrganization(''); // Add this line
  }, []);

  // Retry function
  const handleRetry = useCallback(async () => {
    try {
      setComponentLoading(true);
      console.log('🔄 Retrying to fetch data...');
      await Promise.all([getUsers(), getOrganizations()]);
      console.log('✅ Retry successful');
    } catch (error) {
      console.error('❌ Retry failed:', error);
    } finally {
      setComponentLoading(false);
    }
  }, [getUsers, getOrganizations]);

  // Filter users based on search and filters
  const filteredUsers = React.useMemo(() => {
    return users.filter(user => {
      const searchLower = searchTerm.toLowerCase();

      // Search by email or phone
      const matchesSearch = !searchTerm ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.phoneNumber && user.phoneNumber.toLowerCase().includes(searchLower));

      // Separate first name and last name filters
      const matchesFirstName = !filterFirstName ||
        (user.firstName && user.firstName.toLowerCase().includes(filterFirstName.toLowerCase()));

      const matchesLastName = !filterLastName ||
        (user.lastName && user.lastName.toLowerCase().includes(filterLastName.toLowerCase()));

      const matchesRole = !filterRole || user.role === filterRole;
      const matchesStatus = !filterStatus || user.status === filterStatus;

      // Organization filter
      const matchesOrganization = !filterOrganization ||
        getOrganizationNames(user.orgId).toLowerCase().includes(filterOrganization.toLowerCase());

      return matchesSearch && matchesFirstName && matchesLastName && matchesRole && matchesStatus && matchesOrganization;
    });
  }, [users, searchTerm, filterFirstName, filterLastName, filterRole, filterStatus, filterOrganization, getOrganizationNames]);

  // Get unique roles, statuses for filter options
  const { uniqueRoles, uniqueStatuses, uniqueOrganizations } = React.useMemo(() => {
    const roles = [...new Set(users.map(user => user.role).filter(Boolean))];
    const statuses = [...new Set(users.map(user => user.status).filter(Boolean))];

    // Get unique organizations
    const orgSet = new Set();
    users.forEach(user => {
      if (user.orgId) {
        if (Array.isArray(user.orgId)) {
          user.orgId.forEach(orgId => {
            const org = organizations.find(o => o.id === orgId || o.id === parseInt(orgId));
            if (org && org.name) {
              orgSet.add(JSON.stringify({ id: org.id, name: org.name }));
            }
          });
        } else {
          const org = organizations.find(o => o.id === user.orgId || o.id === parseInt(user.orgId));
          if (org && org.name) {
            orgSet.add(JSON.stringify({ id: org.id, name: org.name }));
          }
        }
      }
    });

    const uniqueOrgs = Array.from(orgSet).map(orgStr => JSON.parse(orgStr));

    return {
      uniqueRoles: roles,
      uniqueStatuses: statuses,
      uniqueOrganizations: uniqueOrgs
    };
  }, [users, organizations]);

  // Get available organizations for dropdown (excluding already selected ones)
  const availableOrganizations = React.useMemo(() => {
    return organizations.filter(org =>
      !selectedOrganizations.some(selected => selected.id === org.id)
    );
  }, [organizations, selectedOrganizations]);

  // Show loading state (either context loading or component loading)
  const isLoading = loading || componentLoading || orgLoading;

  if (isLoading) {
    return (
      <div className="users-data-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>טוען את המידע...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-data-container">
        <div className="error-message">
          <h3>אירעה תקלה בעת טעינת המידע</h3>
          <p>{error}</p>
          <button onClick={handleRetry} className="retry-btn">
            לנסות שוב
          </button>
        </div>
      </div>
    );
  }

  const handleExportToExcel = useCallback(() => {
    console.log('🔄 Initiating Excel export...');

    try {
      const exportOptions = {
        isFiltered: filteredUsers.length !== users.length,
        totalCount: users.length
      };

      const result = exportUsersToExcel(
        filteredUsers,
        getOrganizationNames,
        formatDate,
        exportOptions
      );

      if (result.success) {
        showSuccess(result.message);

        // Optional: Log export activity for analytics
        console.log('📈 Export Analytics:', {
          totalUsers: users.length,
          exportedUsers: result.exportedCount,
          hasFilters: exportOptions.isFiltered,
          timestamp: new Date().toISOString(),
          filename: result.filename
        });
      } else {
        alert(result.message);
      }

    } catch (error) {
      console.error('❌ Export handler error:', error);
      alert(`שגיאה בייצוא הנתונים: ${error.message}`);
    }
  }, [filteredUsers, users, getOrganizationNames, formatDate, showSuccess]);

  return (
    <div className="users-data-container">
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="success-popup">
          <div className="success-popup-content">
            <div className="success-icon">✅</div>
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      <div className="users-header">
        <h2>ניהול משתמשים</h2>
        <div className="users-stats">
          כמות משתמשים במערכת: <span className="stat-number">{users.length}</span>
          {filteredUsers.length !== users.length && (
            <span className="filtered-count">
              (מציג {filteredUsers.length})
            </span>
          )}
        </div>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterFirstName={filterFirstName}
        setFilterFirstName={setFilterFirstName}
        filterLastName={filterLastName}
        setFilterLastName={setFilterLastName}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterOrganization={filterOrganization}
        setFilterOrganization={setFilterOrganization}
        uniqueRoles={uniqueRoles}
        uniqueStatuses={uniqueStatuses}
        uniqueOrganizations={uniqueOrganizations}
        clearFilters={clearFilters}
      />

      <div className="export-section">
        <button
          className="btn btn-export"
          onClick={handleExportToExcel}
          disabled={filteredUsers.length === 0}
          title={filteredUsers.length === 0 ? "אין נתונים לייצוא" : "ייצא לאקסל"}
        >
          <span className="export-icon">📊</span>
          ייצא לאקסל ({filteredUsers.length} רשומות)
        </button>
        {filteredUsers.length !== users.length && (
          <small className="export-info">
            יתווצאו רק הרשומות המוצגות לפי הסינון הנוכחי
          </small>
        )}
      </div>

      {filteredUsers.length === 0 ? (
        <div className="no-users">
          <p>
            {users.length === 0
              ? 'לא נמצאו משתמשים'
              : 'לא נמצאו משתמשים התואמים לקריטריונים שנבחרו'
            }
          </p>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>שם</th>
                  <th>כתובת דוא"ל</th>
                  <th>תפקיד</th>
                  <th>ארגונים</th>
                  <th>סטטוס</th>
                  <th>תאריך יצירה</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const statusAction = getStatusAction(user.status);
                  const isUpdating = statusUpdating === user.docId;

                  return (
                    <tr key={user.docId || user.id}>
                      <td data-label="Name">
                        <div className="user-name">
                          <div className="user-avatar">
                            {(user.firstName || user.email || String(user.id)).charAt(0).toUpperCase()}
                          </div>
                          <span>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}</span>
                        </div>
                      </td>
                      <td data-label="Email">{user.email || 'N/A'}</td>
                      <td data-label="Role">
                        <span className={`role-badge ${user.role || 'no-role'}`}>
                          {getRoleLabel(user.role) || 'לא מוגדר'}
                        </span>
                      </td>
                      <td data-label="Organizations">
                        <div className="organizations-cell">
                          {getOrganizationNames(user.orgId)}
                        </div>
                      </td>
                      <td data-label="Status">
                        <div className="status-management">
                          <span className={`status-badge ${user.status}`}>
                            {user.status}
                          </span>
                        </div>
                      </td>
                      <td data-label="Created At">{formatDate(user.createdAt)}</td>
                      <td data-label="Operations">
                        <div className="operations-buttons">
                          <button
                            className="btn btn-watch"
                            onClick={() => handleWatch(user)}
                            title="צפייה בפרופיל"
                          >
                            <HiOutlineEye />
                          </button>
                          <button
                            className="btn btn-edit"
                            onClick={() => handleEdit(user)}
                            title="עריכת פרופיל משתמש"
                          >
                            <HiOutlinePencil />
                          </button>
                          {/* UPDATED: Added onClick handler and conditional display */}
                          {user.role === 'volunteer' && (
                            <button
                              className="btn btn-hours"
                              onClick={() => handleHours(user)}
                              title="צפייה ואישור שעות"
                            >
                              <HiOutlineClock />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showProfile && selectedUser && (
        <UserProfile
          user={selectedUser}
          organizations={organizations}
          onClose={closeProfile}
          onFeedback={handleFeedback}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <UserEdit
          editFormData={editFormData}
          selectedUser={selectedUser}
          selectedOrganizations={selectedOrganizations}
          availableOrganizations={availableOrganizations}
          closeEditModal={closeEditModal}
          handleInputChange={handleInputChange}
          handleOrganizationSelect={handleOrganizationSelect}
          removeSelectedOrganization={removeSelectedOrganization}
          handleStatusUpdateInModal={handleStatusUpdateInModal}
          handleSaveEdit={handleSaveEdit}
        />
      )}

      {/* Hours Management Modal - NEW */}
      {showHoursModal && selectedUser && (
        <HoursData
          volunteer={selectedUser}
          onClose={closeHoursModal}
        />
      )}

      {/* Feedback Popup - Moved outside and with highest z-index */}
      {showFeedbackPopup && feedbackTargetUser && (
        <FeedbackPopup
          targetUser={feedbackTargetUser}
          onClose={closeFeedbackPopup}
        />
      )}
    </div>
  );
};

export default UsersData;