// src/components/UsesData/UserEdit.jsx
import { HiX } from 'react-icons/hi';
import { getRolesWithLabels } from '../../utils/roleTranslations';

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
          <h3>עריכת פרופיל משתמש</h3>
          <button className="close-btn" onClick={closeEditModal}>×</button>
        </div>
        <div className="modal-body">
          <form className="edit-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">שם פרטי:</label>
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
                <label htmlFor="lastName">שם משפחה:</label>
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
                <label htmlFor="email">כתובת דוא"ל:</label>
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
                <label htmlFor="phoneNumber">מספר טלפון:</label>
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
                <label htmlFor="role">תפקיד:</label>
                <select
                  id="role"
                  name="role"
                  value={editFormData.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">בחר תפקיד</option>
                  {getRolesWithLabels().map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Organizations Section */}
            <div className="form-group organizations-group">
              <label>שיוך לארגונים (עד 3):</label>
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
                        ? 'אין ארגונים זמינים'
                        : 'בחר ארגון לשיוך'}
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
                {selectedOrganizations.length}/3 ארגונים נבחרו לשיוך
              </small>
            </div>

            {/* Status Management */}
            <div className="form-row">
              <div className="form-group status-group">
                <label>סטטוס המשתמש:</label>
                <div className="status-controls">
                  <span className={`status-badge ${selectedUser.status}`}>
                    נוכחי: {selectedUser.status}
                  </span>
                  <div className="status-actions">
                    {(selectedUser.status === 'pending' || selectedUser.status === 'waiting for approval') && (
                      <button
                        type="button"
                        className="btn btn-status btn-success"
                        onClick={() => handleStatusUpdateInModal('approved')}
                      >
                        אישור משתמש
                      </button>
                    )}
                    {selectedUser.status === 'approved' && (
                      <button
                        type="button"
                        className="btn btn-status btn-warning"
                        onClick={() => handleStatusUpdateInModal('inactive')}
                      >
                        הפיכת משתמש ללא פעיל
                      </button>
                    )}
                    {selectedUser.status === 'inactive' && (
                      <button
                        type="button"
                        className="btn btn-status btn-success"
                        onClick={() => handleStatusUpdateInModal('approved')}
                      >
                        חזרה לסטטוס פעיל
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
            ביטול
          </button>
          <button className="btn btn-primary" onClick={handleSaveEdit}>
            שמירת שינויים
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserEdit;
