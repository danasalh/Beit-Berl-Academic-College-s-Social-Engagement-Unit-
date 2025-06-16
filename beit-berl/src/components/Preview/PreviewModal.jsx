import React from 'react';
import './PreviewModal.css';

const PreviewModal = ({ org, onClose }) => {
  if (!org) return null;

  return (
    <div className="preview-modal-overlay">
      <div className="preview-modal-content">
        <button className="preview-close-button" onClick={onClose}>
          ✖
        </button>

        <h2 className="preview-title">{org.name}</h2>

        <div className="preview-section">
          <strong>עיר:</strong>
          <span>{org.city}</span>
        </div>

        <div className="preview-section">
          <strong>תיאור:</strong>
          <p>{org.description}</p>
        </div>

        <div className="preview-section">
          <strong>רכז:</strong>
          <span>{org.contact}</span>
        </div>

        <div className="preview-section">
          <strong>פרטי קשר:</strong>
          <span>{org.additionalInfo}</span>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
