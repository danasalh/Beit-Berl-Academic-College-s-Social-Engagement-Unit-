// src/components/pages/volunteer/dashboard/VcDachboard.jsx

import React, { useState } from 'react';
import ProgressBar from '../../../Bars/ProgressBar/ProgressBar';
import ThreeButtonDush from '../../../Buttons/ThreeButtonDush/ThreeButtonDush';
import SubmitHoursBar from '../../../Bars/SubmitHoursBar/SubmitHoursBar';
import FinishVol from '../../../Buttons/FinishVol/FinishVol';
import './VolunteerDashboard.css';

export default function VcDashboard() {
  const [showPopup, setShowPopup] = useState(false);
  const [hours, setHours] = useState(0); // ניהול כמות השעות

  const handleMarkHoursClick = () => {
    setShowPopup(true);
  };

  const handleSubmitHours = (addedHours) => {
    setHours(prev => prev + addedHours); // הוספת השעות
    setShowPopup(false);
  };

  const handleFinishVol = () => {
    alert("כל הכבוד! סיימת 60 שעות התנדבות 🎉");
    // כאן אפשר להוסיף לוגיקה נוספת (שליחה לשרת, ניווט וכו')
  };

  return (
    <div className="volunteer-dashboard-root">
      <div className="welcome-title">ברוך הבא</div>
      <div className="dashboard-bar-wrapper">
        <ProgressBar hours={hours} /> {/* העברת השעות ל-ProgressBar */}
      </div>
      <div className="dashboard-buttons-wrapper">
        <ThreeButtonDush onMarkHoursClick={handleMarkHoursClick} />
      </div>
      {/* הצגת כפתור סיום התנדבות רק אם עברו 60 שעות */}
      {hours >= 60 && (
        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center" }}>
          <FinishVol onClick={handleFinishVol} />
        </div>
      )}
      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div
            className="popup-content popup-animate"
            onClick={e => e.stopPropagation()}
          >
            <SubmitHoursBar onSubmit={handleSubmitHours} />
            <button className="close-btn" onClick={() => setShowPopup(false)}>
              סגור
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
