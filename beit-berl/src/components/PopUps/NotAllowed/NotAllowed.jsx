// src/components/PopUps/NotAllowed/NotAllowed.jsx
import './NotAllowed.css';
import CloseButton from '../../Buttons/CloseButton/CloseButton';

const NotAllowed = ({ onClose}) => {
    return (
        <div className="not-allowed-overlay">
            <div className="not-allowed-modal">
                <CloseButton onClick={onClose} />
                <h3>הפעולה לא אפשרית</h3>
                <p>
                    רק משתמשים שתפקידם <strong>מתנדבים</strong> יכולים לקבל פידבק.
                </p>
            </div>
        </div>
    );
};

export default NotAllowed;
