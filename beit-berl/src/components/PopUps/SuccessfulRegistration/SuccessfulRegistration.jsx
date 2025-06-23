import "./SuccessfulRegistration.css";

const SuccessfulRegistration = ({ onClose }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <div className="checkmark-container">
          <div className="checkmark">✔</div>
        </div>
        <p className="success-message">
          הטופס נשלח בהצלחה. הבקשה שלך נמצאת בבדיקה. <br />
        </p>
      </div>
    </div>
  );
};

export default SuccessfulRegistration;