// src/components/UsesData/UserEdit.jsx
import { HiX } from 'react-icons/hi';

const UserEdit = ({
  editFormData,
  selectedUser,
  selectedOrganizations,
  availableOrganizations,
  closeEditModal,
  handleInputChange,
  handleOrganizationSelect,
  removeSelectedOrganization,
  handleStatusUpdateInModal,
  handleSaveEdit
}) => {
  if (!selectedUser) return null;

  return (
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

            {/* Organizations Section */}
            <div className="form-group organizations-group">
              <label>Organizations (Max 3):</label>
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
                        : 'Select an organization to add'}
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

            {/* Status Management */}
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
  );
};

export default UserEdit;
