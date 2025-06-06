// src/components/PopUps/NotAllowed/NotAllowed.jsx
import React from 'react';
import './NotAllowed.css';

const NotAllowed = ({ onClose, role }) => {
    return (
        <div className="not-allowed-overlay">
            <div className="not-allowed-modal">
                <h3>הפעולה לא אפשרית</h3>
                <p>
                    לא ניתן להוסיף פידבק למשתמש הזה מכיוון שתפקידו הוא<strong>{role}</strong>.
                    <br />
                    רק משתמשים שתפקידם <strong>volunteer</strong> יכולים לקבל פידבק.
                </p>
                <button onClick={onClose} className="close-btn">סגירה</button>
            </div>
        </div>
    );
};

export default NotAllowed;
