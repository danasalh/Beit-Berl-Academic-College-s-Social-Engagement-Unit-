import React, { useState } from 'react';
import { HiLocationMarker, HiPencilAlt } from 'react-icons/hi';

  const OrgDetailsModal = ({ org, onClose, onSave, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrg, setEditedOrg] = useState(org);

  const handleChange = (field, value) => {
    setEditedOrg({ ...editedOrg, [field]: value });
  };

 const handleSave = () => {
  if (onSave) {
    onSave(editedOrg);
  }
  setIsEditing(false);
  onClose(); 
};


  return (
    <div className="modal-overlay">
      <div className="modal-content">
   <div className="modal-header">
  <h2 className="modal-title">
    {isEditing ? 'עריכת פרטי הארגון' : 'פרטי הארגון'}
  </h2>
  <button 
    onClick={onClose}
    className="close-button"
    aria-label="סגור"
  >
    ❌
  </button>
</div>


        {isEditing ? (
          <div className="edit-form">
            <div className="form-group">
              <label className="form-label">שם הארגון</label>
              <input
                type="text"
                value={editedOrg.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">עיר</label>
              <input
                type="text"
                value={editedOrg.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">תיאור</label>
              <textarea
                value={editedOrg.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className="form-textarea"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">יצירת קשר</label>
              <input
                type="text"
                value={editedOrg.contact}
                onChange={(e) => handleChange('contact', e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">רכז המתנדבים</label>
              <input
                type="text"
                value={editedOrg.additionalInfo}
                onChange={(e) => handleChange('additionalInfo', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-actions">
              <button
                onClick={handleSave}
                className="save-button"
              >
                שמירה
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="cancel-button"
              >
                ביטול
              </button>
            </div>
          </div>
        ) : (
          <div className="view-details">
            <div className="org-info">
              <h3 className="org-name-modal">
                {`<${org.name}>`}
              </h3>
              <p className="org-city-modal">עיר: {org.city}</p>
            </div>
            
            <div className="org-description-modal">
              <p>{org.description}</p>
            </div>
            
            <div className="contact-info">
              <p className="contact-text">{org.contact}</p>
              <p className="contact-text">{org.additionalInfo}</p>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => setIsEditing(true)}
                className="edit-button"
              >
                עריכה
              </button>
              <button
  className="delete-button"
  onClick={() => {
    if (window.confirm("האם את בטוחה שברצונך למחוק את הארגון?")) {
      onDelete(org.id);
    }
  }}
>
  🗑 מחיקת הארגון
</button>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgDetailsModal;