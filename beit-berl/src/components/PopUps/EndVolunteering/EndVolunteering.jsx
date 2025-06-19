// src/components/PopUps/EndVolunteering/EndVolunteering.jsx
import { useState } from 'react';
import './EndVolunteering.css';

const EndVolunteering = () => {
    const [isChecked, setIsChecked] = useState(false);

    const handleConfirm = () => {
        if (isChecked) {
            alert('הצהרת ההתנדבות אושרה!');
        } else {
            alert('יש לאשר את ההצהרה בשביל לקבל את הזכאות בגין ביצוע ההתנדבות');
        }
    };

    return (
        <div className="end-volunteering-container">
            <h2 className="title">הצהרת סיום התנדבות</h2>
            <p className="description">
               כאן יהיה כתוב מה שסהר רוצה - משהו בסגנון הצהרה שכל השעות נכונות. אנחנו עדיין ממתינים שהוא יעדכן אותנו</p>
            <label className="checkbox-container">
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => setIsChecked(!isChecked)}
                />
                <span className="checkbox-label">
                    אני מאשר/ת כי קראתי את האמור לעיל וכי תוכנו נכון לגביי.
                </span>
            </label>

            <button className="confirm-button" onClick={handleConfirm}>
                אישור
            </button>
        </div>
    );
};

export default EndVolunteering;