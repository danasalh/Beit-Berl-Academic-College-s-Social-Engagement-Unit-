// src/components/pages/PopUps/EndVolunteering/EndVolunteering.jsx
import React, { useState } from 'react';
import './EndVolunteering.css';

const EndVolunteering = () => {
  const [isChecked, setIsChecked] = useState(false);

  const handleConfirm = () => {
    if (isChecked) {
      alert('הצהרת ההתנדבות אושרה!');
      // 🔧 Tu pourras ici ajouter l'envoi à la base de données ou une fermeture de modal
    } else {
      alert('אנא אשרי שסיימת את שעות ההתנדבות שלך');
    }
  };

  return (
    <div className="end-volunteering-container">
      <h2 className="title">הצהרת סיום התנדבות</h2>

      <label className="checkbox-container">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => setIsChecked(!isChecked)}
        />
        <span className="checkbox-label">
          אני מאשרת שסיימתי את השעות התנדבות שלי
        </span>
      </label>

      <button className="confirm-button" onClick={handleConfirm}>
        אישור
      </button>
    </div>
  );
};

export default EndVolunteering;
