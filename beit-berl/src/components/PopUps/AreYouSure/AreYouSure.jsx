import React from "react";
import "./AreYouSure.css";

const AreYouSure = ({ onCancel, onConfirm }) => {
  return (
    <div className="areyousure-overlay">
      <div className="areyousure-box">
        <p className="areyousure-message">האם את/ה בטוח/ה?</p>
        <div className="areyousure-buttons">
          <button className="cancel-button" onClick={onCancel}>ביטול</button>
          <button className="confirm-button" onClick={onConfirm}>כן</button>
        </div>
      </div>
    </div>
  );
};

export default AreYouSure;