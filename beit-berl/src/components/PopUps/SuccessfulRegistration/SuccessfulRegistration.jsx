import React from "react";
import "./SuccessfulRegistration.css";

const SuccessfulRegistration = ({ onClose }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <div className="checkmark-container">
          <div className="checkmark">✔</div>
        </div>
        <p className="success-message">
          הטופס נשלח בהצלחה. <br />
          נשלח לך הודעה ברגע שיתקבל אישור.
        </p>
        <button onClick={onClose} className="close-button">סגור</button>
      </div>
    </div>
  );
};

export default SuccessfulRegistration;
