// OrganizationPopup.jsx
import React from 'react';
import './OrganizationPopup.css';
import { HiEye, HiEyeOff } from 'react-icons/hi';

export default function OrganizationPopup() {
  const openPopup = () => {
    document.getElementById('popup').classList.remove('hidden');
  };

  const closePopup = () => {
    document.getElementById('popup').classList.add('hidden');
  };

  return (
    <div dir="rtl" className="page">
      <button className="open-popup-btn" onClick={openPopup}>תצוגה מקדימה
        <HiEye className="icon" />
      </button>

      <div className="popup-overlay hidden" id="popup">
        <div className="popup-content">
          <div className="popup-header">
            <div className="header-content">
              <div className="org-avatar-large">ע</div>
              <div className="header-info">
                <h2>עמותת יד לחיוך</h2>
                <div className="header-location">
                  <svg className="location-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/>
                  </svg>
                  <span>תל אביב</span>
                </div>
              </div>
            </div>
            <button className="close-button" onClick={closePopup}>
              <svg className="close-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
              </svg>
            </button>
          </div>

          <div className="popup-body">
            <div className="stats-grid">
              <div className="stat-card volunteers">
                <div className="stat-number">1240</div>
                <div className="stat-label">מתנדבים</div>
              </div>
              <div className="stat-card events">
                <div className="stat-number">רכז מתנדבים</div>
                <div className="stat-label">סהר</div>
              </div>
              <div className="stat-card rating">
                <div className="stat-number">נציג </div>
                <div className="stat-label">דוד</div>
              </div>
            </div>

            <div className="section">
              <h3 className="section-title">תיאור מלא</h3>
              <p className="description">
                עמותת יד לחיוך פועלת להעלאת איכות החיים של ילדים חולים וקשישים באמצעות פעילות התנדבותית מגוונת. אנו מאמינים בכוח של קהילה, חיוך ונתינה
              </p>
            </div>

            <div className="info-grid">
              <div className="info-card">
                <div className="info-title">מייל:</div>
                <div className="info-value">info@yadlahayuch.org</div>
              </div>
              <div className="info-card">
                <div className="info-title">קטגוריה</div>
                <div className="info-value">רווחה וחינוך</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 