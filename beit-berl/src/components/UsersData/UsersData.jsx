// src/components/UsersData/UsersData.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useUsers } from '../../contexts/UsersContext';
import UserProfile from '../UserProfile/UserProfile';
import FilterBar from '../FilterBar/FilterBar';
import './UsersData.css';
import { HiOutlineEye, HiOutlinePencil } from 'react-icons/hi';

const UsersData = () => {
  const {
    users,
    loading,
    error,
    getUsers,
    updateUser,
  } = useUsers();

  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFirstName, setFilterFirstName] = useState('');
  const [filterLastName, setFilterLastName] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [componentLoading, setComponentLoading] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        setComponentLoading(true);
        console.log('🚀 Fetching users on component mount...');
        await getUsers();
        console.log('✅ Users fetched successfully');
      } catch (error) {
        console.error('❌ Error fetching users:', error);
      } finally {
        setComponentLoading(false);
      }
    };

    // Only fetch if we don't have users already
    if (users.length === 0 && !loading) {
      fetchUsersData();
    }
  }, []); // Empty dependency array - only run once on mount

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

    setStatusUpdating(user.id);
    
    try {
      console.log(`Updating user ${user.id} status from ${user.status} to ${statusAction.newStatus}`);
      
      await updateUser(user.id, { status: statusAction.newStatus });
      
      console.log(`Successfully updated user ${user.id} status to ${statusAction.newStatus}`);
    } catch (err) {
      console.error('Error updating user status:', err);
      alert(`Failed to update user status: ${err.message}`);
    } finally {
      setStatusUpdating(null);
    }
  }, [updateUser, getStatusAction]);

  // Status update in modal
  const handleStatusUpdateInModal = useCallback(async (newStatus) => {
    if (!selectedUser) return;
    
    try {
      console.log(`Updating user ${selectedUser.id} status from ${selectedUser.status} to ${newStatus}`);
      
      await updateUser(selectedUser.id, { status: newStatus });
      
      // Update the selected user object locally to reflect the change
      setSelectedUser(prev => ({
        ...prev,
        status: newStatus
      }));
      
      console.log(`Successfully updated user ${selectedUser.id} status to ${newStatus}`);
    } catch (err) {
      console.error('Error updating user status:', err);
      alert(`Failed to update user status: ${err.message}`);
    }
  }, [selectedUser, updateUser]);

  // Handle watch user profile
  const handleWatch = useCallback((user) => {
    console.log('Viewing user profile for user ID:', user.id);
    setSelectedUser(user);
    setShowProfile(true);
  }, []);

  // Handle edit user
  const handleEdit = useCallback((user) => {
    console.log('Editing user with ID:', user.id, 'Document ID:', user.docId);
    
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      role: user.role || '',
      orgId: user.orgId || ''
    });
    setShowEditModal(true);
  }, []);

  // Handle form input change
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Handle save edit
  const handleSaveEdit = useCallback(async () => {
    if (!selectedUser || !selectedUser.id) {
      console.error('No selected user or user ID');
      return;
    }

    try {
      console.log('Updating user with ID:', selectedUser.id, 'Data:', editFormData);
      
      await updateUser(selectedUser.id, editFormData);
      
      setShowEditModal(false);
      setSelectedUser(null);
      setEditFormData({});
      
      console.log('User updated successfully');
    } catch (err) {
      console.error('Error updating user:', err);
      alert(`Failed to update user: ${err.message}`);
    }
  }, [selectedUser, editFormData, updateUser]);

  // Close modals
  const closeProfile = useCallback(() => {
    setShowProfile(false);
    setSelectedUser(null);
  }, []);

  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setSelectedUser(null);
    setEditFormData({});
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
      console.log('🔄 Retrying to fetch users...');
      await getUsers();
      console.log('✅ Retry successful');
    } catch (error) {
      console.error('❌ Retry failed:', error);
    } finally {
      setComponentLoading(false);
    }
  }, [getUsers]);

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

  // Show loading state (either context loading or component loading)
  const isLoading = loading || componentLoading;

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
              ? 'No users found.' 
              : 'No users match the current filters.'
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
                  <th>Organization ID</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Operations</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const statusAction = getStatusAction(user.status);
                  const isUpdating = statusUpdating === user.id;
                  
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
                      <td data-label="Organization ID">
                        {user.orgId || 'N/A'}
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
                              {isUpdating ? 'Updating...' : statusAction.label}
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
                            <HiOutlineEye/>
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
          onClose={closeProfile}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User - ID: {selectedUser.id}</h3>
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
                      <option value="cv">cv</option>
                      <option value="volunteer">volunteer</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="orgId">Organization ID:</label>
                    <input
                      type="text"
                      id="orgId"
                      name="orgId"
                      value={editFormData.orgId || ''}
                      onChange={handleInputChange}
                      placeholder="Enter organization ID"
                    />
                  </div>
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
    </div>
  );
};

export default UsersData;