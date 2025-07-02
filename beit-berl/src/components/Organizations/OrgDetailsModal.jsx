import { useState, useEffect } from 'react';
import { HiLocationMarker, HiPencilAlt, HiOutlineX, HiChevronDown, HiExternalLink } from 'react-icons/hi';
import { useUsers } from '../../Contexts/UsersContext';

const OrgDetailsModal = ({
  org,
  onClose,
  onSave,
  onDelete,
  onStatusChange,
  isNew = false,
  allUsers = [],
  isVolunteer = false
}) => {
  const [isEditing, setIsEditing] = useState(isNew && !isVolunteer);
  const [editedOrg, setEditedOrg] = useState(org);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [vcDropdownOpen, setVcDropdownOpen] = useState(false);

  // Get current user and check if admin
  const { currentUser, currentUserHasRole } = useUsers();
  const isAdmin = currentUserHasRole('admin') || currentUserHasRole('Admin');

  // Get all volunteer coordinators from users
  const getVolunteerCoordinators = () => {
    if (!allUsers || !Array.isArray(allUsers)) {
      return [];
    }

    return allUsers.filter(user => {
      const isVC = user.role === 'vc' || user.role === 'VC' || user.role === 'volunteerCoordinator';
      return isVC;
    }).map(user => {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();

      return {
        id: user.id || user.docId,
        name: fullName || user.name || `מזהה: ${user.id || user.docId}`,
        user: user
      };
    });
  };

  const volunteerCoordinators = getVolunteerCoordinators();

  // Helper function to get city value - handles different possible field names
  const getCityValue = (org) => {
    return org.City || org.city || org.CITY || org.location || org.Location || '';
  };

  // Helper function to set city value with the correct field name
  const setCityValue = (orgData, cityValue) => {
    // Determine which field name to use based on existing data
    if (org.City !== undefined) {
      return { ...orgData, City: cityValue };
    } else if (org.city !== undefined) {
      return { ...orgData, city: cityValue };
    } else if (org.CITY !== undefined) {
      return { ...orgData, CITY: cityValue };
    } else if (org.location !== undefined) {
      return { ...orgData, location: cityValue };
    } else if (org.Location !== undefined) {
      return { ...orgData, Location: cityValue };
    } else {
      // Default to 'City' for new organizations
      return { ...orgData, City: cityValue };
    }
  };

  // Helper function to get full user name by ID
  const getFullNameById = (userId) => {
    if (!userId || !allUsers || !Array.isArray(allUsers)) {
      return `מזהה: ${userId || 'לא זמין'}`;
    }

    // Try to find user by both id and docId fields
    const user = allUsers.find(u =>
      u.id === userId ||
      u.docId === userId ||
      u.id === String(userId) ||
      u.docId === String(userId) ||
      String(u.id) === String(userId) ||
      String(u.docId) === String(userId)
    );

    if (user) {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();

      if (fullName) {
        return fullName;
      }

      // Fallback to name field if firstName/lastName not available
      if (user.name) {
        return user.name;
      }
    }

    return `מזהה: ${userId}`;
  };

  // Helper function to get organization representative full name
  const getOrgRepName = (orgId) => {
    if (!orgId || !allUsers || !Array.isArray(allUsers)) {
      return 'לא צוין';
    }

    // Find user who is orgRep for this organization
    const orgRep = allUsers.find(user => {
      const isOrgRep = user.role === 'orgRep' || user.role === 'OrgRep';
      if (!isOrgRep) return false;

      // Check if user's orgId matches (could be single ID or array)
      if (Array.isArray(user.orgId)) {
        return user.orgId.includes(orgId) || user.orgId.includes(String(orgId));
      } else {
        return user.orgId === orgId || user.orgId === String(orgId) || String(user.orgId) === String(orgId);
      }
    });

    if (orgRep) {
      const firstName = orgRep.firstName || '';
      const lastName = orgRep.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();

      if (fullName) {
        return fullName;
      }

      // Fallback to name field
      if (orgRep.name) {
        return orgRep.name;
      }
    }

    return 'לא צוין';
  };

  // Helper function to get volunteer coordinator names
  const getVcNames = (vcIds) => {
    if (!vcIds || !Array.isArray(vcIds) || vcIds.length === 0) {
      return [];
    }

    return vcIds.map(vcId => {
      // Find user by ID (try multiple matching strategies)
      const user = allUsers.find(u =>
        u.id === vcId ||
        u.docId === vcId ||
        u.id === String(vcId) ||
        u.docId === String(vcId) ||
        String(u.id) === String(vcId) ||
        String(u.docId) === String(vcId)
      );

      if (user) {
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();

        if (fullName) {
          return fullName;
        }

        // Fallback to name field
        if (user.name) {
          return user.name;
        }
      }

      return `מזהה: ${vcId}`;
    });
  };

  // Calculate number of volunteers based on current user roles and orgId
  const calculateVolunteerCount = (organization) => {
    if (!allUsers || !Array.isArray(allUsers) || !organization.id) {
      return 0;
    }

    const volunteers = allUsers.filter(user => {
      // Check if user is a volunteer
      const isVolunteer = user.role === "volunteer" || user.role === "Volunteer";

      if (!isVolunteer) return false;

      // Check if user's orgId array contains this organization's id
      if (Array.isArray(user.orgId)) {
        return user.orgId.includes(organization.id) || user.orgId.includes(String(organization.id));
      } else {
        return user.orgId === organization.id || user.orgId === String(organization.id) || String(user.orgId) === String(organization.id);
      }
    });

    return volunteers.length;
  };

  // Get all volunteer users for this organization
  const getVolunteerUsers = (organization) => {
    if (!allUsers || !Array.isArray(allUsers) || !organization.id) {
      return [];
    }

    return allUsers.filter(user => {
      // Check if user is a volunteer
      const isVolunteer = user.role === "volunteer" || user.role === "Volunteer";

      if (!isVolunteer) return false;

      // Check if user's orgId array contains this organization's id
      if (Array.isArray(user.orgId)) {
        return user.orgId.includes(organization.id) || user.orgId.includes(String(organization.id));
      } else {
        return user.orgId === organization.id || user.orgId === String(organization.id) || String(user.orgId) === String(organization.id);
      }
    });
  };

  // Helper function to validate URL
  const isValidUrl = (string) => {
    if (!string || typeof string !== 'string') return false;
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Helper function to format URL for display and storage
  const formatUrlForDisplay = (url) => {
    if (!url || typeof url !== 'string') return '';
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return '';

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return `https://${trimmedUrl}`;
    }
    return trimmedUrl;
  };

  // Update editedOrg when org prop changes
  useEffect(() => {
    setEditedOrg({
      ...org,
      // Ensure status has a default value
      status: org.status !== undefined ? org.status : true,
      // Ensure link has a default value
      link: org.link || ''
    });
  }, [org]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vcDropdownOpen && !event.target.closest('.vc-dropdown-container')) {
        setVcDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [vcDropdownOpen]);

  const handleChange = (field, value) => {
    if (field === 'city') {
      // Handle city field specially
      setEditedOrg(prev => setCityValue(prev, value));
    } else {
      setEditedOrg(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handle volunteer coordinator selection
  const handleVcSelection = (vcId) => {
    const currentVcIds = Array.isArray(editedOrg.vcId) ? editedOrg.vcId : [];

    // Convert vcId to string for consistent comparison
    const vcIdStr = String(vcId);

    let newVcIds;
    // Compare as strings to avoid type issues
    const isCurrentlySelected = currentVcIds.some(id => String(id) === vcIdStr);

    if (isCurrentlySelected) {
      // Remove if already selected - keep original data type
      newVcIds = currentVcIds.filter(id => String(id) !== vcIdStr);
    } else {
      // Add if not selected - try to maintain original data type
      const originalVcId = isNaN(vcId) ? vcId : Number(vcId);
      newVcIds = [...currentVcIds, originalVcId];
    }

    setEditedOrg(prev => ({ ...prev, vcId: newVcIds }));
  };

  const handleSave = async () => {
    // Prevent volunteers from saving
    if (isVolunteer) {
      return;
    }

    // Basic validation
    if (!editedOrg.name?.trim()) {
      alert('שם הארגון הוא שדה חובה');
      return;
    }

    // Validate URL if provided
    if (editedOrg.link && editedOrg.link.trim()) {
      const formattedUrl = formatUrlForDisplay(editedOrg.link.trim());
      if (!isValidUrl(formattedUrl)) {
        alert('כתובת האתר שהוזנה אינה תקינה');
        return;
      }
      // Update the editedOrg with the formatted URL
      setEditedOrg(prev => ({ ...prev, link: formattedUrl }));
    }

    setIsSaving(true);
    try {
      // Ensure status is properly set (default to true if undefined)
      const orgToSave = {
        ...editedOrg,
        status: editedOrg.status !== undefined ? editedOrg.status : true,
        link: editedOrg.link || ''
      };

      await onSave(orgToSave);
      setIsEditing(false);
      if (!isNew) {
        // Only close modal if we're not creating a new org
        onClose();
      }
    } catch (err) {
      console.error('Error saving organization:', err);
      alert('שגיאה בשמירת הארגון');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    // Only allow admins to delete
    if (!isAdmin) {
      return;
    }

    if (window.confirm("האם אתה בטוח שברצונך למחוק את הארגון?")) {
      try {
        await onDelete(org.id);
      } catch (err) {
        console.error('Error deleting organization:', err);
        alert('שגיאה במחיקת הארגון');
      }
    }
  };

  // Handle status toggle (admin only)
  const handleStatusToggle = async () => {
    if (!isAdmin || !onStatusChange) {
      return;
    }

    const currentStatus = editedOrg.status !== undefined ? editedOrg.status : true;
    const newStatus = !currentStatus;
    const statusText = newStatus ? 'פעיל' : 'לא פעיל';

    if (window.confirm(`האם אתה בטוח שברצונך לשנות את סטטוס הארגון ל${statusText}?`)) {
      setIsChangingStatus(true);
      try {
        await onStatusChange(org.id, newStatus);
        // Update local state to reflect the change
        setEditedOrg(prev => ({ ...prev, status: newStatus }));
      } catch (err) {
        console.error('Error changing organization status:', err);
        alert('שגיאה בשינוי סטטוס הארגון');
      } finally {
        setIsChangingStatus(false);
      }
    }
  };

  const volunteerCount = calculateVolunteerCount(org);
  const volunteerUsers = getVolunteerUsers(org);
  const vcNames = getVcNames(org.vcId);

  // Use editedOrg for display values to show real-time updates
  const displayOrg = isEditing ? editedOrg : org;
  const currentStatus = displayOrg.status !== undefined ? displayOrg.status : true;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            {isNew ? 'הוספת ארגון חדש' :
              isEditing ? 'עריכת פרטי הארגון' : 'פרטי הארגון'}
          </h2>
          <button
            onClick={onClose}
            className="close-btn"
            aria-label="סגור"
          >
            <HiOutlineX />
          </button>
        </div>

        {isEditing && !isVolunteer ? (
          <div className="edit-form">
            <div className="form-group">
              <label className="form-label">שם הארגון *</label>
              <input
                type="text"
                value={editedOrg.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">עיר</label>
              <input
                type="text"
                value={getCityValue(editedOrg)}
                onChange={(e) => handleChange('city', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">תיאור</label>
              <textarea
                value={editedOrg.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label className="form-label">פרטי יצירת קשר</label>
              <input
                type="text"
                value={editedOrg.contactInfo || ''}
                onChange={(e) => handleChange('contactInfo', e.target.value)}
                className="form-input"
                placeholder="טלפון או מייל"
              />
            </div>

            <div className="form-group">
              <label className="form-label">קישור לאתר הארגון</label>
              <input
                type="url"
                value={editedOrg.link || ''}
                onChange={(e) => handleChange('link', e.target.value)}
                className="form-input"
                placeholder="https://example.com"
              />
              {editedOrg.link && (
                <small className="form-hint">
                  תצוגה מקדימה: {formatUrlForDisplay(editedOrg.link)}
                </small>
              )}
            </div>

            {/* Status field - only show for admins */}
            {isAdmin && (
              <div className="form-group">
                <label className="form-label">סטטוס הארגון (לחץ על ה-V בכדי לשנות)</label>
                <div className="status-toggle-container">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={editedOrg.status !== undefined ? editedOrg.status : true}
                      onChange={(e) => handleChange('status', e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                  <span className="status-label">
                    {editedOrg.status !== undefined ?
                      (editedOrg.status ? 'פעיל' : 'לא פעיל') : 'פעיל'}
                  </span>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                onClick={handleSave}
                className="save-button"
                disabled={isSaving}
              >
                {isSaving ? 'שומר...' : 'שמירה'}
              </button>
              <button
                onClick={() => {
                  if (isNew) {
                    onClose();
                  } else {
                    setIsEditing(false);
                    setEditedOrg({
                      ...org,
                      status: org.status !== undefined ? org.status : true,
                      link: org.link || ''
                    });
                  }
                }}
                className="cancel-button-org"
                disabled={isSaving}
              >
                ביטול
              </button>
            </div>
          </div>
        ) : (
          <div className="view-details">
            <div className="org-info">
              <h3 className="org-name-modal">
                {displayOrg.name || 'שם הארגון'}
                {/* Status indicator */}
                <span className={`status-indicator ${currentStatus ? 'active' : 'inactive'}`}>
                  {currentStatus ? ' - פעיל' : ' - לא פעיל'}
                </span>
              </h3>
              <div className="city-info-modal">
                <HiLocationMarker className="location-icon" />
                <span>עיר: {getCityValue(displayOrg) || 'לא צוין'}</span>
              </div>
            </div>

            <div className="org-description-modal">
              <h4>תיאור:</h4>
              <p>{displayOrg.description || 'אין תיאור זמין'}</p>
            </div>

            <div className="contact-info">
              <div className="contact-field">
                <strong>פרטי יצירת קשר:</strong> {displayOrg.contactInfo || 'לא צוין'}
              </div>

              <div className="contact-field">
                <strong>אתר הארגון: </strong>
                {displayOrg.link ? (
                  <a
                    href={formatUrlForDisplay(displayOrg.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="org-link"
                  >
                    {displayOrg.link} <HiExternalLink className="external-link-icon" />
                  </a>
                ) : (
                  <span> לא צוין</span>
                )}
              </div>

              {/* Hide these fields from volunteers */}
              {!isVolunteer && (
                <>
                  <div className="contact-field">
                    <strong>נציג הארגון:</strong> {getOrgRepName(displayOrg.id)}
                  </div>

                  <div className="contact-field">
                    <strong>רכזי מתנדבים:</strong>
                    {vcNames.length > 0 ? (
                      <div className="coordinators-list">
                        {vcNames.map((name, index) => (
                          <span key={index} className="coordinator-name">
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span> לא צוין</span>
                    )}
                  </div>

                  <div className="contact-field">
                    <strong>מספר מתנדבים:</strong> {volunteerCount}
                  </div>

                  {volunteerUsers.length > 0 && (
                    <div className="volunteers-list">
                      <strong>רשימת מתנדבים:</strong>
                      <div className="volunteers-names">
                        {volunteerUsers.map(volunteer => {
                          const firstName = volunteer.firstName || '';
                          const lastName = volunteer.lastName || '';
                          const fullName = `${firstName} ${lastName}`.trim();
                          const displayName = fullName || volunteer.name || `מזהה: ${volunteer.id || volunteer.docId}`;

                          return (
                            <span key={volunteer.id || volunteer.docId} className="volunteer-name">
                              {displayName}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Hide edit and delete buttons from volunteers */}
            {!isVolunteer && (
              <div className="modal-actions">
                <button
                  onClick={() => setIsEditing(true)}
                  className="edit-button-org"
                >
                  <HiPencilAlt /> עריכה
                </button>

                {/* Admin-only buttons */}
                {isAdmin && (
                  <>
                    <button
                      onClick={handleStatusToggle}
                      className={`status-toggle-button ${currentStatus ? 'deactivate' : 'activate'}`}
                      disabled={isChangingStatus}
                    >
                      {isChangingStatus ? 'משנה...' :
                        currentStatus ? '⏸ השבת ארגון' : '🔄 הפעל ארגון'}
                    </button>

                    <button
                      className="delete-button"
                      onClick={handleDelete}
                    >
                      🗑 מחיקת הארגון
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgDetailsModal;