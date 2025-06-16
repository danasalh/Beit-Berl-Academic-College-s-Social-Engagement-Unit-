// Fixed SubmitHoursBar.jsx
import React, { useState } from "react";
import "./SubmitHoursBar.css";

const SubmitHoursBar = ({ 
  onSubmit, 
  loading = false, 
  userOrganizations = [], 
  loadingOrgs = false 
}) => {
  const [value, setValue] = useState(0);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [showLabel, setShowLabel] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  const handleChange = (e) => {
    setValue(Number(e.target.value));
    setShowLabel(false);
  };

  const handleRelease = () => {
    setShowLabel(true);
  };

  const handleOrgChange = (e) => {
    const selectedValue = e.target.value;
    // Handle both string and number IDs
    setSelectedOrgId(selectedValue === "" ? "" : selectedValue);
  };

  const handleClick = async () => {
    if (value <= 0) {
      alert("נא לבחור כמות שעות גדולה מ-0");
      return;
    }

    if (!selectedOrgId || selectedOrgId === "") {
      alert("נא לבחור ארגון לפני רישום השעות");
      return;
    }

    if (loading) return; // Prevent double submission

    setIsCelebrating(true);
    
    try {
      await onSubmit?.(value, selectedOrgId);
      // Reset form after successful submission
      setValue(0);
      setSelectedOrgId("");
      setShowLabel(false);
    } catch (error) {
      console.error('Error in handleClick:', error);
    } finally {
      setTimeout(() => setIsCelebrating(false), 1000);
    }
  };

  // Show message if user has no organizations
  if (!loadingOrgs && userOrganizations.length === 0) {
    return (
      <div className="submit-hours-container">
        <div className="no-organizations-message">
          <p>לא נמצאו ארגונים עבור המשתמש</p>
          <p>יש לפנות למנהל המערכת להצטרפות לארגון</p>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-hours-container">
      {/* Organization Selection Dropdown */}
      <div className="organization-selector">
        <label htmlFor="org-select" className="org-label">
          בחר ארגון:
        </label>
        <select
          id="org-select"
          value={selectedOrgId}
          onChange={handleOrgChange}
          className="org-select"
          disabled={loading || loadingOrgs}
        >
          <option value="">
            {loadingOrgs ? "טוען ארגונים..." : "בחר ארגון"}
          </option>
          {userOrganizations.map((org) => {
            // Handle different ID field names (id vs Id)
            const orgId = org.id || org.Id;
            const orgName = org.name || org.Name || `ארגון ${orgId}`;
            
            return (
              <option key={orgId} value={orgId}>
                {orgName}
              </option>
            );
          })}
        </select>
      </div>

      {/* Hours Slider */}
      <div className="slider-wrapper">
        <span className="slider-label">8</span>
        <input
          type="range"
          min="0"
          max="8"
          step="0.5"
          value={value}
          onChange={handleChange}
          onMouseUp={handleRelease}
          onTouchEnd={handleRelease}
          className="slider"
          disabled={loading}
        />
        <span className="slider-label">0</span>

        {showLabel && (
          <div className="hours-tooltip animate-tooltip">
            {value % 1 === 0 ? value : value.toFixed(1)} שעות
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        className={`submit-button ${isCelebrating ? "celebrate-glow" : ""} ${loading ? "loading" : ""}`}
        onClick={handleClick}
        disabled={loading || value <= 0 || !selectedOrgId || selectedOrgId === ""}
      >
        {loading ? "שומר..." : "אישור"}
      </button>
    </div>
  );
};

export default SubmitHoursBar;