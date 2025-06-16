import React from 'react';
import './PreviewModal.css';

const PreviewModal = ({ org, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>❌</button>
        <h2>{org.name}</h2>
        <p><strong>עיר:</strong> {org.city}</p>
        <p><strong>תיאור:</strong> {org.description}</p>
        <p><strong>צור קשר:</strong> {org.contact}</p>
        <p><strong>מידע נוסף:</strong> {org.additionalInfo}</p>
      </div>
    </div>
  );
};

export default PreviewModal;
