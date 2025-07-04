import React, { useState, useEffect } from "react";
import { useUsers } from "../../Contexts/UsersContext";
import { getRoleLabel } from "../../utils/roleTranslations"; 
import "./Settings.css";

const Settings = () => {
  const { currentUser, updateUser, loading, error } = useUsers();
  const [isEditable, setIsEditable] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    role: ''
  });
  const [originalData, setOriginalData] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Load current user data when component mounts or currentUser changes
  useEffect(() => {
    if (currentUser) {
      const userData = {
        firstName: currentUser.firstName || currentUser.name?.split(' ')[0] || '',
        lastName: currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || '',
        phoneNumber: currentUser.phoneNumber || '',
        email: currentUser.email || '',
        role: currentUser.role || ''
      };
      setFormData(userData);
      setOriginalData(userData);
    }
  }, [currentUser]);

  const validatePhoneNumber = (phone) => {
    // Remove any non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length === 0) {
      return { isValid: true, message: '' }; // Allow empty phone number
    }
    
    if (digitsOnly.length !== 10) {
      return { 
        isValid: false, 
        message: 'מספר הטלפון חייב להכיל בדיוק 10 ספרות' 
      };
    }
    
    return { isValid: true, message: '' };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      // Allow only digits and common formatting characters
      const filteredValue = value.replace(/[^\d\-\s]/g, '');
      
      // Validate phone number
      const validation = validatePhoneNumber(filteredValue);
      setPhoneError(validation.message);
      
      setFormData(prev => ({
        ...prev,
        [name]: filteredValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEditClick = () => {
    setIsEditable(true);
    setPhoneError(''); // Clear any previous phone errors
  };

  const handleCancelClick = () => {
    setFormData(originalData);
    setIsEditable(false);
    setPhoneError(''); // Clear phone error on cancel
  };

  const handleSaveClick = async () => {
    if (!currentUser) {
      alert('אין משתמש מחובר');
      return;
    }

    // Validate phone number before saving
    const phoneValidation = validatePhoneNumber(formData.phoneNumber);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.message);
      return;
    }

    // Use docId for Firestore operations (it's the actual document ID)
    const userId = currentUser.docId;
    if (!userId || typeof userId !== 'string') {
      console.error('Invalid user document ID:', userId);
      alert('שגיאה: מזהה משתמש לא תקין');
      return;
    }

    setUpdateLoading(true);
    try {
      // Prepare data to update (exclude email and role)
      const updateData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        // Combine first and last name for the name field
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim()
      };

      await updateUser(userId, updateData);
      
      // Update original data to reflect the saved changes
      const newOriginalData = { ...formData };
      setOriginalData(newOriginalData);
      setIsEditable(false);
      setPhoneError(''); // Clear phone error on successful save
      
      alert('הפרטים נשמרו בהצלחה!');
    } catch (err) {
      console.error('Error updating user:', err);
      alert('שגיאה בשמירת הפרטים. אנא נסה שוב.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const getInputClass = (fieldName) => {
    const baseClass = isEditable ? "editable-input" : "locked-input";
    // Add disabled class for email and role
    if (fieldName === 'email' || fieldName === 'role') {
      return `${baseClass} disabled-field`;
    }
    // Add error class for phone number if there's an error
    if (fieldName === 'phoneNumber' && phoneError) {
      return `${baseClass} error-input`;
    }
    return baseClass;
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="loading">טוען נתונים...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-container">
        <div className="error">שגיאה בטעינת הנתונים: {error}</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="settings-container">
        <div className="no-user">אין משתמש מחובר</div>
      </div>
    );
  }

  return (
    <div className="settings-container" style={{ direction: "rtl", textAlign: "left" }}>
      <h2>הגדרות משתמש</h2>

      <div className="setting-row">
        <label>שם פרטי:</label>
        <input 
          type="text" 
          name="firstName"
          value={formData.firstName}
          onChange={handleInputChange}
          readOnly={!isEditable} 
          className={getInputClass('firstName')} 
        />
      </div>

      <div className="setting-row">
        <label>שם משפחה:</label>
        <input 
          type="text" 
          name="lastName"
          value={formData.lastName}
          onChange={handleInputChange}
          readOnly={!isEditable} 
          className={getInputClass('lastName')} 
        />
      </div>

      <div className="setting-row">
        <label>מספר טלפון:</label>
        <input 
          type="tel" 
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleInputChange}
          readOnly={!isEditable} 
          className={getInputClass('phoneNumber')}
          placeholder={isEditable ? "0501234567" : ""}
        />
        {phoneError && isEditable && (
          <div className="field-error">
            <small className="error-message">{phoneError}</small>
          </div>
        )}
      </div>

      <div className="setting-row">
        <label>כתובת דוא"ל:</label>
        <input 
          type="email" 
          name="email"
          value={formData.email}
          readOnly={true}
          className={getInputClass('email')} 
        />
      </div>
      {isEditable && (
        <div className="field-note-wrapper">
          <small className="field-note">לא ניתן לשנות כתובת דוא"ל</small>
        </div>
      )}

      <div className="setting-row">
        <label>תפקיד:</label>
        <input 
          type="text" 
          name="role"
          value={getRoleLabel(formData.role)} // Display Hebrew role
          readOnly={true}
          className={getInputClass('role')} 
        />
      </div>
      {isEditable && (
        <div className="field-note-wrapper">
          <small className="field-note">לא ניתן לשנות תפקיד</small>
        </div>
      )}

      <div className="edit-button-container">
        {!isEditable ? (
          <button onClick={handleEditClick} className="edit-button">
            ✏️ עריכה
          </button>
        ) : (
          <div className="button-group">
            <button 
              onClick={handleSaveClick} 
              className="save-button"
              disabled={updateLoading || phoneError}
            >
              {updateLoading ? '⏳ שומר...' : '✅ שמירה'}
            </button>
            <button 
              onClick={handleCancelClick} 
              className="cancel-button"
              disabled={updateLoading}
            >
              ❌ ביטול
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;