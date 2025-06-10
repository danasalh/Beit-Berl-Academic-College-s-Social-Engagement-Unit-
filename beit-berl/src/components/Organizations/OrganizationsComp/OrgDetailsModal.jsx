import React, { useState, useEffect } from 'react';
import { HiLocationMarker, HiPencilAlt } from 'react-icons/hi';
import { useUsers } from '../../../Contexts/UsersContext';

const OrgDetailsModal = ({ 
  org, 
  onClose, 
  onSave, 
  onDelete, 
  isNew = false, 
  allUsers = [], 
  isVolunteer = false 
}) => {
  const [isEditing, setIsEditing] = useState(isNew && !isVolunteer); // Don't allow editing if volunteer
  const [editedOrg, setEditedOrg] = useState(org);
  const [isSaving, setIsSaving] = useState(false);

  // Get current user and check if admin
  const { currentUser, currentUserHasRole } = useUsers();
  const isAdmin = currentUserHasRole('admin') || currentUserHasRole('Admin');

  // Debug: Log the organization object
  console.log('🏢 OrgDetailsModal - Organization object:', org);
  console.log('👥 OrgDetailsModal - All users count:', allUsers.length);
  console.log('👤 OrgDetailsModal - Is volunteer:', isVolunteer);
  console.log('👤 OrgDetailsModal - Is admin:', isAdmin);

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

  // Helper function to get user name by ID
  const getUserNameById = (userId) => {
    if (!userId || !allUsers || !Array.isArray(allUsers)) {
      return `מזהה: ${userId || 'לא זמין'}`;
    }

    const user = allUsers.find(u => u.id === userId || u.docId === userId);
    if (user && user.firstName) {
      return user.firstName;
    }
    
    return `מזהה: ${userId}`;
  };

  // Helper function to get organization representative name
  const getOrgRepName = (orgId) => {
    if (!orgId || !allUsers || !Array.isArray(allUsers)) {
      return 'לא צוין';
    }

    // Find user who is orgRep for this organization
    const orgRep = allUsers.find(user => 
      user.role === 'orgRep' && 
      (user.orgId === orgId || 
       (Array.isArray(user.orgId) && user.orgId.includes(orgId)))
    );

    if (orgRep && orgRep.firstName) {
      return orgRep.firstName;
    }
    
    return 'לא צוין';
  };

  // Helper function to get volunteer coordinator names
  const getVcNames = (vcIds) => {
    if (!vcIds || !Array.isArray(vcIds) || vcIds.length === 0) {
      return [];
    }

    return vcIds.map(vcId => {
      const user = allUsers.find(u => u.id === vcId || u.docId === vcId);
      return user && user.firstName ? user.firstName : `מזהה: ${vcId}`;
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
      const userOrgIds = Array.isArray(user.orgId) ? user.orgId : [];
      return userOrgIds.includes(organization.id);
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
      const userOrgIds = Array.isArray(user.orgId) ? user.orgId : [];
      return userOrgIds.includes(organization.id);
    });
  };

  // Update editedOrg when org prop changes
  useEffect(() => {
    setEditedOrg(org);
  }, [org]);

  const handleChange = (field, value) => {
    if (field === 'city') {
      // Handle city field specially
      setEditedOrg(prev => setCityValue(prev, value));
    } else if (field === 'vcId') {
      // Handle vcId as array of numbers
      const ids = value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      setEditedOrg(prev => ({ ...prev, [field]: ids }));
    } else {
      setEditedOrg(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    // Prevent volunteers from saving
    if (isVolunteer) {
      console.log('❌ Volunteer users cannot save organizations');
      return;
    }

    // Basic validation
    if (!editedOrg.name?.trim()) {
      alert('שם הארגון הוא שדה חובה');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editedOrg);
      setIsEditing(false);
      if (!isNew) {
        // Only close modal if we're not creating a new org
        onClose();
      }
    } catch (err) {
      console.error('Error saving organization:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    // Only allow admins to delete
    if (!isAdmin) {
      console.log('❌ Only admin users can delete organizations');
      return;
    }

    if (window.confirm("האם את בטוחה שברצונך למחוק את הארגון?")) {
      try {
        await onDelete(org.id);
      } catch (err) {
        console.error('Error deleting organization:', err);
      }
    }
  };

  const volunteerCount = calculateVolunteerCount(org);
  const volunteerUsers = getVolunteerUsers(org);
  const vcNames = getVcNames(org.vcId);

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
            className="close-button"
            aria-label="סגור"
          >
            ❌
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
              <label className="form-label">רכזי מתנדבים (מזהים מופרדים בפסיק)</label>
              <input
                type="text"
                value={Array.isArray(editedOrg.vcId) ? editedOrg.vcId.join(', ') : ''}
                onChange={(e) => handleChange('vcId', e.target.value)}
                className="form-input"
                placeholder="1, 2, 3"
              />
            </div>

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
                    setEditedOrg(org); // Reset changes
                  }
                }}
                className="cancel-button"
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
                {org.name || 'שם הארגון'}
              </h3>
              <div className="city-info-modal">
                <HiLocationMarker className="location-icon" />
                <span>עיר: {getCityValue(org) || 'לא צוין'}</span>
              </div>
              {org.id && (
                <div className="org-id-info">
                  <span><strong>מזהה ארגון:</strong> {org.id}</span>
                </div>
              )}
            </div>
            
            <div className="org-description-modal">
              <h4>תיאור:</h4>
              <p>{org.description || 'אין תיאור זמין'}</p>
            </div>
            
            <div className="contact-info">
              <div className="contact-field">
                <strong>פרטי יצירת קשר:</strong> {org.contactInfo || 'לא צוין'}
              </div>
              
              {/* Hide these fields from volunteers */}
              {!isVolunteer && (
                <>
                  <div className="contact-field">
                    <strong>נציג הארגון:</strong> {getOrgRepName(org.id)}
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
                        {volunteerUsers.map(volunteer => (
                          <span key={volunteer.id || volunteer.docId} className="volunteer-name">
                            {volunteer.firstName || volunteer.name || `מזהה: ${volunteer.id || volunteer.docId}`}
                          </span>
                        ))}
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
                  className="edit-button"
                >
                  <HiPencilAlt /> עריכה
                </button>
                {/* Only show delete button for admin users */}
                {isAdmin && (
                  <button
                    className="delete-button"
                    onClick={handleDelete}
                  >
                    🗑 מחיקת הארגון
                  </button>
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