import React, { useState } from "react";
import "./Settings.css";

const Settings = () => {
  const [isEditable, setIsEditable] = useState(false);

  const handleEditClick = () => {
    setIsEditable(true);
  };

  const handleSaveClick = () => {
    setIsEditable(false);
  };

  const getInputClass = () => {
    return isEditable ? "editable-input" : "locked-input";
  };

  return (
    <div className="settings-container">
      <h2>הגדרות משתמש</h2>

      <div className="setting-row">
        <label>שם פרטי:</label>
        <input type="text" readOnly={!isEditable} className={getInputClass()} />
      </div>

      <div className="setting-row">
        <label>שם משפחה:</label>
        <input type="text" readOnly={!isEditable} className={getInputClass()} />
      </div>

      <div className="setting-row">
        <label>כתובת דוא"ל:</label>
        <input type="email" readOnly={!isEditable} className={getInputClass()} />
      </div>

      <div className="setting-row">
        <label>מספר טלפון:</label>
        <input type="tel" readOnly={!isEditable} className={getInputClass()} />
      </div>

      <div className="setting-row">
        <label>סטטוס:</label>
        <input type="text" readOnly={!isEditable} className={getInputClass()} />
      </div>

      <div className="setting-row">
        <label>תפקיד:</label>
        <input type="text" readOnly={!isEditable} className={getInputClass()} />
      </div>

      <div className="setting-row">
        <label>ארגון/עמותה:</label>
        <input type="text" readOnly={!isEditable} className={getInputClass()} />
      </div>

      <div className="edit-button-container">
        {!isEditable ? (
          <button onClick={handleEditClick} className="edit-button">
            ✏️ 
          </button>
        ) : (
          <button onClick={handleSaveClick} className="save-button">
            ✅ שמור 
          </button>
        )}
      </div>
    </div>
  );
};

export default Settings;
