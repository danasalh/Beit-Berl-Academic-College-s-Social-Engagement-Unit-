// src/components/UsersData/UsersData.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useUsers } from '../../Contexts/UsersContext';
import { useOrganizations } from '../../Contexts/OrganizationsContext';
import UserProfile from '../UserProfile/UserProfile';
import FilterBar from '../FilterBar/FilterBar';
import FeedbackPopup from '../PopUps/FeedbackPopup/FeedbackPopup';
import './UsersData.css';
import { HiOutlineEye, HiOutlinePencil, HiX } from 'react-icons/hi';

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
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [componentLoading, setComponentLoading] = useState(false);

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

      return matchesSearch && matchesFirstName && matchesLastName && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, filterFirstName, filterLastName, filterRole, filterStatus]);

  // Get unique roles, statuses for filter options
  const { uniqueRoles, uniqueStatuses } = React.useMemo(() => {
    const roles = [...new Set(users.map(user => user.role).filter(Boolean))];
    const statuses = [...new Set(users.map(user => user.status).filter(Boolean))];
    return { uniqueRoles: roles, uniqueStatuses: statuses };
  }, [users]);

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
          <p>Loading users...</p>
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
        <h2>Users Management</h2>
        <div className="users-stats">
          Total Users: <span className="stat-number">{users.length}</span>
          {filteredUsers.length !== users.length && (
            <span className="filtered-count">
              (Showing {filteredUsers.length})
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
        uniqueRoles={uniqueRoles}
        uniqueStatuses={uniqueStatuses}
        clearFilters={clearFilters}
      />

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
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Organizations</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Operations</th>
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
                          {user.role || 'N/A'}
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
                          {statusAction && (
                            <button
                              className={`btn btn-status btn-${statusAction.variant}`}
                              onClick={() => handleStatusUpdate(user)}
                              disabled={isUpdating}
                              title={`${statusAction.label} user`}
                            >
                              {isUpdating ? 'מעדכן...' : statusAction.label}
                            </button>
                          )}
                        </div>
                      </td>
                      <td data-label="Created At">{formatDate(user.createdAt)}</td>
                      <td data-label="Operations">
                        <div className="operations-buttons">
                          <button
                            className="btn btn-watch"
                            onClick={() => handleWatch(user)}
                            title="View Profile"
                          >
                            <HiOutlineEye />
                          </button>
                          <button
                            className="btn btn-edit"
                            onClick={() => handleEdit(user)}
                            title="Edit User"
                          >
                            <HiOutlinePencil />
                          </button>
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
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User</h3>
              <button className="close-btn" onClick={closeEditModal}>×</button>
            </div>
            <div className="modal-body">
              <form className="edit-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name:</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={editFormData.firstName || ''}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name:</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={editFormData.lastName || ''}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={editFormData.email || ''}
                      onChange={handleInputChange}
                      placeholder="Enter email"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phoneNumber">Phone Number:</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={editFormData.phoneNumber || ''}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="role">Role:</label>
                    <select
                      id="role"
                      name="role"
                      value={editFormData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Role</option>
                      <option value="admin">Admin</option>
                      <option value="orgRep">orgRep</option>
                      <option value="vc">vc</option>
                      <option value="volunteer">volunteer</option>
                    </select>
                  </div>
                </div>

                {/* Organizations Selection */}
                <div className="form-group organizations-group">
                  <label>Organizations (Max 3):</label>

                  {/* Selected Organizations */}
                  {selectedOrganizations.length > 0 && (
                    <div className="selected-organizations">
                      {selectedOrganizations.map(org => (
                        <div key={org.id} className="selected-org-item">
                          <span className="org-name">{org.name}</span>
                          <button
                            type="button"
                            className="remove-org-btn"
                            onClick={() => removeSelectedOrganization(org.id)}
                            title="Remove organization"
                          >
                            <HiX />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Organization Dropdown */}
                  {selectedOrganizations.length < 3 && (
                    <div className="add-organization">
                      <select
                        onChange={handleOrganizationSelect}
                        defaultValue=""
                        disabled={availableOrganizations.length === 0}
                      >
                        <option value="">
                          {availableOrganizations.length === 0
                            ? 'No more organizations available'
                            : 'Select an organization to add'
                          }
                        </option>
                        {availableOrganizations.map(org => (
                          <option key={org.id} value={org.id}>
                            {org.name || `Organization ${org.id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <small className="form-help">
                    {selectedOrganizations.length}/3 organizations selected
                  </small>
                </div>

                <div className="form-row">
                  <div className="form-group status-group">
                    <label>Status Management:</label>
                    <div className="status-controls">
                      <span className={`status-badge ${selectedUser.status}`}>
                        Current: {selectedUser.status}
                      </span>
                      <div className="status-actions">
                        {(selectedUser.status === 'pending' || selectedUser.status === 'waiting for approval') && (
                          <button
                            type="button"
                            className="btn btn-status btn-success"
                            onClick={() => handleStatusUpdateInModal('approved')}
                          >
                            Approve User
                          </button>
                        )}
                        {selectedUser.status === 'approved' && (
                          <button
                            type="button"
                            className="btn btn-status btn-warning"
                            onClick={() => handleStatusUpdateInModal('inactive')}
                          >
                            Deactivate User
                          </button>
                        )}
                        {selectedUser.status === 'inactive' && (
                          <button
                            type="button"
                            className="btn btn-status btn-success"
                            onClick={() => handleStatusUpdateInModal('approved')}
                          >
                            Reactivate User
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeEditModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
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