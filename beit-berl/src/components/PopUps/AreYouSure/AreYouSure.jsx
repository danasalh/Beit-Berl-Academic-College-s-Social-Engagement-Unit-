import React from "react";
import "./AreYouSure.css";

const AreYouSure = ({ onCancel, onConfirm }) => {
  return (
    <div className="areyousure-overlay">
      <div className="areyousure-box">
        <p className="areyousure-message">ברצונך להתנתק מהמערכת?</p>
        <div className="areyousure-buttons">
          <button className="cancel-button-logout" onClick={onCancel}>ביטול</button>
          <button className="confirm-button" onClick={onConfirm}>כן</button>
        </div>
      </div>
    </div>
  );
};

export default AreYouSure;